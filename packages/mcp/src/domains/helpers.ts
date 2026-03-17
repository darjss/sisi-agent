import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { RawResourceEnvelope, SessionState } from "../schemas";
import type { SisiApiClient } from "../api-client";
import type { SessionStore } from "../session-store";

export type AppServices = {
	apiClient: SisiApiClient;
	sessionStore: SessionStore;
};

export type ResourceLinkDescriptor = {
	uri: string;
	name: string;
	description: string;
};

export function createToolResult<TStructured>(summary: string, structuredContent: TStructured, resource: ResourceLinkDescriptor) {
	const preview = createPreview(structuredContent);
	return {
		content: [
			{ type: "text" as const, text: summary },
			{ type: "text" as const, text: `Raw resource URI: ${resource.uri}` },
			...(preview ? [{ type: "text" as const, text: `Preview:\n${preview}` }] : []),
			{
				type: "resource_link" as const,
				uri: resource.uri,
				name: resource.name,
				description: resource.description,
				mimeType: "application/json",
			},
		],
		structuredContent,
	};
}

function createPreview(value: unknown): string | null {
	try {
		const json = JSON.stringify(value, null, 2);
		if (!json) {
			return null;
		}

		if (json.length <= 1500) {
			return json;
		}

		return `${json.slice(0, 1500)}\n...`;
	} catch {
		return null;
	}
}

export function createRawResourceResult(uri: URL, envelope: RawResourceEnvelope) {
	return {
		contents: [
			{
				uri: uri.toString(),
				mimeType: "application/json",
				text: JSON.stringify(envelope, null, 2),
			},
		],
	};
}

export function createResourceTemplate(
	uriTemplate: string,
	listResources: () => Array<{ uri: string; name: string; description: string }>,
	completions: Record<string, (value: string) => string[]> = {},
) {
	return new ResourceTemplate(uriTemplate, {
		list: async () => ({
			resources: listResources().map((resource) => ({
				uri: resource.uri,
				name: resource.name,
				description: resource.description,
				mimeType: "application/json",
			})),
		}),
		complete: Object.fromEntries(
			Object.entries(completions).map(([key, callback]) => [key, async (value: string) => callback(value)]),
		),
	});
}

export function requireDefault(session: SessionState, key: keyof SessionState["defaults"], fallback?: string): string {
	const value = session.defaults[key] ?? fallback;
	if (!value) {
		throw new Error(`Missing required default '${key}'. Register the localhost session with that default value.`);
	}

	return value;
}

export function requireTemplateVar(value: string | string[] | undefined, name: string): string {
	if (typeof value === "string" && value.length > 0) {
		return value;
	}

	throw new Error(`Missing required resource variable '${name}'.`);
}

export function createEnvelope(
	domain: string,
	inputs: Record<string, unknown>,
	upstream: Record<string, unknown>,
): RawResourceEnvelope {
	return {
		domain,
		fetchedAt: new Date().toISOString(),
		inputs,
		upstream,
	};
}
