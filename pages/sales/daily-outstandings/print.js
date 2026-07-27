import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
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

const REPORT_KEY = "DAILYOUTSTANDING";

const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch (error) {
    return "-";
  }
};

const formatDisplayDateTime = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy hh:mm a");
  } catch (error) {
    return "-";
  }
};

const formatAmount = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return "0.00";
  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const buildLineItemsRows = (customers) => {
  if (!customers || customers.length === 0) {
    return `<tr><td colspan="3" style="text-align:center;padding:16px;">No outstanding customers</td></tr>`;
  }
  return customers
    .map(
      (item, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.customerName || "-")}</td>
        <td class="num">${escapeHtml(formatAmount(item.outstandingAmount))}</td>
      </tr>`
    )
    .join("\n");
};

const applyTemplate = (templateHtml, tokenMap, rowsHtml) => {
  if (!templateHtml) return "";
  let output = templateHtml.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, rowsHtml);
  output = output.replace(/\{\{\s*companyLogo\s*\}\}/gi, tokenMap.companyLogo || "");
  Object.entries(tokenMap).forEach(([key, value]) => {
    if (key === "companyLogo") return;
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    output = output.replace(pattern, escapeHtml(value));
  });

  const printStyle =
    "<style>@page{size:A4;margin:0;}@media print{html,body{margin:0!important;}}</style>";
  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, `${printStyle}</head>`);
  } else {
    output = `${printStyle}${output}`;
  }
  return output;
};

export default function DailyOutstandingPrintPage() {
  const router = useRouter();
  const iframeRef = useRef(null);
  const snapshotDate = router.query.date;

  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warehouseData, setWarehouseData] = useState(null);
  const [sidebarLogo, setSidebarLogo] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [iframeHeight, setIframeHeight] = useState(1123);

  const { companyData } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    if (!router.isReady || !snapshotDate) return;
    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BASE_URL}/Outstanding/GetDailyCustomerOutstandingBreakdown?snapshotDate=${encodeURIComponent(snapshotDate)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const data = await response.json().catch(() => null);
        setBreakdown(data?.result ?? null);
      } catch (error) {
        console.error("Error fetching breakdown:", error);
        toast.error("Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchBreakdown();
  }, [snapshotDate, router.isReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const warehouseId = localStorage.getItem("warehouse");
    const token = localStorage.getItem("token");
    if (!warehouseId || !token) return;

    const fetchWarehouse = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Warehouse/GetWarehouseById?Id=${warehouseId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json().catch(() => null);
        if (response.ok && data?.statusCode === 200) {
          setWarehouseData(data.result);
        }
      } catch (error) {
        console.error("Error fetching warehouse:", error);
      }
    };

    const fetchLogo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${warehouseId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSidebarLogo(data.logoUrl || "");
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    };

    fetchWarehouse();
    fetchLogo();
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BASE_URL}/ReportTemplate/GetReportTemplateByKey?reportKey=${REPORT_KEY}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const data = await response.json().catch(() => null);
        if (response.ok && data?.htmlContent) {
          setTemplateHtml(data.htmlContent);
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      }
    };
    fetchTemplate();
  }, []);

  const companyAddressLines = useMemo(
    () =>
      [
        warehouseData?.addressLine1,
        warehouseData?.addressLine2,
        warehouseData?.addressLine3,
      ].filter(Boolean),
    [warehouseData]
  );

  const companyContactLines = useMemo(() => {
    const phones = [
      warehouseData?.contactNumber,
      warehouseData?.contactNumber2,
      companyData?.contactNumber,
    ].filter((value, index, arr) => value && arr.indexOf(value) === index);
    const lines = [];
    if (phones.length > 0) lines.push(phones.join(" / "));
    if (warehouseData?.email1) lines.push(warehouseData.email1);
    return lines;
  }, [companyData?.contactNumber, warehouseData]);

  const companyLogoSrc =
    sidebarLogo || (ProjectNo === 1 ? "/images/cbass.png" : "/images/db-logo.png");

  const tokenMap = useMemo(
    () => ({
      companyLogo: companyLogoSrc
        ? `<img src="${escapeHtml(companyLogoSrc)}" alt="Company Logo" />`
        : "",
      companyName: companyData?.name || warehouseData?.name || "Company",
      companyAddress: companyAddressLines.join(", "),
      companyContact: companyContactLines.join("  |  "),
      snapshotDate: formatDisplayDateTime(breakdown?.snapshotDate || snapshotDate),
      warehouseName: warehouseData?.name || "-",
      customerCount: breakdown?.customerCount ?? 0,
      totalOutstanding: formatAmount(breakdown?.totalOutstandingAmount),
      generatedOn: formatDisplayDateTime(new Date()),
    }),
    [
      companyLogoSrc,
      companyData?.name,
      warehouseData,
      companyAddressLines,
      companyContactLines,
      breakdown,
      snapshotDate,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !breakdown) return "";
    return applyTemplate(
      templateHtml,
      tokenMap,
      buildLineItemsRows(breakdown?.customers ?? [])
    );
  }, [templateHtml, breakdown, tokenMap]);

  const resizeIframe = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.documentElement) return;
    const height = Math.max(
      doc.documentElement.scrollHeight,
      doc.body ? doc.body.scrollHeight : 0
    );
    if (height > 0) setIframeHeight(height);
  };

  const handleIframeLoad = () => {
    resizeIframe();
    setTimeout(resizeIframe, 300);
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadPDF = async () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      toast.error("Nothing to export yet.");
      return;
    }
    try {
      const target = doc.querySelector(".page") || doc.body;
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const pxPerMm = canvas.width / pageWidthMm;
      const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);
      let renderedHeight = 0;
      let pageIndex = 0;
      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
        const imgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        const sliceHeightMm = sliceHeight / pxPerMm;
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, sliceHeightMm);
        renderedHeight += sliceHeight;
        pageIndex += 1;
      }
      pdf.save(`Daily_Outstanding_${(snapshotDate || "report").slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <style>{`
          @page { size: A4; margin: 0; }
          @media print { html, body { margin: 0 !important; padding: 0 !important; } }
        `}</style>
      </Head>
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
            display: "flex",
            flexDirection: "column",
            "@media print": {
              maxWidth: "100%",
              borderRadius: 0,
              boxShadow: "none",
              paddingX: 0,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              width: "100%",
              mt: 5,
              mb: 1,
              pb: 1,
              borderBottom: "2px solid #e0e0e0",
              "@media print": { display: "none" },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ textTransform: "none" }}
              disabled={!finalHtml}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              sx={{ textTransform: "none" }}
              disabled={!finalHtml}
            >
              Download PDF
            </Button>
          </Box>

          <Box mb={5}>
            {loading ? (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Loading report...
                </Typography>
              </Box>
            ) : finalHtml ? (
              <Box
                component="iframe"
                ref={iframeRef}
                title="Daily Outstanding Report"
                srcDoc={finalHtml}
                onLoad={handleIframeLoad}
                sx={{
                  width: { xs: "100%", sm: "210mm" },
                  maxWidth: "100%",
                  height: `${iframeHeight}px`,
                  margin: "0 auto",
                  border: "none",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  "@media print": { boxShadow: "none", width: "100%" },
                }}
              />
            ) : (
              <Box sx={{ p: 6, textAlign: "center" }}>
                <Typography variant="body2" color="error">
                  No report data available
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <ToastContainer position="top-right" autoClose={3000} />
      </Box>
    </>
  );
}
