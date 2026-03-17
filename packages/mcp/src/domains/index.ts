import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { AppServices } from "./helpers";
import { registerAcademicDomain } from "./academic";
import { registerEjournalDomain } from "./ejournal";
import { registerFinancialDomain } from "./financial";
import { registerNotificationsDomain } from "./notifications";
import { registerOverviewDomain } from "./overview";
import { registerScheduleDomain } from "./schedule";
import { registerStudentResourcesDomain } from "./student-resources";
import { registerTopMenusDomain } from "./top-menus";

export function registerDomains(server: McpServer, services: AppServices) {
	registerOverviewDomain(server, services);
	registerScheduleDomain(server, services);
	registerFinancialDomain(server, services);
	registerAcademicDomain(server, services);
	registerNotificationsDomain(server, services);
	registerStudentResourcesDomain(server, services);
	registerTopMenusDomain(server, services);
	registerEjournalDomain(server, services);
}
