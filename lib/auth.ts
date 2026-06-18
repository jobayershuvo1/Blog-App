import { connectDB } from "@/lib/db";
import { ROLES, USER_STATUS, type Role } from "@/lib/constants";
import bcrypt from "bcryptjs";
import type { NextAuthOptions, getServerSession as _getServerSession } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() }).select(
          "+password"
        );
        if (!user || !user.password) return null;

        if (user.status !== USER_STATUS.ACTIVE) {
          throw new Error("Your account is not active. Please contact an administrator.");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar || null,
          role: user.role as Role,
          status: user.status,
          username: user.username || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.username = user.username ?? null;
      }
      // Reflect profile updates (name/photo) without requiring re-login.
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.username = token.username ?? null;
      }
      return session;
    },
  },
};

/** Server-side session helper. */
export function auth() {
  return getServerSession(authOptions);
}

export { ROLES };
export type { Role };
