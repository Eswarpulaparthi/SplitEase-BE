import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `https://splitease-be-3.onrender.com/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email returned from Google profile"));
        }

        const name = profile.displayName;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          const token = jwt.sign(
            {
              id: existingUser._id,
              name: existingUser.name,
              username: existingUser.username,
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" },
          );
          return done(null, { token });
        }

        const sanitizedBase = authService.sanitized(email.split("@")[0]);
        const username = authService.generateUniqueUsername(sanitizedBase);
        const user = await User.create({
          name,
          username,
          email,
        });

        const token = jwt.sign(
          { id: user._id, name: user.name, username: user.username },
          process.env.JWT_SECRET!,
          { expiresIn: "1d" },
        );

        return done(null, { token });
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);
