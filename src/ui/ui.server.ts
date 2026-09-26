import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { EpicClient } from "../epic/epic.client.js";
import { isWithinMaxPrice } from "../games/price.util.js";
import { SettingsService } from "../settings/settings.service.js";
import { renderSettingsPage } from "./ui.page.js";

interface UiServerOptions {
  settingsService: SettingsService;
  epicClient: EpicClient;
  port: number;
}

export class UiServer {
  private readonly server: http.Server;

  constructor(private readonly options: UiServerOptions) {
    this.server = http.createServer((request, response) => {
      void this.handleRequest(request, response);
    });
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);

      this.server.listen(this.options.port, () => {
        this.server.removeListener("error", reject);
        resolve();
      });
    });

    console.log(
      `🖥️  Preference UI running at http://localhost:${this.options.port}`,
    );
  }

  private async handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const url = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "localhost"}`,
    );

    try {
      if (request.method === "GET" && url.pathname === "/") {
        this.sendHtml(response, renderSettingsPage());
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/settings") {
        const settings = await this.options.settingsService.getSettings();

        this.sendJson(response, 200, settings);
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/settings") {
        const body = await this.readJsonBody(request);

        const settings = await this.options.settingsService.updateMaxPrice(
          body.maxPrice,
        );

        this.sendJson(response, 200, settings);
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/free-games") {
        const [games, settings] = await Promise.all([
          this.options.epicClient.getFreeGames(),
          this.options.settingsService.getSettings(),
        ]);

        this.sendJson(response, 200, {
          maxPrice: settings.maxPrice,
          games: games.map((game) => ({
            id: game.id,
            title: game.title,
            url: game.url,
            imageUrl: game.imageUrl,
            originalPrice: game.originalPrice,
            endDate: game.endDate,
            matchesFilter: isWithinMaxPrice(
              game.originalPrice,
              settings.maxPrice,
            ),
          })),
        });
        return;
      }

      this.sendJson(response, 404, { error: "Not found" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";

      const status = url.pathname === "/api/settings" ? 400 : 500;

      this.sendJson(response, status, { error: message });
    }
  }

  private async readJsonBody(
    request: IncomingMessage,
  ): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = [];

    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    if (chunks.length === 0) {
      return {};
    }

    const raw = Buffer.concat(chunks).toString("utf8");

    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error("Request body must be valid JSON");
    }
  }

  private sendJson(
    response: ServerResponse,
    statusCode: number,
    payload: unknown,
  ): void {
    const body = JSON.stringify(payload);

    response.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
    });

    response.end(body);
  }

  private sendHtml(response: ServerResponse, html: string): void {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": Buffer.byteLength(html),
    });

    response.end(html);
  }
}
