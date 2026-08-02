import React, { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import { toast } from "react-toastify";

/**
 * Renders a resolved HTML document (tokens already substituted) inside an A4
 * preview iframe with Print and Download PDF actions. Mirrors the behaviour of
 * the sales print pages so every template-based screen looks/behaves the same.
 *
 * Props:
 *  - finalHtml:    fully-rendered HTML string (empty until ready)
 *  - loading:      whether the source document is still loading
 *  - loadingText:  message shown while loading
 *  - errorText:    message shown when not loading and finalHtml is empty
 *  - downloadName: file name (without extension) for the exported PDF
 */
export default function TemplatePrintFrame({
  finalHtml,
  loading,
  loadingText = "Loading...",
  errorText = "Failed to load document",
  downloadName = "document",
  showDownloadPdf = true,
}) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(1123);

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

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, sliceHeightMm);

        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

      pdf.save(`${downloadName}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const placeholderBox = (content) => (
    <Box
      sx={{
        width: { xs: "100%", sm: "210mm" },
        minHeight: "297mm",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {content}
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
            "@media print": { display: "none" },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={loading || !finalHtml}
            sx={{ textTransform: "none" }}
          >
            Print
          </Button>
          {showDownloadPdf ? (
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              disabled={loading || !finalHtml}
              sx={{ textTransform: "none" }}
            >
              Download PDF
            </Button>
          ) : null}
        </Box>

        {loading
          ? placeholderBox(
              <Typography variant="body2" color="text.secondary">
                {loadingText}
              </Typography>
            )
          : finalHtml
          ? (
            <Box
              component="iframe"
              ref={iframeRef}
              title="Print Preview"
              srcDoc={finalHtml}
              onLoad={handleIframeLoad}
              sx={{
                width: { xs: "100%", sm: "210mm" },
                maxWidth: "100%",
                height: `${iframeHeight}px`,
                border: "none",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                "@media print": { boxShadow: "none", width: "100%" },
              }}
            />
          )
          : placeholderBox(
              <Typography variant="body2" color="error">
                {errorText}
              </Typography>
            )}
      </Box>
    </Box>
  );
}
