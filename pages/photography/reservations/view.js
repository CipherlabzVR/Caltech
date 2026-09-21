import React, { useState } from "react";
import {
  Chip,
  Divider,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendPortalLink from "./send-portal-link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 820, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  maxHeight: "90vh",
  overflowY: "auto",
};

const Section = ({ title, children }) => (
  <>
    <Divider sx={{ my: 1.5 }} />
    <Typography sx={{ fontWeight: "600", mb: 1 }}>{title}</Typography>
    {children}
  </>
);

const Row = ({ label, value }) => (
  <Grid item xs={12} md={6} mt={1}>
    <Typography sx={{ fontSize: "12px", opacity: 0.7 }}>{label}</Typography>
    {typeof value === "object" && value != null ? (
      <Box sx={{ mt: 0.25 }}>{value}</Box>
    ) : (
      <Typography sx={{ fontWeight: "500" }}>{value ?? "-"}</Typography>
    )}
  </Grid>
);

const money = (n) =>
  n == null || n === ""
    ? "-"
    : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ViewReservation({ item }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(item);
  const [history, setHistory] = useState([]);

  const load = () => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    fetch(`${BASE_URL}/PhotographyReservation/GetReservationById?id=${item.id}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.result) setDetail(d.result);
      })
      .catch((e) => toast.error(e.message || ""));

    fetch(`${BASE_URL}/PhotographyReservation/GetStatusHistory?reservationId=${item.id}`, {
      headers,
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.result)) setHistory(d.result);
      })
      .catch(() => {});
  };

  const handleOpen = () => {
    setDetail(item);
    load();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const quotation = detail?.quotation || detail?.Quotation || null;
  const payments = detail?.payments || detail?.Payments || [];
  const photographers = detail?.photographers || detail?.Photographers || [];
  const qLines = quotation?.lines || quotation?.Lines || [];
  const qAddOns = quotation?.addOns || quotation?.AddOns || [];

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleOpen} aria-label="view" size="small">
          <VisibilityIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: "600" }}>
              Reservation {detail.cardNo || detail.CardNo}
            </Typography>
            <Typography sx={{ fontWeight: "500" }}>
              {detail.eventTypeName || detail.EventTypeName}
            </Typography>
          </Box>

          <Section title="Reservation Details">
            <Grid container spacing={1}>
              <Row label="Couple / Client Names" value={detail.coupleNames} />
              <Row label="Customer Mobile / WhatsApp" value={detail.customerMobileNo} />
              <Row
                label="Ceremony Type"
                value={
                  detail.ceremonyTypeName === "Other"
                    ? detail.ceremonyTypeOther || "Other"
                    : detail.ceremonyTypeName
                }
              />
              <Row label="No. of Guests" value={detail.noOfGuests} />
              <Row label="Makeup Artist" value={detail.makeupArtist} />
              <Row label="Assigned Team" value={detail.assignedTeamName} />
              <Row label="Current Status" value={detail.currentStatusName} />
              <Row label="Created On" value={formatDate(detail.createdOn)} />
              <Row label="Remark" value={detail.remark} />
            </Grid>
          </Section>

          <Section title="Events">
            {(detail.events || detail.Events || []).length > 0 ? (
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Main</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detail.events || detail.Events || []).map((e, idx) => (
                    <TableRow key={e.id || idx} sx={{ bgcolor: e.isMainEvent ? "action.selected" : "transparent" }}>
                      <TableCell>{e.eventTypeName || e.EventTypeName || "-"}</TableCell>
                      <TableCell>{formatDate(e.eventDate || e.EventDate)}</TableCell>
                      <TableCell>{e.eventTime || e.EventTime || "-"}</TableCell>
                      <TableCell>{e.location || e.Location || "-"}</TableCell>
                      <TableCell>
                        {(e.isMainEvent || e.IsMainEvent) ? (
                          <Chip size="small" color="primary" label="Main" />
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Grid container spacing={1}>
                <Row label="Event Type" value={detail.eventTypeName} />
                <Row label="Event Date" value={formatDate(detail.eventDate)} />
                <Row label="Event Time" value={detail.eventTime} />
                <Row label="Location" value={detail.receptionLocation} />
              </Grid>
            )}
          </Section>

          <Section title="Photographers">
            {photographers.length > 0 ? (
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Default Team</TableCell>
                    <TableCell>Role in Event</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {photographers.map((p, idx) => (
                    <TableRow key={p.photographerId || p.PhotographerId || idx}>
                      <TableCell>{p.photographerName || p.PhotographerName || "-"}</TableCell>
                      <TableCell>{p.defaultTeamName || p.DefaultTeamName || "-"}</TableCell>
                      <TableCell>{p.roleInEvent || p.RoleInEvent || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Typography sx={{ opacity: 0.7 }}>No photographers assigned</Typography>
            )}
          </Section>

          <Section title="Quotation">
            {!quotation ? (
              <Typography sx={{ opacity: 0.7 }}>No linked quotation</Typography>
            ) : (
              <>
                <Grid container spacing={1}>
                  <Row
                    label="Quotation No"
                    value={quotation.quotationNo || quotation.QuotationNo}
                  />
                  <Row
                    label="Status"
                    value={
                      <Chip
                        size="small"
                        label={quotation.statusName || quotation.StatusName || "-"}
                      />
                    }
                  />
                  <Row label="Sub Total" value={money(quotation.subTotal ?? quotation.SubTotal)} />
                  <Row
                    label="Discount"
                    value={money(quotation.discountAmount ?? quotation.DiscountAmount)}
                  />
                  <Row
                    label="Transportation"
                    value={money(quotation.transportationCost ?? quotation.TransportationCost)}
                  />
                  <Row label="Net Total" value={money(quotation.netTotal ?? quotation.NetTotal)} />
                </Grid>

                {(qLines.length > 0 || qAddOns.length > 0) && (
                  <Table size="small" className="dark-table" sx={{ mt: 1.5 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Unit</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {qLines.map((l) => (
                        <TableRow key={l.id || l.Id}>
                          <TableCell>{l.packageName || l.PackageName}</TableCell>
                          <TableCell align="right">{l.qty ?? l.Qty}</TableCell>
                          <TableCell align="right">{money(l.unitPrice ?? l.UnitPrice)}</TableCell>
                          <TableCell align="right">{money(l.lineTotal ?? l.LineTotal)}</TableCell>
                        </TableRow>
                      ))}
                      {qAddOns.map((a) => (
                        <TableRow key={a.id || a.Id}>
                          <TableCell>{a.name || a.Name} (Add-on)</TableCell>
                          <TableCell align="right">{a.qty ?? a.Qty}</TableCell>
                          <TableCell align="right">{money(a.price ?? a.Price)}</TableCell>
                          <TableCell align="right">{money(a.lineTotal ?? a.LineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </Section>

          <Section title="Payments">
            {payments.length === 0 ? (
              <Typography sx={{ opacity: 0.7 }}>No payments recorded</Typography>
            ) : (
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Payment No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id || p.Id}>
                      <TableCell>{p.paymentNo || p.PaymentNo}</TableCell>
                      <TableCell>{formatDate(p.createdOn || p.CreatedOn)}</TableCell>
                      <TableCell>{p.paymentMethodName || p.PaymentMethodName || "-"}</TableCell>
                      <TableCell>
                        {(p.isAdvance ?? p.IsAdvance) ? "Advance" : "Payment"}
                      </TableCell>
                      <TableCell>{p.approvalStatusName || p.ApprovalStatusName || "-"}</TableCell>
                      <TableCell align="right">{money(p.amount ?? p.Amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>

          <Section title="Status History">
            <Table size="small" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Changed On</TableCell>
                  <TableCell>Remark</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography sx={{ opacity: 0.7 }}>No history</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{h.fromStatusName || "-"}</TableCell>
                      <TableCell>{h.toStatusName || "-"}</TableCell>
                      <TableCell>{formatDate(h.changedOn)}</TableCell>
                      <TableCell>{h.remark || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Section>

          <Box display="flex" mt={2} justifyContent="space-between" alignItems="center">
            <SendPortalLink item={detail} />
            <Button variant="contained" onClick={handleClose} size="small">
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
