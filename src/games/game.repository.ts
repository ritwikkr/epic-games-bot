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
}
