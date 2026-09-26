import cron from "node-cron";
import { GameService } from "../games/game.service.js";
import { EmailService } from "../notifications/email.service.js";

export class GameScheduler {
  constructor(
    private readonly gameService: GameService,
    private readonly emailService: EmailService,
  ) {}

  async checkForGames(): Promise<void> {
    console.log("🔍 Checking for new free games...");

    try {
      const newGames = await this.gameService.syncFreeGames();

      if (newGames.length === 0) {
        console.log("No new free games found.");
        return;
      }

      console.log(`🎉 Found ${newGames.length} new free game(s)!`);

      for (const game of newGames) {
        console.log(`🎮 ${game.title}`);

        await this.emailService.sendNewGameEmail(game);

        console.log(`📧 Email sent for "${game.title}"`);
      }
    } catch (error) {
      console.error("❌ Failed to check for free games:", error);
    }
  }

  async start(): Promise<void> {
    // Run immediately
    await this.checkForGames();

    // Then run every 6 hours
    cron.schedule("0 */6 * * *", () => {
      void this.checkForGames();
    });

    console.log("⏰ Game scheduler started.");
  }
}
