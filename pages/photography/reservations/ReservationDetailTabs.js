import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PrintIcon from "@mui/icons-material/Print";
import PreviewIcon from "@mui/icons-material/Preview";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import ReservationTasks from "./ReservationTasks";
import TaskAssignment from "./TaskAssignment";
import PrintReceipt from "../payment-approval/PrintReceipt";
import RecordPayment from "../quotations/RecordPayment";
import { getAgentTypes } from "@/Services/photographyAgentService";

const money = (n) =>
  n == null || n === ""
    ? "-"
    : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function statusColor(name) {
  const s = String(name || "").toLowerCase();
  if (s.includes("approv") || s.includes("convert") || s.includes("accept") || s === "sent") return "success";
  if (s.includes("reject") || s.includes("cancel")) return "error";
  if (s.includes("pending")) return "warning";
  return "default";
}

function isApprovedQuotation(status) {
  const s = String(status || "").toLowerCase();
  return (
    s.includes("approv") ||
    s.includes("accept") ||
    s.includes("convert") ||
    s === "sent" ||
    s === "2" ||
    s === "3" ||
    s === "5" ||
    s === "7"
  );
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] != null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function normalizeQuotation(q) {
  if (!q) return null;
  return {
    id: pick(q, "id", "Id"),
    quotationNo: pick(q, "quotationNo", "QuotationNo"),
    reservationId: pick(q, "reservationId", "ReservationId"),
    eventTypeName: pick(q, "eventTypeName", "EventTypeName"),
    customerName: pick(q, "customerName", "CustomerName"),
    customerMobileNo: pick(q, "customerMobileNo", "CustomerMobileNo"),
    customerEmail: pick(q, "customerEmail", "CustomerEmail", "email", "Email"),
    eventDate: pick(q, "eventDate", "EventDate"),
    eventTime: pick(q, "eventTime", "EventTime"),
    eventEndTime: pick(q, "eventEndTime", "EventEndTime"),
    venue: pick(q, "venue", "Venue"),
    noOfGuests: pick(q, "noOfGuests", "NoOfGuests"),
    statusName: pick(q, "statusName", "StatusName", "status", "Status"),
    subTotal: Number(pick(q, "subTotal", "SubTotal") ?? 0),
    discountAmount: Number(pick(q, "discountAmount", "DiscountAmount") ?? 0),
    transportationCost: Number(pick(q, "transportationCost", "TransportationCost") ?? 0),
    netTotal: Number(pick(q, "netTotal", "NetTotal", "grandTotal", "GrandTotal") ?? 0),
    remark: pick(q, "remark", "Remark"),
    createdOn: pick(q, "createdOn", "CreatedOn"),
    lines: (pick(q, "lines", "Lines") || []).map((l) => ({
      id: pick(l, "id", "Id"),
      packageName: pick(l, "packageName", "PackageName"),
      unitPrice: pick(l, "unitPrice", "UnitPrice"),
      qty: pick(l, "qty", "Qty"),
      lineTotal: pick(l, "lineTotal", "LineTotal"),
      items: (pick(l, "items", "Items") || []).map((i) => ({
        lineText: pick(i, "lineText", "LineText"),
        isIncluded: pick(i, "isIncluded", "IsIncluded"),
      })),
    })),
    addOns: (pick(q, "addOns", "AddOns") || []).map((a) => ({
      id: pick(a, "id", "Id"),
      name: pick(a, "name", "Name"),
      price: pick(a, "price", "Price"),
      qty: pick(a, "qty", "Qty"),
      lineTotal: pick(a, "lineTotal", "LineTotal"),
    })),
  };
}

function normalizePayment(p) {
  return {
    id: pick(p, "id", "Id"),
    paymentNo: pick(p, "paymentNo", "PaymentNo"),
    quotationId: pick(p, "quotationId", "QuotationId"),
    quotationNo: pick(p, "quotationNo", "QuotationNo"),
    customerName: pick(p, "customerName", "CustomerName"),
    customerMobileNo: pick(p, "customerMobileNo", "CustomerMobileNo"),
    eventTypeName: pick(p, "eventTypeName", "EventTypeName"),
    eventDate: pick(p, "eventDate", "EventDate"),
    venue: pick(p, "venue", "Venue"),
    quotationNetTotal: Number(pick(p, "quotationNetTotal", "QuotationNetTotal") ?? 0),
    amount: Number(pick(p, "amount", "Amount") ?? 0),
    paymentMethodName: pick(p, "paymentMethodName", "PaymentMethodName"),
    isAdvance: pick(p, "isAdvance", "IsAdvance"),
    approvalStatus: pick(p, "approvalStatus", "ApprovalStatus"),
    approvalStatusName: pick(p, "approvalStatusName", "ApprovalStatusName"),
    approvedOn: pick(p, "approvedOn", "ApprovedOn"),
    createdOn: pick(p, "createdOn", "CreatedOn"),
    remark: pick(p, "remark", "Remark"),
  };
}

const QUOTE_DOC_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1a1a1a;
    background: #fff;
    padding: 48px 56px;
    max-width: 850px;
    margin: 0 auto;
  }
  .logo-wrap { width: 170px; }
  .logo-wrap img { width: 170px; height: auto; object-fit: contain; display: block; }
  .hr { border-top: 1px solid #ccc; margin: 20px 0 28px; }
  .doc-title { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #1a1a1a; margin-bottom: 14px; }
  .top-grid { display: flex; justify-content: space-between; gap: 24px; }
  .top-grid .right { text-align: right; }
  .label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 6px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  .kv { font-size: 12.5px; margin-bottom: 3px; font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; }
  .kv .k { font-weight: 700; margin-right: 4px; }
  .line { font-size: 12.5px; margin-bottom: 3px; font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; }
  .line.strong { font-weight: 700; font-family: Georgia, 'Times New Roman', serif; font-size: 13.5px; color: #1a1a1a; }
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-top: 32px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    color: #1a1a1a;
  }
  table.items th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #555;
    padding: 10px 8px;
    border-bottom: 1px solid #ccc;
    background: #fff;
  }
  table.items td {
    font-size: 12.5px;
    padding: 12px 8px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
    color: #1a1a1a;
    background: #fff;
  }
  .product-cell { width: 22%; }
  .desc-cell { color: #333; }
  .desc-list { margin: 4px 0 0 16px; font-size: 11.5px; color: #444; }
  .desc-list li { margin-bottom: 2px; }
  .num-cell { text-align: right; white-space: nowrap; }
  .num-cell.center { text-align: center; }
  .subtotal-row td { border-bottom: none; padding-top: 16px; }
  .total-row td { border-top: 2px solid #1a1a1a; border-bottom: none; font-size: 14px; padding-top: 10px; font-family: Georgia, 'Times New Roman', serif; }
  .note { margin-top: 20px; font-size: 12.5px; font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; }
  .footer {
    text-align: center;
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid #ccc;
    font-size: 12px;
    color: #555;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  @media print { body { padding: 24px 32px; } }
`;

function wrapPrintDocument(title, bodyHtml, css = QUOTE_DOC_CSS) {
  return `
    <html>
      <head>
        <title>${title}</title>
        <style>${css}</style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `;
}

function openPrintWindow(title, bodyHtml, css) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  printWindow.document.write(wrapPrintDocument(title, bodyHtml, css));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function quotationBodyHtml(q, logoUrl) {
  if (!q) return "";
  const logo = logoUrl || "/images/cbass.png";
  const descHtml = (l) => {
    const included = (l.items || []).filter((i) => i.isIncluded !== false);
    if (!included.length) return "";
    return `<ul class="desc-list">${included.map((i) => `<li>${i.lineText || ""}</li>`).join("")}</ul>`;
  };
  const lineRows = (q.lines || [])
    .map(
      (l) => `
      <tr>
        <td class="product-cell"><strong>${l.packageName || "-"}</strong></td>
        <td class="desc-cell">${descHtml(l)}</td>
        <td class="num-cell">${formatCurrency(l.unitPrice)}</td>
        <td class="num-cell center">${l.qty ?? "-"}</td>
        <td class="num-cell"><strong>${formatCurrency(l.lineTotal)}</strong></td>
      </tr>`
    )
    .join("");
  const addOnRows = (q.addOns || [])
    .map(
      (a) => `
      <tr>
        <td class="product-cell"><strong>${a.name || "-"}</strong></td>
        <td class="desc-cell">Add-on</td>
        <td class="num-cell">${formatCurrency(a.price)}</td>
        <td class="num-cell center">${a.qty ?? "-"}</td>
        <td class="num-cell"><strong>${formatCurrency(a.lineTotal)}</strong></td>
      </tr>`
    )
    .join("");
  const discountRow =
    q.discountAmount > 0
      ? `
      <tr>
        <td class="product-cell"><strong>Special Discount</strong></td>
        <td class="desc-cell">Fixed fee discount</td>
        <td class="num-cell"></td>
        <td class="num-cell center"></td>
        <td class="num-cell"><strong>-${formatCurrency(q.discountAmount)}</strong></td>
      </tr>`
      : "";
  const transportRow =
    q.transportationCost > 0
      ? `
      <tr>
        <td class="product-cell"><strong>Transportation</strong></td>
        <td class="desc-cell">Travel cost</td>
        <td class="num-cell"></td>
        <td class="num-cell center"></td>
        <td class="num-cell"><strong>${formatCurrency(q.transportationCost)}</strong></td>
      </tr>`
      : "";
  const shootStart = q.eventTime ? q.eventTime : "";
  const shootEnd = q.eventEndTime ? ` - ${q.eventEndTime}` : "";
  const shootTimeLine = shootStart || shootEnd ? `${shootStart}${shootEnd}` : "";

  return `
    <div class="logo-wrap">
      <img src="${logo}" alt="Company logo" />
    </div>
    <div class="hr"></div>

    <div class="top-grid">
      <div>
        <h1 class="doc-title">Quotation</h1>
        <div class="kv"><span class="k">Quotation ID:</span><span class="v">${q.quotationNo || "-"}</span></div>
        <div class="kv"><span class="k">Issue Date:</span><span class="v">${formatDate(q.createdOn || q.eventDate)}</span></div>
      </div>
      <div class="right">
        <div class="label">QUOTATION FOR</div>
        <div class="line strong">${q.customerName || "-"}</div>
        ${q.customerMobileNo ? `<div class="line">Phone number: ${q.customerMobileNo}</div>` : ""}
        ${q.customerEmail ? `<div class="line">Email: ${q.customerEmail}</div>` : ""}
      </div>
    </div>

    <div class="top-grid" style="margin-top:24px;">
      <div>
        <div class="label">FROM</div>
        <div class="line strong">Beyond Destiny</div>
        <div class="line">Phone number: 0779944812 / 0779944155</div>
        <div class="line">Email: contact@beyonddestinyweddings.com</div>
        <div class="line">No 27A, Skelton Road, Bambalapitiya., Sri Lanka</div>
      </div>
      <div class="right">
        <div class="line strong">${q.eventTypeName || "-"}</div>
        <div class="line">Shoot</div>
        ${shootTimeLine ? `<div class="line">${shootTimeLine} | ${formatDate(q.eventDate)}</div>` : `<div class="line">${formatDate(q.eventDate)}</div>`}
        ${q.venue ? `<div class="line">${q.venue}</div>` : ""}
        ${q.noOfGuests ? `<div class="line">Guests: ${q.noOfGuests}</div>` : ""}
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Product / Package</th>
          <th>Description</th>
          <th class="num-cell">Unit Price</th>
          <th class="num-cell center">Quantity</th>
          <th class="num-cell">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}${addOnRows}${discountRow}${transportRow}
        <tr class="subtotal-row">
          <td colspan="4">Subtotal</td>
          <td class="num-cell"><strong>${formatCurrency(q.subTotal)}</strong></td>
        </tr>
        <tr class="total-row">
          <td colspan="4"><strong>Total</strong></td>
          <td class="num-cell"><strong>${formatCurrency(q.netTotal)}</strong></td>
        </tr>
      </tbody>
    </table>
    ${q.remark ? `<div class="note"><strong>Note:</strong> ${q.remark}</div>` : ""}
    <div class="footer">
      <p>Thank you for choosing Beyond Destiny.</p>
      <p>This quotation is valid for 30 days from the issue date.</p>
    </div>`;
}

function quotationDocumentHtml(q, logoUrl) {
  return wrapPrintDocument(`Quotation - ${q?.quotationNo || ""}`, quotationBodyHtml(q, logoUrl));
}

function printQuotation(q, logoUrl) {
  if (!q) return;
  openPrintWindow(`Quotation - ${q.quotationNo || ""}`, quotationBodyHtml(q, logoUrl));
}

const INVOICE_DOC_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1a1a1a;
    padding: 48px 56px;
    max-width: 850px;
    margin: 0 auto;
    background: #fff;
  }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: 3px; line-height: 1.25; text-transform: uppercase; }
  .logo-wrap { width: 170px; }
  .logo-wrap img { width: 170px; height: auto; object-fit: contain; display: block; }
  .hr { border-top: 1px solid #ccc; margin: 20px 0 28px; }
  .doc-title { font-size: 26px; font-weight: 700; margin-bottom: 14px; }
  .top-grid { display: flex; justify-content: space-between; gap: 24px; }
  .top-grid .right { text-align: right; }
  .label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 6px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  .kv { font-size: 12.5px; margin-bottom: 3px; font-family: 'Segoe UI', Tahoma, sans-serif; }
  .kv .k { font-weight: 700; margin-right: 4px; }
  .line { font-size: 12.5px; margin-bottom: 3px; font-family: 'Segoe UI', Tahoma, sans-serif; }
  .line.strong { font-weight: 700; font-family: Georgia, serif; font-size: 13.5px; }
  table.items, table.status {
    width: 100%;
    border-collapse: collapse;
    margin-top: 32px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  table.items th, table.status th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #555;
    padding: 10px 8px;
    border-bottom: 1px solid #ccc;
  }
  table.items td, table.status td {
    font-size: 12.5px;
    padding: 12px 8px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }
  .product-cell { width: 22%; }
  .desc-cell { color: #333; }
  .desc-list { margin: 4px 0 0 16px; font-size: 11.5px; color: #444; }
  .desc-list li { margin-bottom: 2px; }
  .num-cell { text-align: right; white-space: nowrap; }
  .num-cell.center { text-align: center; }
  .subtotal-row td { border-bottom: none; padding-top: 16px; }
  .total-row td { border-top: 2px solid #1a1a1a; border-bottom: none; font-size: 14px; padding-top: 10px; }
  table.status { margin-top: 36px; }
  .balance-row td { border-top: 2px solid #1a1a1a; border-bottom: none; font-size: 14px; padding-top: 10px; }
  @media print { body { padding: 24px 32px; } }
`;

function invoiceBodyHtml({ quotation: q, payments, balance, logoUrl }) {
  if (!q) return "";

  const issueDate = formatDate(new Date());

  const packageDescriptionHtml = (l) => {
    const included = (l.items || []).filter((i) => i.isIncluded !== false);
    if (!included.length) return "";
    return `<ul class="desc-list">${included.map((i) => `<li>${i.lineText || ""}</li>`).join("")}</ul>`;
  };

  const lineRows = (q.lines || [])
    .map(
      (l) => `
      <tr>
        <td class="product-cell"><strong>${l.packageName || "-"}</strong></td>
        <td class="desc-cell">${packageDescriptionHtml(l)}</td>
        <td class="num-cell">${formatCurrency(l.unitPrice)}</td>
        <td class="num-cell center">${l.qty ?? "-"}</td>
        <td class="num-cell"><strong>${formatCurrency(l.lineTotal)}</strong></td>
      </tr>`
    )
    .join("");

  const addOnRows = (q.addOns || [])
    .map(
      (a) => `
      <tr>
        <td class="product-cell"><strong>${a.name || "-"}</strong></td>
        <td class="desc-cell">Add-on</td>
        <td class="num-cell">${formatCurrency(a.price)}</td>
        <td class="num-cell center">${a.qty ?? "-"}</td>
        <td class="num-cell"><strong>${formatCurrency(a.lineTotal)}</strong></td>
      </tr>`
    )
    .join("");

  const discountRow =
    q.discountAmount > 0
      ? `
      <tr>
        <td class="product-cell"><strong>Special Discount</strong></td>
        <td class="desc-cell">Fixed fee discount</td>
        <td class="num-cell"></td>
        <td class="num-cell center"></td>
        <td class="num-cell"><strong>-${formatCurrency(q.discountAmount)}</strong></td>
      </tr>`
      : "";

  const transportRow =
    q.transportationCost > 0
      ? `
      <tr>
        <td class="product-cell"><strong>Transportation</strong></td>
        <td class="desc-cell">Travel cost</td>
        <td class="num-cell"></td>
        <td class="num-cell center"></td>
        <td class="num-cell"><strong>${formatCurrency(q.transportationCost)}</strong></td>
      </tr>`
      : "";

  // Payment status rows, styled like the PDF's Status / Due / Last Action / Amount table
  const paymentStatusRows = (payments || [])
    .map((p) => {
      const isApproved = String(p.approvalStatusName || "").toLowerCase().includes("approv");
      const statusLabel = isApproved ? "Paid" : p.approvalStatusName || "Unpaid";
      const lastAction = p.approvedOn ? `Paid on ${formatDate(p.approvedOn)}` : "-";
      return `
      <tr>
        <td><strong>${statusLabel}</strong></td>
        <td>${issueDate}</td>
        <td>${lastAction}</td>
        <td class="num-cell"><strong>${formatCurrency(p.amount)}</strong></td>
      </tr>`;
    })
    .join("");

  const unpaidRow =
    balance > 0
      ? `
      <tr>
        <td><strong>Unpaid</strong></td>
        <td>${issueDate}</td>
        <td>-</td>
        <td class="num-cell"><strong>${formatCurrency(balance)}</strong></td>
      </tr>`
      : "";

  const shootStart = q.eventTime ? q.eventTime : "";
  const shootEnd = q.eventEndTime ? ` - ${q.eventEndTime}` : "";
  const shootTimeLine = shootStart || shootEnd ? `${shootStart}${shootEnd}` : "";

  const logo = logoUrl
    ? `<div class="logo-wrap"><img src="${logoUrl}" alt="Company logo" /></div>`
    : `<div class="logo">BEYOND<br/>DESTINY</div>`;

  return `
    ${logo}
    <div class="hr"></div>

    <div class="top-grid">
      <div>
        <h1 class="doc-title">Invoice</h1>
        <div class="kv"><span class="k">Invoice ID:</span><span class="v">${q.quotationNo || "-"}</span></div>
        <div class="kv"><span class="k">Issue Date:</span><span class="v">${issueDate}</span></div>
      </div>
      <div class="right">
        <div class="label">INVOICE FOR</div>
        <div class="line strong">${q.customerName || "-"}</div>
        ${q.customerMobileNo ? `<div class="line">Phone number: ${q.customerMobileNo}</div>` : ""}
        ${q.customerEmail ? `<div class="line">Email: ${q.customerEmail}</div>` : ""}
      </div>
    </div>

    <div class="top-grid" style="margin-top:24px;">
      <div>
        <div class="label">FROM</div>
        <div class="line strong">Beyond Destiny</div>
        <div class="line">Phone number: 0779944812 / 0779944155</div>
        <div class="line">Email: contact@beyonddestinyweddings.com</div>
        <div class="line">No 27A, Skelton Road, Bambalapitiya., Sri Lanka</div>
      </div>
      <div class="right">
        <div class="line strong">${q.eventTypeName || "-"}</div>
        <div class="line">Shoot</div>
        ${shootTimeLine ? `<div class="line">${shootTimeLine} | ${formatDate(q.eventDate)}</div>` : `<div class="line">${formatDate(q.eventDate)}</div>`}
        ${q.venue ? `<div class="line">${q.venue}</div>` : ""}
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Product / Package</th>
          <th>Description</th>
          <th class="num-cell">Unit Price</th>
          <th class="num-cell center">Quantity</th>
          <th class="num-cell">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}${addOnRows}${discountRow}${transportRow}
        <tr class="subtotal-row">
          <td colspan="4">Subtotal</td>
          <td class="num-cell"><strong>${formatCurrency(q.subTotal)}</strong></td>
        </tr>
        <tr class="total-row">
          <td colspan="4"><strong>Total</strong></td>
          <td class="num-cell"><strong>${formatCurrency(q.netTotal)}</strong></td>
        </tr>
      </tbody>
    </table>

    <table class="status">
      <thead>
        <tr>
          <th>Status</th>
          <th>Due</th>
          <th>Last Action</th>
          <th class="num-cell">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${paymentStatusRows}${unpaidRow}
        <tr class="balance-row">
          <td colspan="3"><strong>Balance due</strong></td>
          <td class="num-cell"><strong>${formatCurrency(balance)}</strong></td>
        </tr>
      </tbody>
    </table>
  `;
}

function invoiceDocumentHtml(args) {
  const q = args?.quotation;
  return wrapPrintDocument(`Invoice - ${q?.quotationNo || ""}`, invoiceBodyHtml(args), INVOICE_DOC_CSS);
}

function printInvoice(args) {
  if (!args?.quotation) return;
  openPrintWindow(`Invoice - ${args.quotation.quotationNo || ""}`, invoiceBodyHtml(args), INVOICE_DOC_CSS);
}

function TasksTabPanel({ reservationId, tasksEnabled, userAgentType, isAdminUser }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      {!tasksEnabled && (
        <Box
          sx={{
            mb: 1.5,
            p: 1.25,
            borderRadius: 1,
            bgcolor: "warning.50",
            border: "1px solid",
            borderColor: "warning.light",
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            Task work is disabled until handover to an agent type with{" "}
            <strong>Can manage tasks</strong> (default: After Wedding Manager). You can view tasks, but
            generate / complete / assign unlock after that handover.
          </Typography>
        </Box>
      )}
      <ReservationTasks
        reservationId={reservationId}
        embedded
        enabled={tasksEnabled}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
      <TaskAssignment
        reservationId={reservationId}
        refreshKey={refreshKey}
        enabled={tasksEnabled}
        userAgentType={userAgentType}
        isAdminUser={isAdminUser}
      />
    </>
  );
}

/**
 * Sidebar tabs: Quotation | Invoice (payments) | Tasks
 * Visibility rules:
 * - Admin users (type 0 or 1) OR users with no agent type: see all tabs
 * - Customer Coordinator (1) and Payment Handler (2): see approved quotation
 * - Payment Handler (2): also sees Invoice
 * - After Wedding Manager (3): sees Tasks
 */
export default function ReservationDetailTabs({ reservationId, currentAgentType, userAgentType, isAdminUser }) {
  const [taskAgentTypes, setTaskAgentTypes] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewQuote, setPreviewQuote] = useState(null);
  const [previewKind, setPreviewKind] = useState("quotation");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("/images/cbass.png");

  const openQuotationPreview = (q) => {
    if (!q) return;
    setPreviewKind("quotation");
    setPreviewQuote(q);
    setPreviewHtml(quotationDocumentHtml(q, companyLogo));
    setPreviewOpen(true);
  };

  const canSeeAll = isAdminUser || userAgentType === null || userAgentType === undefined;
  const canSeeQuotationTab = canSeeAll || userAgentType === 1 || userAgentType === 2;
  const canSeeInvoiceTab = canSeeAll || userAgentType === 2;
  const canSeeTasks = canSeeAll || userAgentType === 3;

  useEffect(() => {
    getAgentTypes()
      .then((data) => {
        if (data?.statusCode === 200 || data?.statusCode === "SUCCESS") {
          setTaskAgentTypes(data.result || data.Result || []);
        }
      })
      .catch(() => {});

    const warehouse = typeof window !== "undefined" ? localStorage.getItem("warehouse") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!warehouse || !token) return;
    fetch(`${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const url = data?.logoUrl || data?.LogoUrl || data?.result || "";
        if (url && typeof url === "string") setCompanyLogo(url);
      })
      .catch(() => {});
  }, []);

  const tasksEnabled = useMemo(() => {
    const cur = Number(currentAgentType);
    if (!cur) return false;
    const match = taskAgentTypes.find((t) => Number(t.id ?? t.Id) === cur);
    if (match) return !!(match.canManageTasks ?? match.CanManageTasks);
    return cur === 3; // fallback After Wedding Manager
  }, [currentAgentType, taskAgentTypes]);

  const load = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [qRes, dRes] = await Promise.all([
        fetch(`${BASE_URL}/PhotographyQuotation/GetQuotationsByReservation/${reservationId}`, { headers }),
        fetch(`${BASE_URL}/PhotographyReservation/GetReservationById?id=${reservationId}`, { headers }),
      ]);
      const qData = await qRes.json();
      const dData = await dRes.json();

      const qListRaw = qData?.result ?? qData?.Result;
      let list = Array.isArray(qListRaw) ? qListRaw.map(normalizeQuotation) : qListRaw ? [normalizeQuotation(qListRaw)] : [];

      const detail = dData?.result ?? dData?.Result;
      const detailQ = normalizeQuotation(detail?.quotation ?? detail?.Quotation);
      if (detailQ && !list.some((q) => q.id === detailQ.id)) {
        list = [detailQ, ...list];
      }

      setQuotations(list.filter(Boolean));
      setSelectedId(list[0]?.id ?? detailQ?.id ?? null);
      setPayments((detail?.payments ?? detail?.Payments ?? []).map(normalizePayment));
    } catch {
      setQuotations([]);
      setSelectedId(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleQuotations = useMemo(() => {
    if (canSeeAll) return quotations;
    return quotations.filter((q) => isApprovedQuotation(q.statusName));
  }, [quotations, canSeeAll]);

  const selected = useMemo(
    () => visibleQuotations.find((q) => q.id === selectedId) || visibleQuotations[0] || null,
    [visibleQuotations, selectedId]
  );

  const paidTotal = payments
    .filter((p) => String(p.approvalStatusName || "").toLowerCase().includes("approv"))
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const netTotal = Number(selected?.netTotal || 0);
  const balance = netTotal - paidTotal;
  const relatedHint = selected && selected.reservationId == null;

  // Build visible tabs based on permissions
  const visibleTabs = useMemo(() => {
    const tabs = [];
    if (canSeeQuotationTab) {
      tabs.push({ key: "quotation", label: "Quotation", icon: <RequestQuoteIcon sx={{ fontSize: 16 }} /> });
    }
    if (canSeeInvoiceTab) {
      tabs.push({ key: "invoice", label: "Invoice", icon: <ReceiptLongIcon sx={{ fontSize: 16 }} /> });
    }
    if (canSeeTasks) {
      tabs.push({ key: "tasks", label: "Tasks", icon: <AssignmentIcon sx={{ fontSize: 16 }} /> });
    }
    return tabs;
  }, [canSeeQuotationTab, canSeeInvoiceTab, canSeeTasks]);

  const currentTabKey = visibleTabs[tab]?.key || visibleTabs[0]?.key;

  // If no tabs visible, don't render the component
  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1, mb: 1 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { minHeight: 36, py: 0.5, fontSize: 12, textTransform: "none" },
        }}
      >
        {visibleTabs.map((t) => (
          <Tab key={t.key} icon={t.icon} iconPosition="start" label={t.label} />
        ))}
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={22} />
        </Box>
      ) : (
        <>
          {currentTabKey === "quotation" && (
            <Box sx={{ pt: 1.5 }}>
              {visibleQuotations.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  {quotations.length === 0
                    ? "No quotations linked"
                    : "Quotation will appear here after it is approved"}
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {relatedHint && (
                    <Typography variant="caption" color="warning.main">
                      Related by mobile (not linked to reservation)
                    </Typography>
                  )}
                  {visibleQuotations.map((q) => {
                    const active = q.id === selected?.id;
                    return (
                      <Paper
                        key={q.id}
                        elevation={0}
                        onClick={() => setSelectedId(q.id)}
                        sx={{
                          p: 1.25,
                          border: "1px solid",
                          borderColor: active ? "primary.main" : "divider",
                          borderRadius: 1,
                          cursor: "pointer",
                          bgcolor: active ? "action.selected" : "background.paper",
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight={700}>
                            {q.quotationNo || "-"}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip
                              size="small"
                              label={q.statusName || "-"}
                              color={statusColor(q.statusName)}
                              sx={{ height: 20, fontSize: 10 }}
                            />
                            <Tooltip title="Preview quotation">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openQuotationPreview(q);
                                }}
                              >
                                <PreviewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print quotation">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  printQuotation(q, companyLogo);
                                }}
                              >
                                <PrintIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {(q.eventTypeName || "-") + " • " + (q.customerName || "-")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDate(q.eventDate)}
                          {q.lines?.[0]?.packageName ? ` • ${q.lines[0].packageName}` : ""}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="primary.main" mt={0.5}>
                          {money(q.netTotal)}
                        </Typography>
                      </Paper>
                    );
                  })}

                  {selected && (
                    <>
                      <Divider />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" fontWeight={700}>
                          Quotation details
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            startIcon={<PreviewIcon />}
                            onClick={() => openQuotationPreview(selected)}
                            sx={{ textTransform: "none", fontSize: 12 }}
                          >
                            Preview
                          </Button>
                          <Button
                            size="small"
                            startIcon={<PrintIcon />}
                            onClick={() => printQuotation(selected, companyLogo)}
                            sx={{ textTransform: "none", fontSize: 12 }}
                          >
                            Print
                          </Button>
                        </Stack>
                      </Box>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selected.lines || []).map((l) => (
                            <TableRow key={l.id || l.packageName}>
                              <TableCell>
                                <Typography variant="body2">{l.packageName}</Typography>
                                {(l.items || [])
                                  .filter((i) => i.isIncluded !== false)
                                  .slice(0, 4)
                                  .map((i, idx) => (
                                    <Typography key={idx} variant="caption" color="text.secondary" display="block">
                                      • {i.lineText}
                                    </Typography>
                                  ))}
                              </TableCell>
                              <TableCell align="right">{l.qty}</TableCell>
                              <TableCell align="right">{money(l.lineTotal)}</TableCell>
                            </TableRow>
                          ))}
                          {(selected.addOns || []).map((a) => (
                            <TableRow key={a.id || a.name}>
                              <TableCell>{(a.name || "") + " (Add-on)"}</TableCell>
                              <TableCell align="right">{a.qty}</TableCell>
                              <TableCell align="right">{money(a.lineTotal)}</TableCell>
                            </TableRow>
                          ))}
                          {(!selected.lines || selected.lines.length === 0) &&
                            (!selected.addOns || selected.addOns.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    No line items on this quotation
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                        </TableBody>
                      </Table>
                      <Stack spacing={0.35}>
                        {selected.subTotal > 0 && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">Subtotal</Typography>
                            <Typography variant="caption">{money(selected.subTotal)}</Typography>
                          </Box>
                        )}
                        {selected.discountAmount > 0 && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">Discount</Typography>
                            <Typography variant="caption" color="success.main">
                              -{money(selected.discountAmount)}
                            </Typography>
                          </Box>
                        )}
                        {selected.transportationCost > 0 && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption">Transport</Typography>
                            <Typography variant="caption">{money(selected.transportationCost)}</Typography>
                          </Box>
                        )}
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={700}>
                            Net total
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            {money(selected.netTotal)}
                          </Typography>
                        </Box>
                      </Stack>
                    </>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {currentTabKey === "invoice" && (
            <Box sx={{ pt: 1.5 }}>
              {selected ? (
                <Paper elevation={0} sx={{ p: 1.25, mb: 1, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Invoice ({selected.quotationNo || "-"})
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        startIcon={<PreviewIcon />}
                        onClick={() => {
                          setPreviewKind("invoice");
                          setPreviewQuote(selected);
                          setPreviewHtml(
                            invoiceDocumentHtml({
                              quotation: selected,
                              payments,
                              paidTotal,
                              balance,
                              logoUrl: companyLogo,
                            })
                          );
                          setPreviewOpen(true);
                        }}
                        sx={{ textTransform: "none", fontSize: 12 }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        startIcon={<PrintIcon />}
                        onClick={() =>
                          printInvoice({
                            quotation: selected,
                            payments,
                            paidTotal,
                            balance,
                            logoUrl: companyLogo,
                          })
                        }
                        sx={{ textTransform: "none", fontSize: 12 }}
                      >
                        Print
                      </Button>
                      {canSeeInvoiceTab && (
                        <RecordPayment
                          quotation={selected}
                          fetchItems={load}
                          canRecordPayment
                          paidApproved={paidTotal}
                          pendingAmount={payments
                            .filter((p) => String(p.approvalStatusName || "").toLowerCase().includes("pend"))
                            .reduce((sum, p) => sum + Number(p.amount || 0), 0)}
                          variant="button"
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack spacing={0.5} mt={0.75}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Net total</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {money(netTotal)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Paid (approved)</Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        {money(paidTotal)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={700}>
                        Balance
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={balance > 0 ? "warning.main" : "success.main"}
                      >
                        {money(balance)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" py={1}>
                  No quotation for invoice summary
                </Typography>
              )}

              {payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No payments recorded
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {payments.map((p) => (
                    <Paper
                      key={p.id}
                      elevation={0}
                      sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={700}>
                          {p.paymentNo}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            size="small"
                            label={p.approvalStatusName || "-"}
                            color={statusColor(p.approvalStatusName)}
                            sx={{ height: 20, fontSize: 10 }}
                          />
                          <PrintReceipt payment={p} />
                        </Stack>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(p.createdOn)} • {p.paymentMethodName || "-"}
                        {p.isAdvance
                          ? " • Advance"
                          : String(p.remark || "").toLowerCase().includes("final")
                            ? " • Final"
                            : " • Installment"}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main" mt={0.5}>
                        {money(p.amount)}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {currentTabKey === "tasks" && (
            <Box sx={{ pt: 1.5 }}>
              <TasksTabPanel
                reservationId={reservationId}
                tasksEnabled={tasksEnabled}
                userAgentType={userAgentType}
                isAdminUser={isAdminUser}
              />
            </Box>
          )}
        </>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.25 }}>
          <PreviewIcon color="primary" />
          {previewKind === "invoice" ? "Invoice preview" : "Quotation preview"}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: "#f1f5f9" }}>
          {previewHtml ? (
            <iframe
              title={previewKind === "invoice" ? "Invoice preview" : "Quotation preview"}
              srcDoc={previewHtml}
              style={{ width: "100%", height: "70vh", border: 0, background: "#fff" }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              if (!previewQuote) return;
              if (previewKind === "invoice") {
                printInvoice({
                  quotation: previewQuote,
                  payments,
                  paidTotal,
                  balance,
                  logoUrl: companyLogo,
                });
              } else {
                printQuotation(previewQuote, companyLogo);
              }
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}