import { loadEventCatalog } from "../src/catalog.js";
import {
	loadReleaseActivationLock,
	loadReleaseRequests,
} from "../src/release-requests.js";

const [events, releaseRequests, activationLock] = await Promise.all([
	loadEventCatalog("content/events"),
	loadReleaseRequests(".toen/releases/requests"),
	loadReleaseActivationLock(".toen/releases/activation-lock.json"),
]);
console.log(
	`Validated ${events.length} event documents, ${releaseRequests.length} release requests, and ${activationLock ? "one" : "no"} activation lock.`,
);
