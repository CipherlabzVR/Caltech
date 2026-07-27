import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";
import PrintCompanyLogo from "@/components/UIElements/Print/PrintCompanyLogo";
import PrintPoweredByFooter from "@/components/UIElements/Print/PrintPoweredByFooter";

const FIRST_PAGE_ROW_LIMIT = 8;
const NEXT_PAGE_ROW_LIMIT = 14;

// Customizable HTML template key (managed under Report Template > Sales > Sales Quotation Print Template).
const REPORT_KEY = "SALESQUOTATION";

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

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

const formatQty = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "0";
  }

  return Number.isInteger(numericValue)
    ? numericValue.toString()
    : numericValue.toFixed(2);
};

// Builds one <tr> per sales quotation line for the customizable HTML template:
// Product | Code | Qty | Selling Price | Line Total
const buildLineItemsRows = (items) => {
  if (!items || items.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;padding:16px;">No items available</td></tr>`;
  }

  return items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.productName || "-")}</td>
        <td>${escapeHtml(item.productCode || "-")}</td>
        <td class="num">${escapeHtml(formatQty(item.qty))}</td>
        <td class="num">${escapeHtml(formatAmount(item.sellingPrice))}</td>
        <td class="num">${escapeHtml(formatAmount(item.lineTotal))}</td>
      </tr>`
    )
    .join("\n");
};

const applyTemplate = (templateHtml, tokenMap, rowsHtml) => {
  if (!templateHtml) {
    return "";
  }

  let output = templateHtml.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, rowsHtml);
  output = output.replace(/\{\{\s*companyLogo\s*\}\}/gi, tokenMap.companyLogo || "");

  Object.entries(tokenMap).forEach(([key, value]) => {
    if (key === "companyLogo") {
      return;
    }
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    output = output.replace(pattern, escapeHtml(value));
  });

  const printStyle =
    '<style>@page{size:A4;margin:0;}@media print{html,body{margin:0!important;}}</style>';
  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, `${printStyle}</head>`);
  } else {
    output = `${printStyle}${output}`;
  }

  return output;
};

export default function SalesQuotationPrintPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const iframeRef = useRef(null);
  const salesQuotationId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [salesQuotationData, setSalesQuotationData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loadingSalesQuotation, setLoadingSalesQuotation] = useState(true);
  const [sidebarLogo, setSidebarLogo] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [isTemplateCustomized, setIsTemplateCustomized] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(1123);

  const { companyData } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    if (!router.isReady || !salesQuotationId) {
      return;
    }

    const fetchSalesQuotation = async () => {
      try {
        setLoadingSalesQuotation(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${BASE_URL}/SalesQuotation/GetSalesQuotationById?id=${salesQuotationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json().catch(() => null);
        if (response.ok && data?.result) {
          setSalesQuotationData(data.result);
        } else {
          toast.error(data?.message || "Failed to load sales quotation.");
        }
      } catch (error) {
        console.error("Error fetching sales quotation:", error);
        toast.error("Failed to load sales quotation.");
      } finally {
        setLoadingSalesQuotation(false);
      }
    };

    fetchSalesQuotation();
  }, [router.isReady, salesQuotationId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouseId =
      localStorage.getItem("warehouse") || salesQuotationData?.warehouseId;
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
  }, [salesQuotationData?.warehouseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouse =
      localStorage.getItem("warehouse") || salesQuotationData?.warehouseId;
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
  }, [salesQuotationData?.warehouseId]);

  // Load the customizable Sales Quotation HTML template. Only a saved (customized)
  // template overrides the built-in layout; otherwise the default React layout is used.
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
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
        if (response.ok && data && data.isCustomized && data.htmlContent) {
          setTemplateHtml(data.htmlContent);
          setIsTemplateCustomized(true);
        }
      } catch (error) {
        console.error("Error fetching sales quotation report template:", error);
      }
    };

    fetchTemplate();
  }, []);

  const lineItems = salesQuotationData?.salesQuotationLines ?? [];
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

  const quotationPages = useMemo(() => {
    if (lineItems.length === 0) {
      return [[]];
    }

    const pages = [];
    let startIndex = 0;
    pages.push(lineItems.slice(startIndex, startIndex + FIRST_PAGE_ROW_LIMIT));
    startIndex += FIRST_PAGE_ROW_LIMIT;

    while (startIndex < lineItems.length) {
      pages.push(lineItems.slice(startIndex, startIndex + NEXT_PAGE_ROW_LIMIT));
      startIndex += NEXT_PAGE_ROW_LIMIT;
    }

    return pages;
  }, [lineItems]);

  const totalQty = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
    [lineItems]
  );

  const sumLineTotals = useMemo(
    () =>
      lineItems.reduce((sum, item) => sum + Number(item.lineTotal ?? item.LineTotal ?? 0), 0),
    [lineItems]
  );

  const grossHeader = Number(salesQuotationData?.grossTotal ?? salesQuotationData?.GrossTotal ?? 0);
  const rawLineDisc = salesQuotationData?.lineDiscountTotal ?? salesQuotationData?.LineDiscountTotal;
  const lineDiscountFromHeader = Number(rawLineDisc);
  const storedLineDisc =
    Number.isFinite(lineDiscountFromHeader) && !Number.isNaN(lineDiscountFromHeader)
      ? lineDiscountFromHeader
      : 0;
  const derivedLineDisc = Math.max(0, Number((grossHeader - sumLineTotals).toFixed(2)));
  const lineDisc = Math.max(storedLineDisc, derivedLineDisc);
  const merchandiseTotal = Number(sumLineTotals.toFixed(2));
  const orderDiscountAmount = Number(
    salesQuotationData?.orderDiscountAmount ?? salesQuotationData?.OrderDiscountAmount ?? 0
  );
  const orderDiscountPercent = Number(
    salesQuotationData?.orderDiscountPercent ?? salesQuotationData?.OrderDiscountPercent ?? 0
  );
  const finalNetTotal = Number(
    salesQuotationData?.netTotal ?? salesQuotationData?.NetTotal ?? 0
  );

  const showLineDiscountRow = lineDisc >= 0.01;
  const showOrderDiscountRow = orderDiscountAmount >= 0.01;
  const hasStoredLineDiscountColumn =
    Number.isFinite(lineDiscountFromHeader) && !Number.isNaN(lineDiscountFromHeader);
  /** Older quotations: no split columns; one combined discount between subtotal and net. */
  const legacyCombinedDiscount =
    !hasStoredLineDiscountColumn &&
    !showOrderDiscountRow &&
    !showLineDiscountRow &&
    Math.max(0, grossHeader - finalNetTotal) >= 0.01;
  const legacyDiscountAmount = Math.max(0, Number((grossHeader - finalNetTotal).toFixed(2)));
  const showMerchandiseTotalRow =
    showOrderDiscountRow || Math.abs(merchandiseTotal - finalNetTotal) >= 0.01;

  const tokenMap = useMemo(
    () => ({
      companyLogo: sidebarLogo
        ? `<img src="${escapeHtml(sidebarLogo)}" alt="Company Logo" />`
        : "",
      companyName: companyData?.name || warehouseData?.name || "Company",
      companyAddress: companyAddressLines.join(", "),
      companyContact: companyContactLines.join("  |  "),
      documentNo: salesQuotationData?.documentNo || documentNumber || "-",
      customerName: salesQuotationData?.customerName || "-",
      quotationDate: formatDisplayDate(salesQuotationData?.documentDate),
      warehouseName: salesQuotationData?.warehouseName || warehouseData?.name || "-",
      salesPerson: salesQuotationData?.salesPersonName || "-",
      remark: salesQuotationData?.remark || "-",
      totalQty: formatQty(totalQty),
      subTotal: formatAmount(grossHeader),
      netTotal: formatAmount(finalNetTotal),
    }),
    [
      sidebarLogo,
      companyData?.name,
      warehouseData?.name,
      companyAddressLines,
      companyContactLines,
      salesQuotationData,
      documentNumber,
      totalQty,
      grossHeader,
      finalNetTotal,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!isTemplateCustomized || !templateHtml || !salesQuotationData) {
      return "";
    }
    return applyTemplate(templateHtml, tokenMap, buildLineItemsRows(lineItems));
  }, [isTemplateCustomized, templateHtml, salesQuotationData, tokenMap, lineItems]);

  const usingCustomTemplate = Boolean(finalHtml);

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

  const handleDownloadTemplatePDF = async () => {
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

      pdf.save(
        `Sales_Quotation_${salesQuotationData?.documentNo || documentNumber || "document"}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    if (usingCustomTemplate) {
      await handleDownloadTemplatePDF();
      return;
    }

    if (!contentRef.current) {
      return;
    }

    try {
      const pageElements = contentRef.current.querySelectorAll(
        '[data-sales-quotation-pdf-page="true"]'
      );

      if (pageElements.length === 0) {
        toast.error("No printable pages found.");
        return;
      }

      const images = contentRef.current.querySelectorAll("img");
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

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      for (let index = 0; index < pageElements.length; index += 1) {
        const canvas = await html2canvas(pageElements[index], {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        if (index > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      pdf.save(
        `Sales_Quotation_${salesQuotationData?.documentNo || documentNumber || "document"}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    if (usingCustomTemplate && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
      return;
    }
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const renderTable = (items, isLastPage) => (
    <Box sx={{ mb: { xs: 2, sm: 3 }, borderTop: "2px solid #333", borderBottom: "2px solid #333" }}>
      <Box
        sx={{
          display: "flex",
          padding: { xs: "6px 4px", sm: "10px 6px" },
          fontWeight: 600,
          borderBottom: "1px solid #333",
          color: "black",
        }}
      >
        <Box sx={{ flex: 2, fontSize: { xs: "0.52rem", sm: "0.78rem" } }}>Product</Box>
        <Box sx={{ flex: 1.4, fontSize: { xs: "0.52rem", sm: "0.78rem" } }}>Code</Box>
        <Box sx={{ flex: 1, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.78rem" } }}>Qty</Box>
        <Box sx={{ flex: 1.2, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.78rem" } }}>Selling Price</Box>
        <Box sx={{ flex: 1.2, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.78rem" } }}>Line Total</Box>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ padding: "16px" }}>
          <Typography sx={{ textAlign: "center", fontSize: { xs: "0.58rem", sm: "0.82rem" } }}>
            No items available
          </Typography>
        </Box>
      ) : (
        items.map((item, index) => (
          <Box
            key={item.id || `${item.productCode}-${index}`}
            sx={{
              display: "flex",
              padding: { xs: "5px 4px", sm: "8px 6px" },
              borderBottom: index === items.length - 1 ? "none" : "1px solid #cfcfcf",
            }}
          >
            <Box sx={{ flex: 2, fontSize: { xs: "0.52rem", sm: "0.76rem" } }}>
              {item.productName || "-"}
            </Box>
            <Box sx={{ flex: 1.4, fontSize: { xs: "0.52rem", sm: "0.76rem" } }}>
              {item.productCode || "-"}
            </Box>
            <Box sx={{ flex: 1, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.76rem" } }}>
              {formatQty(item.qty)}
            </Box>
            <Box sx={{ flex: 1.2, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.76rem" } }}>
              {formatAmount(item.sellingPrice)}
            </Box>
            <Box sx={{ flex: 1.2, textAlign: "right", fontSize: { xs: "0.52rem", sm: "0.76rem" }, fontWeight: 600 }}>
              {formatAmount(item.lineTotal)}
            </Box>
          </Box>
        ))
      )}

      {isLastPage && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #333", p: { xs: "8px 4px", sm: "10px 6px" } }}>
          <Box sx={{ width: { xs: "60%", sm: "35%" } }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 700 }}>Sub Total</Typography>
              <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 700 }}>
                {formatAmount(grossHeader)}
              </Typography>
            </Box>
            {showLineDiscountRow && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>Line Discount</Typography>
                <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>
                  {formatAmount(lineDisc)}
                </Typography>
              </Box>
            )}
            {showMerchandiseTotalRow && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>Total</Typography>
                <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>
                  {formatAmount(merchandiseTotal)}
                </Typography>
              </Box>
            )}
            {showOrderDiscountRow && (
              <>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>
                    Order Discount ({Number(orderDiscountPercent.toFixed(2))}%)
                  </Typography>
                  <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>
                    {formatAmount(orderDiscountAmount)}
                  </Typography>
                </Box>
              </>
            )}
            {legacyCombinedDiscount && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>Discount</Typography>
                <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.8rem" }, fontWeight: 600 }}>
                  {formatAmount(legacyDiscountAmount)}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" pt={0.5} borderTop="2px solid #333">
              <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.84rem" }, fontWeight: 700 }}>Gross Total</Typography>
              <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.84rem" }, fontWeight: 700 }}>
                {formatAmount(finalNetTotal)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderPageContent = (items, pageIndex, isLastPage) => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          gap: { xs: 1.5, sm: 3 },
          mb: { xs: 2, sm: 3 },
          pb: 2,
        }}
      >
        <PrintCompanyLogo src={sidebarLogo} />
        <Box sx={{ flex: 1, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, lineHeight: 1.2 }}>
            {companyData?.name || warehouseData?.name || "Company"}
          </Typography>
          {companyAddressLines.map((line) => (
            <Typography key={line} sx={{ fontSize: { xs: "0.62rem", sm: "0.82rem" }, lineHeight: 1.3 }}>
              {line}
            </Typography>
          ))}
          {companyContactLines.map((line) => (
            <Typography key={line} sx={{ fontSize: { xs: "0.62rem", sm: "0.82rem" }, lineHeight: 1.3, fontWeight: 600 }}>
              {line}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ borderTop: "2px solid #333", borderBottom: "2px solid #333", py: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: "bold", textAlign: "center", fontSize: { xs: "1rem", sm: "1.5rem" }, lineHeight: 1.2 }}>
          {pageIndex === 0 ? "SALES QUOTATION" : "SALES QUOTATION (CONT.)"}
        </Typography>
      </Box>

      {pageIndex === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: { xs: 2, sm: 2.5 },
            flexDirection: { xs: "column", sm: "row" },
            gap: 4,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {[
              ["Customer", salesQuotationData?.customerName || "-"],
              ["Quotation No", salesQuotationData?.documentNo || documentNumber || "-"],
              ["Quotation Date", formatDisplayDate(salesQuotationData?.documentDate)],
              ["Qty", formatQty(totalQty)],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "120px 12px 1fr", sm: "140px 16px 1fr" }, alignItems: "start", mb: 1, columnGap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>:</Typography>
                <Typography sx={{ fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1 }}>
            {[
              ["Warehouse", salesQuotationData?.warehouseName || warehouseData?.name || "-"],
              ["Sales Person", salesQuotationData?.salesPersonName || "-"],
              ["Remark", salesQuotationData?.remark || "-"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "120px 12px 1fr", sm: "130px 16px 1fr" }, alignItems: "start", mb: 1, columnGap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>:</Typography>
                <Typography sx={{ fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {renderTable(items, isLastPage)}
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
        "@media print": {
          padding: 0,
          backgroundColor: "#fff",
        },
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
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: 1,
            paddingBottom: 1,
            borderBottom: "2px solid #e0e0e0",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
            "@media print": {
              display: "none",
            },
          }}
          mt={5}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "stretch", sm: "flex-end" }, gap: 1 }}>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ textTransform: "none" }}>
                Print
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF} sx={{ textTransform: "none" }}>
                Download PDF
              </Button>
            </Box>
          </Box>
        </Box>

        <Box mb={5} ref={contentRef}>
          {loadingSalesQuotation ? (
            <Box
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading sales quotation...
              </Typography>
            </Box>
          ) : salesQuotationData ? (
            usingCustomTemplate ? (
              <Box
                component="iframe"
                ref={iframeRef}
                title="Sales Quotation Print Preview"
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
                  "@media print": {
                    boxShadow: "none",
                    width: "100%",
                  },
                }}
              />
            ) : (
            quotationPages.map((items, pageIndex) => {
              const isLastPage = pageIndex === quotationPages.length - 1;

              return (
                <Box
                  key={`sales-quotation-page-${pageIndex}`}
                  data-sales-quotation-pdf-page="true"
                  sx={{
                    width: { xs: "100%", sm: "210mm" },
                    minHeight: { xs: "auto", sm: "297mm" },
                    maxWidth: "100%",
                    margin: "0 auto",
                    marginBottom: { xs: 2, sm: isLastPage ? 0 : 4 },
                    position: "relative",
                    backgroundColor: "white",
                    padding: "0.5in",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    pageBreakAfter: isLastPage ? "auto" : "always",
                    breakAfter: isLastPage ? "auto" : "page",
                    "@media print": {
                      margin: 0,
                      marginBottom: 0,
                      boxShadow: "none",
                      padding: "0.5in",
                      boxSizing: "border-box",
                      pageBreakAfter: isLastPage ? "auto" : "always",
                      breakAfter: isLastPage ? "auto" : "page",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", mx: "auto", boxSizing: "border-box", backgroundColor: "transparent", flex: 1 }}>
                    {renderPageContent(items, pageIndex, isLastPage)}
                  </Box>
                  <PrintPoweredByFooter />
                </Box>
              );
            })
            )
          ) : (
            <Box
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="body2" color="error">
                Failed to load sales quotation
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
    </Box>
  );
}
