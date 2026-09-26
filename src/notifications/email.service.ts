import "dotenv/config";
import nodemailer from "nodemailer";
import type { FreeGame } from "../epic/epic.types.js";

export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly recipient: string;

  constructor() {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);
    const secure = process.env.EMAIL_SECURE === "true";
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;
    const recipient = process.env.EMAIL_TO;

    if (!host) {
      throw new Error("EMAIL_HOST is not configured");
    }

    if (!user) {
      throw new Error("EMAIL_USER is not configured");
    }

    if (!password) {
      throw new Error("EMAIL_PASSWORD is not configured");
    }

    if (!recipient) {
      throw new Error("EMAIL_TO is not configured");
    }

    this.recipient = recipient;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendNewGameEmail(game: FreeGame): Promise<void> {
    const sender = process.env.EMAIL_USER;

    await this.transporter.sendMail({
      from: `"Epic Free Games Bot" <${sender}>`,
      to: this.recipient,

      subject: `🎁 New Epic Free Game: ${game.title}`,

      text: `
A new free game is available on Epic Games!

🎮 ${game.title}

💰 Normally: ${game.originalPrice}

⏰ Available until:
${game.endDate}

🔗 Claim it:
${game.url}
      `.trim(),
    });
  }
}
