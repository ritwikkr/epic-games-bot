import cron from "node-cron";
import type { FreeGame } from "../epic/epic.types.js";
import { GameService } from "../games/game.service.js";
import { EmailService } from "../notifications/email.service.js";

/**
 * All cron expressions below are evaluated in this timezone.
 * IST (Asia/Kolkata) is always UTC+05:30 - India has no daylight saving.
 */
const TIMEZONE = "Asia/Kolkata";

/** Every morning at 9:00 AM IST. */
const DIGEST_CRON = "0 9 * * *";

/** Keeps the database (and the web UI) fresh. */
const DETECTION_CRON = "0 */6 * * *";

export class GameScheduler {
  constructor(
    private readonly gameService: GameService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Detection only - records new free games in MongoDB. Nothing is emailed
   * here; the morning digest is responsible for sending emails.
   */
  async checkForGames(): Promise<FreeGame[]> {
    console.log("🔍 Checking for new free games...");

    const newGames = await this.gameService.syncFreeGames();

    if (newGames.length === 0) {
      console.log("No new free games found.");
      return newGames;
    }

    console.log(
      `🎉 Found ${newGames.length} new free game(s) - will be emailed in the next 9:00 AM IST digest.`,
    );

    for (const game of newGames) {
      console.log(`🎮 ${game.title}`);
    }

    return newGames;
  }

  /**
   * Emails every free game that has not been emailed yet, then marks those
   * games as notified so they are never sent twice.
   */
  async sendDailyDigest(): Promise<{ sent: number; failed: number }> {
    console.log("📬 Sending the daily 9:00 AM IST free games digest...");

    const games = await this.gameService.getGamesToNotify();

    if (games.length === 0) {
      console.log("No games to email this morning.");
      return { sent: 0, failed: 0 };
    }

    const sent: FreeGame[] = [];

    for (const game of games) {
      try {
        await this.emailService.sendNewGameEmail(game);
        sent.push(game);
        console.log(`📧 Email sent for "${game.title}"`);
      } catch (error) {
        console.error(`❌ Failed to email "${game.title}":`, error);
      }
    }

    await this.gameService.markNotified(sent);

    console.log(
      `✅ Digest complete: ${sent.length} of ${games.length} email(s) sent.`,
    );

    return { sent: sent.length, failed: games.length - sent.length };
  }

  /**
   * Runs one full cycle (detect + email) and returns.
   *
   * Used by one-shot callers such as the GitHub Actions workflow. Anything
   * that fails is thrown so the CI run is reported as failed.
   */
  async runOnce(): Promise<void> {
    await this.checkForGames();

    const { failed } = await this.sendDailyDigest();

    if (failed > 0) {
      throw new Error(`${failed} email(s) could not be sent`);
    }
  }

  async start(): Promise<void> {
    // Record any current free games right away (no email is sent here).
    await this.checkForGames().catch((error) => {
      console.error("❌ Failed to check for free games:", error);
    });

    // Keep the database fresh every 6 hours.
    cron.schedule(
      DETECTION_CRON,
      () => {
        void this.checkForGames().catch((error) => {
          console.error("❌ Failed to check for free games:", error);
        });
      },
      { timezone: TIMEZONE },
    );

    // Email the digest every morning at 9:00 AM IST.
    cron.schedule(
      DIGEST_CRON,
      () => {
        void this.sendDailyDigest().catch((error) => {
          console.error("❌ Failed to send the daily digest:", error);
        });
      },
      { timezone: TIMEZONE },
    );

    console.log("⏰ Game scheduler started - emails every day at 9:00 AM IST.");
  }
}

