import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { Readable } from "node:stream";
import calculateEstimateApi from "./api/estimate/calculate";
import chatApi from "./api/chat";
import pricesApi from "./api/prices";
import priceSearchApi from "./api/prices/search";

type LocalApiHandler = {
  fetch: (request: Request) => Promise<Response> | Response;
};

const apiRoutes = new Map<string, LocalApiHandler>([
  ["/api/chat", chatApi],
  ["/api/prices", pricesApi],
  ["/api/prices/search", priceSearchApi],
  ["/api/estimate/calculate", calculateEstimateApi],
]);

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

      const apiRoute = apiRoutes.get(pathname);

      if (!apiRoute) {
        next();
        return;
      }

      try {
        const method = request.method || "GET";
        const headers = new Headers();

        for (const [key, value] of Object.entries(request.headers)) {
          if (Array.isArray(value)) {
            value.forEach((item) => headers.append(key, item));
          } else if (value) {
            headers.set(key, value);
          }
        }

        const webRequest = new Request(`http://localhost${request.url || "/api/chat"}`, {
          method,
          headers,
          body: method === "GET" || method === "HEAD" ? undefined : Readable.toWeb(request),
          duplex: "half",
        } as RequestInit & { duplex: "half" });
        const webResponse = await apiRoute.fetch(webRequest);

        response.statusCode = webResponse.status;
        webResponse.headers.forEach((value, key) => response.setHeader(key, value));
        response.end(Buffer.from(await webResponse.arrayBuffer()));
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
