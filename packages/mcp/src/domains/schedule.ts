import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { scheduleToolInputSchema, scheduleToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, type AppServices, requireTemplateVar } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://schedule/{kind}",
	() => [
		{
			uri: "sisi://schedule/course",
			name: "Raw course schedule",
			description: "Full upstream course schedule payload.",
		},
		{
			uri: "sisi://schedule/exam",
			name: "Raw exam schedule",
			description: "Full upstream exam schedule payload.",
		},
		{
			uri: "sisi://schedule/both",
			name: "Raw combined schedule",
			description: "Full upstream course and exam schedule payloads.",
		},
	],
	{
		kind: () => ["course", "exam", "both"],
	},
);

export function registerScheduleDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_schedule",
		{
			title: "Get Schedule",
			description: "Fetches course and exam schedules for the active student session.",
			inputSchema: scheduleToolInputSchema,
			outputSchema: scheduleToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ kind }) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchScheduleRaw(services, session, kind);
			return createToolResult(
				`Fetched the ${kind} schedule. Read the linked resource for the full raw upstream payload.`,
				{
					domain: "schedule",
					fetchedAt: raw.fetchedAt,
					resourceUri: services.apiClient.getScheduleResourceUri(kind),
					kind,
					...(raw.upstream.courseSchedule !== undefined ? { courseSchedule: raw.upstream.courseSchedule } : {}),
					...(raw.upstream.examSchedule !== undefined ? { examSchedule: raw.upstream.examSchedule } : {}),
				},
				{
					uri: services.apiClient.getScheduleResourceUri(kind),
					name: "Raw schedule payload",
					description: `Full upstream ${kind} schedule payload.`,
				},
			);
		},
	);

	server.registerResource(
		"schedule-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Schedule Payload",
			description: "Full upstream schedule payloads for the active student session.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			const kind = parseKind(requireTemplateVar(variables.kind, "kind"));
			const session = services.sessionStore.requireActive();
			const raw = await fetchScheduleRaw(services, session, kind);
			return createRawResourceResult(uri, raw);
		},
	);
}

function parseKind(value: string): "course" | "exam" | "both" {
	if (value === "course" || value === "exam" || value === "both") {
		return value;
	}

	throw new Error("Schedule resource kind must be one of: course, exam, both.");
}

async function fetchScheduleRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	kind: "course" | "exam" | "both",
) {
	const courseSchedule = kind === "course" || kind === "both"
		? await services.apiClient.fetchCourseSchedule(session)
		: undefined;
	const examSchedule = kind === "exam" || kind === "both"
		? await services.apiClient.fetchExamSchedule(session)
		: undefined;

	return createEnvelope("schedule", { kind }, {
		...(courseSchedule !== undefined ? { courseSchedule } : {}),
		...(examSchedule !== undefined ? { examSchedule } : {}),
	});
}
