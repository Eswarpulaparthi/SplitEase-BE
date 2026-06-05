import { Router } from "express";
import passport from "passport";
import { send_otp, verifyOTP } from "../controller/auth.controller";
const router = Router();

router.post("/send-otp", send_otp);
router.post("/verify-otp", verifyOTP);
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/",
  }),
  (req, res) => {
    const { token } = req.user as { token: string };

    res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
  },
);

export default router;
