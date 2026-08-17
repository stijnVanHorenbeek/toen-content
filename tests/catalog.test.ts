import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import {
	loadEventCatalog,
	parseEventDocument,
	validateCatalogEntries,
} from "../src/catalog.js";
import {
	loadReleaseActivationLock,
	loadReleaseRequests,
} from "../src/release-requests.js";
import {
	beatSources,
	contextDecisionBeat,
	invalidBeatIdentityCases,
	invalidBeatRouteCases,
	invalidBeatStructuralCases,
	sourceDuelBeat,
	voteRevoteBeat,
} from "./fixtures/interactive-beat.js";

const voteRevoteBeatV2 = {
	...voteRevoteBeat,
	version: 2,
	responseMethod: "response-cards",
	vocationalConnection:
		"Vergelijk de beslissing met hedendaagse veiligheidsprocedures.",
} as const;

const validDocument = `---
title: Test event
date:
  year: 1969
  era: ce
  precision: day
  month: 7
  day: 20
summary: Test summary
topics:
  - wetenschap
profiles:
  - algemeen
sources:
  - title: Primary source
    publisher: Test publisher
    url: https://example.com/source
---

Event body.
`;

function replaceDocument(from: string, to: string): string {
	return validDocument.replace(from, to);
}

function documentWithBeat(
	beat: unknown,
	sources: unknown = beatSources,
): string {
	const sourceAndBeatBlock = stringify(
		{ sources, beat },
		{ lineWidth: 0 },
	).trimEnd();
	return validDocument.replace(
		"sources:\n  - title: Primary source\n    publisher: Test publisher\n    url: https://example.com/source",
		sourceAndBeatBlock,
	);
}

describe("event document validation", () => {
	it("shares one hashed Beat V2 parity fixture with the application schema", async () => {
		const document = await readFile(
			path.join(process.cwd(), "tests/fixtures/release-parity-event.md"),
			"utf8",
		);
		expect(createHash("sha256").update(document).digest("hex")).toBe(
			"b0d2817528fda7d084b3a1414814ec9bc975ac4aeca143769af0aae5a1179fb3",
		);
		expect(
			parseEventDocument("release-parity-event-1969.md", document),
		).toMatchObject({ beat: { version: 2, responseMethod: "response-cards" } });
	});

	it("derives slug from canonical filename and parses valid content", () => {
		const event = parseEventDocument("test-event.md", validDocument);

		expect(event.slug).toBe("test-event");
		expect(event.body).toBe("Event body.");
	});

	it("accepts a versioned vote-revote beat", () => {
		expect(
			parseEventDocument("test-event.md", documentWithBeat(voteRevoteBeat)),
		).toMatchObject({ beat: voteRevoteBeat });
	});

	it("accepts version 2 while retaining version 1", () => {
		expect(
			parseEventDocument("test-event.md", documentWithBeat(voteRevoteBeatV2)),
		).toMatchObject({ beat: voteRevoteBeatV2 });
		expect(
			parseEventDocument("test-event.md", documentWithBeat(voteRevoteBeat)),
		).toMatchObject({ beat: voteRevoteBeat });
	});

	it.each([
		["source duel", sourceDuelBeat],
		["context-bound decision", contextDecisionBeat],
	])("accepts a versioned %s beat", (_name, beat) => {
		expect(
			parseEventDocument("test-event.md", documentWithBeat(beat)),
		).toMatchObject({ beat });
	});

	it.each(invalidBeatIdentityCases)("rejects %s", (_name, beat) => {
		expect(() =>
			parseEventDocument("test-event.md", documentWithBeat(beat)),
		).toThrow();
	});

	it("rejects duplicate event source URLs for a beat", () => {
		expect(() =>
			parseEventDocument(
				"test-event.md",
				documentWithBeat(voteRevoteBeat, [
					...beatSources,
					{ ...beatSources[0], title: "Duplicate mission report" },
				]),
			),
		).toThrow();
	});

	it.each(invalidBeatRouteCases)("rejects %s", (_name, beat) => {
		expect(() =>
			parseEventDocument("test-event.md", documentWithBeat(beat)),
		).toThrow();
	});

	it.each(invalidBeatStructuralCases)("rejects %s", (_name, beat) => {
		expect(() =>
			parseEventDocument("test-event.md", documentWithBeat(beat)),
		).toThrow();
	});

	it("keeps version fields strict across both beat versions", () => {
		const { responseMethod: _responseMethod, ...missingResponseMethod } =
			voteRevoteBeatV2;
		expect(() =>
			parseEventDocument(
				"test-event.md",
				documentWithBeat(missingResponseMethod),
			),
		).toThrow();
		expect(() =>
			parseEventDocument(
				"test-event.md",
				documentWithBeat({
					...voteRevoteBeat,
					responseMethod: "response-cards",
				}),
			),
		).toThrow();
	});

	it.each([
		["unknown response method", { ...voteRevoteBeatV2, responseMethod: "app" }],
		[
			"long vocational connection",
			{ ...voteRevoteBeatV2, vocationalConnection: "x".repeat(241) },
		],
		["unknown version 2 field", { ...voteRevoteBeatV2, autoplay: true }],
	])("rejects version 2 with %s", (_name, beat) => {
		expect(() =>
			parseEventDocument("test-event.md", documentWithBeat(beat)),
		).toThrow();
	});

	it("accepts historical leap days without modern Gregorian assumptions", () => {
		const document = replaceDocument(
			"year: 1969\n  era: ce\n  precision: day\n  month: 7\n  day: 20",
			"year: 1900\n  era: ce\n  precision: day\n  month: 2\n  day: 29",
		);

		expect(parseEventDocument("test-event.md", document).date).toEqual({
			year: 1900,
			era: "ce",
			precision: "day",
			month: 2,
			day: 29,
		});
	});

	it("enforces release projection bounds before publication", () => {
		expect(() =>
			parseEventDocument(
				"test-event.md",
				replaceDocument("title: Test event", `title: ${"x".repeat(161)}`),
			),
		).toThrow();
		expect(() =>
			parseEventDocument(
				"test-event.md",
				validDocument.replace("Event body.", "x".repeat(20_001)),
			),
		).toThrow();
		expect(() =>
			parseEventDocument(
				"test-event.md",
				replaceDocument(
					"topics:\n  - wetenschap",
					"topics:\n  - wetenschap\n  - wetenschap",
				),
			),
		).toThrow();
		expect(() =>
			parseEventDocument(
				"test-event.md",
				replaceDocument(
					"    url: https://example.com/source",
					"    url: https://example.com/source\n  - title: Duplicate\n    publisher: Test publisher\n    url: https://example.com/source",
				),
			),
		).toThrow();
	});

	it("rejects unknown frontmatter fields", () => {
		const document = replaceDocument(
			"title: Test event",
			"title: Test event\nextra: nope",
		);

		expect(() => parseEventDocument("test-event.md", document)).toThrow();
	});

	it.each([
		["invalid year", "year: 1969", "year: 0"],
		["invalid era", "era: ce", "era: future"],
		["invalid precision fields", "day: 20", "day: 32"],
		["impossible historical day", "month: 7\n  day: 20", "month: 4\n  day: 31"],
		["invalid source URL", "https://example.com/source", "not-a-url"],
		[
			"unsafe source protocol",
			"https://example.com/source",
			"ftp://example.com/source",
		],
		["empty source title", "title: Primary source", 'title: ""'],
		["noncanonical topic ID", "wetenschap", "Café"],
		["unknown profile ID", "algemeen", "onbekende-richting"],
	])("rejects %s", (_name, from, to) => {
		expect(() =>
			parseEventDocument("test-event.md", replaceDocument(from, to)),
		).toThrow();
	});

	it("accepts selected topic labels and rejects unrelated labels", () => {
		const labeledDocument = replaceDocument(
			"topics:\n  - wetenschap",
			"topics:\n  - wetenschap\ntopicLabels:\n  wetenschap: Wetenschap",
		);
		expect(
			parseEventDocument("test-event.md", labeledDocument).topicLabels,
		).toEqual({
			wetenschap: "Wetenschap",
		});

		const unrelatedLabel = labeledDocument.replace(
			"wetenschap: Wetenschap",
			"politiek: Politiek",
		);
		expect(() => parseEventDocument("test-event.md", unrelatedLabel)).toThrow();
	});

	it("accepts the canonical Markdown subset", () => {
		const body = `## Tussenkop

### Verdieping

Tekst met *nadruk*, **sterke nadruk** en een [veilige link](https://example.com).

> Een citaat.

- Eerste punt
- Tweede punt

1. Eerste stap
2. Tweede stap`;
		const document = validDocument.replace("Event body.", body);

		expect(parseEventDocument("test-event.md", document).body).toBe(body);
	});

	it("accepts canonical hard line breaks produced by the editor", () => {
		const body = "Eerste regel.  \nTweede regel.";
		const document = validDocument.replace("Event body.", body);

		expect(parseEventDocument("test-event.md", document).body).toBe(body);
	});

	it("rejects a noncanonical document when it contains a hard line break", () => {
		const body = "Eerste regel.  \nTweede regel.\n\n_tekst_";
		const document = validDocument.replace("Event body.", body);

		expect(() => parseEventDocument("test-event.md", document)).toThrow(
			"unsupported Markdown",
		);
	});

	it("rejects excessive Markdown nesting without overflowing the stack", () => {
		const body = `${"> ".repeat(5_000)}Tekst`;
		const document = validDocument.replace("Event body.", body);

		expect(() => parseEventDocument("test-event.md", document)).toThrow(
			"unsupported Markdown",
		);
	});

	it.each([
		["unsafe link", "[Link](javascript:alert(1))"],
		["link title", '[Link](https://example.com "Titel")'],
		["backslash hard line break", "Eerste regel.\\\nTweede regel."],
		["three-space hard line break", "Eerste regel.   \nTweede regel."],
		["CRLF hard line break", "Eerste regel.  \r\nTweede regel."],
		["level-one heading", "# Hoofdtitel"],
		["level-four heading", "#### Te diepe titel"],
		["image", "![Beschrijving](https://example.com/image.jpg)"],
		["inline code", "Gebruik `code`."],
		["HTML", "<strong>Tekst</strong>"],
		["reference link", "[Link][bron]\n\n[bron]: https://example.com"],
		["thematic break", "---"],
	])("rejects unsupported Markdown: %s", (_name, body) => {
		const document = validDocument.replace("Event body.", body);

		expect(() => parseEventDocument("test-event.md", document)).toThrow(
			"unsupported Markdown",
		);
	});

	it("rejects an empty Markdown body", () => {
		const document = validDocument.replace("\nEvent body.\n", "\n   \n");

		expect(() => parseEventDocument("test-event.md", document)).toThrow(
			"has no Markdown body",
		);
	});
});

describe("release request reader", () => {
	it("accepts an integrity-checked exact-SHA request", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "toen-release-request-"));
		const buildUuid = "123e4567-e89b-42d3-a456-426614174000";
		const core = {
			kind: "toen-release-request",
			schemaVersion: 1,
			buildUuid,
			appSha: "a".repeat(40),
			contentSha: "b".repeat(40),
		};
		const integritySha256 = createHash("sha256")
			.update(JSON.stringify(core))
			.digest("hex");
		await writeFile(
			path.join(root, `${buildUuid}.json`),
			`${JSON.stringify({ ...core, integritySha256 })}\n`,
		);
		await expect(loadReleaseRequests(root, root)).resolves.toEqual([
			{ ...core, integritySha256 },
		]);
	});

	it("accepts an integrity-checked activation lock", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "toen-release-lock-"));
		const core = {
			kind: "toen-release-activation-lock",
			schemaVersion: 1,
			ownerId: "223e4567-e89b-42d3-a456-426614174000",
			appSha: "a".repeat(40),
			contentSha: "b".repeat(40),
			state: "active",
			buildUuid: "323e4567-e89b-42d3-a456-426614174000",
		};
		const integritySha256 = createHash("sha256")
			.update(JSON.stringify(core))
			.digest("hex");
		const filePath = path.join(root, "activation-lock.json");
		await writeFile(
			filePath,
			`${JSON.stringify({ ...core, integritySha256 })}\n`,
		);
		await expect(loadReleaseActivationLock(filePath, root)).resolves.toEqual({
			...core,
			integritySha256,
		});
	});

	it("rejects unexpected files and symlinked roots", async () => {
		const root = await mkdtemp(
			path.join(tmpdir(), "toen-release-request-bad-"),
		);
		await writeFile(path.join(root, "unexpected.json"), "{}\n");
		await expect(loadReleaseRequests(root, root)).rejects.toThrow(
			"Invalid release request filename",
		);
		const linked = await mkdtemp(path.join(tmpdir(), "toen-release-link-"));
		await symlink(root, path.join(linked, "requests"), "dir");
		await expect(
			loadReleaseRequests(path.join(linked, "requests"), linked),
		).rejects.toThrow("real directory");
	});
});

describe("full catalog validation", () => {
	it.each([
		"Test-event.md",
		"test_event.md",
		"test-event.MD",
		"README.md",
		"notes.txt",
	])("rejects non-canonical event filename %s", (filename) => {
		expect(() =>
			validateCatalogEntries([{ filename, document: validDocument }]),
		).toThrow("Invalid event filename");
	});

	it("rejects duplicate slugs", () => {
		expect(() =>
			validateCatalogEntries([
				{ filename: "test-event.md", document: validDocument },
				{ filename: "test-event.md", document: validDocument },
			]),
		).toThrow("Duplicate event slug: test-event");
	});

	it("requires at least one event", () => {
		expect(() => validateCatalogEntries([])).toThrow(
			"Event catalog must contain at least one event",
		);
	});

	it("rejects a symbolic-link catalog root", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "toen-content-link-"));
		const events = path.join(root, "events");
		const alias = path.join(root, "events-alias");
		await mkdir(events);
		await writeFile(path.join(events, "test-event.md"), validDocument);
		await symlink(events, alias, "dir");

		await expect(loadEventCatalog(alias)).rejects.toThrow(
			"catalog root must be a real directory",
		);
	});

	it("rejects conflicting visible labels across events", () => {
		const first = replaceDocument(
			"topics:\n  - wetenschap",
			"topics:\n  - wetenschap\ntopicLabels:\n  wetenschap: Wetenschap",
		);
		const second = first.replace(
			"wetenschap: Wetenschap",
			"wetenschap: Andere naam",
		);
		expect(() =>
			validateCatalogEntries([
				{ filename: "first.md", document: first },
				{ filename: "second.md", document: second },
			]),
		).toThrow("Conflicting topic label");
	});
});
