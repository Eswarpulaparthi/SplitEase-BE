import { Router } from "express";
import Group from "../models/groups.model";
import mongoose from "mongoose";
import User from "../models/user.model";
import {
  addMemberToGroup,
  adminGroups,
  createGroup,
  groupDetails,
  normalGroups,
} from "../controller/group.controller";

const router = Router();

router.get("/admin-groups", adminGroups);

router.get("/normal-groups", normalGroups);

router.get("/group-details/:id", groupDetails);

router.post("/group/:groupId/add-member/:member", addMemberToGroup);

router.post("/create-group", createGroup);

export default router;
