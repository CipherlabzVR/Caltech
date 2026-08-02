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

const REPORT_KEY = "GRN";

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

const formatDisplayDateTime = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd-MMM-yyyy hh:mm:ssa");
  } catch (error) {
    return "-";
  }
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

const getUserLabel = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  user?.userName ||
  user?.email ||
  (user?.id != null ? `User #${user.id}` : "-");

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

// Per-unit freight duty: prefer persisted AdditionalCost, else derive from line math.
const getFreightDutyCost = (item) => {
  const stored = Number(item?.additionalCost);
  if (Number.isFinite(stored) && Math.abs(stored) > 0.0001) {
    return stored;
  }

  const qty = Number(item?.qty) || 0;
  const free = Number(item?.free) || 0;
  const unitPrice = Number(item?.unitPrice) || 0;
  const lineTotal = Number(item?.lineTotal) || 0;
  const discountRate = Number(item?.discountRate) || 0;
  const lineDiscountAmount = (unitPrice * qty * discountRate) / 100;
  const qtyPlusFree = qty + free;

  if (qty > 0 && free === 0) {
    return (lineTotal - unitPrice * qty + lineDiscountAmount) / qty;
  }

  const costPrice = Number(item?.costPrice) || 0;
  if (costPrice > 0 && qtyPlusFree > 0) {
    return costPrice - (unitPrice * qty - lineDiscountAmount) / qtyPlusFree;
  }

  return Number.isFinite(stored) ? stored : 0;
};

// Ensures older DB templates (without this column) still show a Freight Duty header.
const ensureFreightDutyColumnHeader = (html) => {
  if (!html || /<th[^>]*>\s*Freight\s*Duty/i.test(html)) {
    return html;
  }
  return html.replace(
    /(<th[^>]*>\s*Unit\s*Price\s*<\/th>)/i,
    `$1\n          <th class="num">Freight Duty</th>`
  );
};

// Ensures older DB templates still show Freight Duty Total in the footer.
const ensureFreightDutyTotalRow = (html) => {
  if (
    !html ||
    /\{\{\s*freightDutyTotal\s*\}\}/i.test(html) ||
    /Freight\s*Duty\s*Total/i.test(html)
  ) {
    return html;
  }
  return html.replace(
    /(<div class=["']totals["']>\s*)(<div class=["']row["']>\s*<span>\s*Total\s*<\/span>)/i,
    `$1<div class="row"><span>Freight Duty Total</span><span>{{freightDutyTotal}}</span></div>\n      $2`
  );
};

// Builds one <tr> per GRN line, matching the template table columns:
// Item | Batch | Exp. Date | Qty | Free | Unit Price | Freight Duty | Dis% | Selling | Line Total
const buildLineItemsRows = (items) => {
  if (!items || items.length === 0) {
    return `<tr><td colspan="10" style="text-align:center;padding:16px;">No items available</td></tr>`;
  }

  return items
    .map((item) => {
      const productName = escapeHtml(item.productName || "-");
      const productCode = item.productCode
        ? `<br/><span style="color:#666;">${escapeHtml(item.productCode)}</span>`
        : "";
      return `<tr>
        <td>${productName}${productCode}</td>
        <td>${escapeHtml(item.batch || "-")}</td>
        <td>${escapeHtml(formatDisplayDate(item.expDate))}</td>
        <td class="num">${escapeHtml(formatQty(item.qty))}</td>
        <td class="num">${escapeHtml(formatQty(item.free))}</td>
        <td class="num">${escapeHtml(formatAmount(item.unitPrice))}</td>
        <td class="num">${escapeHtml(formatAmount(getFreightDutyCost(item)))}</td>
        <td class="num">${escapeHtml(formatAmount(item.discountRate))}</td>
        <td class="num">${escapeHtml(formatAmount(item.sellingPrice))}</td>
        <td class="num">${escapeHtml(formatAmount(item.lineTotal))}</td>
      </tr>`;
    })
    .join("\n");
};

// Replaces {{tokens}} in the template HTML with live document data.
// `lineItemsRows` and `companyLogo` are injected as raw HTML; everything else is escaped.
const applyTemplate = (templateHtml, tokenMap, rowsHtml) => {
  if (!templateHtml) {
    return "";
  }

  let output = ensureFreightDutyColumnHeader(templateHtml);
  output = ensureFreightDutyTotalRow(output);
  output = output.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, rowsHtml);
  output = output.replace(/\{\{\s*companyLogo\s*\}\}/gi, tokenMap.companyLogo || "");

  Object.entries(tokenMap).forEach(([key, value]) => {
    if (key === "companyLogo") {
      return;
    }
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    output = output.replace(pattern, escapeHtml(value));
  });

  // Ensure clean A4 output regardless of the (user-editable) template styles.
  const printStyle =
    '<style>@page{size:A4;margin:0;}@media print{html,body{margin:0!important;}}</style>';
  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, `${printStyle}</head>`);
  } else {
    output = `${printStyle}${output}`;
  }

  return output;
};

export default function GRNPrintPage() {
  const router = useRouter();
  const iframeRef = useRef(null);
  const grnId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [grnData, setGrnData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loadingGRN, setLoadingGRN] = useState(true);
  const [sidebarLogo, setSidebarLogo] = useState("");
  const [salesPersonMap, setSalesPersonMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [templateHtml, setTemplateHtml] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(1123);

  const { companyData } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    if (!router.isReady || !grnId) {
      return;
    }

    const fetchGRN = async () => {
      try {
        setLoadingGRN(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${BASE_URL}/GoodReceivedNote/GetAllGoodReceivedNote`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json().catch(() => null);

        const grnList = Array.isArray(data?.result)
          ? data.result
          : Array.isArray(data)
            ? data
            : [];
        const selectedGRN = grnList.find(
          (item) => String(item.id) === String(grnId)
        );

        if (response.ok && selectedGRN) {
          setGrnData(selectedGRN);
        } else {
          toast.error(data?.message || "Failed to load GRN.");
        }
      } catch (error) {
        console.error("Error fetching GRN:", error);
        toast.error("Failed to load GRN.");
      } finally {
        setLoadingGRN(false);
      }
    };

    fetchGRN();
  }, [grnId, router.isReady]);

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

    const warehouseId = localStorage.getItem("warehouse") || grnData?.warehouseId;
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
  }, [grnData?.warehouseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const warehouse = localStorage.getItem("warehouse") || grnData?.warehouseId;
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
  }, [grnData?.warehouseId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const fetchLookupData = async () => {
      try {
        const [salesResponse, userResponse] = await Promise.all([
          fetch(`${BASE_URL}/SalesPerson/GetAllSalesPerson`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/User/GetAllUser`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (salesResponse.ok) {
          const salesData = await salesResponse.json().catch(() => null);
          const salesPeople = salesData?.result || salesData?.data || salesData || [];
          const nextSalesPersonMap = {};
          if (Array.isArray(salesPeople)) {
            salesPeople.forEach((person) => {
              nextSalesPersonMap[person.id] = person;
            });
          }
          setSalesPersonMap(nextSalesPersonMap);
        }

        if (userResponse.ok) {
          const usersData = await userResponse.json().catch(() => null);
          const users = Array.isArray(usersData)
            ? usersData
            : Array.isArray(usersData?.result)
              ? usersData.result
              : [];
          const nextUserMap = {};
          users.forEach((user) => {
            nextUserMap[user.id] = user;
          });
          setUserMap(nextUserMap);
        }
      } catch (error) {
        console.error("Error fetching GRN lookup data:", error);
      }
    };

    fetchLookupData();
  }, []);

  const lineItems = grnData?.goodReceivedNoteLineDetails ?? [];
  const totalQty = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
    [lineItems]
  );
  // Freight-inclusive sum of line totals (used for discounts / gross).
  const sumLineTotals = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + Number(item.lineTotal ?? 0),
        0
      ),
    [lineItems]
  );
  // Footer "Total" excludes freight: Σ (qty × unitPrice)
  const merchandiseTotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) =>
          sum + Number(item.qty ?? 0) * Number(item.unitPrice ?? 0),
        0
      ),
    [lineItems]
  );
  // Matches create screen: Σ freightDuty × (qty + free)
  const freightDutyTotal = useMemo(
    () =>
      lineItems.reduce((sum, item) => {
        const freight = getFreightDutyCost(item);
        const qtyPlusFree =
          (Number(item.qty) || 0) + (Number(item.free) || 0);
        return sum + freight * qtyPlusFree;
      }, 0),
    [lineItems]
  );

  const headerDiscountPercent = Number(grnData?.discount ?? 0);
  const savedTotalAmount = Number(grnData?.totalAmount ?? NaN);
  const derivedDiscountAmount = useMemo(() => {
    if (!Number.isFinite(savedTotalAmount)) return 0;
    const diff = sumLineTotals - savedTotalAmount;
    return diff > 0.009 ? diff : 0;
  }, [sumLineTotals, savedTotalAmount]);

  const orderDiscountAmount = useMemo(() => {
    if (headerDiscountPercent && !Number.isNaN(headerDiscountPercent)) {
      const amt = sumLineTotals * (headerDiscountPercent / 100);
      if (!Number.isNaN(amt) && amt > 0) return amt;
    }
    return derivedDiscountAmount;
  }, [headerDiscountPercent, sumLineTotals, derivedDiscountAmount]);

  const orderDiscountPercent = useMemo(() => {
    if (headerDiscountPercent && !Number.isNaN(headerDiscountPercent)) {
      return headerDiscountPercent;
    }
    if (sumLineTotals > 0 && orderDiscountAmount > 0) {
      return (orderDiscountAmount / sumLineTotals) * 100;
    }
    return 0;
  }, [headerDiscountPercent, sumLineTotals, orderDiscountAmount]);

  const grossTotal = Number.isFinite(savedTotalAmount)
    ? savedTotalAmount
    : sumLineTotals - orderDiscountAmount;

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

  const tokenMap = useMemo(
    () => ({
      companyLogo: sidebarLogo
        ? `<img src="${escapeHtml(sidebarLogo)}" alt="Company Logo" />`
        : "",
      companyName: companyData?.name || warehouseData?.name || "Company",
      companyAddress: companyAddressLines.join(", "),
      companyContact: companyContactLines.join("  |  "),
      documentNo: grnData?.documentNo || documentNumber || "-",
      supplierName: grnData?.supplierName || "-",
      grnDate: formatDisplayDate(grnData?.grnDate || grnData?.createdOn),
      remark: grnData?.remark || "-",
      totalQty: formatQty(totalQty),
      warehouseName: grnData?.warehouseName || warehouseData?.name || "-",
      createdBy: getUserLabel(userMap[grnData?.createdBy]),
      createdDate: formatDisplayDateTime(grnData?.createdOn),
      referenceNo: grnData?.referanceNo || "-",
      salesPerson: salesPersonMap[grnData?.salesPerson]?.name || "-",
      freightDutyTotal: formatAmount(freightDutyTotal),
      subtotal: formatAmount(merchandiseTotal),
      orderDiscountPercent: formatAmount(orderDiscountPercent),
      totalDiscount: formatAmount(orderDiscountAmount),
      grossTotal: formatAmount(grossTotal),
    }),
    [
      sidebarLogo,
      companyData?.name,
      warehouseData?.name,
      companyAddressLines,
      companyContactLines,
      grnData,
      documentNumber,
      totalQty,
      userMap,
      salesPersonMap,
      freightDutyTotal,
      merchandiseTotal,
      orderDiscountPercent,
      orderDiscountAmount,
      grossTotal,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !grnData) {
      return "";
    }
    return applyTemplate(templateHtml, tokenMap, buildLineItemsRows(lineItems));
  }, [templateHtml, grnData, tokenMap, lineItems]);

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
    // Re-measure once webfonts/logo image settle.
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

      pdf.save(`GRN_${grnData?.documentNo || documentNumber || "document"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const isLoading = loadingGRN || loadingTemplate;

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
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPDF}
            disabled={isLoading || !finalHtml}
            sx={{ textTransform: "none" }}
          >
            Download PDF
          </Button>
        </Box>

        {isLoading ? (
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
            <Typography variant="body2" color="text.secondary">
              Loading GRN...
            </Typography>
          </Box>
        ) : finalHtml ? (
          <Box
            component="iframe"
            ref={iframeRef}
            title="GRN Print Preview"
            srcDoc={finalHtml}
            onLoad={handleIframeLoad}
            sx={{
              width: { xs: "100%", sm: "210mm" },
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
              width: { xs: "100%", sm: "210mm" },
              minHeight: "297mm",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="body2" color="error">
              Failed to load GRN
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
