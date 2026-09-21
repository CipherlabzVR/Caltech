import React, { useEffect, useState } from "react";
import {
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import PreviewIcon from "@mui/icons-material/Preview";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";

const RECEIPT_CSS = `
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
  .wordmark { font-size: 22px; font-weight: 700; letter-spacing: 3px; line-height: 1.25; text-transform: uppercase; }
  .hr { border-top: 1px solid #ccc; margin: 20px 0 28px; }
  .doc-title { font-size: 26px; font-weight: 700; margin-bottom: 14px; color: #1a1a1a; }
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
  .kv, .line { font-size: 12.5px; margin-bottom: 3px; font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a1a; }
  .kv .k { font-weight: 700; margin-right: 4px; }
  .line.strong { font-weight: 700; font-family: Georgia, 'Times New Roman', serif; font-size: 13.5px; }
  table.details {
    width: 100%;
    border-collapse: collapse;
    margin-top: 32px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  table.details th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #555;
    padding: 10px 8px;
    border-bottom: 1px solid #ccc;
  }
  table.details td {
    font-size: 12.5px;
    padding: 12px 8px;
    border-bottom: 1px solid #eee;
    color: #1a1a1a;
  }
  .num { text-align: right; white-space: nowrap; }
  .amount-row td {
    border-top: 2px solid #1a1a1a;
    border-bottom: none;
    font-size: 14px;
    font-weight: 700;
    padding-top: 12px;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .stamp {
    display: inline-block;
    border: 2px solid #1a1a1a;
    color: #1a1a1a;
    padding: 8px 22px;
    font-weight: 800;
    font-size: 16px;
    letter-spacing: 2px;
    margin: 28px 0 8px;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .footer {
    text-align: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #ccc;
    font-size: 12px;
    color: #555;
    font-family: 'Segoe UI', Tahoma, sans-serif;
  }
  @media print { body { padding: 24px 32px; } }
`;

function paymentTypeLabel(payment) {
  if (payment?.isAdvance) return "Advance payment";
  const remark = String(payment?.remark || "").toLowerCase();
  if (remark.includes("final")) return "Final payment";
  return "Installment";
}

function receiptBodyHtml(payment, logoUrl) {
  const logo = logoUrl
    ? `<div class="logo-wrap"><img src="${logoUrl}" alt="Company logo" /></div>`
    : `<div class="wordmark">BEYOND<br/>DESTINY</div>`;

  return `
    ${logo}
    <div class="hr"></div>

    <div class="top-grid">
      <div>
        <h1 class="doc-title">Payment Receipt</h1>
        <div class="kv"><span class="k">Receipt No:</span><span>${payment.paymentNo || "-"}</span></div>
        <div class="kv"><span class="k">Date:</span><span>${formatDate(payment.approvedOn || payment.createdOn)}</span></div>
        <div class="kv"><span class="k">Quotation:</span><span>${payment.quotationNo || "-"}</span></div>
      </div>
      <div class="right">
        <div class="label">RECEIVED FROM</div>
        <div class="line strong">${payment.customerName || "-"}</div>
        ${payment.customerMobileNo ? `<div class="line">Phone number: ${payment.customerMobileNo}</div>` : ""}
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
        <div class="line strong">${payment.eventTypeName || "-"}</div>
        <div class="line">Shoot</div>
        <div class="line">${formatDate(payment.eventDate)}</div>
        ${payment.venue ? `<div class="line">${payment.venue}</div>` : ""}
      </div>
    </div>

    <table class="details">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Payment method</td>
          <td class="num">${payment.paymentMethodName || "-"}</td>
        </tr>
        <tr>
          <td>Payment type</td>
          <td class="num">${paymentTypeLabel(payment)}</td>
        </tr>
        <tr>
          <td>Quotation total</td>
          <td class="num">${formatCurrency(payment.quotationNetTotal)}</td>
        </tr>
        ${
          payment.remark
            ? `<tr><td>Remarks</td><td class="num">${payment.remark}</td></tr>`
            : ""
        }
        <tr class="amount-row">
          <td>Amount received</td>
          <td class="num">${formatCurrency(payment.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div style="text-align:center;">
      <div class="stamp">PAID</div>
    </div>

    <div class="footer">
      <p>Beyond Destiny Photography</p>
      <p>0779944812 / 0779944155 · contact@beyonddestinyweddings.com</p>
      <p>No 27A, Skelton Road, Bambalapitiya, Sri Lanka</p>
      <p style="margin-top:10px;">Thank you for your payment.</p>
    </div>
  `;
}

function receiptDocumentHtml(payment, logoUrl) {
  return `
    <html>
      <head>
        <title>Payment Receipt - ${payment?.paymentNo || ""}</title>
        <style>${RECEIPT_CSS}</style>
      </head>
      <body>${receiptBodyHtml(payment, logoUrl)}</body>
    </html>
  `;
}

function printReceipt(payment, logoUrl) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  printWindow.document.write(receiptDocumentHtml(payment, logoUrl));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export default function PrintReceipt({ payment }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState("");

  useEffect(() => {
    const warehouse = typeof window !== "undefined" ? localStorage.getItem("warehouse") : null;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!warehouse || !token) return;
    fetch(`${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const url = data?.logoUrl || data?.LogoUrl || "";
        if (url) setCompanyLogo(url);
      })
      .catch(() => {});
  }, []);

  const status = String(payment.approvalStatusName || payment.ApprovalStatusName || payment.approvalStatus || payment.ApprovalStatus || "").toLowerCase();
  const confirmed = status.includes("approv") || status === "2";

  if (!payment || !confirmed) return null;

  return (
    <>
      <Stack direction="row" spacing={0} alignItems="center">
        <Tooltip title="Preview receipt">
          <IconButton size="small" onClick={() => setPreviewOpen(true)} sx={{ color: "#1a1a1a" }}>
            <PreviewIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print receipt">
          <IconButton size="small" onClick={() => printReceipt(payment, companyLogo)} sx={{ color: "#1a1a1a" }}>
            <PrintIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.25 }}>
          <PreviewIcon color="primary" />
          Receipt preview
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: "#f1f5f9" }}>
          <iframe
            title="Receipt preview"
            srcDoc={receiptDocumentHtml(payment, companyLogo)}
            style={{ width: "100%", height: "70vh", border: 0, background: "#fff" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => printReceipt(payment, companyLogo)}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
