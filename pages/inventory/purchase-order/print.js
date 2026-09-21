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
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";
import { EMPTY_LINE_ITEMS_HTML } from "@/components/ReportTemplate/lineItemsEditor";
import {
    getPageSizeMm,
    PAGE_ORIENTATION,
    parsePageOrientation,
} from "@/components/ReportTemplate/pageOrientation";

const REPORT_KEY = "PO";

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

export default function PurchaseOrderPrintPage() {
    const router = useRouter();
    const iframeRef = useRef(null);
    const purchaseOrderId = router.query.id;
    const documentNumber = router.query.documentNumber;

  const [purchaseOrderData, setPurchaseOrderData] = useState(null);
  const [poTallyList, setPoTallyList] = useState([]);
  const [warehouseData, setWarehouseData] = useState(null);
  const [loadingPurchaseOrder, setLoadingPurchaseOrder] = useState(true);
  const [sidebarLogo, setSidebarLogo] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(1123);

    const { companyData } = useLoggedUserCompanyLetterhead();

    useEffect(() => {
        if (!router.isReady || !purchaseOrderId) {
            return;
        }

        const fetchPurchaseOrder = async () => {
            try {
                setLoadingPurchaseOrder(true);

                const token =
                    typeof window !== "undefined" ? localStorage.getItem("token") : null;

                const response = await fetch(
                    `${BASE_URL}/GoodReceivedNote/GetPurchaseOrderById?id=${purchaseOrderId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                const data = await response.json().catch(() => null);

                if (response.ok && data?.statusCode === 200) {
                    setPurchaseOrderData(data.result);
                } else {
                    toast.error(data?.message || "Failed to load purchase order.");
                }
            } catch (error) {
                console.error("Error fetching purchase order:", error);
                toast.error("Failed to load purchase order.");
            } finally {
                setLoadingPurchaseOrder(false);
            }
        };

        fetchPurchaseOrder();
    }, [purchaseOrderId, router.isReady]);

  useEffect(() => {
    if (!purchaseOrderData?.purchaseOrderNo) {
      return;
    }

    const poType = purchaseOrderData?.type ?? purchaseOrderData?.purchasingOrderType;
    if (poType === 1) {
      setPoTallyList([]);
      return;
    }

    const fetchPoTally = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${BASE_URL}/GoodReceivedNote/GetPOTallyByPurchaseOrderNo?poNumber=${encodeURIComponent(
            purchaseOrderData.purchaseOrderNo
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json().catch(() => null);
        if (response.ok && data?.statusCode === 200) {
          setPoTallyList(Array.isArray(data.result) ? data.result : []);
        } else {
          setPoTallyList([]);
        }
      } catch (error) {
        console.error("Error fetching PO tally:", error);
        setPoTallyList([]);
      }
    };

    fetchPoTally();
  }, [purchaseOrderData?.purchaseOrderNo, purchaseOrderData?.type, purchaseOrderData?.purchasingOrderType]);

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

        const warehouseId =
            localStorage.getItem("warehouse") || purchaseOrderData?.warehouseId;
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
    }, [purchaseOrderData?.warehouseId]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const warehouse =
            localStorage.getItem("warehouse") || purchaseOrderData?.warehouseId;
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
    }, [purchaseOrderData?.warehouseId]);

  const lineItems = purchaseOrderData?.goodReceivedNoteLineDetails ?? [];
  const poType = purchaseOrderData?.type ?? purchaseOrderData?.purchasingOrderType;
  const isLocalPO = poType == 1;
  const isImportPO = !isLocalPO;

  const getPoLineForProduct = (productId) =>
    lineItems.find(
      (line) =>
        Number(line.productId ?? line.ProductId) === Number(productId)
    );

  const getShipmentUnitCost = (tally, poLine) => {
    const unitPrice = Number(
      tally?.shipmentUnitPrice ?? tally?.ShipmentUnitPrice ?? 0
    );
    const overseasCost = Number(
      tally?.shipmentAdditionalCost ?? tally?.ShipmentAdditionalCost ?? 0
    );
    const freightDutyCost = Number(
      tally?.shipmentFreightDutyCost ?? tally?.ShipmentFreightDutyCost ?? 0
    );
    const localTransportCost = Number(
      tally?.shipmentLocalTransportCost ?? tally?.ShipmentLocalTransportCost ?? 0
    );
    const shipmentTotal = unitPrice + overseasCost + freightDutyCost + localTransportCost;
    if (shipmentTotal > 0) {
      return shipmentTotal;
    }
    return Number(poLine?.costPrice ?? 0);
  };

  const getOrderQty = (item) =>
    Number(item.poQty ?? item.orderedQty ?? item.qty ?? item.orderQty ?? 0);

  const getReceivedQty = (item) =>
    Number(
      item.receivedQty ??
        item.shipmentReceivedQty ??
        item.ShipmentReceivedQty ??
        0
    );

  const getQtyForLineAmount = (item) => {
    if (isImportPO && item.shipmentNoteNo && item.shipmentNoteNo !== "-") {
      return getOrderQty(item);
    }
    if (isLocalPO) {
      return Number(item.qty ?? 0);
    }
    return getOrderQty(item);
  };

    const getLineGross = (item) =>
        Number(item.costPrice ?? 0) * getQtyForLineAmount(item);

    const getLineDiscount = (item) => {
        const rate = Number(item.discountRate ?? 0);
        const amount = Number(item.discountAmount ?? 0);
        if (rate > 0) {
            return (getLineGross(item) * rate) / 100;
        }
        return amount > 0 ? amount : 0;
    };

  const getLineTotal = (item) => {
    const fromDb =
      item.lineTotal && Number(item.lineTotal) > 0 ? Number(item.lineTotal) : null;
    if (fromDb != null && !Number.isNaN(fromDb) && isLocalPO) {
      return fromDb;
    }
    return Math.max(getLineGross(item) - getLineDiscount(item), 0);
  };

  const printLineItems = useMemo(() => {
    if (!isImportPO || poTallyList.length === 0) {
      return lineItems.map((item) => ({
        ...item,
        shipmentNoteNo: "-",
        orderQty: getOrderQty(item),
        receivedQty: getReceivedQty(item),
        poReceivedQty: Number(item.receivedQty ?? item.poReceivedQty ?? 0),
        costPrice: Number(item.costPrice ?? 0),
      }));
    }

    return poTallyList.map((tally) => {
      const poLine = getPoLineForProduct(tally.productId ?? tally.ProductId) ?? {};
      const orderQty = Number(
        tally.shipmentOrderedQty ?? tally.ShipmentOrderedQty ?? 0
      );
      const receivedQty = Number(
        tally.shipmentReceivedQty ?? tally.ShipmentReceivedQty ?? 0
      );
      const poReceivedQty = Number(
        tally.poReceivedQty ?? tally.POReceivedQty ?? 0
      );
      const costPrice = getShipmentUnitCost(tally, poLine);
      const poQty = Number(poLine.poQty ?? poLine.orderedQty ?? poLine.qty ?? 0);
      const lineDiscountRate = Number(poLine.discountRate ?? 0);
      const lineDiscountAmount = Number(poLine.discountAmount ?? 0);
      const proratedDiscountAmount =
        poQty > 0 && lineDiscountAmount > 0 && lineDiscountRate <= 0
          ? (lineDiscountAmount * orderQty) / poQty
          : lineDiscountAmount;

      return {
        productId: tally.productId ?? tally.ProductId,
        productName: tally.productName ?? tally.ProductName ?? poLine.productName,
        productCode: tally.productCode ?? tally.ProductCode ?? poLine.productCode,
        shipmentNoteNo: tally.shipmentNoteNo ?? tally.ShipmentNoteNo ?? "-",
        batch: poLine.batch || "-",
        expDate: poLine.expDate,
        orderQty,
        receivedQty,
        poReceivedQty,
        costPrice,
        discountRate: lineDiscountRate,
        discountAmount: lineDiscountRate > 0 ? 0 : proratedDiscountAmount,
      };
    });
  }, [isImportPO, lineItems, poTallyList]);

  const totalQty = useMemo(
    () => printLineItems.reduce((sum, item) => sum + getOrderQty(item), 0),
    [printLineItems]
  );
  const totalDiscount = useMemo(
    () => printLineItems.reduce((sum, item) => sum + getLineDiscount(item), 0),
    [printLineItems, isLocalPO, isImportPO]
  );
  const grandTotal = useMemo(
    () => printLineItems.reduce((sum, item) => sum + getLineTotal(item), 0),
    [printLineItems, isLocalPO, isImportPO]
  );

  const uniqueProductCount = useMemo(() => {
    const ids = new Set(
      printLineItems.map((item) => item.productId ?? item.productName).filter(Boolean)
    );
    return ids.size;
  }, [printLineItems]);

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
            lines.push(`Email: ${warehouseData.email1}`);
        }

        return lines;
    }, [companyData?.contactNumber, warehouseData]);

  const buildPoLineTokenMap = (item) => ({
    productName: item.productName || item.productCode || "-",
    shipmentNoteNo: item.shipmentNoteNo || "-",
    batch: item.batch || "-",
    expDate: item.expDate ? formatDisplayDate(item.expDate) : "-",
    orderQty: formatQty(getOrderQty(item)),
    receivedQty: formatQty(getReceivedQty(item)),
    poReceivedQty: formatQty(Number(item.poReceivedQty ?? 0)),
    costPrice: formatAmount(item.costPrice),
    discountRate: formatAmount(Number(item.discountRate ?? 0)),
    discountAmount: formatAmount(getLineDiscount(item)),
    lineTotal: formatAmount(getLineTotal(item)),
  });

    // Legacy fallback for templates still using {{lineItemsRows}}.
    const buildLineItemsRows = (items) => {
        if (!items || items.length === 0) return EMPTY_LINE_ITEMS_HTML;
        return items
            .map((item) => {
                const t = buildPoLineTokenMap(item);
                return `<tr>
          <td>${escapeHtml(t.productName)}</td>
          <td>${escapeHtml(t.shipmentNoteNo)}</td>
          <td>${escapeHtml(t.batch)}</td>
          <td>${escapeHtml(t.expDate)}</td>
          <td class="num">${escapeHtml(t.orderQty)}</td>
          <td class="num">${escapeHtml(t.receivedQty)}</td>
          <td class="num">${escapeHtml(t.costPrice)}</td>
          <td class="num">${escapeHtml(t.discountRate)}</td>
          <td class="num">${escapeHtml(t.discountAmount)}</td>
          <td class="num">${escapeHtml(t.lineTotal)}</td>
        </tr>`;
            })
            .join("\n");
    };

  const tokenMap = useMemo(
    () => ({
      companyLogo: sidebarLogo
        ? `<img src="${escapeHtml(sidebarLogo)}" alt="Company Logo" />`
        : "",
      companyName: companyData?.name || warehouseData?.name || "Company",
      companyAddress: companyAddressLines.join(", "),
      companyContact: companyContactLines.join("  |  "),
      documentNo:
        purchaseOrderData?.purchaseOrderNo ||
        purchaseOrderData?.documentNo ||
        documentNumber ||
        "-",
      supplierName: purchaseOrderData?.supplierName || "-",
      poDate: formatDisplayDate(purchaseOrderData?.poDate),
      referenceNo: purchaseOrderData?.referanceNo || "-",
      grnDate: formatDisplayDate(
        purchaseOrderData?.grnDate ?? purchaseOrderData?.poDate
      ),
      orderType: poType === 2 ? "Import" : "Local",
      payment: purchaseOrderData?.isCredit ? "Credit" : "Cash",
      warehouseName:
        purchaseOrderData?.warehouseName || warehouseData?.name || "-",
      totalProducts: String(uniqueProductCount),
      totalQty: formatQty(totalQty),
      totalDiscount: formatAmount(totalDiscount),
      grandTotal: formatAmount(grandTotal),
    }),
    [
      sidebarLogo,
      companyData?.name,
      warehouseData?.name,
      companyAddressLines,
      companyContactLines,
      purchaseOrderData,
      documentNumber,
      poType,
      uniqueProductCount,
      totalQty,
      totalDiscount,
      grandTotal,
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
    if (!templateHtml || !purchaseOrderData) {
      return "";
    }
    const lineTokenMaps = printLineItems.map(buildPoLineTokenMap);
    return applyTemplate(templateHtml, tokenMap, buildLineItemsRows(printLineItems), {
      lineTokenMaps,
      emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
    });
  }, [templateHtml, purchaseOrderData, tokenMap, printLineItems]);

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
                `Purchase_Order_${purchaseOrderData?.purchaseOrderNo || documentNumber || "document"
                }.pdf`
            );
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to download PDF. Please try again.");
        }
    };

    const isLoading = loadingPurchaseOrder || loadingTemplate;

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
                            Loading purchase order...
                        </Typography>
                    </Box>
                ) : finalHtml ? (
                    <Box
                        component="iframe"
                        ref={iframeRef}
                        title="Purchase Order Print Preview"
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
                            Failed to load purchase order
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
