"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { requireMembership } from "@/lib/session";

export type ClientFormState = { error?: string; ok?: boolean } | undefined;

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const clientSchema = z.object({
  name: z.string().trim().min(2, "Enter the client's name.").max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email address.")
    .transform((v) => v || null),
  address: optional(200),
  taxNumber: optional(40),
});

export async function saveClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const { workspace } = await requireMembership("admin");
  const parsed = clientSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    taxNumber: formData.get("taxNumber") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  if (id) {
    // workspaceId in the WHERE clause: a client from another workspace can never be touched.
    const updated = await db
      .update(clients)
      .set(parsed.data)
      .where(and(eq(clients.id, id), eq(clients.workspaceId, workspace.id)))
      .returning({ id: clients.id });
    if (!updated.length) return { error: "Client not found." };
  } else {
    await db.insert(clients).values({ ...parsed.data, workspaceId: workspace.id });
  }

  revalidatePath("/app/clients");
  return { ok: true };
}

export async function deleteClient(id: string) {
  const { workspace } = await requireMembership("admin");
  const [{ n }] = await db.select({ n: count() }).from(invoices).where(and(eq(invoices.clientId, id), eq(invoices.workspaceId, workspace.id)));
  if (n > 0) return { error: `This client has ${n} invoice${n === 1 ? "" : "s"} and can't be deleted.` };

  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.workspaceId, workspace.id)));
  revalidatePath("/app/clients");
  redirect("/app/clients");
}
