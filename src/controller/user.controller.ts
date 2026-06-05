import type { Request, Response } from "express";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import mongoose from "mongoose";

export const usernameUpdate = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    const id = req.auth?.id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!username || typeof username !== "string" || username.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Username is required" });
    }
    const normalized = username.trim().toLowerCase();

    const existing = await User.findOne({
      username: normalized,
      _id: { $ne: id },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Username already taken" });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { username: normalized },
      { returnDocument: "after" },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(201).json({ success: true, username: updated.username });
  } catch (err) {
    console.error("update-username error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getUsername = async (req: Request, res: Response) => {
  try {
    const username = req.params.username as string;
    const user = await User.findOne({ username }).populate({
      path: "friends",
      select: "username",
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const friendId = req.body.friendId as string;
    const friend = await User.findById(friendId);
    const userId = req.auth?.id as string;
    if (!friend) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const notification = await Notification.create({
      sender: new mongoose.Types.ObjectId(userId),
      receiver: new mongoose.Types.ObjectId(friendId),
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.id as string;
    const notifications = await Notification.find({
      receiver: userId,
    }).populate({
      path: "sender",
      select: "username",
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addFriend = async (req: Request, res: Response) => {
  try {
    const friendId = req.body.friendId as string;
    const notifId = req.body.notifId as string;
    const userId = req.auth?.id as string;
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: new mongoose.Types.ObjectId(friendId) },
    });
    await User.findByIdAndUpdate(friendId, {
      $addToSet: { friends: new mongoose.Types.ObjectId(userId) },
    });
    await Notification.deleteOne({ _id: new mongoose.Types.ObjectId(notifId) });
    res.json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const searchSuggestions = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const results = await User.find({
      username: { $regex: q, $options: "i" },
    })
      .limit(5)
      .select("username");
    res.json(results);
  } catch (err) {
    console.error("search suggestions error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
