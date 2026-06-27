import type { Request, Response } from "express";
import User from "../models/user.model";
import Notification from "../models/notification.model";
import mongoose from "mongoose";

export const apiMe = async (req: Request, res: Response) => {
  try {
    const id = req.auth?.id;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ id: user._id, name: user.name, username: user.username });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const checkFriend = async (req: Request, res: Response) => {
  try {
    const id = req.auth?.id;
    const { username } = req.body;

    const friendUser = await User.findOne(
      { username },
      { username: 1, friends: 1 },
    ).lean();

    if (!friendUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const isFriend = await User.exists({
      _id: id,
      friends: friendUser._id,
    });

    return res.status(200).json({
      success: true,
      user: {
        _id: friendUser._id,
        username: friendUser.username,
      },
      isFriend: Boolean(isFriend),
      totalFriendsCount: friendUser.friends.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

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
    return res.status(201).json({ success: true });
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
      select: {
        username: 1,
        createdAt: 1,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(201).json(user.friends);
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.body;
    const userId = req.auth?.id as string;

    if (userId === friendId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyFriend = await User.exists({
      _id: userId,
      friends: friendId,
    });

    if (alreadyFriend) {
      return res.status(400).json({
        success: false,
        message: "Already friends",
      });
    }

    const duplicateNotification = await Notification.findOne({
      sender: userId,
      receiver: friendId,
    });

    if (duplicateNotification) {
      return res.status(200).json({
        success: true,
        notification: duplicateNotification,
        message: "Friend request already sent",
      });
    }

    const notification = await Notification.create({
      sender: userId,
      receiver: friendId,
    });

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { friends: new mongoose.Types.ObjectId(friendId) },
      }),
      User.findByIdAndUpdate(friendId, {
        $addToSet: { friends: new mongoose.Types.ObjectId(userId) },
      }),
      Notification.deleteOne({
        _id: new mongoose.Types.ObjectId(notifId),
      }),
    ]);
    res.json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const searchSuggestions = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);

    const user = await User.findById(req.auth?.id).select("friends");
    const excludedIds = [...(user?.friends ?? []), req.auth?.id];

    const results = await User.find({
      _id: { $nin: excludedIds },
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
