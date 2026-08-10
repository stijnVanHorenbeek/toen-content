import { describe, expect, it } from "vitest";
import {
	loadEventCatalog,
	parseEventDocument,
	validateCatalogEntries,
} from "../src/catalog.js";

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

describe("event document validation", () => {
	it("derives slug from canonical filename and parses valid content", () => {
		const event = parseEventDocument("test-event.md", validDocument);

		expect(event.slug).toBe("test-event");
		expect(event.body).toBe("Event body.");
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
		["invalid source URL", "https://example.com/source", "not-a-url"],
		["empty source title", "title: Primary source", 'title: ""'],
	])("rejects %s", (_name, from, to) => {
		expect(() =>
			parseEventDocument("test-event.md", replaceDocument(from, to)),
		).toThrow();
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
});
