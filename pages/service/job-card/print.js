import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const INTAKE_KEY = "SERVICEJOBCARD";
const CUSTOMER_BILL_KEY = "SERVICEREPAIRESTIMATE";

const STATUS_NAMES = [
  "Received", "Diagnosed", "AwaitingApproval", "Approved",
  "InProgress", "OnHold", "Ready", "Delivered", "Cancelled",
  "AwaitingPartsApproval", "Unrepairable",
];
const STATUS_LABEL_DISPLAY = {
  AwaitingApproval: "Awaiting Customer Approval",
  AwaitingPartsApproval: "Awaiting Parts Approval",
  Unrepairable: "Can't Repair",
};
const PRIORITY_LABEL = { 1: "Normal", 2: "Urgent", 3: "Critical" };
const LINE_TYPE_LABEL = { 1: "Part", 2: "Labour", 3: "Diagnostic" };

const SERVICE_TYPE_LABEL = (jc) => {
  if (jc?.serviceType === 1) {
    return jc.isWarrantyRepair ? "Warranty Repair (no charge)" : "Free Service (no charge)";
  }
  return jc?.serviceType === 2 ? "Paid Repair" : "—";
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch {
    return "-";
  }
};

const formatDisplayDateTime = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy hh:mm:ssa");
  } catch {
    return "-";
  }
};

const getUserLabel = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  user?.email ||
  (user?.id != null ? `User #${user.id}` : "-");

function statusLabel(value) {
  if (typeof value === "string") return value;
  return STATUS_NAMES[(value || 1) - 1] ?? "Received";
}

function statusDisplay(value) {
  const name = statusLabel(value);
  return STATUS_LABEL_DISPLAY[name] || name;
}

function isUnrepairable(jobCard) {
  return statusLabel(jobCard?.status) === "Unrepairable";
}

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const buildAccessoryRows = (jobCard) => {
  const list = (jobCard?.accessoriesReceived || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return `<tr><td colspan="2" style="text-align:center;padding:12px;">-</td></tr>`;
  }
  return list
    .map((a, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(a)}</td></tr>`)
    .join("\n");
};

const buildBillRows = (rows) => {
  if (!rows || rows.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;padding:12px;">No priced lines yet.</td></tr>`;
  }
  return rows
    .map((l, i) => {
      const amount = l._covered
        ? `<span class="free">FREE</span>`
        : escapeHtml(l._total.toFixed(2));
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(LINE_TYPE_LABEL[l.lineType] || "-")}</td>
        <td>${escapeHtml(l.productName || l.description || "-")}</td>
        <td class="num">${escapeHtml(l.qty)}</td>
        <td class="num">${escapeHtml(Number(l.unitPrice || 0).toFixed(2))}</td>
        <td class="num">${amount}</td>
      </tr>`;
    })
    .join("\n");
};

export default function JobCardPrintPage() {
  const router = useRouter();
  const jobCardId = router.query.id;
  const documentNumber = router.query.documentNumber;
  const isCustomerBill = router.query.type === "customer-bill";

  const [jobCard, setJobCard] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [userMap, setUserMap] = useState({});

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(
    isCustomerBill ? CUSTOMER_BILL_KEY : INTAKE_KEY
  );
  const { letterheadTokens } = useTemplateLetterhead(jobCard?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !jobCardId) return;
    setLoadingJob(true);
    fetch(`${BASE_URL}/ServiceJobCard/GetById/${jobCardId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setJobCard(j?.result || null))
      .catch(() => setJobCard(null))
      .finally(() => setLoadingJob(false));
  }, [jobCardId, router.isReady]);

  useEffect(() => {
    fetch(`${BASE_URL}/User/GetAllUser`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const users = Array.isArray(j) ? j : Array.isArray(j?.result) ? j.result : [];
        const m = {};
        users.forEach((u) => {
          m[u.id] = u;
        });
        setUserMap(m);
      })
      .catch(() => {});
  }, []);

  const billComputed = useMemo(() => {
    const billLines = (jobCard?.lines || []).filter(
      (l) => !l.isDeleted && (!l.isTechnicianRequested || l.isApproved)
    );
    const jobIsFree = jobCard?.serviceType === 1;
    return billLines.map((l) => {
      const covered = l.isWarrantyCovered || jobIsFree;
      const base = Number(l.qty || 0) * Number(l.unitPrice || 0);
      const discount = covered ? base : Number(l.discountAmount || 0);
      const total = Math.max(0, base - discount);
      return { ...l, _covered: covered, _base: base, _total: total };
    });
  }, [jobCard]);

  const tokenMap = useMemo(() => {
    if (!jobCard) return { ...letterheadTokens };

    if (isCustomerBill) {
      const approvedById = jobCard.finalApprovedBy ?? jobCard.partsApprovalDecisionBy ?? null;
      const approvedOn = jobCard.finalApprovedOn || jobCard.partsApprovalDecisionOn || null;
      const estimatedReady = jobCard.diagnosis?.eta || jobCard.expectedDeliveryDate || null;
      const jobIsFree = jobCard.serviceType === 1;
      const gross = billComputed.reduce((s, l) => s + l._base, 0);
      const discount = billComputed.reduce(
        (s, l) => s + (l._covered ? l._base : Number(l.discountAmount || 0)),
        0
      );
      const customerPays = billComputed.reduce((s, l) => s + l._total, 0);
      const deviceDetails = [
        jobCard.deviceType && `Type: ${jobCard.deviceType}`,
        jobCard.brand && `Brand: ${jobCard.brand}`,
        jobCard.model && `Model: ${jobCard.model}`,
        jobCard.productName && `Product: ${jobCard.productName}`,
        jobCard.serialNumber && `Serial: ${jobCard.serialNumber}`,
        jobCard.physicalCondition && `Condition: ${jobCard.physicalCondition}`,
        jobCard.accessoriesReceived && `Accessories: ${jobCard.accessoriesReceived}`,
      ]
        .filter(Boolean)
        .join("\n") || "-";

      return {
        ...letterheadTokens,
        documentNo: jobCard.documentNo || documentNumber || "-",
        billDate: formatDisplayDateTime(approvedOn || jobCard.receivedDate),
        customerName: jobCard.customerName || "-",
        contactNo: jobCard.contactNo || "-",
        serviceType: SERVICE_TYPE_LABEL(jobCard),
        technician: getUserLabel(userMap[jobCard.assignedTechnicianId]),
        estimatedReady: formatDisplayDate(estimatedReady),
        approvedBy: getUserLabel(userMap[approvedById]),
        deviceDetails,
        reportedFault: jobCard.faultReportedByCustomer || "-",
        diagnosis: jobCard.diagnosis?.technicianFindings || "-",
        grossTotal: gross.toFixed(2),
        totalDiscount: jobIsFree ? gross.toFixed(2) : discount.toFixed(2),
        customerPayable: jobIsFree ? "0.00" : customerPays.toFixed(2),
      };
    }

    return {
      ...letterheadTokens,
      docTitle: isUnrepairable(jobCard) ? "SERVICE JOB CARD — CAN'T REPAIR" : "SERVICE JOB CARD",
      documentNo: jobCard.documentNo || documentNumber || "-",
      customerName: jobCard.customerName || "-",
      contactNo: jobCard.contactNo || "-",
      receivedDate: formatDisplayDate(jobCard.receivedDate || jobCard.createdOn),
      expectedDeliveryDate: formatDisplayDate(jobCard.expectedDeliveryDate),
      status: statusDisplay(jobCard.status),
      deviceType: jobCard.deviceType || "-",
      brandModel: [jobCard.brand, jobCard.model].filter(Boolean).join(" / ") || "-",
      productName: jobCard.productName || "-",
      serialNumber: jobCard.serialNumber || "-",
      serviceType: SERVICE_TYPE_LABEL(jobCard),
      priority: PRIORITY_LABEL[jobCard.priority] || "Normal",
      reportedFault: jobCard.faultReportedByCustomer || "-",
      physicalCondition: jobCard.physicalCondition || "-",
      receivedBy: getUserLabel(userMap[jobCard.receivedBy]),
      technician: getUserLabel(userMap[jobCard.assignedTechnicianId]),
      printedDate: formatDisplayDateTime(new Date()),
    };
  }, [jobCard, isCustomerBill, billComputed, userMap, documentNumber, letterheadTokens]);

  const finalHtml = useMemo(() => {
    if (!templateHtml || !jobCard) return "";
    const rows = isCustomerBill ? buildBillRows(billComputed) : buildAccessoryRows(jobCard);
    return applyTemplate(templateHtml, tokenMap, rows);
  }, [templateHtml, jobCard, isCustomerBill, billComputed, tokenMap]);

  const isLoading = loadingJob || loadingTemplate;
  const prefix = isCustomerBill ? "CustomerBill" : "JobCard";

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading job card..."
        errorText="Failed to load job card"
        downloadName={`${prefix}_${jobCard?.documentNo || documentNumber || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
