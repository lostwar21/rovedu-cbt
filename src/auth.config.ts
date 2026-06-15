import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-trial",
  pages: {
    signIn: "/", // Home/Login page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as any;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
