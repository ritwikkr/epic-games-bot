import { EpicClient } from "../epic/epic.client.js";
import type { FreeGame } from "../epic/epic.types.js";
import { SettingsService } from "../settings/settings.service.js";
import { GameRepository } from "./game.repository.js";
import { isWithinMaxPrice } from "./price.util.js";

export class GameService {
  constructor(
    private readonly epicClient: EpicClient,
    private readonly gameRepository: GameRepository,
    private readonly settingsService: SettingsService,
  ) {}

  async syncFreeGames(): Promise<FreeGame[]> {
    const freeGames = await this.epicClient.getFreeGames();

    const { maxPrice } = await this.settingsService.getSettings();

    const matchingGames = freeGames.filter((game) =>
      isWithinMaxPrice(game.originalPrice, maxPrice),
    );

    const newGames: FreeGame[] = [];

    for (const game of matchingGames) {
      const savedGame = await this.gameRepository.save(game);

      if (savedGame) {
        newGames.push(savedGame);
      }
    }

    return newGames;
  }

  async getGamesToNotify(): Promise<FreeGame[]> {
    return this.gameRepository.findUnnotified();
  }

  async markNotified(games: FreeGame[]): Promise<void> {
    await this.gameRepository.markNotified(games.map((game) => game.id));
  }
}

