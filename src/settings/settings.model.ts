import mongoose, { Schema } from "mongoose";

export const SETTINGS_KEY = "default";

const settingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: SETTINGS_KEY,
    },

    maxPrice: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const SettingsModel = mongoose.model("Settings", settingsSchema);
