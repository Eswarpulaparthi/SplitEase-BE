import mongoose, { Schema, model } from "mongoose";
import { ref } from "process";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
      },
    ],
  },
  { timestamps: true },
);

const Group = model("Group", groupSchema);
export default Group;
