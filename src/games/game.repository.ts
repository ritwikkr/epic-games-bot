import { GameModel } from "./game.model.js";
import type { FreeGame } from "../epic/epic.types.js";

export class GameRepository {
  async save(game: FreeGame): Promise<FreeGame | null> {
    const result = await GameModel.updateOne(
      { id: game.id },
      {
        $set: {
          title: game.title,
          description: game.description,
          url: game.url,
          imageUrl: game.imageUrl,
          originalPrice: game.originalPrice,
          startDate: game.startDate,
          endDate: game.endDate,
        },
        $setOnInsert: {
          id: game.id,
          firstSeenAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    // Game already existed
    if (result.upsertedCount === 0) {
      return null;
    }

    // Game was newly inserted
    return game;
  }

  async findUnnotified(): Promise<FreeGame[]> {
    const games = await GameModel.find({ notifiedAt: null });

    return games.map((game) => this.toFreeGame(game));
  }

  async markNotified(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await GameModel.updateMany(
      { id: { $in: ids } },
      { $set: { notifiedAt: new Date() } },
    );
  }

  private toFreeGame(game: any): FreeGame {
    return {
      id: game.id,
      title: game.title,
      description: game.description ?? "",
      url: game.url,
      imageUrl: game.imageUrl ?? null,
      originalPrice: game.originalPrice ?? "Unknown",
      startDate: game.startDate ? new Date(game.startDate).toISOString() : null,
      endDate: game.endDate ? new Date(game.endDate).toISOString() : null,
    };
  }
}
