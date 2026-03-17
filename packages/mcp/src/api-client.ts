import { buildUrl } from "./constants";
import { UpstreamHttpError } from "./errors";
import type { RuntimeConfig } from "./constants";
import type { RegisterSessionInput, SessionState } from "./schemas";

type RequestOptions = {
	method: "GET" | "POST";
	url: string;
	expectBinary?: boolean;
};

export type BinaryPayload = {
	contentType: string;
	byteLength: number;
	base64: string;
};

export class SisiApiClient {
	constructor(private readonly config: RuntimeConfig) {}

	async verifySession(auth: RegisterSessionInput): Promise<SessionState["derived"]> {
		const profile = await this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.authBase, "/resource/Me"),
			},
			auth,
		);

		const sih = extractSih(profile);
		return {
			sih,
			profile,
		};
	}

	getOverviewResourceUri(): string {
		return "sisi://overview/latest";
	}

	getScheduleResourceUri(kind: "course" | "exam" | "both"): string {
		return `sisi://schedule/${encodeURIComponent(kind)}`;
	}

	getFinancialResourceUri(year: string, sem: string, curId: string): string {
		return `sisi://financial/${encodeURIComponent(year)}/${encodeURIComponent(sem)}/${encodeURIComponent(curId)}`;
	}

	getAcademicResourceUri(curId: string): string {
		return `sisi://academic/${encodeURIComponent(curId)}`;
	}

	getNotificationsResourceUri(): string {
		return "sisi://notifications/latest";
	}

	getStudentResourcesResourceUri(): string {
		return "sisi://student-resources/latest";
	}

	getTopMenusResourceUri(unitId: string, empId: string, roomId: string, courseId: string): string {
		return `sisi://top-menus/${encodeURIComponent(unitId)}/${encodeURIComponent(empId)}/${encodeURIComponent(roomId)}/${encodeURIComponent(courseId)}`;
	}

	getEjournalResourceUri(acid: string): string {
		return `sisi://ejournal/${encodeURIComponent(acid)}`;
	}

	async fetchProfile(session: SessionState): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.authBase, "/resource/Me"),
			},
			session.auth,
		);
	}

	async fetchStudentPhoto(session: SessionState): Promise<BinaryPayload> {
		return this.requestBinary(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.phostBase, "/students/AccessByMe"),
				expectBinary: true,
			},
			session.auth,
		);
	}

	async fetchMainInfo(session: SessionState, curId?: string): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "POST",
				url: buildUrl(this.config.upstream.support2Base, "/stud/main/info", {
					sih: session.derived.sih,
					curID: curId,
				}),
			},
			session.auth,
		);
	}

	async fetchCurrentCourses(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/GetStudCurrentCourses", {
			sih: session.derived.sih,
		});
	}

	async fetchStudNews(session: SessionState, curId?: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/StudNews", {
			sih: session.derived.sih,
			curid: curId,
		});
	}

	async fetchManagementStatus(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/getManagementStatus", {
			sih: session.derived.sih,
		});
	}

	async fetchNotifications(session: SessionState): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.treeBase, "/comnity/notification/GetReciveNotification", {
					app: "13",
				}),
			},
			session.auth,
		);
	}

	async fetchCourseSchedule(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/Schedule/CourseSchedule", {
			sih: session.derived.sih,
		});
	}

	async fetchExamSchedule(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/Schedule/ExamSchedule", {
			sih: session.derived.sih,
		});
	}

	async fetchStudentBalance(session: SessionState, year: string, sem: string, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/BalanceAccount/StudBalance", {
			sih: session.derived.sih,
			year,
			sem,
			curid: curId,
		});
	}

	async fetchBankAccounts(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/BalanceAccount/bankAccounts", {
			sih: session.derived.sih,
		});
	}

	async fetchPreviousBalance(session: SessionState, year: string, sem: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/BalanceAccount/befUldegdel", {
			sih: session.derived.sih,
			year,
			sem,
		});
	}

	async fetchLastBalance(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/BalanceAccount/lastUldegdel", {
			sih: session.derived.sih,
		});
	}

	async fetchGpa(session: SessionState, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/gpa", {
			sih: session.derived.sih,
			curID: curId,
		});
	}

	async fetchTranscripts(session: SessionState, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/transcripts", {
			sih: session.derived.sih,
			curID: curId,
		});
	}

	async fetchTranscriptStatistics(session: SessionState, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/transcriptStatistic", {
			sih: session.derived.sih,
			curID: curId,
		});
	}

	async fetchCurriculumGroup(session: SessionState, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/curriculumGroup", {
			sih: session.derived.sih,
			curID: curId,
		});
	}

	async fetchUpperEnglish(session: SessionState, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/upperEnglish", {
			sih: session.derived.sih,
			curID: curId,
		});
	}

	async fetchRequestStatus(session: SessionState, curId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/RequestStatus", {
			sih: session.derived.sih,
			curID: curId,
		});
	}

	async fetchManuals(session: SessionState): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.support2Base, "/stud/main/getManuals"),
			},
			session.auth,
		);
	}

	async fetchDocs(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/docs");
	}

	async fetchPaymentSemesters(session: SessionState): Promise<unknown> {
		return this.postSupport2(session, "/stud/main/getPaymentSemesters");
	}

	async fetchCardList(session: SessionState): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.support2Base, "/stud/card/list", {
					sih: session.derived.sih,
				}),
			},
			session.auth,
		);
	}

	async fetchReportTypes(session: SessionState): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.treeBase, "/comnity/Report/Types"),
			},
			session.auth,
		);
	}

	async fetchTopUnits(session: SessionState, unitId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/topMenus/units", {
			unitid: unitId,
		});
	}

	async fetchTopCourses(session: SessionState, unitId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/topMenus/courses", {
			unitid: unitId,
		});
	}

	async fetchTopSchedules(session: SessionState, unitId: string, empId: string, roomId: string, courseId: string): Promise<unknown> {
		return this.postSupport2(session, "/stud/topMenus/TopSchedules", {
			unitid: unitId,
			empid: empId,
			roomid: roomId,
			courseid: courseId,
		});
	}

	async fetchEjournalComponents(session: SessionState): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.teachSisiBase, "/stud/getComponents"),
			},
			session.auth,
		);
	}

	async fetchEjournalJournal(session: SessionState, acid: string): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.teachSisiBase, "/stud/getJournal", {
					priv_hash: session.derived.sih,
					acid,
				}),
			},
			session.auth,
		);
	}

	async fetchEjournalAssessmentPartition(session: SessionState, acid: string): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "GET",
				url: buildUrl(this.config.upstream.teachSisiBase, "/stud/studAssessmentPartition", {
					priv_hash: session.derived.sih,
					acid,
				}),
			},
			session.auth,
		);
	}

	private async postSupport2(
		session: SessionState,
		path: string,
		query?: Record<string, string | undefined>,
	): Promise<unknown> {
		return this.requestUnknown(
			{
				method: "POST",
				url: buildUrl(this.config.upstream.support2Base, path, query),
			},
			session.auth,
		);
	}

	private async requestUnknown(
		options: RequestOptions,
		auth: Pick<RegisterSessionInput, "cookieHeader" | "bearerToken">,
	): Promise<unknown> {
		const response = await this.executeRequest(options, auth);
		return await parseResponseBody(response);
	}

	private async requestBinary(
		options: RequestOptions,
		auth: Pick<RegisterSessionInput, "cookieHeader" | "bearerToken">,
	): Promise<BinaryPayload> {
		const response = await this.executeRequest(options, auth);
		const bytes = await response.bytes();

		return {
			contentType: response.headers.get("content-type") ?? "application/octet-stream",
			byteLength: bytes.byteLength,
			base64: Buffer.from(bytes).toString("base64"),
		};
	}

	private async executeRequest(
		options: RequestOptions,
		auth: Pick<RegisterSessionInput, "cookieHeader" | "bearerToken">,
	): Promise<Response> {
		const headers = new Headers();
		if (auth.bearerToken) {
			headers.set("Authorization", `Bearer ${auth.bearerToken}`);
		}
		if (auth.cookieHeader) {
			headers.set("Cookie", auth.cookieHeader);
		}
		if (options.method === "POST") {
			headers.set("Content-Type", "application/x-www-form-urlencoded");
		}

		let lastError: Error | null = null;
		for (let attempt = 0; attempt < 2; attempt += 1) {
			try {
				const response = await fetch(options.url, {
					method: options.method,
					headers,
					body: options.method === "POST" ? new URLSearchParams() : undefined,
				});

				if (!response.ok) {
					const message = response.status === 401 || response.status === 403
						? "Upstream SISI authorization was rejected."
						: `Upstream SISI request failed with status ${response.status}.`;
					throw new UpstreamHttpError(response.status, message);
				}

				return response;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				if (error instanceof UpstreamHttpError || attempt === 1) {
					break;
				}
			}
		}

		if (lastError instanceof UpstreamHttpError) {
			throw lastError;
		}

		throw new UpstreamHttpError(502, "Unable to reach the upstream SISI services.");
	}
}

async function parseResponseBody(response: Response): Promise<unknown> {
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json") || contentType.includes("+json")) {
		return await response.json();
	}

	const text = await response.text();
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

export function extractSih(profile: unknown): string {
	if (Array.isArray(profile)) {
		for (const entry of profile) {
			if (
				entry &&
				typeof entry === "object" &&
				"Type" in entry &&
				"Value" in entry &&
				typeof entry.Type === "string" &&
				entry.Type.toLowerCase() === "priv_hash" &&
				typeof entry.Value === "string" &&
				entry.Value.trim().length > 0
			) {
				return entry.Value;
			}
		}
	}

	throw new UpstreamHttpError(502, "The upstream profile response did not include the expected SIH value.");
}
