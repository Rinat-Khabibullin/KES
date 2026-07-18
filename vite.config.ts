import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import chatHandler from "./api/chat";

const loadServerEnv = (mode: string) => {
  const env = loadEnv(mode, process.cwd(), "");

  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

const localApiRoutes = (): Plugin => ({
  name: "local-api-routes",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const pathname = request.url ? new URL(request.url, "http://localhost").pathname : "";

      if (pathname !== "/api/chat") {
        next();
        return;
      }

      try {
        await chatHandler(request, response);
      } catch (error) {
        server.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  loadServerEnv(mode);

  return {
    base: "/",
    plugins: [react(), localApiRoutes()],
  };
});
