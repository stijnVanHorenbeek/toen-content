import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

const canonicalFilenamePattern = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

const historicalYearSchema = {
	year: z.int().positive(),
	era: z.enum(["ce", "bce"]),
};

const historicalDateSchema = z.discriminatedUnion("precision", [
	z.strictObject({
		...historicalYearSchema,
		precision: z.literal("day"),
		month: z.int().min(1).max(12),
		day: z.int().min(1).max(31),
	}),
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

const sourceSchema = z.strictObject({
	title: z.string().trim().min(1),
	publisher: z.string().trim().min(1),
	url: z.url(),
});

const eventFrontmatterSchema = z.strictObject({
	title: z.string().trim().min(1),
	date: historicalDateSchema,
	summary: z.string().trim().min(1),
	topics: z.array(z.string().trim().min(1)).min(1),
	profiles: z.array(z.string().trim().min(1)).min(1),
	sources: z.array(sourceSchema).min(1),
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
