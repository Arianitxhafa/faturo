import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

const APP_PATHS = ["/app", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials sign-in requires JWT sessions in Auth.js.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new CredentialsSignin();
        const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
        // Same error for unknown email and wrong password, so accounts can't be enumerated.
        if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) throw new CredentialsSignin();
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    // Runs in the proxy: optimistic redirects only. Pages and actions check the session again on the server.
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const signedIn = Boolean(auth?.user);
      if (APP_PATHS.some((p) => path.startsWith(p))) return signedIn;
      if (signedIn && AUTH_PAGES.includes(path)) return Response.redirect(new URL("/app", request.nextUrl));
      return true;
    },
  },
});
