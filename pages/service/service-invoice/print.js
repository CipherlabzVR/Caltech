import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency } from "@/components/utils/formatHelper";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "SERVICEINVOICE";

const PAYMENT_NAMES = {
  1: "Cash",
  2: "Card",
  3: "Cash + Card",
  4: "Bank Transfer",
  5: "Cheque",
  6: "No Advance",
  7: "Credit",
};

const LINE_TYPE_LABEL = ["", "Part", "Labour", "Diagnostic"];

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch {
    return "-";
  }
};

const serviceTypeLabel = (jobCard) =>
  jobCard?.serviceType === 1
    ? jobCard?.isWarrantyRepair
      ? "Warranty Repair"
      : "Free Service"
    : "Paid Repair";

const buildRows = (lines) => {
  if (!lines || lines.length === 0) {
    return `<tr><td colspan="4" style="text-align:center;padding:16px;">No lines.</td></tr>`;
  }
  return lines
    .map((l) => {
      const base = Number(l.qty || 0) * Number(l.unitPrice || 0);
      const desc = `${escapeHtml(l.productName || l.description || "")}${
        LINE_TYPE_LABEL[l.lineType] ? ` · ${LINE_TYPE_LABEL[l.lineType]}` : ""
      }${l.isWarrantyCovered ? " · Warranty covered" : ""}`;
      const amount = l.isWarrantyCovered
        ? `<span class="free">FREE</span> <span style="text-decoration:line-through;color:#888;">${escapeHtml(
            formatCurrency(base)
          )}</span>`
        : escapeHtml(formatCurrency(l.lineTotal));
      return `<tr>
        <td>${desc}</td>
        <td class="num">${escapeHtml(l.qty)}</td>
        <td class="num">${escapeHtml(formatCurrency(l.unitPrice))}</td>
        <td class="num">${amount}</td>
      </tr>`;
    })
    .join("\n");
};

export default function ServiceInvoicePrintPage() {
  const router = useRouter();
  const id = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [invoice, setInvoice] = useState(null);
  const [jobCard, setJobCard] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(invoice?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !id) return;
    setLoadingInvoice(true);
    fetch(`${BASE_URL}/ServiceInvoice/GetById/${id}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setInvoice(j?.result || null))
      .catch(() => setInvoice(null))
      .finally(() => setLoadingInvoice(false));
  }, [id, router.isReady]);

  useEffect(() => {
    if (!invoice?.serviceJobCardId) return;
    fetch(`${BASE_URL}/ServiceJobCard/GetById/${invoice.serviceJobCardId}`, {
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setJobCard(j?.result || null))
      .catch(() => setJobCard(null));
  }, [invoice?.serviceJobCardId]);

  const lines = invoice?.lines || [];

  const warrantyWaiver = useMemo(
    () =>
      lines
        .filter((l) => l.isWarrantyCovered)
        .reduce((acc, l) => acc + Number(l.qty || 0) * Number(l.unitPrice || 0), 0),
    [lines]
  );

  const tokenMap = useMemo(() => {
    const isCancelled = !!invoice?.isDeleted || invoice?.status === "Cancelled";
    const isPaid = Number(invoice?.netTotal || 0) === 0;
    const statusLabel = isCancelled ? "Cancelled" : isPaid ? "Paid" : "Pending";

    const warrantyMonths = jobCard?.diagnosis?.warrantyOnRepairMonths || 3;
    const until = new Date(invoice?.documentDate || invoice?.createdOn || Date.now());
    until.setMonth(until.getMonth() + warrantyMonths);

    const discount = Math.max(0, Number(invoice?.discountAmount || 0) - warrantyWaiver);

    return {
      ...letterheadTokens,
      documentNo: invoice?.documentNo || documentNumber || "-",
      issueDate: formatDate(invoice?.documentDate || invoice?.createdOn),
      jobCardNo: invoice?.jobCardDocumentNo || "-",
      status: statusLabel,
      customerName: invoice?.customerName || "-",
      contactNo: invoice?.contactNo || "-",
      productName: invoice?.productName || "-",
      serialNumber: invoice?.serialNumber || "-",
      issueReported: jobCard?.faultReportedByCustomer || "-",
      serviceType: serviceTypeLabel(jobCard),
      warrantyDays: String(warrantyMonths * 30),
      warrantyUntil: formatDate(until),
      subtotal: formatCurrency(invoice?.grossTotal),
      warrantyWaiver: warrantyWaiver > 0 ? `- ${formatCurrency(warrantyWaiver)}` : formatCurrency(0),
      discount: `- ${formatCurrency(discount)}`,
      netTotal: formatCurrency(invoice?.netTotal),
      paidAmount: isPaid ? formatCurrency(invoice?.netTotal) : formatCurrency(0),
      balanceDue: formatCurrency(isPaid ? 0 : invoice?.netTotal),
      paymentMethod: PAYMENT_NAMES[invoice?.paymentType] || "N/A",
      technicianName: jobCard?.assignedTechnicianName || "-",
      remark: invoice?.remark || "-",
    };
  }, [invoice, jobCard, warrantyWaiver, documentNumber, letterheadTokens]);

  const finalHtml = useMemo(() => {
    if (!templateHtml || !invoice) return "";
    return applyTemplate(templateHtml, tokenMap, buildRows(lines));
  }, [templateHtml, invoice, tokenMap, lines]);

  const isLoading = loadingInvoice || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading invoice…"
        errorText="Failed to load invoice."
        downloadName={`ServiceInvoice_${invoice?.documentNo || documentNumber || "document"}`}
      />
      <ToastContainer />
    </>
  );
}
