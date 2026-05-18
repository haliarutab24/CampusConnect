import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Auth attempt for:", credentials?.email);
        
        // TEST ACCOUNT
        if (credentials?.email === "test@test.com") {
          console.log("🧪 Using test account");
          return { id: "test", name: "Test User", email: "test@test.com", role: "TalentSeeker", image: "/premium-avatar.png" };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await connectDB();
          console.log("📂 DB connected for auth");

          const user = await User.findOne({ email: credentials.email }).select(
            "+password"
          );

          if (!user) {
            console.log("❌ No user found with email:", credentials.email);
            return null; // Return null for CredentialsSignin error
          }

          console.log("👤 User found, checking password...");
          const isPasswordValid = await user.matchPassword(credentials.password);

          if (!isPasswordValid) {
            console.log("❌ Invalid password for:", credentials.email);
            return null; // Return null for CredentialsSignin error
          }

          console.log("✅ Auth successful for:", user.name);
          
          // Ensure premium avatar is used if image is missing or old placeholder
          const finalImage = (!user.image || user.image === "/profile_img.png" || user.image === "/default-avatar.png") 
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
          console.error("🔥 Auth error:", error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            // Create a new user with TalentSeeker as default role
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image || "/premium-avatar.png",
              password: Math.random().toString(36).slice(-8) + "A1@", // Random secure password
              role: "TalentSeeker",
            });
            user.id = newUser._id.toString();
            user.role = newUser.role;
          } else {
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
          }
        } catch (error) {
          console.error("Google signIn error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // If user logs in via OAuth, account is available on the first call
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: true,
});
