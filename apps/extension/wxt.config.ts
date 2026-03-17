import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

const chromiumBinary =
	process.env.HELIUM_PATH ?? process.env.CHROME_PATH ?? "/usr/bin/helium-browser";

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	vite: () => ({
		plugins: [tailwindcss()],
	}),
	webExt: {
		binaries: {
			chrome: chromiumBinary,
			...(process.env.FIREFOX_PATH
				? { firefox: process.env.FIREFOX_PATH }
				: {}),
		},
	},
});
