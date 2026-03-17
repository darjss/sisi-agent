import { describe, expect, test } from "bun:test";

import { SessionStore } from "./session-store";

describe("SessionStore", () => {
	test("replaces prior sessions on register", () => {
		const store = new SessionStore(60_000);
		const first = store.register({
			auth: { bearerToken: "one", defaults: { curId: "a" } },
			derived: { sih: "first" },
		});
		const second = store.register({
			auth: { bearerToken: "two", defaults: { curId: "b" } },
			derived: { sih: "second" },
		});

		expect(first.sessionId).not.toBe(second.sessionId);
		expect(store.getActive()?.derived.sih).toBe("second");
	});

	test("expires sessions after the idle TTL", async () => {
		const store = new SessionStore(5);
		store.register({
			auth: { bearerToken: "token" },
			derived: { sih: "sih" },
		});

		await Bun.sleep(10);
		expect(store.getActive()).toBeNull();
	});
});
