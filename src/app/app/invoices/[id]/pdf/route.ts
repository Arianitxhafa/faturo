import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireMembership } from "@/lib/session";
import { getInvoice } from "@/lib/invoices";
import { invoiceNumberLabel } from "@/lib/money";
import { InvoicePdf } from "@/lib/pdf/InvoicePdf";
import { getLocale, getTr } from "@/i18n/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireMembership();
  const found = await getInvoice(workspace.id, id);
  if (!found) return new Response("Invoice not found", { status: 404 });

  const element = createElement(InvoicePdf, { workspace, ...found, tr: await getTr(), locale: await getLocale() }) as Parameters<typeof renderToBuffer>[0];
  const pdf = await renderToBuffer(element);
  const filename = `${invoiceNumberLabel(found.invoice.number)}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
