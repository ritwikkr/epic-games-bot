import mongoose, { Schema } from "mongoose";

const gameSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    url: {
      type: String,
      required: true,
    },

    imageUrl: {
      type: String,
      default: null,
    },

    originalPrice: {
      type: String,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const GameModel = mongoose.model("Game", gameSchema);
