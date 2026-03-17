import { afterEach, describe, expect, test } from "bun:test";

import { createApp, toErrorResponse } from "./app";
import { createRuntimeConfig } from "./constants";

const originalFetch = globalThis.fetch;
const asFetch = (fn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) =>
	fn as unknown as typeof fetch;

afterEach(() => {
	globalThis.fetch = originalFetch;
});

describe("localhost session bootstrap", () => {
	test("registers a session from an allowed extension origin", async () => {
		globalThis.fetch = asFetch(async () =>
			new Response(
				JSON.stringify([
					{ Type: "priv_hash", Value: "derived-sih" },
					{ Type: "unit", Value: "1001000" },
				]),
				{
					status: 200,
					headers: {
						"content-type": "application/json",
					},
				},
			));

		const app = await createApp(
			createRuntimeConfig({
				SISI_MCP_ALLOWED_ORIGINS: "chrome-extension://test-extension",
			}),
		);

		const request = new Request("http://127.0.0.1/local/session/register", {
			method: "POST",
			headers: {
				origin: "chrome-extension://test-extension",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				bearerToken: "secret-token",
				defaults: { curId: "20240001" },
			}),
		});

		const response = await app.handleRequest(request);
		expect(response.status).toBe(201);

		const payload = (await response.json()) as { sih: string; sessionId: string };
		expect(payload.sih).toBe("derived-sih");
		expect(typeof payload.sessionId).toBe("string");
		expect(app.sessionStore.getActive()?.derived.sih).toBe("derived-sih");

		await app.shutdown();
	});

	test("rejects unapproved browser origins", async () => {
		globalThis.fetch = asFetch(async () =>
			new Response(JSON.stringify([{ Type: "priv_hash", Value: "derived-sih" }]), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const app = await createApp(
			createRuntimeConfig({
				SISI_MCP_ALLOWED_ORIGINS: "chrome-extension://approved-extension",
			}),
		);

		const request = new Request("http://127.0.0.1/local/session/register", {
			method: "POST",
			headers: {
				origin: "chrome-extension://wrong-extension",
				"content-type": "application/json",
			},
			body: JSON.stringify({ bearerToken: "secret-token" }),
		});

		try {
			await app.handleRequest(request);
			throw new Error("Expected an origin rejection.");
		} catch (error) {
			const response = toErrorResponse(error, request, app.config);
			expect(response.status).toBe(403);
		}

		await app.shutdown();
	});
});
