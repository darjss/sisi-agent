import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { notificationsToolInputSchema, notificationsToolOutputSchema, allToolAnnotations } from "../schemas";
import { createEnvelope, createRawResourceResult, createResourceTemplate, createToolResult, type AppServices } from "./helpers";

const RESOURCE_TEMPLATE = createResourceTemplate(
	"sisi://notifications/{scope}",
	() => [
		{
			uri: "sisi://notifications/latest",
			name: "Raw notifications",
			description: "Full upstream notifications payload for the active student session.",
		},
	],
	{
		scope: () => ["latest"],
	},
);

export function registerNotificationsDomain(server: McpServer, services: AppServices) {
	server.registerTool(
		"get_notifications",
		{
			title: "Get Notifications",
			description: "Fetches student news and app notifications.",
			inputSchema: notificationsToolInputSchema,
			outputSchema: notificationsToolOutputSchema,
			annotations: allToolAnnotations,
		},
		async ({ curId, includeNews, includeAppNotifications }) => {
			const session = services.sessionStore.requireActive();
			const resolvedCurId = curId ?? session.defaults.curId ?? null;
			const raw = await fetchNotificationsRaw(services, session, resolvedCurId);

			return createToolResult(
				"Fetched student notifications. Read the linked resource for the full raw upstream payload.",
				{
					domain: "notifications",
					fetchedAt: raw.fetchedAt,
					resourceUri: "sisi://notifications/latest",
					curId: resolvedCurId,
					...(includeNews ? { news: raw.upstream.news } : {}),
					...(includeAppNotifications ? { appNotifications: raw.upstream.appNotifications } : {}),
				},
				{
					uri: "sisi://notifications/latest",
					name: "Raw notifications",
					description: "Full upstream notifications payload for the active student session.",
				},
			);
		},
	);

	server.registerResource(
		"notifications-raw",
		RESOURCE_TEMPLATE,
		{
			title: "Raw Notifications",
			description: "Full upstream notifications payload for the active student session.",
			mimeType: "application/json",
		},
		async (uri, variables) => {
			if (variables.scope !== "latest") {
				throw new Error("Only sisi://notifications/latest is supported.");
			}

			const session = services.sessionStore.requireActive();
			const raw = await fetchNotificationsRaw(services, session, session.defaults.curId ?? null);
			return createRawResourceResult(uri, raw);
		},
	);
}

async function fetchNotificationsRaw(
	services: AppServices,
	session: ReturnType<AppServices["sessionStore"]["requireActive"]>,
	curId: string | null,
) {
	const [news, appNotifications] = await Promise.all([
		curId ? services.apiClient.fetchStudNews(session, curId) : Promise.resolve(null),
		services.apiClient.fetchNotifications(session),
	]);

	return createEnvelope("notifications", { curId }, {
		news,
		appNotifications,
	});
}
