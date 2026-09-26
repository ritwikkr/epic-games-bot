import { SettingsRepository } from "./settings.repository.js";
import type { BotSettings } from "./settings.types.js";

export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getSettings(): Promise<BotSettings> {
    return this.settingsRepository.get();
  }

  async updateMaxPrice(value: unknown): Promise<BotSettings> {
    const maxPrice = this.parseMaxPrice(value);

    return this.settingsRepository.save({ maxPrice });
  }

  /**
   * Accepts a number, a numeric string, or `null`/`""`/`"any"` for "no limit".
   */
  private parseMaxPrice(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase();

      if (trimmed === "" || trimmed === "any" || trimmed === "none") {
        return null;
      }

      const parsed = Number(trimmed);

      if (!Number.isFinite(parsed)) {
        throw new Error("maxPrice must be a number, or empty for no limit");
      }

      return this.assertValid(parsed);
    }

    if (typeof value === "number") {
      return this.assertValid(value);
    }

    throw new Error("maxPrice must be a number, or empty for no limit");
  }

  private assertValid(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("maxPrice must be a non-negative number");
    }

    return value;
  }
}
