import type { EpicFreeGamesResponse, FreeGame } from "./epic.types.js";

const EPIC_FREE_GAMES_URL =
  "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions";

export class EpicClient {
  async getFreeGames(): Promise<FreeGame[]> {
    const url = new URL(EPIC_FREE_GAMES_URL);

    url.searchParams.set("locale", "en-US");
    url.searchParams.set("country", "IN");
    url.searchParams.set("allowCountries", "IN");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Epic API returned ${response.status}`);
    }

    const data = (await response.json()) as EpicFreeGamesResponse;

    return data.data.Catalog.searchStore.elements
      .map((game) => this.normalizeGame(game))
      .filter((game): game is FreeGame => game !== null);
  }

  private normalizeGame(game: any): FreeGame | null {
    const promotion =
      game.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];

    if (!promotion) {
      return null;
    }

    const price = game.price?.totalPrice?.fmtPrice;

    const discountPrice = price?.discountPrice;

    if (discountPrice !== "0") {
      return null;
    }

    const image =
      game.keyImages?.find((image: any) => image.type === "OfferImageWide")
        ?.url ?? null;

    const slug = this.resolveSlug(game);

    if (!slug) {
      return null;
    }

    return {
      id: game.id,
      title: game.title,
      description: game.description,
      url: `https://store.epicgames.com/en-US/p/${slug}`,
      imageUrl: image,
      originalPrice: price?.originalPrice ?? "Unknown",
      startDate: promotion.startDate,
      endDate: promotion.endDate,
    };
  }

  /**
   * Epic only returns `productSlug` for some offers. When it is missing, the
   * human readable store slug lives in `catalogNs.mappings` / `offerMappings`.
   * `urlSlug` is only a last resort because for some offers it is a raw hex id
   * that leads to a "page not found".
   */
  private resolveSlug(game: any): string | null {
    const candidates = [
      this.findPageSlug(game.catalogNs?.mappings),
      game.productSlug,
      this.findPageSlug(game.offerMappings),
      game.urlSlug,
    ];

    for (const candidate of candidates) {
      const slug = this.cleanSlug(candidate);

      if (slug) {
        return slug;
      }
    }

    return null;
  }

  private findPageSlug(mappings: any): string | null {
    if (!Array.isArray(mappings)) {
      return null;
    }

    const home = mappings.find(
      (mapping) =>
        mapping?.pageType === "productHome" && Boolean(mapping?.pageSlug),
    );

    if (home) {
      return home.pageSlug ?? null;
    }

    const first = mappings.find((mapping) => Boolean(mapping?.pageSlug));

    return first?.pageSlug ?? null;
  }

  private cleanSlug(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed.endsWith("/home")) {
      return trimmed.slice(0, -"/home".length) || null;
    }

    return trimmed;
  }
}
