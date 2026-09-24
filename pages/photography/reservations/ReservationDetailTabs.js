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
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PrintIcon from "@mui/icons-material/Print";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import ReservationTasks from "./ReservationTasks";
import TaskAssignment from "./TaskAssignment";
import PrintReceipt from "../payment-approval/PrintReceipt";
import { getAgentTypes } from "@/Services/photographyAgentService";

const money = (n) =>
  n == null || n === ""
    ? "-"
    : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function statusColor(name) {
  const s = String(name || "").toLowerCase();
  if (s.includes("approv") || s.includes("convert")) return "success";
  if (s.includes("reject") || s.includes("cancel")) return "error";
  if (s.includes("pending")) return "warning";
  return "default";
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
    eventDate: pick(q, "eventDate", "EventDate"),
    eventTime: pick(q, "eventTime", "EventTime"),
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
    approvalStatusName: pick(p, "approvalStatusName", "ApprovalStatusName"),
    approvedOn: pick(p, "approvedOn", "ApprovedOn"),
    createdOn: pick(p, "createdOn", "CreatedOn"),
    remark: pick(p, "remark", "Remark"),
  };
}

function openPrintWindow(title, bodyHtml) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 32px; color: #333; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #4F46E5; }
          .company h1 { font-size: 22px; color: #4F46E5; }
          .company p { font-size: 12px; color: #666; }
          .doc-info { text-align: right; }
          .doc-info h2 { font-size: 20px; color: #4F46E5; margin-bottom: 6px; }
          .doc-info p { font-size: 12px; }
          .parties { display: flex; gap: 20px; margin-bottom: 24px; }
          .party { flex: 1; padding: 14px; background: #f8f9fa; border-radius: 8px; }
          .party h3 { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
          .party p { font-size: 13px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #4F46E5; color: #fff; text-align: left; padding: 10px; font-size: 12px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top; }
          ul.items { margin: 6px 0 0 16px; color: #555; font-size: 12px; }
          .totals { margin-left: auto; width: 280px; }
          .totals td { border: none; padding: 6px 0; }
          .grand-total td { border-top: 2px solid #4F46E5; padding-top: 10px; font-size: 15px; }
          .summary { background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .summary-row.total { border-top: 2px solid #4F46E5; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 15px; }
          .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #666; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function printQuotation(q) {
  if (!q) return;
  const linesHtml = (q.lines || [])
    .map(
      (l) => `
      <tr>
        <td>
          <strong>${l.packageName || "-"}</strong>
          ${
            (l.items || []).filter((i) => i.isIncluded !== false).length
              ? `<ul class="items">${(l.items || [])
                  .filter((i) => i.isIncluded !== false)
                  .map((i) => `<li>${i.lineText || ""}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </td>
        <td style="text-align:right">${formatCurrency(l.unitPrice)}</td>
        <td style="text-align:center">${l.qty ?? "-"}</td>
        <td style="text-align:right">${formatCurrency(l.lineTotal)}</td>
      </tr>`
    )
    .join("");
  const addOnsHtml = (q.addOns || [])
    .map(
      (a) => `
      <tr>
        <td>${a.name || "-"} (Add-on)</td>
        <td style="text-align:right">${formatCurrency(a.price)}</td>
        <td style="text-align:center">${a.qty ?? "-"}</td>
        <td style="text-align:right">${formatCurrency(a.lineTotal)}</td>
      </tr>`
    )
    .join("");

  openPrintWindow(
    `Quotation - ${q.quotationNo || ""}`,
    `
    <div class="header">
      <div class="company">
        <h1>Beyond Destiny</h1>
        <p>Phone: 0779944812 / 0779944155</p>
        <p>Email: contact@beyonddestinyweddings.com</p>
        <p>No 27A, Skelton Road, Bambalapitiya, Sri Lanka</p>
      </div>
      <div class="doc-info">
        <h2>QUOTATION</h2>
        <p><strong>No:</strong> ${q.quotationNo || "-"}</p>
        <p><strong>Date:</strong> ${formatDate(q.createdOn || q.eventDate)}</p>
        <p><strong>Status:</strong> ${q.statusName || "-"}</p>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <h3>Quotation For</h3>
        <p><strong>${q.customerName || "-"}</strong></p>
        ${q.customerMobileNo ? `<p>Phone: ${q.customerMobileNo}</p>` : ""}
      </div>
      <div class="party">
        <h3>Event Details</h3>
        <p><strong>${q.eventTypeName || "-"}</strong></p>
        <p>${q.eventTime || ""} ${formatDate(q.eventDate)}</p>
        ${q.venue ? `<p>${q.venue}</p>` : ""}
        ${q.noOfGuests ? `<p>Guests: ${q.noOfGuests}</p>` : ""}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:50%">Product / Package</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${linesHtml}${addOnsHtml}</tbody>
    </table>
    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(q.subTotal)}</td></tr>
        ${
          q.discountAmount > 0
            ? `<tr><td>Discount</td><td style="text-align:right;color:green">-${formatCurrency(q.discountAmount)}</td></tr>`
            : ""
        }
        ${
          q.transportationCost > 0
            ? `<tr><td>Transportation</td><td style="text-align:right">${formatCurrency(q.transportationCost)}</td></tr>`
            : ""
        }
        <tr class="grand-total"><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatCurrency(q.netTotal)}</strong></td></tr>
      </table>
    </div>
    ${q.remark ? `<div style="margin-top:16px;padding:10px;background:#fef3c7;border-radius:4px"><strong>Note:</strong> ${q.remark}</div>` : ""}
    <div class="footer">
      <p>Thank you for choosing Beyond Destiny!</p>
      <p>This quotation is valid for 30 days from the issue date.</p>
    </div>`
  );
}

function printInvoice({ quotation, payments, paidTotal, balance }) {
  if (!quotation) return;
  const paymentRows = (payments || [])
    .map(
      (p) => `
      <tr>
        <td>${p.paymentNo || "-"}</td>
        <td>${formatDate(p.approvedOn || p.createdOn)}</td>
        <td>${p.paymentMethodName || "-"}${p.isAdvance ? " (Advance)" : ""}</td>
        <td>${p.approvalStatusName || "-"}</td>
        <td style="text-align:right">${formatCurrency(p.amount)}</td>
      </tr>`
    )
    .join("");

  openPrintWindow(
    `Invoice - ${quotation.quotationNo || ""}`,
    `
    <div class="header">
      <div class="company">
        <h1>Beyond Destiny</h1>
        <p>Phone: 0779944812 / 0779944155</p>
        <p>Email: contact@beyonddestinyweddings.com</p>
      </div>
      <div class="doc-info">
        <h2>INVOICE</h2>
        <p><strong>Quotation:</strong> ${quotation.quotationNo || "-"}</p>
        <p><strong>Date:</strong> ${formatDate(new Date())}</p>
      </div>
    </div>
    <div class="parties">
      <div class="party">
        <h3>Bill To</h3>
        <p><strong>${quotation.customerName || "-"}</strong></p>
        ${quotation.customerMobileNo ? `<p>${quotation.customerMobileNo}</p>` : ""}
      </div>
      <div class="party">
        <h3>Event</h3>
        <p><strong>${quotation.eventTypeName || "-"}</strong></p>
        <p>${formatDate(quotation.eventDate)}</p>
        ${quotation.venue ? `<p>${quotation.venue}</p>` : ""}
      </div>
    </div>
    <div class="summary">
      <div class="summary-row"><span>Net total</span><span>${formatCurrency(quotation.netTotal)}</span></div>
      <div class="summary-row"><span>Paid (approved)</span><span>${formatCurrency(paidTotal)}</span></div>
      <div class="summary-row total"><span>Balance</span><span>${formatCurrency(balance)}</span></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Payment No</th>
          <th>Date</th>
          <th>Method</th>
          <th>Status</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows || `<tr><td colspan="5" style="text-align:center">No payments recorded</td></tr>`}
      </tbody>
    </table>
    <div class="footer">
      <p>Beyond Destiny Photography</p>
      <p>Thank you for your business.</p>
    </div>`
  );
}

function TasksTabPanel({ reservationId, tasksEnabled }) {
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
      <TaskAssignment reservationId={reservationId} refreshKey={refreshKey} enabled={tasksEnabled} />
    </>
  );
}

/**
 * Sidebar tabs: Quotation | Invoice (payments) | Tasks
 * Visibility rules:
 * - Admin users (type 0 or 1) OR users with no agent type: see all tabs
 * - Payment Handler (agent type 2): sees Quotation and Invoice tabs
 * - After Wedding Manager (agent type 3): sees Tasks tab
 * - Customer Coordinator (agent type 1): sees none (no sidebar tabs)
 */
export default function ReservationDetailTabs({ reservationId, currentAgentType, userAgentType, isAdminUser }) {
  const [taskAgentTypes, setTaskAgentTypes] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [payments, setPayments] = useState([]);

  // Visibility: admin or no agent type assigned = see all
  const canSeeAll = isAdminUser || userAgentType === null || userAgentType === undefined;
  // Payment Handler (2) sees payment info (Quotation/Invoice)
  const canSeePaymentTabs = canSeeAll || userAgentType === 2;
  // After Wedding Manager (3) sees Tasks
  const canSeeTasks = canSeeAll || userAgentType === 3;

  useEffect(() => {
    getAgentTypes()
      .then((data) => {
        if (data?.statusCode === 200 || data?.statusCode === "SUCCESS") {
          setTaskAgentTypes(data.result || data.Result || []);
        }
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

  const selected = useMemo(
    () => quotations.find((q) => q.id === selectedId) || quotations[0] || null,
    [quotations, selectedId]
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
    if (canSeePaymentTabs) {
      tabs.push({ key: "quotation", label: "Quotation", icon: <RequestQuoteIcon sx={{ fontSize: 16 }} /> });
      tabs.push({ key: "invoice", label: "Invoice", icon: <ReceiptLongIcon sx={{ fontSize: 16 }} /> });
    }
    if (canSeeTasks) {
      tabs.push({ key: "tasks", label: "Tasks", icon: <AssignmentIcon sx={{ fontSize: 16 }} /> });
    }
    return tabs;
  }, [canSeePaymentTabs, canSeeTasks]);

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
              {quotations.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No quotations linked
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {relatedHint && (
                    <Typography variant="caption" color="warning.main">
                      Related by mobile (not linked to reservation)
                    </Typography>
                  )}
                  {quotations.map((q) => {
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
                            <Tooltip title="Print quotation">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  printQuotation(q);
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
                        <Button
                          size="small"
                          startIcon={<PrintIcon />}
                          onClick={() => printQuotation(selected)}
                          sx={{ textTransform: "none", fontSize: 12 }}
                        >
                          Print
                        </Button>
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
                    <Button
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={() =>
                        printInvoice({ quotation: selected, payments, paidTotal, balance })
                      }
                      sx={{ textTransform: "none", fontSize: 12 }}
                    >
                      Print invoice
                    </Button>
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
                        {p.isAdvance ? " • Advance" : ""}
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
              <TasksTabPanel reservationId={reservationId} tasksEnabled={tasksEnabled} />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}
