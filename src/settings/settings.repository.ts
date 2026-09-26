import { SETTINGS_KEY, SettingsModel } from "./settings.model.js";
import type { BotSettings } from "./settings.types.js";

export class SettingsRepository {
  async get(): Promise<BotSettings> {
    const settings = await SettingsModel.findOne({ key: SETTINGS_KEY });

    return {
      maxPrice: settings?.maxPrice ?? null,
    };
  }

  async save(settings: BotSettings): Promise<BotSettings> {
    await SettingsModel.updateOne(
      { key: SETTINGS_KEY },
      { $set: { maxPrice: settings.maxPrice } },
      { upsert: true },
    );

    return settings;
  }
}
