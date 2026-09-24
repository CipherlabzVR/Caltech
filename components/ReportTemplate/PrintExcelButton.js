import React from "react";
import Button from "@mui/material/Button";
import GridOnIcon from "@mui/icons-material/GridOn";
import { toast } from "react-toastify";
import exportReportHtmlToExcel from "@/components/ReportTemplate/exportReportHtmlToExcel";

/**
 * Convert-to-Excel action for document and report print pages that do not
 * use TemplatePrintFrame. Prefers the iframe document, then an in-page root.
 */
export default function PrintExcelButton({
  iframeRef,
  contentRef,
  downloadName = "document",
  disabled = false,
}) {
  const resolveSource = () => {
    const iframe = iframeRef?.current;
    const iframeDoc = iframe?.contentDocument;
    const iframeVisible = Boolean(iframe && iframe.getClientRects().length > 0);
    const iframeReady = Boolean(
      iframeVisible &&
        iframeDoc?.body &&
        String(iframeDoc.body.innerHTML || "").trim()
    );
    if (iframeReady) return iframeDoc;
    return contentRef?.current || null;
  };

  const handleClick = async () => {
    try {
      await exportReportHtmlToExcel(resolveSource(), downloadName);
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error(error?.message || "Failed to convert to Excel. Please try again.");
    }
  };

  return (
    <Button
      variant="outlined"
      color="success"
      startIcon={<GridOnIcon />}
      onClick={handleClick}
      disabled={disabled}
      sx={{ textTransform: "none" }}
    >
      Convert to Excel
    </Button>
  );
}
