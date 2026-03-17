import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { financialToolInputSchema, financialToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, requireDefault, requireTemplateVar, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://financial/{year}/{sem}/{curId}",
	() => [],
);

export function registerFinancialDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_financial_overview",
		{
			title: "Get Financial Overview",
			description: "Fetches balances and payment-related read-only financial data.",
			inputSchema: financialToolInputSchema,
			outputSchema: financialToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ year, sem, curId, includeBankAccounts, includePreviousBalance, includeLastBalance }) => {
			const session = services.sessionStore.requireActive();
			const resolvedYear = year ?? requireDefault(session, "year", "2025");
			const resolvedSem = sem ?? requireDefault(session, "sem", "4");
			const resolvedCurId = curId ?? requireDefault(session, "curId");
			const raw = await fetchFinancialRaw(services, session, resolvedYear, resolvedSem, resolvedCurId);
			const resourceUri = services.apiClient.getFinancialResourceUri(resolvedYear, resolvedSem, resolvedCurId);

			return createToolResult(
				"Fetched the student financial overview. Read the linked resource for the full raw upstream payload.",
				{
					domain: "financial",
					fetchedAt: raw.fetchedAt,
					resourceUri,
					year: resolvedYear,
					sem: resolvedSem,
					curId: resolvedCurId,
					studentBalance: raw.upstream.studentBalance,
					...(includeBankAccounts ? { bankAccounts: raw.upstream.bankAccounts } : {}),
					...(includePreviousBalance ? { previousBalance: raw.upstream.previousBalance } : {}),
					...(includeLastBalance ? { lastBalance: raw.upstream.lastBalance } : {}),
				},
				{
					uri: resourceUri,
					name: "Raw financial overview",
					description: "Full upstream financial payload for the selected semester and curriculum.",
				},
			);
		},
	);

	server.registerResource(
		"financial-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Financial Overview",
			description: "Full upstream financial payload for the selected semester and curriculum.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchFinancialRaw(
				services,
				session,
				requireTemplateVar(variables.year, "year"),
				requireTemplateVar(variables.sem, "sem"),
				requireTemplateVar(variables.curId, "curId"),
			);
			return createRawResourceResult(uri, raw);
		},
	);
}

async function fetchFinancialRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	year: string,
	sem: string,
	curId: string,
) {
	const [studentBalance, bankAccounts, previousBalance, lastBalance] = await Promise.all([
		services.apiClient.fetchStudentBalance(session, year, sem, curId),
		services.apiClient.fetchBankAccounts(session),
		services.apiClient.fetchPreviousBalance(session, year, sem),
		services.apiClient.fetchLastBalance(session),
	]);

	return createEnvelope("financial", { year, sem, curId }, {
		studentBalance,
		bankAccounts,
		previousBalance,
		lastBalance,
	});
}
