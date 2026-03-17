import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { studentResourcesToolInputSchema, studentResourcesToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://student-resources/{scope}",
	() => [
		{
			uri: "sisi://student-resources/latest",
			name: "Raw student resources",
			description: "Full upstream manuals, docs, card, and report payloads.",
		},
	],
	{
		scope: () => ["latest"],
	},
);

export function registerStudentResourcesDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_student_resources",
		{
			title: "Get Student Resources",
			description: "Fetches read-only manuals, docs, payment semesters, student card data, and report types.",
			inputSchema: studentResourcesToolInputSchema,
			outputSchema: studentResourcesToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ includeManuals, includeDocs, includePaymentSemesters, includeCardList, includeReportTypes }) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchStudentResourcesRaw(services, session);

			return createToolResult(
				"Fetched student resources. Read the linked resource for the full raw upstream payload.",
				{
					domain: "student-resources",
					fetchedAt: raw.fetchedAt,
					resourceUri: "sisi://student-resources/latest",
					...(includeManuals ? { manuals: raw.upstream.manuals } : {}),
					...(includeDocs ? { docs: raw.upstream.docs } : {}),
					...(includePaymentSemesters ? { paymentSemesters: raw.upstream.paymentSemesters } : {}),
					...(includeCardList ? { cardList: raw.upstream.cardList } : {}),
					...(includeReportTypes ? { reportTypes: raw.upstream.reportTypes } : {}),
				},
				{
					uri: "sisi://student-resources/latest",
					name: "Raw student resources",
					description: "Full upstream manuals, docs, card, and report payloads.",
				},
			);
		},
	);

	server.registerResource(
		"student-resources-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Student Resources",
			description: "Full upstream manuals, docs, card, and report payloads.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			if (variables.scope !== "latest") {
				throw new Error("Only sisi://student-resources/latest is supported.");
			}

			const session = services.sessionStore.requireActive();
			const raw = await fetchStudentResourcesRaw(services, session);
			return createRawResourceResult(uri, raw);
		},
	);
}

async function fetchStudentResourcesRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
) {
	const [manuals, docs, paymentSemesters, cardList, reportTypes] = await Promise.all([
		services.apiClient.fetchManuals(session),
		services.apiClient.fetchDocs(session),
		services.apiClient.fetchPaymentSemesters(session),
		services.apiClient.fetchCardList(session),
		services.apiClient.fetchReportTypes(session),
	]);

	return createEnvelope("student-resources", {}, {
		manuals,
		docs,
		paymentSemesters,
		cardList,
		reportTypes,
	});
}
