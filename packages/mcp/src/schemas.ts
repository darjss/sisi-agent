import { z } from "zod/v4";

export const sessionDefaultsSchema = z.object({
	curId: z.string().trim().min(1).optional(),
	year: z.string().trim().min(1).optional(),
	sem: z.string().trim().min(1).optional(),
	unitId: z.string().trim().min(1).optional(),
	empId: z.string().trim().min(1).optional(),
	roomId: z.string().trim().min(1).optional(),
	courseId: z.string().trim().min(1).optional(),
});

export type SessionDefaults = z.infer<typeof sessionDefaultsSchema>;

export const registerSessionInputSchema = z
	.object({
		cookieHeader: z.string().trim().min(1).optional(),
		bearerToken: z.string().trim().min(1).optional(),
		defaults: sessionDefaultsSchema.optional(),
	})
	.refine((value) => Boolean(value.cookieHeader || value.bearerToken), {
		message: "cookieHeader or bearerToken is required",
		path: ["cookieHeader"],
	});

export type RegisterSessionInput = z.infer<typeof registerSessionInputSchema>;

export const refreshSessionInputSchema = z.object({
	sessionId: z.string().trim().min(1),
});

export const clearSessionInputSchema = z.object({
	sessionId: z.string().trim().min(1).optional(),
});

const isoDateSchema = z.string().datetime({ offset: true });

export const registerSessionResponseSchema = z.object({
	sessionId: z.string(),
	expiresAt: isoDateSchema,
	sih: z.string(),
});

export const healthResponseSchema = z.object({
	status: z.literal("ok"),
	sessionActive: z.boolean(),
	expiresAt: isoDateSchema.nullable(),
});

export const rawResourceEnvelopeSchema = z.object({
	domain: z.string(),
	fetchedAt: isoDateSchema,
	inputs: z.record(z.string(), z.unknown()),
	upstream: z.record(z.string(), z.unknown()),
});

export type RawResourceEnvelope = z.infer<typeof rawResourceEnvelopeSchema>;

const baseToolOutputFields = {
	domain: z.string(),
	fetchedAt: isoDateSchema,
	resourceUri: z.string(),
} as const;

export const overviewToolInputSchema = z.object({
	includeProfile: z.boolean().default(true),
	includePhoto: z.boolean().default(false),
	includeMainInfo: z.boolean().default(true),
	includeCurrentCourses: z.boolean().default(true),
	includeManagementStatus: z.boolean().default(true),
	includeNews: z.boolean().default(false),
});

export const overviewToolOutputSchema = z.object({
	...baseToolOutputFields,
	profile: z.unknown().optional(),
	photo: z
		.object({
			contentType: z.string(),
			byteLength: z.number().int().nonnegative(),
		})
		.optional(),
	mainInfo: z.unknown().optional(),
	currentCourses: z.unknown().optional(),
	managementStatus: z.unknown().optional(),
	news: z.unknown().optional(),
});

export const scheduleToolInputSchema = z.object({
	kind: z.enum(["course", "exam", "both"]).default("both"),
});

export const scheduleToolOutputSchema = z.object({
	...baseToolOutputFields,
	kind: z.enum(["course", "exam", "both"]),
	courseSchedule: z.unknown().optional(),
	examSchedule: z.unknown().optional(),
});

export const financialToolInputSchema = z.object({
	year: z.string().trim().min(1).optional(),
	sem: z.string().trim().min(1).optional(),
	curId: z.string().trim().min(1).optional(),
	includeBankAccounts: z.boolean().default(true),
	includePreviousBalance: z.boolean().default(true),
	includeLastBalance: z.boolean().default(true),
});

export const financialToolOutputSchema = z.object({
	...baseToolOutputFields,
	year: z.string(),
	sem: z.string(),
	curId: z.string(),
	studentBalance: z.unknown(),
	bankAccounts: z.unknown().optional(),
	previousBalance: z.unknown().optional(),
	lastBalance: z.unknown().optional(),
});

export const academicToolInputSchema = z.object({
	curId: z.string().trim().min(1).optional(),
	includeGpa: z.boolean().default(true),
	includeTranscripts: z.boolean().default(true),
	includeTranscriptStatistics: z.boolean().default(true),
	includeCurriculumGroup: z.boolean().default(false),
	includeUpperEnglish: z.boolean().default(false),
	includeRequestStatus: z.boolean().default(false),
});

export const academicToolOutputSchema = z.object({
	...baseToolOutputFields,
	curId: z.string(),
	gpa: z.unknown().optional(),
	transcripts: z.unknown().optional(),
	transcriptStatistics: z.unknown().optional(),
	curriculumGroup: z.unknown().optional(),
	upperEnglish: z.unknown().optional(),
	requestStatus: z.unknown().optional(),
});

export const notificationsToolInputSchema = z.object({
	curId: z.string().trim().min(1).optional(),
	includeNews: z.boolean().default(true),
	includeAppNotifications: z.boolean().default(true),
});

export const notificationsToolOutputSchema = z.object({
	...baseToolOutputFields,
	curId: z.string().nullable(),
	news: z.unknown().optional(),
	appNotifications: z.unknown().optional(),
});

export const studentResourcesToolInputSchema = z.object({
	includeManuals: z.boolean().default(true),
	includeDocs: z.boolean().default(true),
	includePaymentSemesters: z.boolean().default(true),
	includeCardList: z.boolean().default(true),
	includeReportTypes: z.boolean().default(true),
});

export const studentResourcesToolOutputSchema = z.object({
	...baseToolOutputFields,
	manuals: z.unknown().optional(),
	docs: z.unknown().optional(),
	paymentSemesters: z.unknown().optional(),
	cardList: z.unknown().optional(),
	reportTypes: z.unknown().optional(),
});

export const topMenusToolInputSchema = z.object({
	unitId: z.string().trim().min(1).optional(),
	empId: z.string().trim().min(1).optional(),
	roomId: z.string().trim().min(1).optional(),
	courseId: z.string().trim().min(1).optional(),
	includeUnits: z.boolean().default(true),
	includeCourses: z.boolean().default(true),
	includeSchedules: z.boolean().default(true),
});

export const topMenusToolOutputSchema = z.object({
	...baseToolOutputFields,
	unitId: z.string(),
	empId: z.string(),
	roomId: z.string(),
	courseId: z.string(),
	units: z.unknown().optional(),
	courses: z.unknown().optional(),
	schedules: z.unknown().optional(),
});

export const ejournalToolInputSchema = z.object({
	acid: z.string().trim().min(1),
	includeComponents: z.boolean().default(true),
	includeJournal: z.boolean().default(true),
	includeAssessmentPartition: z.boolean().default(true),
});

export const ejournalToolOutputSchema = z.object({
	...baseToolOutputFields,
	acid: z.string(),
	components: z.unknown().optional(),
	journal: z.unknown().optional(),
	assessmentPartition: z.unknown().optional(),
});

export const allToolAnnotations = {
	readOnlyHint: true,
	openWorldHint: true,
	idempotentHint: true,
	destructiveHint: false,
} as const;

export type SessionState = {
	sessionId: string;
	auth: {
		cookieHeader?: string;
		bearerToken?: string;
	};
	derived: {
		sih: string;
		profile?: unknown;
	};
	defaults: SessionDefaults;
	expiresAt: number;
};
