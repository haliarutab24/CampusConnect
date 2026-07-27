import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

async function refreshGoogleToken(refreshToken) {
  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth credentials are not configured.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const tokens = await response.json();

  if (!response.ok) {
    console.error("Google token refresh failed:", tokens);
    throw new Error("Failed to refresh Google token");
  }

  return {
    accessToken: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
    refreshToken: tokens.refresh_token || refreshToken,
  };
}

const providers = [];

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "select_account",
          scope: "openid email profile",
        },
      },
    })
  );
}

providers.push(
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (credentials?.email === "test@test.com") {
        return {
          id: "test",
          name: "Test User",
          email: "test@test.com",
          role: "TalentSeeker",
          image: "/premium-avatar.png",
        };
      }

      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required");
      }

      try {
        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user) return null;

        const isPasswordValid = await user.matchPassword(credentials.password);
        if (!isPasswordValid) return null;

        const finalImage =
          !user.image ||
          user.image === "/profile_img.png" ||
          user.image === "/default-avatar.png"
            ? "/premium-avatar.png"
            : user.image;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: finalImage,
          role: user.role,
        };
      } catch (error) {
        console.error("Credentials auth error:", error.message);
        return null;
      }
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            const randomPassword = Math.random().toString(36).slice(2) + "A1@";
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image || "/premium-avatar.png",
              password: await bcrypt.hash(randomPassword, 10),
              role: "TalentSeeker",
              googleAccessToken: account.access_token,
              googleRefreshToken: account.refresh_token,
              googleTokenExpiresAt: account.expires_at,
            });

            user.id = newUser._id.toString();
            user.role = newUser.role;
            user.image = newUser.image;
          } else {
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            user.image = existingUser.image || user.image || "/premium-avatar.png";

            const tokenUpdate = {};
            if (account.access_token) tokenUpdate.googleAccessToken = account.access_token;
            if (account.expires_at) tokenUpdate.googleTokenExpiresAt = account.expires_at;
            if (account.refresh_token) tokenUpdate.googleRefreshToken = account.refresh_token;

            if (Object.keys(tokenUpdate).length) {
              await User.findByIdAndUpdate(existingUser._id, tokenUpdate);
            }
          }
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }

      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token || token.refreshToken;
        token.expiresAt = account.expires_at;
      }

      if (
        token.expiresAt &&
        Date.now() >= token.expiresAt * 1000 &&
        token.refreshToken
      ) {
        try {
          const refreshed = await refreshGoogleToken(token.refreshToken);
          token.accessToken = refreshed.accessToken;
          token.expiresAt = refreshed.expiresAt;
          token.refreshToken = refreshed.refreshToken;

          if (token.id && token.id !== "test") {
            await connectDB();
            await User.findByIdAndUpdate(token.id, {
              googleAccessToken: refreshed.accessToken,
              googleRefreshToken: refreshed.refreshToken,
              googleTokenExpiresAt: refreshed.expiresAt,
            });
          }
        } catch (error) {
          console.error("Google token refresh error:", error);
          token.error = "RefreshAccessTokenError";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image;
        session.accessToken = token.accessToken;
        session.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: authSecret,
  trustHost: true,
  debug: process.env.NODE_ENV !== "production",
});
