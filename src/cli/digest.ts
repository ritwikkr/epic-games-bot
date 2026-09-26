import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../database/database.js";
import { EpicClient } from "../epic/epic.client.js";
import { GameRepository } from "../games/game.repository.js";
import { GameService } from "../games/game.service.js";
import { EmailService } from "../notifications/email.service.js";
import { GameScheduler } from "../scheduler/game.scheduler.js";
import { SettingsRepository } from "../settings/settings.repository.js";
import { SettingsService } from "../settings/settings.service.js";

/**
 * One-shot entry point used by external schedulers such as the GitHub Actions
 * workflow (`npm run digest`).
 *
 * It detects new free games, emails every game that has not been emailed yet,
 * then disconnects and exits - so the process never stays alive.
 *
 * It exits with a non-zero code when something fails, which makes the GitHub
 * Actions run show up as failed.
 */
async function main(): Promise<void> {
  await connectDatabase();

  try {
    const epicClient = new EpicClient();

    const gameRepository = new GameRepository();

    const settingsService = new SettingsService(new SettingsRepository());

    const gameService = new GameService(
      epicClient,
      gameRepository,
      settingsService,
    );

    const emailService = new EmailService();

    const scheduler = new GameScheduler(gameService, emailService);

    await scheduler.runOnce();
  } finally {
    await disconnectDatabase();
  }
}

main()
  .then(() => {
    console.log("✅ Digest run finished.");
  })
  .catch((error) => {
    console.error("Something went wrong:", error);
    process.exit(1);
  });
