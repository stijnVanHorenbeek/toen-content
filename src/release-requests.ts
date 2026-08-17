import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const maximumRequests = 10_000;
const maximumBytes = 4_096;
const filenamePattern = /^([0-9a-f-]{36})\.json$/;
const coreSchema = z.strictObject({
	kind: z.literal("toen-release-request"),
	schemaVersion: z.literal(1),
	buildUuid: z.uuid(),
	appSha: z.string().regex(/^[0-9a-f]{40}$/),
	contentSha: z.string().regex(/^[0-9a-f]{40}$/),
});
const integritySha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const requestSchema = coreSchema.extend({
	integritySha256: integritySha256Schema,
});
const lockCommon = {
	kind: z.literal("toen-release-activation-lock"),
	schemaVersion: z.literal(1),
	ownerId: z.uuid(),
	appSha: z.string().regex(/^[0-9a-f]{40}$/),
	contentSha: z.string().regex(/^[0-9a-f]{40}$/),
};
const lockCoreSchema = z.discriminatedUnion("state", [
	z.strictObject({
		...lockCommon,
		state: z.literal("triggering"),
		expiresAt: z.iso.datetime(),
	}),
	z.strictObject({
		...lockCommon,
		state: z.literal("active"),
		buildUuid: z.uuid(),
	}),
	z.strictObject({ ...lockCommon, state: z.literal("released") }),
]);
const lockSchema = z.discriminatedUnion("state", [
	z.strictObject({
		...lockCommon,
		state: z.literal("triggering"),
		expiresAt: z.iso.datetime(),
		integritySha256: integritySha256Schema,
	}),
	z.strictObject({
		...lockCommon,
		state: z.literal("active"),
		buildUuid: z.uuid(),
		integritySha256: integritySha256Schema,
	}),
	z.strictObject({
		...lockCommon,
		state: z.literal("released"),
		integritySha256: integritySha256Schema,
	}),
]);

export type ReleaseRequest = z.infer<typeof requestSchema>;
export type ReleaseActivationLock = z.infer<typeof lockSchema>;

export async function loadReleaseRequests(
	directory: string,
	trustedRoot = process.cwd(),
): Promise<ReleaseRequest[]> {
	const lexicalTrusted = path.resolve(trustedRoot);
	const trusted = await requireRealDirectory(lexicalTrusted, "Repository root");
	const target = path.isAbsolute(directory)
		? path.resolve(directory)
		: path.resolve(lexicalTrusted, directory);
	const relative = path.relative(lexicalTrusted, target);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error("Release request root escapes repository");
	}
	let current = lexicalTrusted;
	for (const component of relative.split(path.sep).filter(Boolean)) {
		current = path.join(current, component);
		try {
			const componentMetadata = await lstat(current);
			if (componentMetadata.isSymbolicLink()) {
				throw new Error("Release request root must be a real directory");
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
			throw error;
		}
	}
	const resolvedTarget = await realpath(target);
	const resolvedRelative = path.relative(trusted, resolvedTarget);
	if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) {
		throw new Error("Release request root escapes repository");
	}
	let rootMetadata: Awaited<ReturnType<typeof lstat>>;
	try {
		rootMetadata = await lstat(target);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
		throw error;
	}
	if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory()) {
		throw new Error("Release request root must be a real directory");
	}
	const entries = await readdir(target, { withFileTypes: true });
	if (entries.length > maximumRequests) {
		throw new Error(`Release requests exceed ${maximumRequests} entries`);
	}
	const requests: ReleaseRequest[] = [];
	for (const entry of entries.toSorted((left, right) =>
		left.name.localeCompare(right.name),
	)) {
		const match = filenamePattern.exec(entry.name);
		if (!match)
			throw new Error(`Invalid release request filename: ${entry.name}`);
		if (!entry.isFile()) {
			throw new Error(`Release request must be a real file: ${entry.name}`);
		}
		const filePath = path.join(target, entry.name);
		const metadata = await stat(filePath);
		if (metadata.size > maximumBytes) {
			throw new Error(
				`Release request ${entry.name} exceeds ${maximumBytes} bytes`,
			);
		}
		const parsed = requestSchema.parse(
			JSON.parse(await readFile(filePath, "utf8")),
		);
		if (parsed.buildUuid !== match[1]) {
			throw new Error(`Release request UUID does not match ${entry.name}`);
		}
		const { integritySha256, ...core } = parsed;
		const actual = createHash("sha256")
			.update(JSON.stringify(core))
			.digest("hex");
		if (actual !== integritySha256) {
			throw new Error(`Release request integrity failed: ${entry.name}`);
		}
		requests.push(parsed);
	}
	return requests;
}

export async function loadReleaseActivationLock(
	filePath: string,
	trustedRoot = process.cwd(),
): Promise<ReleaseActivationLock | null> {
	const lexicalTrusted = path.resolve(trustedRoot);
	const trusted = await requireRealDirectory(lexicalTrusted, "Repository root");
	const target = path.isAbsolute(filePath)
		? path.resolve(filePath)
		: path.resolve(lexicalTrusted, filePath);
	const relative = path.relative(lexicalTrusted, target);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error("Release activation lock escapes repository");
	}
	let current = lexicalTrusted;
	for (const component of relative.split(path.sep).filter(Boolean)) {
		current = path.join(current, component);
		try {
			const metadata = await lstat(current);
			if (metadata.isSymbolicLink()) {
				throw new Error("Release activation lock must be a real file");
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
			throw error;
		}
	}
	const resolvedTarget = await realpath(target);
	const resolvedRelative = path.relative(trusted, resolvedTarget);
	if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) {
		throw new Error("Release activation lock escapes repository");
	}
	const metadata = await stat(target);
	if (!metadata.isFile()) {
		throw new Error("Release activation lock must be a real file");
	}
	if (metadata.size > maximumBytes) {
		throw new Error(`Release activation lock exceeds ${maximumBytes} bytes`);
	}
	const parsed = lockSchema.parse(JSON.parse(await readFile(target, "utf8")));
	const { integritySha256, ...core } = parsed;
	const validatedCore = lockCoreSchema.parse(core);
	const actual = createHash("sha256")
		.update(JSON.stringify(validatedCore))
		.digest("hex");
	if (actual !== integritySha256) {
		throw new Error("Release activation lock integrity failed");
	}
	return parsed;
}

async function requireRealDirectory(target: string, label: string) {
	const metadata = await lstat(target);
	if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
		throw new Error(`${label} must be a real directory`);
	}
	return realpath(target);
}
