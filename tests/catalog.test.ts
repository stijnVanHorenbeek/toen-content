import { describe, expect, it } from "vitest";
import { stringify } from "yaml";
import {
	loadEventCatalog,
	parseEventDocument,
	validateCatalogEntries,
} from "../src/catalog.js";
import {
	beatSources,
	contextDecisionBeat,
	invalidBeatIdentityCases,
	invalidBeatRouteCases,
	invalidBeatStructuralCases,
	sourceDuelBeat,
	voteRevoteBeat,
} from "./fixtures/interactive-beat.js";

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

	it("validates copied canonical catalog", async () => {
		const events = await loadEventCatalog("content/events");

		expect(events).toHaveLength(4);
		expect(events.map(({ slug }) => slug)).toEqual([
			"apollo-11-1969",
			"belgium-independence-1830",
			"d-day-de-geallieerde-landing-in-normandie-1944",
			"val-van-constantinopel-1453",
		]);
	});

	it("publishes Apollo 11 as the first runnable vote-revote beat", async () => {
		const events = await loadEventCatalog("content/events");
		const apollo = events.find(({ slug }) => slug === "apollo-11-1969");

		expect(apollo?.beat).toMatchObject({
			version: 1,
			mechanic: "vote-revote",
			routes: [
				{ durationMinutes: 5 },
				{ durationMinutes: 8 },
				{ durationMinutes: 12 },
			],
		});
		expect(
			apollo?.beat?.stages
				.filter((stage) => stage.phase === "evidence")
				.every(
					(stage) =>
						stage.sourceUrl ===
						"https://www.nasa.gov/history/apollo-11-mission-overview/",
				),
		).toBe(true);
	});
});
