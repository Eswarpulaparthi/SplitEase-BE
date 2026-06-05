import { Schema, model } from "mongoose";

const BlackListSchema = new Schema({
  token: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "1d",
  },
});

export const BlackListToken = model("BlacklistToken", BlackListSchema);
