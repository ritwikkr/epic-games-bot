import { connectDatabase } from "./database/database.js";
import { EpicClient } from "./epic/epic.client.js";
import { GameRepository } from "./games/game.repository.js";
import { GameService } from "./games/game.service.js";
import { EmailService } from "./notifications/email.service.js";
import { GameScheduler } from "./scheduler/game.scheduler.js";
import { SettingsRepository } from "./settings/settings.repository.js";
import { SettingsService } from "./settings/settings.service.js";
import { UiServer } from "./ui/ui.server.js";

async function main() {
  await connectDatabase();

  const epicClient = new EpicClient();

  const gameRepository = new GameRepository();

  const settingsRepository = new SettingsRepository();

  const settingsService = new SettingsService(settingsRepository);

  const gameService = new GameService(
    epicClient,
    gameRepository,
    settingsService,
  );

  const emailService = new EmailService();

  const scheduler = new GameScheduler(gameService, emailService);

  const uiServer = new UiServer({
    settingsService,
    epicClient,
    port: Number(process.env.PORT ?? 3000),
  });

  await uiServer.start();

  await scheduler.start();
}

main().catch((error) => {
  console.error("Something went wrong:", error);
  process.exit(1);
});
