import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import PrintExcelButton from "@/components/ReportTemplate/PrintExcelButton";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";
import { EMPTY_LINE_ITEMS_HTML } from "@/components/ReportTemplate/lineItemsEditor";
import {
  getPageSizeMm,
  PAGE_ORIENTATION,
  parsePageOrientation,
} from "@/components/ReportTemplate/pageOrientation";

const REPORT_KEY = "CREDITNOTE";

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch (error) {
    return "-";
  }
};

const formatAmount = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const buildCreditNoteLineTokenMap = (note) => ({
  invoiceNumber: note?.invoiceNumber || "-",
  noteType: note?.noteType || "-",
  amount: formatAmount(note?.amount),
});

// Legacy fallback for templates still using {{lineItemsRows}}.
const buildLineItemsRows = (note) => {
  if (!note) return EMPTY_LINE_ITEMS_HTML;
  const t = buildCreditNoteLineTokenMap(note);
  return `<tr>
    <td>${escapeHtml(t.invoiceNumber)}</td>
    <td>${escapeHtml(t.noteType)}</td>
    <td class="num">${escapeHtml(t.amount)}</td>
  </tr>`;
};

export default function CreditNotePrintPage() {
  const router = useRouter();
  const iframeRef = useRef(null);
  const noteId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [noteData, setNoteData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loadingNote, setLoadingNote] = useState(true);
  const [sidebarLogo, setSidebarLogo] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(1123);

  const { companyData } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    if (!router.isReady || !noteId) {
      return;
    }

    const fetchNote = async () => {
      try {
        setLoadingNote(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${BASE_URL}/CreditNote/GetCreditNoteById?id=${noteId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json().catch(() => null);
        const selected = data?.result ?? null;

        if (response.ok && selected) {
          setNoteData(selected);
        } else {
          toast.error(data?.message || "Failed to load Customer Note.");
        }
      } catch (error) {
        console.error("Error fetching Customer Note:", error);
        toast.error("Failed to load Customer Note.");
      } finally {
        setLoadingNote(false);
      }
    };

    fetchNote();
  }, [noteId, router.isReady]);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoadingTemplate(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
        if (response.ok && data) {
          setTemplateHtml(data.htmlContent || "");
        } else {
          toast.error(data?.message || "Failed to load the print template.");
        }
      } catch (error) {
        console.error("Error fetching report template:", error);
        toast.error("Failed to load the print template.");
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouseId = localStorage.getItem("warehouse") || noteData?.warehouseId;
    const token = localStorage.getItem("token");

    if (!warehouseId || !token) {
      return;
    }

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
        console.error("Error fetching warehouse details:", error);
      }
    };

    fetchWarehouse();
  }, [noteData?.warehouseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouse = localStorage.getItem("warehouse") || noteData?.warehouseId;
    const token = localStorage.getItem("token");

    if (!warehouse || !token) {
      return;
    }

    const fetchSidebarLogo = async () => {
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

        if (!response.ok) {
          throw new Error("Failed to fetch company logo");
        }

        const data = await response.json();
        setSidebarLogo(data.logoUrl || "");
      } catch (error) {
        console.error("Error fetching sidebar logo:", error);
        setSidebarLogo("");
      }
    };

    fetchSidebarLogo();
  }, [noteData?.warehouseId]);

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
    const lines = [];
    const phoneNumbers = [
      warehouseData?.contactNumber,
      warehouseData?.contactNumber2,
      warehouseData?.contactNumber3,
      companyData?.contactNumber,
    ].filter((value, index, arr) => value && arr.indexOf(value) === index);

    if (phoneNumbers.length > 0) {
      lines.push(phoneNumbers.join(" / "));
    }

    if (warehouseData?.email1) {
      lines.push(warehouseData.email1);
    }

    return lines;
  }, [companyData?.contactNumber, warehouseData]);

  const customerAddress = useMemo(
    () =>
      [
        noteData?.customerAddressLine1,
        noteData?.customerAddressLine2,
        noteData?.customerAddressLine3,
      ]
        .filter(Boolean)
        .join(", ") || "-",
    [noteData]
  );

  const tokenMap = useMemo(
    () => ({
      companyLogo: sidebarLogo
        ? `<img src="${escapeHtml(sidebarLogo)}" alt="Company Logo" />`
        : "",
      companyName: companyData?.name || warehouseData?.name || "Company",
      companyAddress: companyAddressLines.join(", "),
      companyContact: companyContactLines.join("  |  "),
      documentNo: noteData?.documentNo || documentNumber || "-",
      noteType: noteData?.noteType || "-",
      noteTitle: `${(noteData?.noteType || "Credit").toUpperCase()} NOTE`,
      customerName: noteData?.customerName || "-",
      customerAddress,
      noteDate: formatDisplayDate(noteData?.date || noteData?.createdOn),
      invoiceNumber: noteData?.invoiceNumber || "-",
      salesPerson: noteData?.salesPersonName || "-",
      warehouseName: warehouseData?.name || "-",
      remark: noteData?.remark || "-",
      amount: formatAmount(noteData?.amount),
    }),
    [
      sidebarLogo,
      companyData?.name,
      warehouseData?.name,
      companyAddressLines,
      companyContactLines,
      noteData,
      documentNumber,
      customerAddress,
    ]
  );

  const pageOrientation = useMemo(
    () => parsePageOrientation(templateHtml),
    [templateHtml]
  );
  const pageSizeMm = useMemo(
    () => getPageSizeMm(pageOrientation),
    [pageOrientation]
  );
  const pageWidthCss =
    pageOrientation === PAGE_ORIENTATION.LANDSCAPE ? "297mm" : "210mm";

  const finalHtml = useMemo(() => {
    if (!templateHtml || !noteData) {
      return "";
    }
    const lineTokenMaps = [buildCreditNoteLineTokenMap(noteData)];
    return applyTemplate(templateHtml, tokenMap, buildLineItemsRows(noteData), {
      lineTokenMaps,
      emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
    });
  }, [templateHtml, noteData, tokenMap]);

  const resizeIframe = () => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc || !doc.documentElement) {
      return;
    }
    const height = Math.max(
      doc.documentElement.scrollHeight,
      doc.body ? doc.body.scrollHeight : 0
    );
    if (height > 0) {
      setIframeHeight(height);
    }
  };

  const handleIframeLoad = () => {
    resizeIframe();
    setTimeout(resizeIframe, 300);
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) {
      toast.error("Nothing to export yet.");
      return;
    }

    try {
      const target = doc.querySelector(".page") || doc.body;

      const images = target.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
          });
        })
      );

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: pageOrientation,
      });
      const pageWidthMm = pageSizeMm.widthMm;
      const pageHeightMm = pageSizeMm.heightMm;
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

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, sliceHeightMm);

        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

      pdf.save(
        `CustomerNote_${noteData?.documentNo || documentNumber || "document"}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const isLoading = loadingNote || loadingTemplate;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        "@media print": {
          padding: 0,
          backgroundColor: "#fff",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: pageOrientation === PAGE_ORIENTATION.LANDSCAPE ? "1200px" : "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            mt: 4,
            mb: 2,
            gap: 1,
            flexWrap: "wrap",
            "@media print": {
              display: "none",
            },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={isLoading || !finalHtml}
            sx={{ textTransform: "none" }}
          >
            Print
          </Button>
          <PrintExcelButton
            iframeRef={iframeRef}
            downloadName={`CustomerNote_${noteData?.documentNo || documentNumber || "document"}`}
            disabled={isLoading || !finalHtml}
          />
          {/* <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPDF}
            disabled={isLoading || !finalHtml}
            sx={{ textTransform: "none" }}
          >
            Download PDF
          </Button> */}
        </Box>

        {isLoading ? (
          <Box
            sx={{
              width: { xs: "100%", sm: pageWidthCss },
              minHeight: pageOrientation === PAGE_ORIENTATION.LANDSCAPE ? "210mm" : "297mm",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading Customer Note...
            </Typography>
          </Box>
        ) : finalHtml ? (
          <Box
            component="iframe"
            ref={iframeRef}
            title="Customer Note Print Preview"
            srcDoc={finalHtml}
            onLoad={handleIframeLoad}
            sx={{
              width: { xs: "100%", sm: pageWidthCss },
              maxWidth: "100%",
              height: `${iframeHeight}px`,
              border: "none",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              "@media print": {
                boxShadow: "none",
                width: "100%",
              },
            }}
          />
        ) : (
          <Box
            sx={{
              width: { xs: "100%", sm: pageWidthCss },
              minHeight: pageOrientation === PAGE_ORIENTATION.LANDSCAPE ? "210mm" : "297mm",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="body2" color="error">
              Failed to load Customer Note
            </Typography>
          </Box>
        )}
      </Box>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Box>
  );
}
