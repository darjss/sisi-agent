import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { academicToolInputSchema, academicToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, requireDefault, requireTemplateVar, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://academic/{curId}",
	() => [],
);

export function registerAcademicDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_academic_record",
		{
			title: "Get Academic Record",
			description: "Fetches GPA, transcripts, and curriculum-related read-only academic data.",
			inputSchema: academicToolInputSchema,
			outputSchema: academicToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ curId, includeGpa, includeTranscripts, includeTranscriptStatistics, includeCurriculumGroup, includeUpperEnglish, includeRequestStatus }) => {
			const session = services.sessionStore.requireActive();
			const resolvedCurId = curId ?? requireDefault(session, "curId");
			const raw = await fetchAcademicRaw(services, session, resolvedCurId);
			const resourceUri = services.apiClient.getAcademicResourceUri(resolvedCurId);

			return createToolResult(
				"Fetched the student academic record. Read the linked resource for the full raw upstream payload.",
				{
					domain: "academic",
					fetchedAt: raw.fetchedAt,
					resourceUri,
					curId: resolvedCurId,
					...(includeGpa ? { gpa: raw.upstream.gpa } : {}),
					...(includeTranscripts ? { transcripts: raw.upstream.transcripts } : {}),
					...(includeTranscriptStatistics ? { transcriptStatistics: raw.upstream.transcriptStatistics } : {}),
					...(includeCurriculumGroup ? { curriculumGroup: raw.upstream.curriculumGroup } : {}),
					...(includeUpperEnglish ? { upperEnglish: raw.upstream.upperEnglish } : {}),
					...(includeRequestStatus ? { requestStatus: raw.upstream.requestStatus } : {}),
				},
				{
					uri: resourceUri,
					name: "Raw academic record",
					description: "Full upstream academic payload for the selected curriculum.",
				},
			);
		},
	);

	server.registerResource(
		"academic-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Academic Record",
			description: "Full upstream academic payload for the selected curriculum.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchAcademicRaw(services, session, requireTemplateVar(variables.curId, "curId"));
			return createRawResourceResult(uri, raw);
		},
	);
}

async function fetchAcademicRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	curId: string,
) {
	const [gpa, transcripts, transcriptStatistics, curriculumGroup, upperEnglish, requestStatus] = await Promise.all([
		services.apiClient.fetchGpa(session, curId),
		services.apiClient.fetchTranscripts(session, curId),
		services.apiClient.fetchTranscriptStatistics(session, curId),
		services.apiClient.fetchCurriculumGroup(session, curId),
		services.apiClient.fetchUpperEnglish(session, curId),
		services.apiClient.fetchRequestStatus(session, curId),
	]);

	return createEnvelope("academic", { curId }, {
		gpa,
		transcripts,
		transcriptStatistics,
		curriculumGroup,
		upperEnglish,
		requestStatus,
	});
}
