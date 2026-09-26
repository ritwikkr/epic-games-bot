export interface FreeGame {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  originalPrice: string;
  startDate: string | null;
  endDate: string | null;
}

export interface EpicFreeGamesResponse {
  data: {
    Catalog: {
      searchStore: {
        elements: EpicGame[];
      };
    };
  };
}

export interface EpicGame {
  id: string;
  title: string;
  description: string;
  productSlug?: string;
  urlSlug?: string;

  catalogNs?: {
    mappings?: {
      pageSlug?: string;
      pageType?: string;
    }[];
  };

  offerMappings?: {
    pageSlug?: string;
    pageType?: string;
  }[];

  keyImages?: {
    type: string;
    url: string;
  }[];

  price?: {
    totalPrice?: {
      fmtPrice?: {
        originalPrice?: string;
        discountPrice?: string;
      };
    };
  };

  promotions?: {
    promotionalOffers?: {
      promotionalOffers?: {
        startDate: string;
        endDate: string;
      }[];
    }[];
  };
}
