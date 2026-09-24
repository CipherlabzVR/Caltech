import React, { useRef } from "react";
import { IconButton, Tooltip } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";

export default function PrintReceipt({ payment }) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.paymentNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #10B981; }
            .header h1 { font-size: 28px; color: #10B981; margin-bottom: 5px; }
            .header .subtitle { font-size: 14px; color: #666; }
            
            .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .receipt-box { padding: 15px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10B981; }
            .receipt-box h2 { font-size: 24px; color: #10B981; margin-bottom: 5px; }
            .receipt-box p { font-size: 12px; color: #666; margin-bottom: 3px; }
            
            .parties { display: flex; gap: 30px; margin-bottom: 30px; }
            .party { flex: 1; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .party h3 { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }
            .party p { font-size: 13px; margin-bottom: 5px; }
            .party strong { color: #333; font-size: 16px; }
            
            .payment-details { background: #fff; border: 2px solid #10B981; border-radius: 12px; overflow: hidden; margin-bottom: 30px; }
            .payment-details-header { background: #10B981; color: white; padding: 15px 20px; }
            .payment-details-header h3 { font-size: 16px; margin: 0; }
            .payment-details-body { padding: 20px; }
            
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-row .label { color: #666; font-size: 14px; }
            .detail-row .value { font-weight: 600; font-size: 14px; }
            
            .amount-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
            .amount-box .label { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
            .amount-box .amount { font-size: 36px; font-weight: 800; }
            .amount-box .status { display: inline-block; margin-top: 10px; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 12px; }
            
            .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-row.total { border-top: 2px solid #10B981; margin-top: 10px; padding-top: 15px; font-size: 16px; font-weight: 700; }
            
            .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e2e8f0; }
            .footer p { font-size: 12px; color: #666; margin-bottom: 5px; }
            .footer .company { font-weight: 600; color: #10B981; margin-bottom: 10px; }
            .footer .contact { font-size: 11px; }
            
            .stamp { display: inline-block; border: 3px solid #10B981; color: #10B981; padding: 10px 25px; border-radius: 8px; font-weight: 800; font-size: 18px; transform: rotate(-5deg); margin: 20px 0; }
            
            @media print { 
              body { padding: 20px; }
              .amount-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PAYMENT RECEIPT</h1>
            <p class="subtitle">Beyond Destiny Photography</p>
          </div>
          
          <div class="receipt-info">
            <div class="receipt-box">
              <h2>${payment.paymentNo}</h2>
              <p><strong>Receipt No</strong></p>
              <p>Date: ${formatDate(payment.approvedOn || payment.createdOn)}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Quotation:</strong> ${payment.quotationNo}</p>
              <p><strong>Event Date:</strong> ${formatDate(payment.eventDate)}</p>
              ${payment.venue ? `<p><strong>Venue:</strong> ${payment.venue}</p>` : ""}
            </div>
          </div>
          
          <div class="parties">
            <div class="party">
              <h3>Received From</h3>
              <p><strong>${payment.customerName}</strong></p>
              ${payment.customerMobileNo ? `<p>📞 ${payment.customerMobileNo}</p>` : ""}
            </div>
            <div class="party">
              <h3>Event Details</h3>
              <p><strong>${payment.eventTypeName}</strong></p>
              <p>📅 ${formatDate(payment.eventDate)}</p>
              ${payment.venue ? `<p>📍 ${payment.venue}</p>` : ""}
            </div>
          </div>
          
          <div class="amount-box">
            <p class="label">Amount Received</p>
            <p class="amount">${formatCurrency(payment.amount)}</p>
            <span class="status">✓ ${payment.isAdvance ? "ADVANCE PAYMENT" : "PAYMENT"}</span>
          </div>
          
          <div class="payment-details">
            <div class="payment-details-header">
              <h3>Payment Details</h3>
            </div>
            <div class="payment-details-body">
              <div class="detail-row">
                <span class="label">Payment Method</span>
                <span class="value">${payment.paymentMethodName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Type</span>
                <span class="value">${payment.isAdvance ? "Advance Payment" : "Balance Payment"}</span>
              </div>
              <div class="detail-row">
                <span class="label">Quotation Total</span>
                <span class="value">${formatCurrency(payment.quotationNetTotal)}</span>
              </div>
              <div class="detail-row">
                <span class="label">This Payment</span>
                <span class="value" style="color: #10B981; font-size: 16px;">${formatCurrency(payment.amount)}</span>
              </div>
              ${payment.remark ? `
              <div class="detail-row">
                <span class="label">Remarks</span>
                <span class="value">${payment.remark}</span>
              </div>
              ` : ""}
            </div>
          </div>
          
          <div style="text-align: center;">
            <div class="stamp">PAID</div>
          </div>
          
          <div class="footer">
            <p class="company">Beyond Destiny Photography</p>
            <p class="contact">📞 0779944812 / 0779944155 | ✉️ contact@beyonddestinyweddings.com</p>
            <p class="contact">No 27A, Skelton Road, Bambalapitiya, Sri Lanka</p>
            <p style="margin-top: 15px; font-style: italic;">Thank you for your payment!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Tooltip title="Print Receipt" placement="top">
      <IconButton size="small" onClick={handlePrint} sx={{ color: "#10B981" }}>
        <PrintIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
