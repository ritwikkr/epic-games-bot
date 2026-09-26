export interface BotSettings {
  /**
   * Maximum normal (original) price, in INR, of the free games the bot should
   * email about. `null` means "no limit" - every free game is emailed.
   */
  maxPrice: number | null;
}
