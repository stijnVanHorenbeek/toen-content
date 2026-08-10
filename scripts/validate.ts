import { loadEventCatalog } from "../src/catalog.js";

const events = await loadEventCatalog("content/events");
console.log(`Validated ${events.length} event documents.`);
