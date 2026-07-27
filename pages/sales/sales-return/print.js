import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { getPaymentMethods } from "@/components/types/types";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "SALESRETURN";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const buildCustomerAddress = (record) =>
  [record?.addressLine1, record?.addressLine2, record?.addressLine3].filter(Boolean).join(", ") || "—";

const buildLineRows = (lines) => {
  if (!lines || lines.length === 0) {
    return `<tr><td colspan="8" style="text-align:center;padding:16px;">No return line items.</td></tr>`;
  }

  return lines
    .map(
      (row, idx) => `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.productCode ?? "—")}</td>
        <td>${escapeHtml(row.productName ?? "—")}</td>
        <td class="num">${escapeHtml(row.invoiceQuantity ?? "—")}</td>
        <td class="num">${escapeHtml(row.returnQuntity ?? row.returnQuantity ?? "—")}</td>
        <td class="num">${escapeHtml(formatCurrency(row.soldUnitPrice))}</td>
        <td class="num">${escapeHtml(formatCurrency(row.returnAmount))}</td>
        <td>${escapeHtml(row.reason || "—")}</td>
      </tr>`
    )
    .join("\n");
};

export default function SalesReturnPrintPage() {
  const router = useRouter();
  const salesReturnId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [salesReturn, setSalesReturn] = useState(null);
  const [loadingSalesReturn, setLoadingSalesReturn] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead(salesReturn?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !salesReturnId) return;

    const load = async () => {
      setLoadingSalesReturn(true);
      try {
        const res = await fetch(`${BASE_URL}/SalesReturn/GetSalesReturnById?id=${salesReturnId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const record = json?.result ?? null;

        if (!res.ok || record == null) {
          toast.error(json?.message || "Failed to load sales return.");
          setSalesReturn(null);
        } else {
          setSalesReturn(record);
        }
      } catch (e) {
        console.error("[SalesReturnPrint] load failed", e);
        toast.error("Failed to load sales return.");
        setSalesReturn(null);
      } finally {
        setLoadingSalesReturn(false);
      }
    };

    load();
  }, [router.isReady, salesReturnId]);

  const lines =
    salesReturn?.salesReturnLineDetails ?? salesReturn?.SalesReturnLineDetails ?? [];

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      documentNo: salesReturn?.documentNo || documentNumber || "—",
      salesReturnDate: formatDate(salesReturn?.salesReturnDate) || "—",
      customerName: salesReturn?.customerName || "—",
      customerAddress: buildCustomerAddress(salesReturn),
      invoiceNo: salesReturn?.invoiceNo || "—",
      paymentType: getPaymentMethods(salesReturn?.paymentType),
      salesPerson: salesReturn?.salesPersonName || "—",
      warehouseName: warehouseData?.name || "—",
      totalInvoiceAmount: formatCurrency(salesReturn?.totalInvoiceAmount),
      outstandingAmount: formatCurrency(salesReturn?.outstandingAmount),
      returnAmount: formatCurrency(salesReturn?.returnAmount),
    }),
    [salesReturn, documentNumber, letterheadTokens, warehouseData?.name]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !salesReturn) return "";
    return applyTemplate(templateHtml, tokenMap, buildLineRows(lines));
  }, [templateHtml, salesReturn, tokenMap, lines]);

  const isLoading = loadingSalesReturn || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading sales return…"
        errorText="Sales return not found."
        downloadName={`SalesReturn_${salesReturn?.documentNo || documentNumber || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
