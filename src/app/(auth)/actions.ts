"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

// Echo back what the user typed so the form keeps it after an error.
export type AuthState = { error?: string; values?: { name?: string; email?: string } } | undefined;

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters for your password.").max(200),
});

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = { name: formData.get("name"), email: formData.get("email"), password: formData.get("password") };
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? "") };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const { name, email, password } = parsed.data;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists — try logging in.", values };

  await db.insert(users).values({ name, email, passwordHash: await hashPassword(password) });
  // signIn redirects on success (it throws Next's redirect, which must propagate).
  await signIn("credentials", { email, password, redirectTo: "/onboarding" });
}

export async function logInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", { email, password: formData.get("password"), redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Wrong email or password.", values: { email } };
    throw error;
  }
}

export async function logOutAction() {
  await signOut({ redirectTo: "/" });
}
