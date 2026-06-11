import { Router } from "express";
import passport from "passport";
const router = Router();

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
    failureRedirect: `${process.env.DEPLOYED_FRONTEND_URI!}`,
  }),
  (req, res) => {
    const { token } = req.user as { token: string };

    res.redirect(
      `${process.env.DEPLOYED_FRONTEND_URI!}oauth-success?token=${token}`,
    );
  },
);

export default router;
