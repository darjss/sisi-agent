import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { ejournalToolInputSchema, ejournalToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, requireTemplateVar, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://ejournal/{acid}",
	() => [],
);

export function registerEjournalDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_ejournal_summary",
		{
			title: "Get E-Journal Summary",
			description: "Fetches read-only e-journal data for a selected assessment id.",
			inputSchema: ejournalToolInputSchema,
			outputSchema: ejournalToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ acid, includeComponents, includeJournal, includeAssessmentPartition }) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchEjournalRaw(services, session, acid);
			const resourceUri = services.apiClient.getEjournalResourceUri(acid);

			return createToolResult(
				"Fetched e-journal data. Read the linked resource for the full raw upstream payload.",
				{
					domain: "ejournal",
					fetchedAt: raw.fetchedAt,
					resourceUri,
					acid,
					...(includeComponents ? { components: raw.upstream.components } : {}),
					...(includeJournal ? { journal: raw.upstream.journal } : {}),
					...(includeAssessmentPartition ? { assessmentPartition: raw.upstream.assessmentPartition } : {}),
				},
				{
					uri: resourceUri,
					name: "Raw e-journal payload",
					description: "Full upstream e-journal payload for the supplied assessment id.",
				},
			);
		},
	);

	server.registerResource(
		"ejournal-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw E-Journal",
			description: "Full upstream e-journal payload for the supplied assessment id.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchEjournalRaw(services, session, requireTemplateVar(variables.acid, "acid"));
			return createRawResourceResult(uri, raw);
		},
	);
}

async function fetchEjournalRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	acid: string,
) {
	const [components, journal, assessmentPartition] = await Promise.all([
		services.apiClient.fetchEjournalComponents(session),
		services.apiClient.fetchEjournalJournal(session, acid),
		services.apiClient.fetchEjournalAssessmentPartition(session, acid),
	]);

	return createEnvelope("ejournal", { acid }, {
		components,
		journal,
		assessmentPartition,
	});
}
