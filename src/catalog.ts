import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { parse } from "yaml";
import { z } from "zod";

const canonicalFilenamePattern = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

const historicalYearSchema = {
	year: z.int().positive(),
	era: z.enum(["ce", "bce"]),
};

const dayHistoricalDateSchema = z
	.strictObject({
		...historicalYearSchema,
		precision: z.literal("day"),
		month: z.int().min(1).max(12),
		day: z.int().min(1).max(31),
	})
	.refine(
		({ day, month }) =>
			day <= [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1],
		{ path: ["day"], message: "Invalid day for historical month" },
	);

const historicalDateSchema = z.discriminatedUnion("precision", [
	dayHistoricalDateSchema,
	z.strictObject({
		...historicalYearSchema,
		precision: z.literal("month"),
		month: z.int().min(1).max(12),
	}),
	z.strictObject({
		...historicalYearSchema,
		precision: z.literal("year"),
	}),
	z.strictObject({
		...historicalYearSchema,
		precision: z.literal("approximate"),
	}),
]);

const topicIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const profileIds = [
	"algemeen",
	"auto-mechanica",
	"elektriciteit",
	"bouw",
	"hout",
	"metaal",
	"logistiek-transport",
] as const;

const sourceSchema = z.strictObject({
	title: z.string().trim().min(1),
	publisher: z.string().trim().min(1),
	url: z.url().refine((value) => {
		if (!URL.canParse(value)) return false;
		const protocol = new URL(value).protocol;
		return protocol === "http:" || protocol === "https:";
	}),
});

type MarkdownNode = {
	type: string;
	depth?: number;
	title?: string | null;
	url?: string;
	children?: readonly MarkdownNode[];
	position?: {
		start: { offset?: number };
		end: { offset?: number };
	};
};

function isHttpUrl(value: string): boolean {
	if (!URL.canParse(value)) return false;
	const protocol = new URL(value).protocol;
	return protocol === "http:" || protocol === "https:";
}

function isSupportedMarkdown(markdown: string): boolean {
	const root = fromMarkdown(markdown);
	const nodes: Array<{ node: MarkdownNode; depth: number }> = [
		{ node: root, depth: 0 },
	];
	let hasHardBreak = false;

	while (nodes.length > 0) {
		const current = nodes.pop();
		if (!current || current.depth > 100) return false;
		const { node } = current;

		switch (node.type) {
			case "root":
			case "paragraph":
			case "strong":
			case "emphasis":
			case "blockquote":
			case "list":
			case "listItem":
			case "text":
				break;
			case "heading":
				if (node.depth !== 2 && node.depth !== 3) return false;
				break;
			case "link":
				if (
					node.title !== null ||
					typeof node.url !== "string" ||
					!isHttpUrl(node.url)
				) {
					return false;
				}
				break;
			case "break": {
				const start = node.position?.start.offset;
				const end = node.position?.end.offset;
				if (
					typeof start !== "number" ||
					typeof end !== "number" ||
					markdown.slice(start, end) !== "  \n"
				) {
					return false;
				}
				hasHardBreak = true;
				break;
			}
			default:
				return false;
		}

		for (const child of node.children ?? []) {
			nodes.push({ node: child, depth: current.depth + 1 });
		}
	}

	if (!hasHardBreak) return true;
	const normalized = toMarkdown(root, {
		bullet: "-",
		handlers: { break: () => "  \n" },
	});
	return normalized.trimEnd() === markdown.trimEnd();
}

const eventFrontmatterSchema = z
	.strictObject({
		title: z.string().trim().min(1),
		date: historicalDateSchema,
		summary: z.string().trim().min(1),
		topics: z.array(topicIdSchema).min(1),
		topicLabels: z.record(topicIdSchema, z.string().trim().min(1)).optional(),
		profiles: z.array(z.enum(profileIds)).min(1),
		sources: z.array(sourceSchema).min(1),
	})
	.superRefine(({ topicLabels, topics }, context) => {
		for (const topic of Object.keys(topicLabels ?? {})) {
			if (topics.includes(topic)) continue;
			context.addIssue({
				code: "custom",
				message: "Topic label must belong to a selected topic",
				path: ["topicLabels", topic],
			});
		}
	});

export type Event = z.infer<typeof eventFrontmatterSchema> & {
	slug: string;
	body: string;
};

export type CatalogEntry = {
	filename: string;
	document: string;
};

function slugFromFilename(filename: string): string {
	const match = canonicalFilenamePattern.exec(filename);
	if (!match) {
		throw new Error(`Invalid event filename: ${filename}`);
	}

	return match[1];
}

export function parseEventDocument(filename: string, document: string): Event {
	const slug = slugFromFilename(filename);
	const match = frontmatterPattern.exec(document);
	if (!match) {
		throw new Error(
			`Event document ${filename} has no valid frontmatter block`,
		);
	}

	const frontmatter = eventFrontmatterSchema.parse(parse(match[1]));
	const body = match[2].trim();
	if (!body) {
		throw new Error(`Event document ${filename} has no Markdown body`);
	}
	if (!isSupportedMarkdown(body)) {
		throw new Error(`Event document ${filename} contains unsupported Markdown`);
	}

	return { ...frontmatter, slug, body };
}

export function validateCatalogEntries(entries: CatalogEntry[]): Event[] {
	if (entries.length === 0) {
		throw new Error("Event catalog must contain at least one event");
	}

	const slugs = new Set<string>();
	return entries
		.toSorted((left, right) => left.filename.localeCompare(right.filename))
		.map(({ filename, document }) => {
			const slug = slugFromFilename(filename);
			if (slugs.has(slug)) {
				throw new Error(`Duplicate event slug: ${slug}`);
			}
			slugs.add(slug);

			return parseEventDocument(filename, document);
		});
}

export async function loadEventCatalog(directory: string): Promise<Event[]> {
	const directoryEntries = await readdir(directory, { withFileTypes: true });
	const entries = await Promise.all(
		directoryEntries.map(async (entry): Promise<CatalogEntry> => {
			if (!entry.isFile()) {
				throw new Error(`Invalid event catalog entry: ${entry.name}`);
			}

			return {
				filename: entry.name,
				document: await readFile(path.join(directory, entry.name), "utf8"),
			};
		}),
	);

	return validateCatalogEntries(entries);
}
