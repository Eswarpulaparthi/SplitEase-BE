import { Router } from "express";
import mongoose from "mongoose";
import Expense from "../models/expense.model";
import Group from "../models/groups.model";
const router = Router();

router.post("/create-expense/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId as string;
    const id = req.auth?.id;
    const { title, price } = req.body;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group id",
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(400).json({
        success: false,
        message: "Group Does not exist",
      });
    }
    const expense = await Expense.create({
      title,
      price,
      paidBy: new mongoose.Types.ObjectId(id),
      groupId,
    });
    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/expenses/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId as string;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group id",
      });
    }
    const expenses = await Expense.find({ groupId });
    res.status(200).json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/settlements/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId as string;
    const id = req.auth?.id as string;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group id",
      });
    }
    const [totalSum, userPaidSum, groupMembers] = await Promise.all([
      Expense.aggregate([
        {
          $match: { groupId: new mongoose.Types.ObjectId(groupId) },
        },
        {
          $group: {
            _id: null,
            totalPrice: { $sum: "$price" },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            groupId: new mongoose.Types.ObjectId(groupId),
            paidBy: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $group: {
            _id: null,
            totalPrice: { $sum: "$price" },
          },
        },
      ]),
      Group.findById(groupId),
    ]);
    const totalPrice = totalSum[0]?.totalPrice ?? 0;
    const userPaid = userPaidSum[0]?.totalPrice ?? 0;
    const members = groupMembers?.members?.length ?? 0;
    const moneyTobePaid = totalPrice / (members > 0 ? members : 1);
    const balance = userPaid - moneyTobePaid;
    res.status(200).json({
      success: true,
      totalPrice,
      userPaid,
      balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
