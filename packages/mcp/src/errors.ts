export type SessionErrorCode = "SESSION_MISSING" | "SESSION_EXPIRED" | "SESSION_MISMATCH";

export class SessionError extends Error {
	constructor(
		public readonly code: SessionErrorCode,
		message: string,
	) {
		super(message);
		this.name = "SessionError";
	}
}

export class UpstreamHttpError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "UpstreamHttpError";
	}
}
