import { signOut } from "@/auth";

/**
 * Reached when a valid session cookie points at a user that no longer exists
 * (e.g. a demo account purged after 24 hours). Clears the cookie and sends them to log in.
 */
export async function GET() {
  await signOut({ redirectTo: "/login?expired=1" });
}
