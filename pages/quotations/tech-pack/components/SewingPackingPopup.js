import React, { useEffect, useState } from "react";
import { Document, Page, Text, View, PDFViewer, StyleSheet, Image } from "@react-pdf/renderer";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Box } from "@mui/material";
import BASE_URL from "Base/api";
import { getWindowType } from "@/components/types/types";

// Document panel: Front = 1, Back = 2. Sub-content: Plain (common) = 5
const DOCUMENT_CONTENT_FRONT = 1;
const DOCUMENT_CONTENT_BACK = 2;
const DOCUMENT_SUB_PLAIN_COMMON = 5;

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 10,
        fontFamily: "Helvetica",
        backgroundColor: "#fff",
    },
    // Header: 3 rows, labels with colons
    headerTable: {
        width: "100%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
    },
    headerRow: {
        flexDirection: "row",
        minHeight: 32,
    },
    headerCell: {
        flex: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 6,
        flexDirection: "row",
    },
    headerCellFull: {
        flex: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 6,
        flexDirection: "row",
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: "bold",
    },
    headerValue: {
        fontSize: 10,
        marginLeft: 4,
    },
    imagesSection: {
        marginTop: 12,
    },
    imagesRow: {
        flexDirection: "row",
        marginTop: 6,
        gap: 16,
    },
    imageBlock: {
        flex: 1,
        alignItems: "center",
    },
    panelImage: {
        width: "100%",
        maxWidth: 240,
        height: 200,
        objectFit: "contain",
    },
    // Lower section: two columns
    lowerSection: {
        flexDirection: "row",
        marginTop: 12,
        gap: 12,
    },
    specsColumn: {
        flex: 1,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
    },
    sizeQtyColumn: {
        minWidth: 100,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#000",
    },
    sizeQtyHeaderCellMid: {
        width: 36,
        padding: 4,
        fontSize: 9,
        fontWeight: "bold",
        borderRightWidth: 1,
        borderColor: "#000",
    },
    sizeQtyCellMid: {
        width: 36,
        padding: 4,
        fontSize: 9,
        borderRightWidth: 1,
        borderColor: "#000",
    },
    specRow: {
        flexDirection: "row",
        minHeight: 24,
    },
    specLabel: {
        width: "40%",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 4,
        fontSize: 9,
        fontWeight: "bold",
    },
    specValue: {
        width: "60%",
        borderBottomWidth: 1,
        borderColor: "#000",
        padding: 4,
        fontSize: 9,
    },
    sizeQtyHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#000",
    },
    sizeQtyHeaderCell: {
        width: 56,
        padding: 4,
        fontSize: 9,
        fontWeight: "bold",
        borderRightWidth: 1,
        borderColor: "#000",
    },
    sizeQtyHeaderCellLast: {
        flex: 1,
        padding: 4,
        fontSize: 9,
        fontWeight: "bold",
    },
    sizeQtyRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#000",
    },
    sizeQtyCell: {
        width: 56,
        padding: 4,
        fontSize: 9,
        borderRightWidth: 1,
        borderColor: "#000",
    },
    sizeQtyCellLast: {
        flex: 1,
        padding: 4,
        fontSize: 9,
    },
});

function formatDateForHeader(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}/${m}/${day}`;
}

function formatDeliveryDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const day = d.getDate();
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    return `${day}/${m}/${y}`;
}

/** Start date + working days (calendar days). Returns Date or null. */
function addWorkingDays(startDate, workingDays) {
    if (startDate == null || workingDays == null) return null;
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return null;
    const days = Number(workingDays);
    if (Number.isNaN(days) || days < 0) return null;
    d.setDate(d.getDate() + Math.round(days));
    return d;
}

/**
 * Build fabric display: selected fabric name with GSM (latest from tech pack).
 */
function getLatestFabricDisplay(fabrics) {
    if (!Array.isArray(fabrics) || fabrics.length === 0) return "-";
    const latest = fabrics[fabrics.length - 1];
    const name = latest?.fabricName?.trim() || "";
    const gsm = latest?.gsmName?.trim() || "";
    if (!name && !gsm) return "-";
    return gsm ? `${name} ${gsm}` : name;
}

/** Selected color code from latest fabric (tech pack). */
function getLatestColourDisplay(fabrics) {
    if (!Array.isArray(fabrics) || fabrics.length === 0) return "-";
    const latest = fabrics[fabrics.length - 1];
    const colour = latest?.colorCodeName?.trim() || "";
    return colour || "-";
}

/** Sleeve display from GetOngoingSleeve result: Long, Short, or Long / Short. */
function getSleeveDisplay(sleeveResult) {
    if (!sleeveResult) return "-";
    const longVal = sleeveResult.long === 1 || sleeveResult.long === "1";
    const shortVal = sleeveResult.short === 1 || sleeveResult.short === "1";
    if (longVal && shortVal) return "Long / Short";
    if (longVal) return "Long";
    if (shortVal) return "Short";
    return "-";
}

/** Map necKTypes enum to display name (matches backend NeckType). */
function getNeckTypeName(necKTypes) {
    const n = parseInt(necKTypes, 10);
    switch (n) {
        case 1: return "POLO";
        case 2: return "Crew Neck";
        case 3: return "V Neck";
        case 4: return "Full Collar";
        case 5: return "Chinese Collar";
        default: return "";
    }
}

function getPanelImageUrl(panels, contentType, subContentType) {
    if (!Array.isArray(panels)) return "";
    const exact = panels.find((d) =>
        Number(d?.documentContentType) === Number(contentType) &&
        Number(d?.documentSubContentType) === Number(subContentType) &&
        d?.documentURL
    );
    if (exact?.documentURL) return exact.documentURL;

    const fallback = panels.find((d) =>
        Number(d?.documentContentType) === Number(contentType) &&
        d?.documentURL
    );
    return fallback?.documentURL || "";
}

const SIZE_KEYS = [
    { key: "twoXS", label: "2XS" },
    { key: "xs", label: "XS" },
    { key: "s", label: "S" },
    { key: "m", label: "M" },
    { key: "l", label: "L" },
    { key: "xl", label: "XL" },
    { key: "twoXL", label: "2XL" },
    { key: "threeXL", label: "3XL" },
    { key: "fourXL", label: "4XL" },
    { key: "fiveXL", label: "5XL" },
];

function formatSizeQty(val) {
    if (val == null || val === "" || Number(val) === 0) return "-";
    const n = Number(val);
    return Number.isNaN(n) ? "-" : String(Math.round(n));
}

function SewingPackingDocument({ headerData }) {
    const styleName = headerData?.inquiryStyleName ?? "-";
    const clientName = headerData?.customerName ?? "-";
    const fabric = headerData?.fabricDisplay ?? "-";
    const date = headerData?.date ?? "-";
    const deliveryDate = headerData?.deliveryDate ?? "-";
    const type = headerData?.type ?? "-";
    const frontImageUrl = headerData?.frontImageUrl;
    const backImageUrl = headerData?.backImageUrl;
    const hasImages = frontImageUrl || backImageUrl;
    const colour = headerData?.colourDisplay ?? "-";
    const patternSleeve = headerData?.patternSleeve ?? "-";
    const sizeRows = Array.isArray(headerData?.sizeRows) ? headerData.sizeRows : [];
    const numQtyColumns = Math.max(1, sizeRows.length);
    const sizeColumnWidth = 56;
    const qtyColumnWidth = 40;
    const mergedQtyWidth = qtyColumnWidth * numQtyColumns;

    const specs = [
        { label: "FABRIC", value: fabric },
        { label: "COLOUR", value: colour },
        { label: "PATTERN", value: patternSleeve },
        { label: "PLACKET", value: headerData?.placket ?? "-" },
        { label: "INNER PLACKET", value: headerData?.innerPlacket ?? "-" },
        { label: "OUTER PLACKET", value: headerData?.outerPlacket ?? "-" },
        { label: "SHOULDER OUTLINE", value: headerData?.shoulderOutline ?? "-" },
        { label: "A/HOLE OUTLINE", value: headerData?.aholeOutline ?? "-" },
        { label: "SIDE VENT", value: headerData?.sideVent ?? "-" },
        { label: "COLLAR", value: headerData?.collar ?? "-" },
        { label: "SLEEVE", value: patternSleeve },
        { label: "BUTTONS", value: headerData?.buttons ?? "-" },
        { label: "NECK TAPE", value: headerData?.neckTape ?? "-" },
        { label: "LABELS", value: headerData?.labels ?? "-" },
    ];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header table - same as reference: Row1 STYLE NAME | CLIENT NAME, Row2 FABRIC | DATE | TYPE, Row3 DELIVERY DATE full */}
                <View style={styles.headerTable}>
                    <View style={styles.headerRow}>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerLabel}>STYLE NAME : </Text>
                            <Text style={styles.headerValue}>{styleName}</Text>
                        </View>
                        <View style={[styles.headerCell, { borderRightWidth: 0 }]}>
                            <Text style={styles.headerLabel}>CLIENT NAME : </Text>
                            <Text style={styles.headerValue}>{clientName}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRow}>
                        <View style={[styles.headerCell, { flex: 1 }]}>
                            <Text style={styles.headerLabel}>FABRIC : </Text>
                            <Text style={styles.headerValue}>{fabric}</Text>
                        </View>
                        <View style={styles.headerCell}>
                            <Text style={styles.headerLabel}>DATE : </Text>
                            <Text style={styles.headerValue}>{date}</Text>
                        </View>
                        <View style={[styles.headerCell, { borderRightWidth: 0 }]}>
                            <Text style={styles.headerLabel}>TYPE : </Text>
                            <Text style={styles.headerValue}>{type}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRow}>
                        <View style={styles.headerCellFull}>
                            <Text style={styles.headerLabel}>DELIVERY DATE : </Text>
                            <Text style={styles.headerValue}>{deliveryDate}</Text>
                        </View>
                    </View>
                </View>

                {hasImages && (
                    <View style={styles.imagesSection}>
                        <View style={styles.imagesRow}>
                            {frontImageUrl && (
                                <View style={styles.imageBlock}>
                                    <Image src={frontImageUrl} style={styles.panelImage} />
                                </View>
                            )}
                            {backImageUrl && (
                                <View style={styles.imageBlock}>
                                    <Image src={backImageUrl} style={styles.panelImage} />
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.lowerSection}>
                    <View style={styles.specsColumn}>
                        {specs.map((s, i) => (
                            <View key={i} style={styles.specRow}>
                                <Text style={styles.specLabel}>{s.label}</Text>
                                <Text style={styles.specValue}>{s.value}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.sizeQtyColumn, { width: sizeColumnWidth + mergedQtyWidth }]}>
                        <View style={styles.sizeQtyHeader}>
                            <View style={[styles.sizeQtyHeaderCell, { width: sizeColumnWidth }]}>
                                <Text>Size</Text>
                            </View>
                            {(numQtyColumns === 1 ? [null] : sizeRows).map((_, idx, arr) => (
                                <View
                                    key={idx}
                                    style={[
                                        idx < arr.length - 1 ? styles.sizeQtyHeaderCellMid : styles.sizeQtyHeaderCellLast,
                                        { width: qtyColumnWidth },
                                    ]}
                                >
                                    <Text>Qty</Text>
                                </View>
                            ))}
                        </View>
                        {SIZE_KEYS.map(({ key, label }) => (
                            <View key={key} style={styles.sizeQtyRow}>
                                <View style={[styles.sizeQtyCell, { width: sizeColumnWidth }]}>
                                    <Text>{label}</Text>
                                </View>
                                {(numQtyColumns === 1 ? [sizeRows[0]] : sizeRows).map((row, idx, arr) => (
                                    <View
                                        key={idx}
                                        style={[
                                            idx < arr.length - 1 ? styles.sizeQtyCellMid : styles.sizeQtyCellLast,
                                            { width: qtyColumnWidth },
                                        ]}
                                    >
                                        <Text>{row ? formatSizeQty(row[key]) : "-"}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                        <View style={styles.sizeQtyRow}>
                            <View style={[styles.sizeQtyCell, { width: sizeColumnWidth }]}>
                                <Text style={{ fontWeight: "bold" }}>TOTAL</Text>
                            </View>
                            {(numQtyColumns === 1 ? [sizeRows[0]] : sizeRows).map((row, idx, arr) => (
                                <View
                                    key={idx}
                                    style={[
                                        idx < arr.length - 1 ? styles.sizeQtyCellMid : styles.sizeQtyCellLast,
                                        { width: qtyColumnWidth },
                                    ]}
                                >
                                    <Text style={{ fontWeight: "bold" }}>
                                        {row?.totalQty ? String(Math.round(row.totalQty)) : "-"}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        {numQtyColumns >= 2 && (() => {
                            const totalBoth = sizeRows.reduce((sum, row) => sum + (Number(row?.totalQty) || 0), 0);
                            return (
                                <View style={styles.sizeQtyRow}>
                                    <View style={[styles.sizeQtyCell, { width: sizeColumnWidth }]}>
                                        <Text style={{ fontWeight: "bold" }}>TOTAL</Text>
                                    </View>
                                    <View style={[styles.sizeQtyCellLast, { width: mergedQtyWidth }]}>
                                        <Text style={{ fontWeight: "bold" }}>
                                            {totalBoth ? String(Math.round(totalBoth)) : "-"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export default function SewingPackingPopup({ open, onClose, item }) {
    const [headerData, setHeaderData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !item) {
            setHeaderData(null);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const run = async () => {
            try {
                const token = localStorage.getItem("token");
                const initRes = await fetch(
                    `${BASE_URL}/Ongoing/InitializeTechPack?inquiryId=${item.inquiryId}&optionId=${item.optionId}&sentQuotationId=${item.id}`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (!initRes.ok || cancelled) return;
                const initJson = await initRes.json();
                const init = initJson?.result;
                if (!init || cancelled) {
                    setHeaderData(null);
                    return;
                }

                const ongoingInquiryId = init.ongoingInquiryId;
                const optionId = init.optionId ?? item.optionId;
                const windowType = init.windowType;

                const fabricsRes = await fetch(
                    `${BASE_URL}/Ongoing/GetAllOngoingFabrics?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (!fabricsRes.ok || cancelled) return;
                const fabricsJson = await fabricsRes.json();
                const fabrics = Array.isArray(fabricsJson?.result) ? fabricsJson.result : [];

                let frontImageUrl = "";
                let backImageUrl = "";
                try {
                    const panelsRes = await fetch(
                        `${BASE_URL}/Ongoing/GetAllOngoingDocumentPanels?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    if (panelsRes.ok && !cancelled) {
                        const panelsJson = await panelsRes.json();
                        const panels = Array.isArray(panelsJson?.result) ? panelsJson.result : [];
                        frontImageUrl = getPanelImageUrl(
                            panels,
                            DOCUMENT_CONTENT_FRONT,
                            DOCUMENT_SUB_PLAIN_COMMON
                        );
                        backImageUrl = getPanelImageUrl(
                            panels,
                            DOCUMENT_CONTENT_BACK,
                            DOCUMENT_SUB_PLAIN_COMMON
                        );
                    }
                } catch (_) { /* ignore */ }

                let sleeveDisplay = "-";
                try {
                    const sleeveRes = await fetch(
                        `${BASE_URL}/Ongoing/GetOngoingSleeve?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    if (sleeveRes.ok && !cancelled) {
                        const sleeveJson = await sleeveRes.json();
                        if (sleeveJson?.result) sleeveDisplay = getSleeveDisplay(sleeveJson.result);
                    }
                } catch (_) { /* ignore */ }

                let sizeRows = [];
                try {
                    const sizesRes = await fetch(
                        `${BASE_URL}/Ongoing/GetAllOngoingSizes?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    if (sizesRes.ok && !cancelled) {
                        const sizesJson = await sizesRes.json();
                        const sizesList = Array.isArray(sizesJson?.result) ? sizesJson.result : [];
                        sizeRows = sizesList.map((row) => ({
                            twoXS: row.twoXS ?? row.TwoXS,
                            xs: row.xs ?? row.XS,
                            s: row.s ?? row.S,
                            m: row.m ?? row.M,
                            l: row.l ?? row.L,
                            xl: row.xl ?? row.XL,
                            twoXL: row.twoXL ?? row.TwoXL,
                            threeXL: row.threeXL ?? row.ThreeXL,
                            fourXL: row.fourXL ?? row.FourXL,
                            fiveXL: row.fiveXL ?? row.FiveXL,
                            totalQty: row.totalQty ?? row.TotalQty ?? 0,
                        }));
                    }
                } catch (_) { /* ignore */ }

                const fabricDisplay = getLatestFabricDisplay(fabrics);
                const colourDisplay = getLatestColourDisplay(fabrics);
                const inquiryStyleName = init.styleName ?? item.styleName ?? "-";
                const customerName = init.customerName ?? item.customerName ?? "-";
                // DATE = start date of approved quotation share
                const date = formatDateForHeader(item?.startDate);
                // DELIVERY DATE = start date + working days
                const deliveryDateRaw = addWorkingDays(item?.startDate, item?.workingDays);
                const deliveryDate = deliveryDateRaw ? formatDeliveryDate(deliveryDateRaw.toISOString()) : "-";

                let neckTypeName = "";
                try {
                    const neckRes = await fetch(
                        `${BASE_URL}/Ongoing/GetOngoingNeckType?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    if (neckRes.ok && !cancelled) {
                        const neckJson = await neckRes.json();
                        if (neckJson?.result?.necKTypes != null) {
                            neckTypeName = getNeckTypeName(neckJson.result.necKTypes);
                        }
                    }
                } catch (_) { /* ignore */ }
                const windowTypeName = getWindowType(windowType) || "";
                const type = [neckTypeName, windowTypeName].filter(Boolean).join(" ") || item?.optionName || item?.selectedOption || "-";

                if (!cancelled) {
                    setHeaderData({
                        inquiryStyleName,
                        customerName,
                        fabricDisplay,
                        colourDisplay,
                        patternSleeve: sleeveDisplay,
                        date,
                        deliveryDate,
                        type,
                        frontImageUrl: frontImageUrl || undefined,
                        backImageUrl: backImageUrl || undefined,
                        sizeRows: sizeRows.length ? sizeRows : undefined,
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setHeaderData(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [open, item?.id, item?.inquiryId, item?.optionId]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: "#fff",
                    height: "90vh",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    "& .react-pdf__Document": { backgroundColor: "#fff" },
                },
            }}
        >
            <DialogTitle sx={{ flexShrink: 0 }}>Sewing/Packing</DialogTitle>
            <DialogContent
                sx={{
                    p: 0,
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#f5f5f5",
                    "& iframe": { border: "none", backgroundColor: "#fff" },
                    "& .react-pdf__Message": { backgroundColor: "#fff" },
                }}
            >
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" flex={1} bgcolor="#fff">
                        <CircularProgress />
                    </Box>
                ) : headerData ? (
                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            bgcolor: "#fff",
                            "& iframe": { bgcolor: "#fff" },
                        }}
                    >
                        <PDFViewer width="100%" height="100%" style={{ flex: 1, minHeight: 0 }} showToolbar>
                            <SewingPackingDocument headerData={headerData} />
                        </PDFViewer>
                    </Box>
                ) : item ? (
                    <Box p={2} bgcolor="#fff">
                        <Box color="text.secondary">Unable to load sewing/packing data.</Box>
                    </Box>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ flexShrink: 0, backgroundColor: "#fff", borderTop: "1px solid", borderColor: "divider" }}>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
