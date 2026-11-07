import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { findSharedInvoice } from "@/lib/share";
import { invoiceNumberLabel } from "@/lib/money";
import { InvoicePdf } from "@/lib/pdf/InvoicePdf";
import { getLocale, getTr } from "@/i18n/server";

/** PDF for a public link — same rules as the page: sharing on, not a draft, workspace on Pro. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findSharedInvoice(token);
  if (!found) return new Response((await getTr())("Invoice not found"), { status: 404 });

  const { workspace, invoice, client, items } = found;
  const element = createElement(InvoicePdf, { workspace, invoice, client, items, tr: await getTr(), locale: await getLocale() }) as Parameters<typeof renderToBuffer>[0];
  const pdf = await renderToBuffer(element);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumberLabel(invoice.number)}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
