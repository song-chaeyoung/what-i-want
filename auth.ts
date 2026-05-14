import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { db } from "@/src/lib/db/client";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/src/lib/db/schema";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  providers: [Google, Kakao],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
});
