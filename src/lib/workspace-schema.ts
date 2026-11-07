import { z } from "zod";
import { currencyEnum } from "@/db/schema";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

/** Business details shown on every invoice (used by onboarding and Settings). */
export const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name.").max(100),
  currency: z.enum(currencyEnum.enumValues),
  address: optional(200),
  taxNumber: optional(40),
  iban: optional(40),
});
