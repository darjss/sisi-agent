import { SessionError } from "./errors";
import type { RegisterSessionInput, SessionState } from "./schemas";

type VerifiedSession = {
	auth: RegisterSessionInput;
	derived: SessionState["derived"];
};

export class SessionStore {
	private current: SessionState | null = null;

	constructor(private readonly ttlMs: number) {}

	register(verified: VerifiedSession): SessionState {
		const nextSession: SessionState = {
			sessionId: crypto.randomUUID(),
			auth: {
				cookieHeader: verified.auth.cookieHeader,
				bearerToken: verified.auth.bearerToken,
			},
			derived: verified.derived,
			defaults: {
				...verified.auth.defaults,
			},
			expiresAt: Date.now() + this.ttlMs,
		};

		this.current = nextSession;
		return nextSession;
	}

	getActive(): SessionState | null {
		if (!this.current) {
			return null;
		}

		if (this.current.expiresAt <= Date.now()) {
			this.current = null;
			return null;
		}

		return this.current;
	}

	requireActive(): SessionState {
		if (!this.current) {
			throw new SessionError(
				"SESSION_MISSING",
				"No active SISI session. Bootstrap the localhost server through POST /local/session/register first.",
			);
		}

		if (this.current.expiresAt <= Date.now()) {
			this.current = null;
			throw new SessionError(
				"SESSION_EXPIRED",
				"The local SISI session expired. Bootstrap the localhost server again through POST /local/session/register.",
			);
		}

		this.current.expiresAt = Date.now() + this.ttlMs;
		return this.current;
	}

	refresh(sessionId: string): SessionState {
		const session = this.requireActive();
		if (session.sessionId !== sessionId) {
			throw new SessionError("SESSION_MISMATCH", "The supplied session handle does not match the active local session.");
		}

		session.expiresAt = Date.now() + this.ttlMs;
		return session;
	}

	clear(sessionId?: string): boolean {
		const active = this.getActive();
		if (!active) {
			this.current = null;
			return false;
		}

		if (sessionId && active.sessionId !== sessionId) {
			throw new SessionError("SESSION_MISMATCH", "The supplied session handle does not match the active local session.");
		}

		this.current = null;
		return true;
	}
}
