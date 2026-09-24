import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Stack,
  Paper,
  Grid,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import PrintIcon from "@mui/icons-material/Print";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

export default function QuotationVersions({ quotation }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selected, setSelected] = useState(null);
  const printRef = useRef(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation - ${quotation.quotationNo} v${selected?.versionNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4F46E5; }
            .company { }
            .company h1 { font-size: 24px; color: #4F46E5; margin-bottom: 5px; }
            .company p { font-size: 12px; color: #666; }
            .quotation-info { text-align: right; }
            .quotation-info h2 { font-size: 28px; color: #4F46E5; margin-bottom: 10px; }
            .quotation-info p { font-size: 12px; color: #666; margin-bottom: 3px; }
            .parties { display: flex; gap: 40px; margin-bottom: 30px; }
            .party { flex: 1; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .party h3 { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 8px; }
            .party p { font-size: 13px; margin-bottom: 3px; }
            .party strong { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #4F46E5; color: white; padding: 12px 10px; text-align: left; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .items { padding-left: 15px; margin-top: 8px; }
            .items li { font-size: 11px; color: #666; margin-bottom: 3px; }
            .totals { margin-left: auto; width: 300px; }
            .totals table { margin-bottom: 0; }
            .totals td { padding: 8px 10px; }
            .totals .total-row { background: #f8f9fa; font-weight: bold; }
            .totals .grand-total { background: #4F46E5; color: white; font-size: 14px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #666; font-size: 11px; }
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const fetchVersions = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/PhotographyQuotation/GetQuotationVersions?quotationId=${quotation.id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        const result = data?.result ?? data?.Result ?? [];
        setVersions(Array.isArray(result) ? result : []);
      } else {
        toast.error(data.message || "Failed to load versions");
      }
    } catch (e) {
      toast.error(e.message || "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setSelected(null);
    setOpen(true);
    fetchVersions();
  };
  const handleClose = () => setOpen(false);

  const snap = selected?.snapshot;

  return (
    <>
      <Tooltip title="Version History" placement="top">
        <IconButton size="small" onClick={handleOpen}>
          <HistoryIcon color="action" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography sx={{ fontWeight: 500, fontSize: 16, mb: 1 }}>
            Version History — {quotation.quotationNo}
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : versions.length === 0 ? (
            <Typography color="text.secondary" py={2}>
              No versions recorded.
            </Typography>
          ) : (
            <Table size="small" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Change</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Net Total</TableCell>
                  <TableCell>By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((v) => (
                  <TableRow key={v.id} selected={selected?.id === v.id}>
                    <TableCell>v{v.versionNo}</TableCell>
                    <TableCell>{v.note}</TableCell>
                    <TableCell>{v.statusName}</TableCell>
                    <TableCell>{formatCurrency(v.netTotal)}</TableCell>
                    <TableCell>{v.createdByName || "-"}</TableCell>
                    <TableCell>{formatDate(v.createdOn)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setSelected(v)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {snap ? (
            <Box mt={2}>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                  📄 Version {selected.versionNo} Details
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ bgcolor: "#4F46E5" }}
                >
                  Print Quotation
                </Button>
              </Stack>

              {/* Printable Content */}
              <Box ref={printRef}>
                <div className="header">
                  <div className="company">
                    <h1>Beyond Destiny</h1>
                    <p>Phone: 0779944812 / 0779944155</p>
                    <p>Email: contact@beyonddestinyweddings.com</p>
                    <p>No 27A, Skelton Road, Bambalapitiya., Sri Lanka</p>
                  </div>
                  <div className="quotation-info">
                    <h2>QUOTATION</h2>
                    <p><strong>Quotation No:</strong> {quotation.quotationNo}</p>
                    <p><strong>Version:</strong> {selected.versionNo}</p>
                    <p><strong>Issue Date:</strong> {formatDate(selected.createdOn)}</p>
                    <p><strong>Status:</strong> {selected.statusName}</p>
                  </div>
                </div>

                <div className="parties">
                  <div className="party">
                    <h3>Quotation For</h3>
                    <p><strong>{snap.customerName}</strong></p>
                    {snap.customerMobileNo && <p>Phone: {snap.customerMobileNo}</p>}
                  </div>
                  <div className="party">
                    <h3>Event Details</h3>
                    <p><strong>{snap.eventTypeName}</strong></p>
                    <p>{snap.eventTime || ""} | {formatDate(snap.eventDate)}</p>
                    {snap.venue && <p>{snap.venue}</p>}
                    {snap.noOfGuests && <p>Guests: {snap.noOfGuests}</p>}
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "50%" }}>Product / Package</th>
                      <th style={{ textAlign: "right" }}>Unit Price</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(snap.lines || []).map((l, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{l.packageName}</strong>
                          {l.items && l.items.length > 0 && (
                            <ul className="items">
                              {l.items.filter(i => i.isIncluded !== false).map((item, iIdx) => (
                                <li key={iIdx}>° {item.lineText}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td style={{ textAlign: "right", verticalAlign: "top" }}>{formatCurrency(l.unitPrice)}</td>
                        <td style={{ textAlign: "center", verticalAlign: "top" }}>{l.qty}</td>
                        <td style={{ textAlign: "right", verticalAlign: "top" }}>{formatCurrency(l.lineTotal)}</td>
                      </tr>
                    ))}
                    {(snap.addOns || []).map((a, idx) => (
                      <tr key={`addon-${idx}`}>
                        <td>{a.name} (Add-on)</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(a.price)}</td>
                        <td style={{ textAlign: "center" }}>{a.qty}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(a.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totals">
                  <table>
                    <tbody>
                      <tr>
                        <td>Subtotal</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(snap.subTotal)}</td>
                      </tr>
                      {snap.discountAmount > 0 && (
                        <tr>
                          <td>Discount</td>
                          <td style={{ textAlign: "right", color: "green" }}>-{formatCurrency(snap.discountAmount)}</td>
                        </tr>
                      )}
                      {snap.transportationCost > 0 && (
                        <tr>
                          <td>Transportation</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(snap.transportationCost)}</td>
                        </tr>
                      )}
                      <tr className="grand-total">
                        <td><strong>Total</strong></td>
                        <td style={{ textAlign: "right" }}><strong>{formatCurrency(snap.netTotal)}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {snap.remark && (
                  <div style={{ marginTop: "20px", padding: "10px", background: "#fef3c7", borderRadius: "4px" }}>
                    <strong>Note:</strong> {snap.remark}
                  </div>
                )}

                <div className="footer">
                  <p>Thank you for choosing Beyond Destiny!</p>
                  <p>This quotation is valid for 30 days from the issue date.</p>
                </div>
              </Box>
            </Box>
          ) : null}

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={handleClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
