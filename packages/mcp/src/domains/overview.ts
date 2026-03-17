import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { overviewToolInputSchema, overviewToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://overview/{scope}",
	() => [
		{
			uri: "sisi://overview/latest",
			name: "Raw student overview",
			description: "Full upstream overview payload for the active student session.",
		},
	],
	{
		scope: () => ["latest"],
	},
);

export function registerOverviewDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_student_overview",
		{
			title: "Get Student Overview",
			description: "Fetches the student profile, overview, and home dashboard data.",
			inputSchema: overviewToolInputSchema,
			outputSchema: overviewToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async (args) => {
			const session = services.sessionStore.requireActive();
			const raw = await fetchOverviewRaw(services, session, {
				includeProfile: args.includeProfile,
				includePhoto: args.includePhoto,
				includeMainInfo: args.includeMainInfo,
				includeCurrentCourses: args.includeCurrentCourses,
				includeManagementStatus: args.includeManagementStatus,
				includeNews: args.includeNews,
			});
			const structuredContent = {
				domain: "overview",
				fetchedAt: raw.fetchedAt,
				resourceUri: "sisi://overview/latest",
				...(args.includeProfile ? { profile: raw.upstream.profile } : {}),
				...(args.includePhoto && raw.upstream.photoMetadata ? { photo: raw.upstream.photoMetadata } : {}),
				...(args.includeMainInfo ? { mainInfo: raw.upstream.mainInfo } : {}),
				...(args.includeCurrentCourses ? { currentCourses: raw.upstream.currentCourses } : {}),
				...(args.includeManagementStatus ? { managementStatus: raw.upstream.managementStatus } : {}),
				...(args.includeNews ? { news: raw.upstream.news } : {}),
			};

			return createToolResult(
				"Fetched the active student overview. Read the linked resource for the full raw upstream payload.",
				structuredContent,
				{
					uri: "sisi://overview/latest",
					name: "Raw student overview",
					description: "Full upstream overview payload for the active student session.",
				},
			);
		},
	);

	server.registerResource(
		"overview-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Student Overview",
			description: "Full upstream overview payload for the active student session.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			if (variables.scope !== "latest") {
				throw new Error("Only sisi://overview/latest is supported.");
			}

			const session = services.sessionStore.requireActive();
			const raw = await fetchOverviewRaw(services, session, {
				includeProfile: true,
				includePhoto: true,
				includeMainInfo: true,
				includeCurrentCourses: true,
				includeManagementStatus: true,
				includeNews: true,
			});
			return createRawResourceResult(uri, raw);
		},
	);
}

type OverviewFetchOptions = {
	includeProfile: boolean;
	includePhoto: boolean;
	includeMainInfo: boolean;
	includeCurrentCourses: boolean;
	includeManagementStatus: boolean;
	includeNews: boolean;
};

async function fetchOverviewRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	options: OverviewFetchOptions,
) {
	const [profile, photo, mainInfo, currentCourses, managementStatus, news] = await Promise.all([
		options.includeProfile ? services.apiClient.fetchProfile(session) : Promise.resolve(undefined),
		options.includePhoto ? services.apiClient.fetchStudentPhoto(session) : Promise.resolve(undefined),
		options.includeMainInfo ? services.apiClient.fetchMainInfo(session, session.defaults.curId) : Promise.resolve(undefined),
		options.includeCurrentCourses ? services.apiClient.fetchCurrentCourses(session) : Promise.resolve(undefined),
		options.includeManagementStatus ? services.apiClient.fetchManagementStatus(session) : Promise.resolve(undefined),
		options.includeNews && session.defaults.curId ? services.apiClient.fetchStudNews(session, session.defaults.curId) : Promise.resolve(undefined),
	]);

	return createEnvelope("overview", {}, {
		...(profile !== undefined ? { profile } : {}),
		...(photo !== undefined
			? {
					photoMetadata: {
						contentType: photo.contentType,
						byteLength: photo.byteLength,
					},
					photo,
				}
			: {}),
		...(mainInfo !== undefined ? { mainInfo } : {}),
		...(currentCourses !== undefined ? { currentCourses } : {}),
		...(managementStatus !== undefined ? { managementStatus } : {}),
		...(news !== undefined ? { news } : {}),
	});
}
