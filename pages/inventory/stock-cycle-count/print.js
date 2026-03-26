import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import BASE_URL from "Base/api";
import { ProjectNo } from "Base/catelogue";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";

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

const formatQty = (value) => {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0";
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
};

export default function StockCycleCountPrintPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const id = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarLogo, setSidebarLogo] = useState("");
  const [stockTransactionReport, setStockTransactionReport] = useState([]);

  const { companyData } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    if (!router.isReady || !id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(
          `${BASE_URL}/StockCycleCount/GetStockCycleCountById?id=${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const json = await response.json().catch(() => null);
        if (response.ok && json?.result) {
          setData(json.result);
        } else {
          toast.error(json?.message || "Failed to load Stock Cycle Count.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Stock Cycle Count.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router.isReady]);

  useEffect(() => {
    if (!data?.startDate || !id) return;
    const fromDate = format(new Date(data.startDate), "yyyy-MM-dd");
    const endDate = data.endDate ? format(new Date(data.endDate), "yyyy-MM-dd") : fromDate;
    const warehouse = typeof window !== "undefined" ? localStorage.getItem("warehouse") : null;

    const fetchReport = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const params = new URLSearchParams({ fromDate, toDate: endDate, stockCycleCountId: id });
        if (warehouse && warehouse !== "null") params.set("warehouseId", warehouse);
        const response = await fetch(
          `${BASE_URL}/StockTransactionsHistory/GetStockTransactionReportByPeriod?${params}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!response.ok) return;
        const json = await response.json().catch(() => null);
        const result = json?.result ?? json?.data ?? [];
        setStockTransactionReport(Array.isArray(result) ? result : []);
      } catch {
        setStockTransactionReport([]);
      }
    };
    fetchReport();
  }, [id, data?.startDate, data?.endDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const warehouse = localStorage.getItem("warehouse");
    const token = localStorage.getItem("token");
    if (!warehouse || !token) return;

    const fetchLogo = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouse}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const d = await res.json();
          setSidebarLogo(d.logoUrl || "");
        }
      } catch {
        setSidebarLogo("");
      }
    };
    fetchLogo();
  }, []);

  const lineItems = data?.stockCycleCountLineDetails ?? data?.StockCycleCountLineDetails ?? [];
  const getReportByProductId = (productId) =>
    stockTransactionReport.filter((p) => p.productId === productId);

  const companyLogoSrc = sidebarLogo || (ProjectNo === 1 ? "/images/cbass.png" : "/images/db-logo.png");

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    try {
      const pageElements = contentRef.current.querySelectorAll('[data-scc-pdf-page="true"]');
      if (pageElements.length === 0) {
        toast.error("No printable pages found.");
        return;
      }
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      for (let i = 0; i < pageElements.length; i++) {
        const canvas = await html2canvas(pageElements[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }
      pdf.save(`StockCycleCount_${data?.documentNo || documentNumber || "document"}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to download PDF.");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const renderTable = () => (
    <Box sx={{ mb: 2, borderTop: "2px solid #333", borderBottom: "2px solid #333" }}>
      <Box
        sx={{
          display: "flex",
          padding: "10px 6px",
          fontWeight: 600,
          borderBottom: "1px solid #333",
          color: "black",
          fontSize: "0.74rem",
        }}
      >
        <Box sx={{ flex: 0.5 }}>#</Box>
        <Box sx={{ flex: 1.5 }}>Code</Box>
        <Box sx={{ flex: 3 }}>Product Name</Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>Stock Start</Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>Stock End</Box>
      </Box>
      {lineItems.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography sx={{ textAlign: "center", fontSize: "0.82rem" }}>No items</Typography>
        </Box>
      ) : (
        lineItems.map((item, idx) => (
          <Box
            key={item.id || idx}
            sx={{
              display: "flex",
              padding: "8px 6px",
              borderBottom: idx === lineItems.length - 1 ? "none" : "1px solid #cfcfcf",
              fontSize: "0.72rem",
            }}
          >
            <Box sx={{ flex: 0.5 }}>{idx + 1}</Box>
            <Box sx={{ flex: 1.5 }}>{item.productCode ?? item.ProductCode ?? "-"}</Box>
            <Box sx={{ flex: 3 }}>{item.productName ?? item.ProductName ?? "-"}</Box>
            <Box sx={{ flex: 1, textAlign: "right" }}>{formatQty(item.stockForStartDate ?? item.StockForStartDate)}</Box>
            <Box sx={{ flex: 1, textAlign: "right" }}>{formatQty(item.stockForEndDate ?? item.StockForEndDate)}</Box>
          </Box>
        ))
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        "@media print": { padding: 0, backgroundColor: "#fff" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          paddingX: 2,
          "@media print": { maxWidth: "100%", borderRadius: 0, boxShadow: "none", paddingX: 0 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: 1,
            paddingBottom: 1,
            borderBottom: "2px solid #e0e0e0",
            gap: 1,
            "@media print": { display: "none" },
          }}
          mt={5}
        >
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ textTransform: "none" }}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF} sx={{ textTransform: "none" }}>
            Download PDF
          </Button>
        </Box>

        <Box mb={5} ref={contentRef}>
          {loading ? (
            <Box sx={{ minHeight: 200, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : data ? (
            <Box
              data-scc-pdf-page="true"
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                padding: "0.5in",
                boxSizing: "border-box",
                backgroundColor: "white",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box sx={{ width: "135px" }}>
                  <img src={companyLogoSrc} alt="Logo" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.25rem" }}>{companyData?.name || "Company"}</Typography>
                </Box>
              </Box>

              <Box sx={{ borderTop: "2px solid #333", borderBottom: "2px solid #333", py: 1, mb: 2 }}>
                <Typography sx={{ fontWeight: "bold", textAlign: "center", fontSize: "1.5rem" }}>
                  STOCK CYCLE COUNT
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
                <Box>
                  {[
                    ["Document No", data.documentNo ?? documentNumber ?? "-"],
                    ["Start Date", formatDisplayDate(data.startDate ?? data.StartDate)],
                    ["End Date", formatDisplayDate(data.endDate ?? data.EndDate)],
                    ["Remark", data.remark ?? data.Remark ?? "-"],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ display: "grid", gridTemplateColumns: "120px 12px 1fr", alignItems: "start", mb: 1, columnGap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>{label}</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>:</Typography>
                      <Typography sx={{ fontSize: "0.86rem" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  {[
                    ["Created Date", formatDisplayDateTime(data.createdOn)],
                  ].map(([label, value]) => (
                    <Box key={label} sx={{ display: "grid", gridTemplateColumns: "120px 12px 1fr", alignItems: "start", mb: 1, columnGap: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>{label}</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.86rem" }}>:</Typography>
                      <Typography sx={{ fontSize: "0.86rem" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {renderTable()}

              {lineItems.length > 0 && stockTransactionReport.length > 0 && (
                <>
                  <Typography sx={{ mt: 3, mb: 1.5, fontWeight: 700, fontSize: "1rem" }}>
                    Stock Transaction Details
                  </Typography>
                  {lineItems.map((line, lineIdx) => {
                    const productId = line.productId ?? line.ProductId;
                    const reportEntries = getReportByProductId(productId);
                    const allTransactions = reportEntries.flatMap((e) => e.transactions ?? []).sort(
                      (a, b) => new Date(a.date || 0) - new Date(b.date || 0)
                    );
                    const startStock = line.stockForStartDate ?? line.StockForStartDate ?? 0;
                    const endStock = line.stockForEndDate ?? line.StockForEndDate ?? 0;
                    const actualQty =
                      Number(startStock) +
                      (allTransactions?.reduce((sum, t) => sum + Number(t.qtyIn ?? 0) - Number(t.qtyOut ?? 0), 0) ?? 0);
                    const enteredQty = Number(endStock) || 0;
                    const diffQty = actualQty - enteredQty;
                    return (
                      <Box key={line.id ?? lineIdx} sx={{ mb: 2.5, border: "1px solid #ddd", borderRadius: 1, overflow: "hidden" }}>
                        <Box sx={{ px: 1.5, py: 1, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd", fontSize: "0.8rem", fontWeight: 600 }}>
                          {line.productCode ?? line.ProductCode} - {line.productName ?? line.ProductName}
                        </Box>
                        <Box sx={{ borderTop: "1px solid #eee" }}>
                          <Box sx={{ display: "flex", padding: "6px 8px", fontWeight: 600, borderBottom: "1px solid #ddd", fontSize: "0.7rem" }}>
                            <Box sx={{ flex: 1.2 }}>Date</Box>
                            <Box sx={{ flex: 1 }}>Doc No</Box>
                            <Box sx={{ flex: 1 }}>Type</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>In</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>Out</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>Balance</Box>
                          </Box>
                          <Box sx={{ display: "flex", padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "0.72rem", fontWeight: 600, alignItems: "center" }}>
                            <Box sx={{ flex: 1.2 }}>Start Stock</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>{formatQty(startStock)}</Box>
                          </Box>
                          {allTransactions.length === 0 ? (
                            <Box sx={{ p: 1.5, fontSize: "0.72rem", color: "text.secondary" }}>No transactions in period</Box>
                          ) : (
                            (() => {
                              let runningBalance = Number(startStock) || 0;
                              return allTransactions.map((tx, idx) => {
                                const qtyOut = Number(tx.qtyOut ?? 0);
                                const qtyIn = Number(tx.qtyIn ?? 0);
                                runningBalance += qtyIn - qtyOut;
                                return (
                                  <Box key={idx} sx={{ display: "flex", padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "0.68rem", alignItems: "center" }}>
                                    <Box sx={{ flex: 1.2 }}>{tx.date ? formatDisplayDateTime(tx.date) : "-"}</Box>
                                    <Box sx={{ flex: 1 }}>{tx.documentNo ?? "-"}</Box>
                                    <Box sx={{ flex: 1 }}>{tx.transactionTypeName ?? "-"}</Box>
                                    <Box sx={{ flex: 0.5, textAlign: "right" }}>{qtyIn > 0 ? formatQty(qtyIn) : "-"}</Box>
                                    <Box sx={{ flex: 0.5, textAlign: "right" }}>{qtyOut > 0 ? formatQty(qtyOut) : "-"}</Box>
                                    <Box sx={{ flex: 0.5, textAlign: "right" }}>{formatQty(runningBalance)}</Box>
                                  </Box>
                                );
                              });
                            })()
                          )}
                          <Box sx={{ display: "flex", padding: "5px 8px", borderTop: "1px solid #ddd", fontSize: "0.72rem", fontWeight: 600, alignItems: "center" }}>
                            <Box sx={{ flex: 1.2 }}>Stock Total</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>{formatQty(actualQty)}</Box>
                          </Box>
                          <Box sx={{ display: "flex", padding: "5px 8px", borderBottom: "1px solid #eee", fontSize: "0.72rem", fontWeight: 600, alignItems: "center" }}>
                            <Box sx={{ flex: 1.2 }}>End Stock</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>{formatQty(enteredQty)}</Box>
                          </Box>
                          <Box sx={{ display: "flex", padding: "5px 8px", borderBottom: "1px solid #ddd", fontSize: "0.72rem", fontWeight: 600, alignItems: "center" }}>
                            <Box sx={{ flex: 1.2 }}>Difference</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 1 }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>-</Box>
                            <Box sx={{ flex: 0.5, textAlign: "right" }}>{diffQty >= 0 ? "+" : ""}{formatQty(diffQty)}</Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </>
              )}

              <Typography sx={{ mt: 2, pt: 1, borderTop: "1px solid #d9d9d9", textAlign: "center", fontSize: "0.8rem", fontWeight: 600 }}>
                Powered By : CBASS-AI
              </Typography>
            </Box>
          ) : (
            <Box sx={{ minHeight: 200, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Typography color="error">Failed to load Stock Cycle Count</Typography>
            </Box>
          )}
        </Box>

        <ToastContainer position="top-right" autoClose={3000} />
      </Box>
    </Box>
  );
}
