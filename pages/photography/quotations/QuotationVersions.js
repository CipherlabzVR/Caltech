import React, { useEffect, useState, useRef } from "react";
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
  Chip,
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
  width: { xs: "calc(100% - 24px)", md: "calc(100% - 48px)", xl: 1200 },
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
};

const valueOf = (source, lower, upper, fallback = "") =>
  source?.[lower] ?? source?.[upper] ?? fallback;

const normalizeSnapshot = (snapshot = {}) => ({
  customerName: valueOf(snapshot, "customerName", "CustomerName"),
  customerMobileNo: valueOf(snapshot, "customerMobileNo", "CustomerMobileNo"),
  eventTypeName: valueOf(snapshot, "eventTypeName", "EventTypeName"),
  eventTime: valueOf(snapshot, "eventTime", "EventTime"),
  eventDate: valueOf(snapshot, "eventDate", "EventDate"),
  venue: valueOf(snapshot, "venue", "Venue"),
  noOfGuests: valueOf(snapshot, "noOfGuests", "NoOfGuests"),
  lines: (valueOf(snapshot, "lines", "Lines", []) || []).map((line) => ({
    packageName: valueOf(line, "packageName", "PackageName"),
    unitPrice: valueOf(line, "unitPrice", "UnitPrice", 0),
    qty: valueOf(line, "qty", "Qty", 1),
    lineTotal: valueOf(
      line,
      "lineTotal",
      "LineTotal",
      Number(line.unitPrice || line.UnitPrice || 0) *
        Number(line.qty || line.Qty || 1),
    ),
    items: (valueOf(line, "items", "Items", []) || []).map((item) => ({
      lineText: valueOf(item, "lineText", "LineText"),
      isIncluded: valueOf(item, "isIncluded", "IsIncluded", true),
    })),
  })),
  addOns: (valueOf(snapshot, "addOns", "AddOns", []) || []).map((addOn) => ({
    name: valueOf(addOn, "name", "Name"),
    price: valueOf(addOn, "price", "Price", 0),
    qty: valueOf(addOn, "qty", "Qty", 1),
    lineTotal: valueOf(
      addOn,
      "lineTotal",
      "LineTotal",
      Number(addOn.price || addOn.Price || 0) *
        Number(addOn.qty || addOn.Qty || 1),
    ),
  })),
  subTotal: valueOf(snapshot, "subTotal", "SubTotal", 0),
  discountAmount: valueOf(snapshot, "discountAmount", "DiscountAmount", 0),
  transportationCost: valueOf(
    snapshot,
    "transportationCost",
    "TransportationCost",
    0,
  ),
  netTotal: valueOf(snapshot, "netTotal", "NetTotal", 0),
  remark: valueOf(snapshot, "remark", "Remark"),
});

const versionDate = (version) =>
  version.savedAt || version.createdOn || version.CreatedOn || "";

const sortVersions = (items) =>
  [...items].sort((a, b) => {
    const dateDifference =
      new Date(versionDate(b)).getTime() - new Date(versionDate(a)).getTime();
    if (Number.isFinite(dateDifference) && dateDifference !== 0)
      return dateDifference;
    return (Number(b.versionNo) || 0) - (Number(a.versionNo) || 0);
  });

export default function QuotationVersions({ quotation, canPrint = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [companyLogo, setCompanyLogo] = useState("");
  const printRef = useRef(null);
  const printIframeRef = useRef(null);

  useEffect(() => {
    const warehouse = localStorage.getItem("warehouse");
    const token = localStorage.getItem("token");
    if (!warehouse || !token) return;

    const fetchCompanyLogo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) return;
        const data = await response.json();
        setCompanyLogo(data.logoUrl || "");
      } catch (error) {
        console.error("Failed to fetch company logo", error);
      }
    };

    fetchCompanyLogo();
  }, []);

  const handlePrint = () => {
    if (!printRef.current) return;

    // Remove any previous print iframe so nothing lingers
    if (printIframeRef.current) {
      printIframeRef.current.remove();
      printIframeRef.current = null;
    }

    const printContent = printRef.current.innerHTML;

    // Hidden iframe instead of window.open — this keeps the print dialog
    // directly over the current page with no second browser window visible
    // behind it.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    printIframeRef.current = iframe;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Quotation - ${quotation.quotationNo} v${selected?.versionNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    doc.close();

    // Give the iframe a tick to render before invoking print, then clean up afterwards
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);

    const cleanup = () => {
      if (printIframeRef.current === iframe) {
        iframe.remove();
        printIframeRef.current = null;
      }
    };
    iframe.contentWindow.onafterprint = cleanup;
    // Fallback in case onafterprint doesn't fire (some browsers on cancel)
    setTimeout(cleanup, 60000);
  };

  const fetchVersions = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    let backendVersions = [];
    try {
      const res = await fetch(
        `${BASE_URL}/PhotographyQuotation/GetQuotationVersions?quotationId=${quotation.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        const result = data?.result ?? data?.Result ?? [];
        backendVersions = Array.isArray(result)
          ? result.map((version) => ({
              ...version,
              source: "backend",
              snapshot: normalizeSnapshot(
                version.snapshot || version.Snapshot || version,
              ),
            }))
          : [];
      } else {
        toast.error(data.message || "Failed to load versions");
      }
    } catch (e) {
      toast.error(e.message || "Failed to load versions");
    } finally {
      let localVersions = [];
      try {
        const stored = JSON.parse(
          localStorage.getItem(`quotation_versions_${quotation.id}`) || "[]",
        );
        localVersions = (Array.isArray(stored) ? stored : []).map(
          (version) => ({
            ...version,
            source: "local",
            snapshot: normalizeSnapshot(version.snapshot),
          }),
        );
      } catch (storageError) {
        toast.error("Unable to read local quotation versions");
      }
      const mergedVersions = sortVersions([
        ...backendVersions,
        ...localVersions,
      ]);
      setVersions(mergedVersions);
      setSelected(mergedVersions[0] || null);
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
        <Box sx={style}>
          <Typography sx={{ fontWeight: 500, fontSize: 16, mb: 1 }}>
            Version History — {quotation.quotationNo}
          </Typography>

          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={4} lg={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  maxHeight: { xs: 320, md: "70vh" },
                  overflowY: "auto",
                }}
              >
                <Typography sx={{ fontWeight: 600, px: 1, py: 1 }}>
                  Versions
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
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>Change</TableCell>
                        <TableCell align="right">View</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Net Total</TableCell>
                        <TableCell>By</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Source</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {versions.map((v) => (
                        <TableRow
                          key={`${v.source}-${v.id}`}
                          selected={
                            selected?.id === v.id &&
                            selected?.source === v.source
                          }
                        >
                          <TableCell>v{v.versionNo}</TableCell>
                          <TableCell>{v.note}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => setSelected(v)}
                              sx={{
                                minWidth: 58,
                                px: 1.5,
                                py: 0.35,
                                textTransform: "none",
                                backgroundColor:
                                  selected?.id === v.id &&
                                  selected?.source === v.source
                                    ? "#1a1a1a"
                                    : "#f0f0f0",
                                color:
                                  selected?.id === v.id &&
                                  selected?.source === v.source
                                    ? "#fff"
                                    : "#1a1a1a",
                                boxShadow: "none",
                                "&:hover": {
                                  backgroundColor: "#333",
                                  color: "#fff",
                                  boxShadow: "none",
                                },
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={v.statusName || "-"}
                              color={
                                v.statusName === "Approved"
                                  ? "success"
                                  : "default"
                              }
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(v.netTotal)}</TableCell>
                          <TableCell>{v.createdByName || "-"}</TableCell>
                          <TableCell>{formatDate(versionDate(v))}</TableCell>
                          <TableCell>
                            {v.source === "local" ? (
                              <Chip
                                size="small"
                                label="Local"
                                color="warning"
                              />
                            ) : (
                              <Chip size="small" label="Server" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={8} lg={9}>
              {snap ? (
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
                      Version {selected.versionNo} Details
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {canPrint && selected?.id === versions[0]?.id && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PrintIcon />}
                          onClick={handlePrint}
                          sx={{
                            bgcolor: "#1a1a1a",
                            "&:hover": { bgcolor: "#000" },
                          }}
                        >
                          Print Quotation
                        </Button>
                      )}
                      <Button variant="outlined" onClick={handleClose}>
                        Close
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  {/* Printable Content — plain HTML + inline styles so it survives
                      innerHTML being copied into the print window unchanged */}
                  <div
                    ref={printRef}
                    style={{
                      fontFamily: "'Helvetica Neue', Arial, sans-serif",
                      color: "#1a1a1a",
                      fontSize: 13,
                      background: "#fff",
                      padding: 16,
                    }}
                  >
                    {/* Brand + heading row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        paddingBottom: 18,
                        marginBottom: 24,
                        borderBottom: "1px solid #cfcfcf",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={companyLogo || "/images/cbass.png"}
                          alt="Company Logo"
                          style={{
                            width: 120,
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    </div>

                    {/* FROM (left) + Quotation For (right) */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 40,
                        paddingBottom: 24,
                        marginBottom: 24,
                        borderBottom: "1px solid #e5e5e5",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            color: "#8a8a8a",
                            marginBottom: 6,
                          }}
                        >
                          From
                        </div>
                        <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                          Beyond Destiny
                        </p>
                        <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                          Phone: 0779944812 / 0779944155
                        </p>
                        <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                          Email: contact@beyonddestinyweddings.com
                        </p>

                        <p
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            margin: "12px 0 2px 0",
                          }}
                        >
                          {snap.eventTypeName || "-"}
                        </p>
                        <p
                          style={{
                            fontSize: 12.5,
                            color: "#444",
                            margin: "0 0 3px 0",
                          }}
                        >
                          {snap.eventTime}
                          {snap.eventTime ? " | " : ""}
                          {formatDate(snap.eventDate)}
                        </p>
                        {snap.venue && (
                          <p
                            style={{
                              fontSize: 12.5,
                              color: "#444",
                              margin: "0 0 3px 0",
                            }}
                          >
                            {snap.venue}
                          </p>
                        )}
                        {snap.noOfGuests && (
                          <p
                            style={{
                              fontSize: 12.5,
                              color: "#444",
                              margin: "0 0 3px 0",
                            }}
                          >
                            Guests: {snap.noOfGuests}
                          </p>
                        )}
                      </div>

                      <div
                        style={{ flex: 1, minWidth: 220, textAlign: "right" }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            color: "#8a8a8a",
                            marginBottom: 6,
                          }}
                        >
                          Quotation For
                        </div>
                        <p
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            margin: "0 0 3px 0",
                          }}
                        >
                          {snap.customerName || "-"}
                        </p>
                        {snap.customerMobileNo && (
                          <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                            Phone: {snap.customerMobileNo}
                          </p>
                        )}

                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                            <span style={{ color: "#8a8a8a" }}>
                              Quotation No:{" "}
                            </span>
                            <strong>{quotation.quotationNo}</strong>
                          </p>
                          <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                            <span style={{ color: "#8a8a8a" }}>Version: </span>
                            <strong>{selected.versionNo}</strong>
                          </p>
                          <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                            <span style={{ color: "#8a8a8a" }}>
                              Issue Date:{" "}
                            </span>
                            <strong>{formatDate(selected.createdOn)}</strong>
                          </p>
                          <p style={{ fontSize: 12.5, margin: "0 0 3px 0" }}>
                            <span style={{ color: "#8a8a8a" }}>Status: </span>
                            <strong>{selected.statusName}</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Line items table */}
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: 20,
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              color: "#6b6b6b",
                              fontWeight: 700,
                              padding: "8px 6px",
                              borderBottom: "1.5px solid #1a1a1a",
                            }}
                          >
                            Package Name
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              color: "#6b6b6b",
                              fontWeight: 700,
                              padding: "8px 6px",
                              borderBottom: "1.5px solid #1a1a1a",
                            }}
                          >
                            Description
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              color: "#6b6b6b",
                              fontWeight: 700,
                              padding: "8px 6px",
                              borderBottom: "1.5px solid #1a1a1a",
                            }}
                          >
                            Unit Price
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              color: "#6b6b6b",
                              fontWeight: 700,
                              padding: "8px 6px",
                              borderBottom: "1.5px solid #1a1a1a",
                            }}
                          >
                            Qty
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              fontSize: 10.5,
                              textTransform: "uppercase",
                              letterSpacing: "0.4px",
                              color: "#6b6b6b",
                              fontWeight: 700,
                              padding: "8px 6px",
                              borderBottom: "1.5px solid #1a1a1a",
                            }}
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(snap.lines || []).map((l, idx) => (
                          <tr key={idx}>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                verticalAlign: "top",
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                {l.packageName}
                              </div>
                            </td>
                            <td>
                              {l.items && l.items.length > 0 && (
                                <ul
                                  style={{
                                    paddingLeft: 14,
                                    margin: "4px 0 0 0",
                                  }}
                                >
                                  {l.items
                                    .filter((i) => i.isIncluded !== false)
                                    .map((item, iIdx) => (
                                      <li
                                        key={iIdx}
                                        style={{
                                          fontSize: 11.5,
                                          color: "#444",
                                          marginBottom: 2,
                                          listStyle: "none",
                                        }}
                                      >
                                        ° {item.lineText}
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                textAlign: "right",
                                verticalAlign: "top",
                              }}
                            >
                              {formatCurrency(l.unitPrice)}
                            </td>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                textAlign: "center",
                                verticalAlign: "top",
                              }}
                            >
                              {l.qty}
                            </td>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                textAlign: "right",
                                verticalAlign: "top",
                              }}
                            >
                              {formatCurrency(l.lineTotal)}
                            </td>
                          </tr>
                        ))}
                        {(snap.addOns || []).map((a, idx) => (
                          <tr key={`addon-${idx}`}>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                              }}
                            >
                              {a.name} (Add-on)
                            </td>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(a.price)}
                            </td>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                textAlign: "center",
                              }}
                            >
                              {a.qty}
                            </td>
                            <td
                              style={{
                                padding: "12px 6px",
                                borderBottom: "1px solid #e5e5e5",
                                fontSize: 12.5,
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(a.lineTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div
                      style={{
                        marginLeft: "auto",
                        width: 280,
                        maxWidth: "100%",
                      }}
                    >
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "8px 6px", fontSize: 12.5 }}>
                              Subtotal
                            </td>
                            <td
                              style={{
                                padding: "8px 6px",
                                fontSize: 12.5,
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(snap.subTotal)}
                            </td>
                          </tr>
                          {snap.discountAmount > 0 && (
                            <tr>
                              <td
                                style={{ padding: "8px 6px", fontSize: 12.5 }}
                              >
                                Discount
                              </td>
                              <td
                                style={{
                                  padding: "8px 6px",
                                  fontSize: 12.5,
                                  textAlign: "right",
                                }}
                              >
                                -{formatCurrency(snap.discountAmount)}
                              </td>
                            </tr>
                          )}
                          {snap.transportationCost > 0 && (
                            <tr>
                              <td
                                style={{ padding: "8px 6px", fontSize: 12.5 }}
                              >
                                Transportation
                              </td>
                              <td
                                style={{
                                  padding: "8px 6px",
                                  fontSize: 12.5,
                                  textAlign: "right",
                                }}
                              >
                                {formatCurrency(snap.transportationCost)}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td
                              style={{
                                padding: "10px 6px 8px",
                                fontSize: 13.5,
                                fontWeight: 700,
                                borderTop: "1.5px solid #1a1a1a",
                              }}
                            >
                              Total
                            </td>
                            <td
                              style={{
                                padding: "10px 6px 8px",
                                fontSize: 13.5,
                                fontWeight: 700,
                                textAlign: "right",
                                borderTop: "1.5px solid #1a1a1a",
                              }}
                            >
                              {formatCurrency(snap.netTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {snap.remark && (
                        <div
                          style={{
                            marginTop: 20,
                            padding: "10px 12px",
                            border: "1px solid #e5e5e5",
                            fontSize: 12,
                            color: "#444",
                          }}
                        >
                          <strong style={{ color: "#1a1a1a" }}>Note:</strong>{" "}
                          {snap.remark}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 40,
                        paddingTop: 16,
                        borderTop: "1px solid #e5e5e5",
                        textAlign: "center",
                        color: "#8a8a8a",
                        fontSize: 11,
                      }}
                    ></div>

                    <div
                      style={{
                        textAlign: "right",
                        marginTop: 20,
                        padding: "10px 12px",
                        color: "#444",
                      }}
                    >
                      <img
                        src="/images/IMG_4685.png"
                        alt=""
                        style={{
                          width: 240,
                          height: "auto",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                </Box>
              ) : null}
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
