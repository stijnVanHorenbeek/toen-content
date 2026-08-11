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

const httpUrlSchema = z.url().refine((value) => {
	if (!URL.canParse(value)) return false;
	const protocol = new URL(value).protocol;
	return protocol === "http:" || protocol === "https:";
});

const sourceSchema = z.strictObject({
	title: z.string().trim().min(1),
	publisher: z.string().trim().min(1),
	url: httpUrlSchema,
});

const beatTextSchema = (maximumLength: number) =>
	z.string().trim().min(1).max(maximumLength);
const beatIdSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const ordinaryStageSecondsSchema = z.int().min(30).max(90);
const shortStageSecondsSchema = z.int().min(1).max(30);
const stageCommonSchema = {
	id: beatIdSchema,
	teacherPrompt: beatTextSchema(240),
	expectedStudentAction: beatTextSchema(160),
};

const beatStageSchema = z.discriminatedUnion("phase", [
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("opening"),
		suggestedSeconds: shortStageSecondsSchema,
		stimulus: beatTextSchema(400),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("commitment"),
		suggestedSeconds: shortStageSecondsSchema,
		prompt: beatTextSchema(240),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("evidence"),
		suggestedSeconds: ordinaryStageSecondsSchema,
		title: beatTextSchema(80),
		evidence: beatTextSchema(400),
		sourceUrl: httpUrlSchema,
		earliestDurationMinutes: z.union([
			z.literal(5),
			z.literal(8),
			z.literal(12),
		]),
		optional: z.literal(true).optional(),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("discussion"),
		suggestedSeconds: ordinaryStageSecondsSchema,
		prompt: beatTextSchema(240),
		sentenceStarter: beatTextSchema(120).optional(),
		optional: z.literal(true).optional(),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("revision"),
		suggestedSeconds: ordinaryStageSecondsSchema,
		prompt: beatTextSchema(240),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("reasoning"),
		suggestedSeconds: ordinaryStageSecondsSchema,
		prompt: beatTextSchema(240),
		optional: z.literal(true).optional(),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("resolution"),
		suggestedSeconds: ordinaryStageSecondsSchema,
		title: beatTextSchema(80),
		feedback: beatTextSchema(400),
		misconception: beatTextSchema(240).optional(),
		sourceUrls: z.array(httpUrlSchema).min(1).max(4),
	}),
	z.strictObject({
		...stageCommonSchema,
		phase: z.literal("lesson-bridge"),
		suggestedSeconds: ordinaryStageSecondsSchema,
		bridge: beatTextSchema(400),
	}),
]);

const beatRouteSchema = (durationMinutes: 5 | 8 | 12) =>
	z.strictObject({
		durationMinutes: z.literal(durationMinutes),
		stageIds: z.array(beatIdSchema).min(1).max(16),
	});

const beatChoiceSchema = z.strictObject({
	id: beatIdSchema,
	label: beatTextSchema(80),
});
const beatCommonSchema = {
	version: z.literal(1),
	question: beatTextSchema(240),
	choices: z.array(beatChoiceSchema).min(2).max(4),
	stages: z.array(beatStageSchema).min(7).max(16),
	routes: z.tuple([
		beatRouteSchema(5),
		beatRouteSchema(8),
		beatRouteSchema(12),
	]),
	sensitivityNotes: z.array(beatTextSchema(300)).min(1).max(5).optional(),
};
const sourceCardSchema = z.strictObject({
	id: beatIdSchema,
	label: beatTextSchema(80),
	excerpt: beatTextSchema(400),
	sourceUrl: httpUrlSchema,
});

const interactiveBeatUnionSchema = z.discriminatedUnion("mechanic", [
	z.strictObject({
		...beatCommonSchema,
		mechanic: z.literal("vote-revote"),
	}),
	z.strictObject({
		...beatCommonSchema,
		mechanic: z.literal("source-duel"),
		sourceCards: z.tuple([sourceCardSchema, sourceCardSchema]),
	}),
	z.strictObject({
		...beatCommonSchema,
		mechanic: z.literal("context-decision"),
		perspective: beatTextSchema(400),
	}),
]);
type InteractiveBeatInput = z.infer<typeof interactiveBeatUnionSchema>;

const interactiveBeatSchema = interactiveBeatUnionSchema.superRefine(
	validateInteractiveBeatRoutes,
);

function validateInteractiveBeatRoutes(
	beat: InteractiveBeatInput,
	context: z.RefinementCtx,
): void {
	const stageIndexById = new Map(
		beat.stages.map((stage, index) => [stage.id, index]),
	);
	const usedStageIds = new Set<string>();
	const phaseOrder = {
		opening: 0,
		commitment: 1,
		evidence: 2,
		discussion: 2,
		revision: 3,
		reasoning: 4,
		resolution: 5,
		"lesson-bridge": 6,
	} as const;

	for (const fixedPhase of [
		"opening",
		"commitment",
		"revision",
		"resolution",
		"lesson-bridge",
	] as const) {
		if (beat.stages.filter(({ phase }) => phase === fixedPhase).length === 1) {
			continue;
		}
		addBeatRouteIssue(
			context,
			["stages"],
			`Vaste beatfase ${fixedPhase} moet exact één keer voorkomen.`,
		);
	}

	for (const [routeIndex, route] of beat.routes.entries()) {
		const seenStageIds = new Set<string>();
		const routeStages: InteractiveBeatInput["stages"] = [];
		const masterIndexes: number[] = [];

		for (const [stageIdIndex, stageId] of route.stageIds.entries()) {
			if (seenStageIds.has(stageId)) {
				addBeatRouteIssue(
					context,
					["routes", routeIndex, "stageIds", stageIdIndex],
					"Een route mag elke beatfase maar één keer gebruiken.",
				);
			} else {
				seenStageIds.add(stageId);
			}

			const masterIndex = stageIndexById.get(stageId);
			if (masterIndex === undefined) {
				addBeatRouteIssue(
					context,
					["routes", routeIndex, "stageIds", stageIdIndex],
					"Route verwijst naar een onbekende beatfase.",
				);
				continue;
			}
			usedStageIds.add(stageId);
			masterIndexes.push(masterIndex);
			routeStages.push(beat.stages[masterIndex]);
		}

		if (
			masterIndexes.some(
				(masterIndex, index) =>
					index > 0 && masterIndex <= masterIndexes[index - 1],
			)
		) {
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				"Route moet de vaste volgorde van beatfasen behouden.",
			);
		}

		const phases = routeStages.map(({ phase }) => phase);
		if (phases[0] !== "opening" || phases[1] !== "commitment") {
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				"Route moet starten met opening en commitment.",
			);
		}
		if (phases.at(-2) !== "resolution" || phases.at(-1) !== "lesson-bridge") {
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				"Route moet eindigen met resolutie en lesbrug.",
			);
		}
		for (const requiredPhase of [
			"evidence",
			"discussion",
			"revision",
		] as const) {
			if (phases.includes(requiredPhase)) continue;
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				`Route mist verplichte fase ${requiredPhase}.`,
			);
		}
		if (phases.indexOf("discussion") < phases.indexOf("evidence")) {
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				"Eerste bewijs moet vóór eerste bespreking verschijnen.",
			);
		}
		if (
			phases.some(
				(phase, index) =>
					index > 0 && phaseOrder[phase] < phaseOrder[phases[index - 1]],
			)
		) {
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				"Route bevat beatfasen in een ongeldige cognitieve volgorde.",
			);
		}

		const routeSeconds = routeStages.reduce(
			(total, stage) => total + stage.suggestedSeconds,
			0,
		);
		const maximumSeconds = route.durationMinutes * 60;
		const previousCheckpointSeconds =
			route.durationMinutes === 8
				? 5 * 60
				: route.durationMinutes === 12
					? 8 * 60
					: 0;
		if (
			routeSeconds > maximumSeconds ||
			(previousCheckpointSeconds > 0 &&
				routeSeconds <= previousCheckpointSeconds)
		) {
			addBeatRouteIssue(
				context,
				["routes", routeIndex, "stageIds"],
				"Geplande fasetijd past niet bij het routecheckpoint.",
			);
		}
	}

	for (const [stageIndex, stage] of beat.stages.entries()) {
		if (!usedStageIds.has(stage.id)) {
			addBeatRouteIssue(
				context,
				["stages", stageIndex, "id"],
				"Elke beatfase moet in minstens één route voorkomen.",
			);
		}
		if (stage.phase !== "evidence") continue;
		const earliestRoute = beat.routes.find(({ stageIds }) =>
			stageIds.includes(stage.id),
		)?.durationMinutes;
		if (earliestRoute === stage.earliestDurationMinutes) continue;
		addBeatRouteIssue(
			context,
			["stages", stageIndex, "earliestDurationMinutes"],
			"Vroegste bewijsroute moet overeenkomen met routegebruik.",
		);
	}

	if (!isStageIdSubsequence(beat.routes[0].stageIds, beat.routes[1].stageIds)) {
		addBeatRouteIssue(
			context,
			["routes", 1, "stageIds"],
			"Route van acht minuten moet route van vijf minuten bevatten.",
		);
	}
	if (!isStageIdSubsequence(beat.routes[1].stageIds, beat.routes[2].stageIds)) {
		addBeatRouteIssue(
			context,
			["routes", 2, "stageIds"],
			"Route van twaalf minuten moet route van acht minuten bevatten.",
		);
	}
}

function isStageIdSubsequence(
	shorter: readonly string[],
	longer: readonly string[],
): boolean {
	let shorterIndex = 0;
	for (const stageId of longer) {
		if (stageId === shorter[shorterIndex]) shorterIndex += 1;
	}
	return shorterIndex === shorter.length;
}

function addBeatRouteIssue(
	context: z.RefinementCtx,
	path: Array<string | number>,
	message: string,
): void {
	context.addIssue({ code: "custom", path, message });
}

function validateInteractiveBeatIdentityAndSources(
	value: {
		sources: Array<{ url: string }>;
		beat?: z.infer<typeof interactiveBeatSchema>;
	},
	context: z.RefinementCtx,
): void {
	const { beat } = value;
	if (!beat) return;

	validateUniqueBeatIds(beat.choices, ["beat", "choices"], context);
	validateUniqueBeatIds(beat.stages, ["beat", "stages"], context);
	if (beat.mechanic === "source-duel") {
		validateUniqueBeatIds(beat.sourceCards, ["beat", "sourceCards"], context);
	}

	const eventSourceUrls = new Set<string>();
	for (const [sourceIndex, { url }] of value.sources.entries()) {
		if (!eventSourceUrls.has(url)) {
			eventSourceUrls.add(url);
			continue;
		}
		context.addIssue({
			code: "custom",
			path: ["sources", sourceIndex, "url"],
			message: "Gebeurtenisbronnen voor een beat moeten uniek zijn.",
		});
	}

	for (const [stageIndex, stage] of beat.stages.entries()) {
		if (stage.phase === "evidence" && !eventSourceUrls.has(stage.sourceUrl)) {
			context.addIssue({
				code: "custom",
				path: ["beat", "stages", stageIndex, "sourceUrl"],
				message: "Beatbron moet exact verwijzen naar een gebeurtenisbron.",
			});
		}
		if (stage.phase === "resolution") {
			for (const [sourceIndex, sourceUrl] of stage.sourceUrls.entries()) {
				if (eventSourceUrls.has(sourceUrl)) continue;
				context.addIssue({
					code: "custom",
					path: ["beat", "stages", stageIndex, "sourceUrls", sourceIndex],
					message: "Beatbron moet exact verwijzen naar een gebeurtenisbron.",
				});
			}
		}
	}

	if (beat.mechanic !== "source-duel") return;
	for (const [cardIndex, sourceCard] of beat.sourceCards.entries()) {
		if (eventSourceUrls.has(sourceCard.sourceUrl)) continue;
		context.addIssue({
			code: "custom",
			path: ["beat", "sourceCards", cardIndex, "sourceUrl"],
			message: "Beatbron moet exact verwijzen naar een gebeurtenisbron.",
		});
	}
	if (new Set(beat.sourceCards.map(({ sourceUrl }) => sourceUrl)).size !== 2) {
		context.addIssue({
			code: "custom",
			path: ["beat", "sourceCards"],
			message: "Bronduel moet twee verschillende bronnen gebruiken.",
		});
	}
}

function validateUniqueBeatIds(
	items: readonly { id: string }[],
	path: Array<string | number>,
	context: z.RefinementCtx,
): void {
	const ids = new Set<string>();
	for (const [index, { id }] of items.entries()) {
		if (!ids.has(id)) {
			ids.add(id);
			continue;
		}
		context.addIssue({
			code: "custom",
			path: [...path, index, "id"],
			message: "Beat-ID moet uniek zijn.",
		});
	}
}

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
		beat: interactiveBeatSchema.optional(),
	})
	.superRefine((value, context) => {
		for (const topic of Object.keys(value.topicLabels ?? {})) {
			if (value.topics.includes(topic)) continue;
			context.addIssue({
				code: "custom",
				message: "Topic label must belong to a selected topic",
				path: ["topicLabels", topic],
			});
		}
		validateInteractiveBeatIdentityAndSources(value, context);
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
