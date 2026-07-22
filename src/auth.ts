import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import {
  getAuthSecret,
  isGoogleOAuthConfigured,
  upsertGoogleOAuthUser,
} from "@/lib/auth/google-oauth";
import { sendWelcomeEmail } from "@/lib/auth/auth-email";

const providers = [];

if (isGoogleOAuthConfigured()) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      /** Minimal scopes: email + public profile (name, picture). No Gmail or contacts. */
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  );
}

/**
 * NextAuth v5 validates OAuth `state` automatically (CSRF protection on authorization
 * code flow). Do not disable state checks. Redirect URIs must be whitelisted in Google
 * Cloud Console — see Documentation/18 § Google OAuth.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: getAuthSecret(),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/masuk",
    error: "/masuk",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return account?.provider === "google" ? false : true;
      }

      try {
        const { user: dbUser, isNew } = await upsertGoogleOAuthUser({
          email: user.email,
          name: user.name,
          avatarUrl: user.image,
        });
        if (isNew) {
          void sendWelcomeEmail({ email: dbUser.email, name: dbUser.nama });
        }
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.provider = "google";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
});
