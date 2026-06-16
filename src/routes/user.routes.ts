import { Router } from "express";
import {
  addFriend,
  apiMe,
  getNotifications,
  getUsername,
  searchSuggestions,
  sendFriendRequest,
  usernameUpdate,
} from "../controller/user.controller";
const router = Router();

router.get("/api/me", apiMe);

router.patch("/api/update-username", usernameUpdate);

router.get("/api/user/:username", getUsername);

router.post("/api/send-friend-request", sendFriendRequest);

router.get("/api/notifications", getNotifications);

router.post("/api/add-friend", addFriend);

router.get("/api/search-suggestions", searchSuggestions);

export default router;
