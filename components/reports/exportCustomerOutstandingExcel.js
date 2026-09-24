import { writeOrganizedExcel } from "@/components/ReportTemplate/exportReportHtmlToExcel";
import { formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const toAmount = (value) => Number(value ?? 0) || 0;

export async function fetchCustomerOutstandingLines(customerId, asOfDate = "") {
  const dateQuery = asOfDate ? `&asOfDate=${asOfDate}` : "";
  const response = await fetch(
    `${BASE_URL}/Outstanding/GetAllCustomerwiseOutstandings?customerId=${customerId}${dateQuery}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load customer outstanding details.");
  }
  return data?.result || [];
}

export async function exportCustomerOutstandingDetail({
  customerName,
  asOfDate = "",
  lines,
}) {
  const rows = lines || [];
  if (!rows.length) {
    throw new Error("No outstanding invoices available to export.");
  }

  const totalInvoice = rows.reduce(
    (sum, item) => sum + toAmount(item.totalInvoiceAmount),
    0
  );
  const totalOutstanding = rows.reduce(
    (sum, item) => sum + toAmount(item.outstandingAmount),
    0
  );

  await writeOrganizedExcel(
    {
      title: "CUSTOMER OUTSTANDING",
      detailsLeft: [
        ["Customer", customerName || "-"],
        ["As of Date", asOfDate ? formatDate(asOfDate) || asOfDate : "Current"],
      ],
      detailsRight: [
        ["Invoices", rows.length],
        ["Outstanding Amount", totalOutstanding],
      ],
      sections: [
        {
          title: "Outstanding Invoices",
          headers: [
            "#",
            "Invoice Date",
            "Invoice No",
            "Invoice Amount",
            "Credit Amount",
            "Outstanding Amount",
            "Sales Person",
            "Remark",
          ],
          rows: rows.map((item, index) => [
            index + 1,
            formatDate(item.invoiceDate) || "-",
            item.invoiceNumber || "-",
            toAmount(item.totalInvoiceAmount),
            toAmount(item.creditAmount),
            toAmount(item.outstandingAmount),
            item.salesPersonName || "-",
            item.remark || "-",
          ]),
          totals: [
            ["Invoice Total", totalInvoice],
            ["Total Outstanding", totalOutstanding],
          ],
        },
      ],
    },
    `CustomerOutstanding_${String(customerName || "customer").replace(/[:\\/?*[\]]/g, " ").trim()}_${asOfDate || new Date().toISOString().slice(0, 10)}`
  );
}
