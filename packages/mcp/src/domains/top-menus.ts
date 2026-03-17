import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { topMenusToolInputSchema, topMenusToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, requireDefault, requireTemplateVar, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://top-menus/{unitId}/{empId}/{roomId}/{courseId}",
	() => [],
);

export function registerTopMenusDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"browse_top_menus",
		{
			title: "Browse Top Menus",
			description: "Fetches top menu units, courses, and schedules.",
			inputSchema: topMenusToolInputSchema,
			outputSchema: topMenusToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ unitId, empId, roomId, courseId, includeUnits, includeCourses, includeSchedules }) => {
			const session = services.sessionStore.requireActive();
			const resolvedUnitId = unitId ?? requireDefault(session, "unitId", "1001000");
			const resolvedEmpId = empId ?? requireDefault(session, "empId", "0");
			const resolvedRoomId = roomId ?? requireDefault(session, "roomId", "0");
			const resolvedCourseId = courseId ?? requireDefault(session, "courseId", "0");
			const raw = await fetchTopMenusRaw(services, session, resolvedUnitId, resolvedEmpId, resolvedRoomId, resolvedCourseId);
			const resourceUri = services.apiClient.getTopMenusResourceUri(resolvedUnitId, resolvedEmpId, resolvedRoomId, resolvedCourseId);

			return createToolResult(
				"Fetched top-menu data. Read the linked resource for the full raw upstream payload.",
				{
					domain: "top-menus",
					fetchedAt: raw.fetchedAt,
					resourceUri,
					unitId: resolvedUnitId,
					empId: resolvedEmpId,
					roomId: resolvedRoomId,
					courseId: resolvedCourseId,
					...(includeUnits ? { units: raw.upstream.units } : {}),
					...(includeCourses ? { courses: raw.upstream.courses } : {}),
					...(includeSchedules ? { schedules: raw.upstream.schedules } : {}),
				},
				{
					uri: resourceUri,
					name: "Raw top-menu payload",
					description: "Full upstream top-menu payload for the supplied identifiers.",
				},
			);
		},
	);

	server.registerResource(
		"top-menus-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Top Menus",
			description: "Full upstream top-menu payload for the supplied identifiers.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchTopMenusRaw(
				services,
				session,
				requireTemplateVar(variables.unitId, "unitId"),
				requireTemplateVar(variables.empId, "empId"),
				requireTemplateVar(variables.roomId, "roomId"),
				requireTemplateVar(variables.courseId, "courseId"),
			);
			return createRawResourceResult(uri, raw);
		},
	);
}

async function fetchTopMenusRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	unitId: string,
	empId: string,
	roomId: string,
	courseId: string,
) {
	const [units, courses, schedules] = await Promise.all([
		services.apiClient.fetchTopUnits(session, unitId),
		services.apiClient.fetchTopCourses(session, unitId),
		services.apiClient.fetchTopSchedules(session, unitId, empId, roomId, courseId),
	]);

	return createEnvelope("top-menus", { unitId, empId, roomId, courseId }, {
		units,
		courses,
		schedules,
	});
}
