import type { Request, Response } from "express";
import Group from "../models/groups.model";
import mongoose from "mongoose";
import User from "../models/user.model";
import Expense from "../models/expense.model";

export const adminGroups = async (req: Request, res: Response) => {
  try {
    const id = req.auth?.id;
    const adminGroups = await Group.find({ admin: id });
    if (adminGroups.length === 0) {
      return res.json({
        success: true,
        message: "there are no groups created by this user",
      });
    }
    res.status(200).json({ success: true, adminGroups });
  } catch (error) {
    console.log("error fetching admin-groups ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const normalGroups = async (req: Request, res: Response) => {
  try {
    const id = req.auth?.id;
    const groups = await Group.find({
      members: id,
      admin: { $ne: id },
    });
    if (groups.length === 0) {
      return res.json({
        success: true,
        message: "there are no groups created for this user",
      });
    }
    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.log("error fetching admin-groups ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const groupDetails = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member id",
      });
    }
    const [groupDetails, expenses] = await Promise.all([
      Group.findById(groupId).populate([
        { path: "members", select: "username" },
      ]),
      Expense.find({ groupId }),
    ]);
    if (!groupDetails) {
      return res.json({
        success: false,
        message: "there are no groups with this group id",
      });
    }
    res.status(200).json({ success: true, groupDetails, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addMemberToGroup = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId as string;
    const memberId = req.params.member as string;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group id",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member id",
      });
    }
    const [group, member] = await Promise.all([
      Group.findById(groupId),
      User.findById(memberId),
    ]);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group does't exist" });
    }
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "User does't exist" });
    }
    if (group.admin?.toString() !== req.auth?.id) {
      return res.status(403).json({
        success: false,
        message: "Your not allowed to add members to the group",
      });
    }
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      {
        $addToSet: { members: new mongoose.Types.ObjectId(memberId) },
      },
      { returnDocument: "after" },
    );
    res.status(200).json({ success: true, updatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const groupName = req.body.groupName;
    const id = req.auth?.id;
    const adminGroup = await Group.create({
      name: groupName,
      admin: id,
      members: [new mongoose.Types.ObjectId(id)],
    });
    res.status(201).json({ success: true, adminGroup });
  } catch (error) {
    console.log("error creating admin-group ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
