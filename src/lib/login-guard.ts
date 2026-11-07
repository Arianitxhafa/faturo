import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { isLoginLimited, LOGIN_WINDOW_MINUTES } from "./rate-limit";

/**
 * Failed logins in the last 15 minutes — per email (counting only failures after the last
 * successful login) and per IP — decide whether another attempt is allowed.
 */
export async function loginBlocked(email: string, ip: string | null) {
  const window = sql`now() - make_interval(mins => ${LOGIN_WINDOW_MINUTES})`;
  const rows = await db.execute<{ email_failures: number; ip_failures: number }>(sql`
    select
      (select count(*) from ${loginAttempts}
        where email = ${email} and not success and created_at > ${window}
          and created_at > coalesce((select max(created_at) from ${loginAttempts} where email = ${email} and success), '-infinity'::timestamptz)
      )::int as email_failures,
      (select count(*) from ${loginAttempts} where ip is not distinct from ${ip} and ${ip}::text is not null and not success and created_at > ${window})::int as ip_failures
  `);
  const row = rows.rows[0];
  return isLoginLimited({ emailFailures: Number(row?.email_failures ?? 0), ipFailures: Number(row?.ip_failures ?? 0) });
}

export async function recordLoginAttempt(email: string, ip: string | null, success: boolean) {
  await db.batch([
    db.insert(loginAttempts).values({ email, ip, success }),
    // Housekeeping: attempts older than a day are no longer useful.
    db.delete(loginAttempts).where(sql`${loginAttempts.createdAt} < now() - interval '1 day'`),
  ]);
}
