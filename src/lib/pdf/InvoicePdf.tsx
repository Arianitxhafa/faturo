import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Client, Invoice, InvoiceItem, Workspace } from "@/db/schema";
import { computeTotals, formatMoney, formatQuantity, formatRate, invoiceNumberLabel } from "@/lib/money";
import { makeTr, type Tr } from "@/i18n/tr";
import type { Locale } from "@/i18n/config";
import { formatDay } from "@/lib/dates";

// Embed Inter so ë, ç, € and other non-ASCII characters render correctly (built-in PDF fonts can't).
const fontDir = path.join(process.cwd(), "src/lib/pdf/fonts");
Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(fontDir, "Inter-400.woff"), fontWeight: 400 },
    { src: path.join(fontDir, "Inter-600.woff"), fontWeight: 600 },
    { src: path.join(fontDir, "Inter-700.woff"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const INK = "#14161a";
const MUTED = "#6b6f76";
const LINE = "#e4e2da";
const BRAND = "#0f766e";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Inter", color: INK, lineHeight: 1.4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  business: { fontSize: 16, fontWeight: 700 },
  muted: { color: MUTED },
  label: { fontSize: 8, letterSpacing: 1.5, color: MUTED, fontWeight: 700, textTransform: "uppercase" },
  invoiceLabel: { fontSize: 8, letterSpacing: 2, color: BRAND, fontWeight: 700, textAlign: "right" },
  number: { fontSize: 18, fontWeight: 700, textAlign: "right", marginTop: 2 },
  bold: { fontWeight: 700 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: INK, paddingBottom: 5, marginTop: 28 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.75, borderBottomColor: LINE, paddingVertical: 6 },
  th: { fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 45, textAlign: "right" },
  cPrice: { width: 75, textAlign: "right" },
  cVat: { width: 45, textAlign: "right" },
  cAmount: { width: 80, textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1.5, borderTopColor: INK, marginTop: 4, paddingTop: 6, fontSize: 13, fontWeight: 700 },
  footer: { marginTop: 36, paddingTop: 10, borderTopWidth: 0.75, borderTopColor: LINE, color: MUTED },
});


type Props = { workspace: Workspace; client: Client; invoice: Invoice; items: InvoiceItem[]; tr?: Tr; locale?: Locale };

export function InvoicePdf({ workspace, client, invoice, items, tr = makeTr("en"), locale = "en" }: Props) {
  const date = (d: string) => formatDay(d, locale, { day: true, month: "long", year: true });
  const money = (c: number) => formatMoney(c, invoice.currency);
  const { vatGroups } = computeTotals(items, invoice.discountBps);
  const from = [workspace.address, workspace.taxNumber && tr("Tax no. {n}", { n: workspace.taxNumber })].filter(Boolean).join("\n");
  const to = [client.address, client.email, client.taxNumber && tr("Tax no. {n}", { n: client.taxNumber })].filter(Boolean).join("\n");

  return (
    <Document title={`${invoiceNumberLabel(invoice.number)} — ${workspace.name}`} author={workspace.name} creator="Faturo">
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.business}>{workspace.name}</Text>
            {from ? <Text style={[s.muted, { marginTop: 3 }]}>{from}</Text> : null}
          </View>
          <View>
            <Text style={s.invoiceLabel}>{tr("Invoice").toUpperCase()}</Text>
            <Text style={s.number}>{invoiceNumberLabel(invoice.number)}</Text>
          </View>
        </View>

        <View style={[s.row, { marginTop: 28 }]}>
          <View style={{ maxWidth: 260 }}>
            <Text style={s.label}>{tr("Bill to")}</Text>
            <Text style={[s.bold, { marginTop: 3 }]}>{client.name}</Text>
            {to ? <Text style={s.muted}>{to}</Text> : null}
          </View>
          <View style={{ width: 180 }}>
            <View style={s.totalRow}>
              <Text style={s.muted}>{tr("Issue date")}</Text>
              <Text>{date(invoice.issueDate)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.muted}>{tr("Due date")}</Text>
              <Text style={s.bold}>{date(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={s.tableHead}>
          <Text style={[s.th, s.cDesc]}>{tr("Description")}</Text>
          <Text style={[s.th, s.cQty]}>{tr("Qty")}</Text>
          <Text style={[s.th, s.cPrice]}>{tr("Unit price")}</Text>
          <Text style={[s.th, s.cVat]}>{tr("VAT")}</Text>
          <Text style={[s.th, s.cAmount]}>{tr("Amount")}</Text>
        </View>
        {items.map((item) => (
          <View key={item.id} style={s.tableRow} wrap={false}>
            <Text style={s.cDesc}>{item.description}</Text>
            <Text style={s.cQty}>{formatQuantity(item.quantityHundredths)}</Text>
            <Text style={s.cPrice}>{money(item.unitPriceCents)}</Text>
            <Text style={s.cVat}>{formatRate(item.vatRateBps)}</Text>
            <Text style={[s.cAmount, s.bold]}>{money(item.lineTotalCents)}</Text>
          </View>
        ))}

        <View style={s.totals} wrap={false}>
          <View style={s.totalRow}>
            <Text style={s.muted}>{tr("Subtotal")}</Text>
            <Text>{money(invoice.subtotalCents)}</Text>
          </View>
          {invoice.discountCents > 0 ? (
            <View style={s.totalRow}>
              <Text style={s.muted}>{tr("Discount ({rate})", { rate: formatRate(invoice.discountBps) })}</Text>
              <Text>−{money(invoice.discountCents)}</Text>
            </View>
          ) : null}
          {vatGroups
            .filter((g) => g.rateBps > 0)
            .map((g) => (
              <View key={g.rateBps} style={s.totalRow}>
                <Text style={s.muted}>{tr("VAT {rate}", { rate: formatRate(g.rateBps) })}</Text>
                <Text>{money(g.vatCents)}</Text>
              </View>
            ))}
          <View style={s.grand}>
            <Text>{tr("Total")}</Text>
            <Text>{money(invoice.totalCents)}</Text>
          </View>
        </View>

        {invoice.notes || workspace.iban ? (
          <View style={s.footer} wrap={false}>
            {invoice.notes ? <Text>{invoice.notes}</Text> : null}
            {workspace.iban && !invoice.notes?.includes(workspace.iban) ? <Text>IBAN: {workspace.iban}</Text> : null}
          </View>
        ) : null}

        <Text style={{ position: "absolute", bottom: 28, left: 48, right: 48, fontSize: 7, color: MUTED, textAlign: "center" }} fixed>
          {workspace.name} · {invoiceNumberLabel(invoice.number)} · {tr("Created with Faturo")}
        </Text>
      </Page>
    </Document>
  );
}
