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

const DOCUMENT_CONTENT_FRONT = 1;
const DOCUMENT_CONTENT_BACK = 2;
const DOCUMENT_CONTENT_LEFT_SLEEVE = 4;
const DOCUMENT_CONTENT_RIGHT_SLEEVE = 5;
const DOCUMENT_SUB_PLAIN_COMMON = 5;

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

const formatDateForHeader = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "yyyy/M/d");
};

const formatDeliveryDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return format(d, "d/M/yyyy");
};

const addWorkingDays = (startDate, workingDays) => {
  if (!startDate || workingDays == null) return null;
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return null;
  const days = Number(workingDays);
  if (Number.isNaN(days) || days < 0) return null;
  d.setDate(d.getDate() + Math.round(days));
  return d;
};

const getAllFabricDisplay = (fabrics) => {
  if (!Array.isArray(fabrics) || fabrics.length === 0) return "-";
  const entries = fabrics
    .map((item) => {
      const name = item?.fabricName?.trim() || "";
      const gsm = item?.gsmName?.trim() || "";
      const color = item?.colorCodeName?.trim() || "";
      const core = [name, gsm].filter(Boolean).join(" ");
      if (!core && !color) return "";
      if (core && color) return `${core} (${color})`;
      return core || color;
    })
    .filter(Boolean);
  return entries.length > 0 ? entries.join(" / ") : "-";
};

const getAllColourDisplay = (fabrics) => {
  if (!Array.isArray(fabrics) || fabrics.length === 0) return "-";
  const colors = Array.from(
    new Set(
      fabrics
        .map((item) => item?.colorCodeName?.trim() || "")
        .filter(Boolean)
    )
  );
  return colors.length > 0 ? colors.join(" / ") : "-";
};

const getSleeveLengthDisplay = (sleeveResult) => {
  if (!sleeveResult) return "-";
  const longVal =
    sleeveResult.long === 1 ||
    sleeveResult.long === "1" ||
    sleeveResult.Long === 1 ||
    sleeveResult.Long === "1";
  const shortVal =
    sleeveResult.short === 1 ||
    sleeveResult.short === "1" ||
    sleeveResult.Short === 1 ||
    sleeveResult.Short === "1";
  if (longVal && shortVal) return "Long / Short";
  if (longVal) return "Long";
  if (shortVal) return "Short";
  return "-";
};

const getPatternDisplay = (sleeveResult) => {
  if (!sleeveResult) return "-";
  const normalVal =
    sleeveResult.normal === "1" ||
    sleeveResult.normal === 1 ||
    sleeveResult.Normal === "1" ||
    sleeveResult.Normal === 1;
  const raglanVal =
    sleeveResult.wrangler === "1" ||
    sleeveResult.wrangler === 1 ||
    sleeveResult.Wrangler === "1" ||
    sleeveResult.Wrangler === 1;
  if (normalVal && raglanVal) return "Normal / Raglan";
  if (raglanVal) return "Raglan";
  if (normalVal) return "Normal";
  return "-";
};

const getSleeveTypeText = (type) => {
  const n = Number(type);
  switch (n) {
    case 1:
    case 5:
      return "HEM";
    case 2:
    case 6:
      return "Double HEM";
    case 3:
    case 7:
      return "Knitted Cuff";
    case 4:
    case 8:
      return "Fabric Cuff";
    case 10:
      return "Tiffin Knitted Cuff";
    default:
      return "-";
  }
};

const getSleeveFinishDisplay = (sleeveResult) => {
  if (!sleeveResult) return "-";
  const shortVal =
    sleeveResult.short === 1 ||
    sleeveResult.short === "1" ||
    sleeveResult.Short === 1 ||
    sleeveResult.Short === "1";
  const longVal =
    sleeveResult.long === 1 ||
    sleeveResult.long === "1" ||
    sleeveResult.Long === 1 ||
    sleeveResult.Long === "1";
  const shortType = sleeveResult.shortType ?? sleeveResult.ShortType;
  const longType = sleeveResult.longType ?? sleeveResult.LongType;

  if (shortVal && !longVal) return getSleeveTypeText(shortType);
  if (longVal && !shortVal) return getSleeveTypeText(longType);
  if (shortVal && longVal) {
    const shortText = getSleeveTypeText(shortType);
    const longText = getSleeveTypeText(longType);
    if (shortText === longText) return shortText;
    if (shortText === "-" && longText !== "-") return longText;
    if (longText === "-" && shortText !== "-") return shortText;
    return `${shortText} / ${longText}`;
  }
  return "-";
};

const normalizeSleeveResult = (json) => {
  const result = json?.result;
  if (Array.isArray(result)) return result[0] || null;
  return result || null;
};

const hasSleeveSelection = (sleeveResult) => {
  if (!sleeveResult) return false;
  const keys = ["short", "long", "normal", "wrangler", "Short", "Long", "Normal", "Wrangler"];
  if (keys.some((key) => sleeveResult[key] === 1 || sleeveResult[key] === "1")) return true;
  const shortType = Number(sleeveResult.shortType ?? sleeveResult.ShortType);
  const longType = Number(sleeveResult.longType ?? sleeveResult.LongType);
  return (shortType > 0 && shortType !== 9) || (longType > 0 && longType !== 9);
};

const getCollarSelectionLabel = (row) => {
  const neckType = Number(row?.necKTypes);
  const firstRow = Number(row?.neckFirstRows);
  if (neckType === 2 && firstRow === 5) return "Chinese Collar Crew Neck";
  if (neckType === 2 && firstRow === 6) return "Crew Neck";
  if (neckType === 3 && firstRow === 7) return "V Neck";
  if (neckType === 3 && firstRow === 8) return "Chinese V Neck";
  if (neckType === 3 && firstRow === 9) return "Full CLR V Neck";
  if (neckType === 4) return "Full Collar";
  if (neckType === 5) return "Chinese Collar";
  if (neckType === 1 && firstRow !== 10) return "Polo Neck";
  return "";
};

const getNeckTypeName = (necKTypes) => {
  const n = parseInt(necKTypes, 10);
  switch (n) {
    case 1:
      return "POLO";
    case 2:
      return "Crew Neck";
    case 3:
      return "V Neck";
    case 4:
      return "Full Collar";
    case 5:
      return "Chinese Collar";
    default:
      return "";
  }
};

const getWindowType = (windowType) => {
  const wt = Number(windowType);
  switch (wt) {
    case 1:
      return "T-Shirt";
    case 2:
      return "Shirt";
    case 3:
      return "Short";
    case 4:
      return "Bottom";
    case 5:
      return "Cap";
    case 6:
      return "Visor";
    default:
      return "";
  }
};

const getPanelImageUrl = (panels, contentType, subContentType) => {
  if (!Array.isArray(panels)) return "";
  const exact = panels.find(
    (d) =>
      Number(d?.documentContentType) === Number(contentType) &&
      Number(d?.documentSubContentType) === Number(subContentType) &&
      d?.documentURL
  );
  if (exact?.documentURL) return exact.documentURL;
  const fallback = panels.find(
    (d) => Number(d?.documentContentType) === Number(contentType) && d?.documentURL
  );
  return fallback?.documentURL || "";
};

const getPlacketColorDisplay = (neckTypeSource, type) => {
  if (!neckTypeSource) return "-";
  const isInner = type === "inner";
  const candidates = isInner
    ? [
        neckTypeSource.innerPlacketColorCodeName,
        neckTypeSource.innerPlacketColorName,
        neckTypeSource.InnerPlacketColorCodeName,
        neckTypeSource.InnerPlacketColorName,
      ]
    : [
        neckTypeSource.outerPlacketColorCodeName,
        neckTypeSource.outerPlacketColorName,
        neckTypeSource.OuterPlacketColorCodeName,
        neckTypeSource.OuterPlacketColorName,
      ];
  const selected = candidates.find((value) => typeof value === "string" && value.trim());
  return selected ? selected.trim() : "-";
};

const getPlacketDisplay = (neckTypeSource) => {
  if (!neckTypeSource) return "-";
  const rawValue =
    neckTypeSource.neck3rdRowS ??
    neckTypeSource.Neck3rdRowS ??
    neckTypeSource.neck3RdRowS ??
    neckTypeSource.neck3rdRows ??
    neckTypeSource.Neck3rdRows;
  const n = Number(rawValue);
  if (n === 1) return "Single Placket";
  if (n === 2) return "Piping Single Placket";
  if (n === 3) return "Single Color Double Placket";
  if (n === 4) return "Double Color Double Placket";
  if (n === 5) return "Zipper";
  return "-";
};

const getSideVentDisplay = (neckTypeSource) => {
  if (!neckTypeSource) return "-";
  const rawValue =
    neckTypeSource.sideVent ??
    neckTypeSource.sideVents ??
    neckTypeSource.sideVentType ??
    neckTypeSource.sideVentStatus ??
    neckTypeSource.SideVent ??
    neckTypeSource.SideVents ??
    neckTypeSource.SideVentType ??
    neckTypeSource.SideVentStatus;
  if (typeof rawValue === "boolean") return rawValue ? "Yes" : "No";
  const n = Number(rawValue);
  if (n === 1) return "Yes";
  if (n === 2) return "No";
  return "-";
};

const mapSizeRows = (sizesList) =>
  sizesList.map((row) => ({
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
    sixXL: row.sixXL ?? row.SixXL,
    sevenXL: row.sevenXL ?? row.SevenXL,
    eightXL: row.eightXL ?? row.EightXL,
    totalQty: row.totalQty ?? row.TotalQty ?? 0,
  }));

const getQty = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : "-";
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const getOriginSafe = (value) => {
  try {
    if (!value) return "";
    return new URL(
      value,
      typeof window !== "undefined" ? window.location.origin : undefined
    ).origin;
  } catch {
    return "";
  }
};

const shouldUseAuthForImage = (src) => {
  if (!src) return false;
  const imageOrigin = getOriginSafe(src);
  if (!imageOrigin) return false;
  if (typeof window !== "undefined" && imageOrigin === window.location.origin) return true;
  const apiOrigin = getOriginSafe(BASE_URL);
  return Boolean(apiOrigin && imageOrigin === apiOrigin);
};

const fetchImageAsDataUrl = async (requestUrl, requestInit = {}) => {
  const res = await fetch(requestUrl, {
    method: "GET",
    ...requestInit,
  });
  if (!res.ok) return "";
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (
    contentType &&
    !contentType.startsWith("image/") &&
    !contentType.includes("application/octet-stream")
  ) {
    return "";
  }
  const blob = await res.blob();
  if (
    blob.type &&
    !blob.type.toLowerCase().startsWith("image/") &&
    !blob.type.toLowerCase().includes("application/octet-stream")
  ) {
    return "";
  }
  const dataUrl = await blobToDataUrl(blob);
  return typeof dataUrl === "string" && dataUrl.startsWith("data:")
    ? dataUrl
    : "";
};

const tryInlineImageSource = async (src, token) => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;

  try {
    const proxyDataUrl = await fetchImageAsDataUrl(
      `/api/image-proxy?url=${encodeURIComponent(src)}`,
      {
        headers: token ? { "x-auth-token": token } : undefined,
        credentials: "same-origin",
      }
    );
    if (proxyDataUrl) return proxyDataUrl;
  } catch {
    // Fall back to direct browser fetches.
  }

  const requestCandidates = [
    {
      headers: undefined,
      credentials: "omit",
    },
    ...(token && shouldUseAuthForImage(src)
      ? [
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          },
        ]
      : []),
  ];

  for (const req of requestCandidates) {
    try {
      const dataUrl = await fetchImageAsDataUrl(src, {
        headers: req.headers,
        credentials: req.credentials,
        mode: "cors",
      });
      if (dataUrl) return dataUrl;
    } catch {
      // Keep trying fallback request options.
    }
  }

  return src;
};

const canvasSliceHasContent = (ctx, width, height) => {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 250 || g < 250 || b < 250) return true;
  }
  return false;
};

export default function CuttingPrintPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const inquiryId = router.query.inquiryId;
  const optionId = router.query.optionId;
  const sentQuotationId = router.query.sentQuotationId;
  const startDate = router.query.startDate;
  const workingDays = router.query.workingDays;
  const styleNameQuery = router.query.styleName;
  const customerNameQuery = router.query.customerName;
  const optionNameQuery = router.query.optionName;
  const selectedOptionQuery = router.query.selectedOption;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!router.isReady || !inquiryId || !optionId || !sentQuotationId) return;

    const run = async () => {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const initRes = await fetch(
          `${BASE_URL}/Ongoing/InitializeTechPack?inquiryId=${inquiryId}&optionId=${optionId}&sentQuotationId=${sentQuotationId}`,
          {
            method: "POST",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }
        );
        if (!initRes.ok) throw new Error("Failed to initialize tech pack.");
        const initJson = await initRes.json();
        const init = initJson?.result;
        if (!init) throw new Error("Invalid tech pack response.");

        const ongoingInquiryId = init.ongoingInquiryId;
        const selectedOptionId = init.optionId ?? optionId;
        const windowType = init.windowType;

        const [
          fabricsRes,
          panelsRes,
          sleeveRes,
          inquirySleeveRes,
          sizesRes,
          neckRes,
          inquiryNeckTypeRes,
          ongoingNeckListRes,
          inquiryNeckList1Res,
          inquiryNeckList2Res,
          inquiryNeckList3Res,
          inquiryNeckList4Res,
          inquiryNeckList5Res,
        ] = await Promise.all([
          fetch(`${BASE_URL}/Ongoing/GetAllOngoingFabrics?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/Ongoing/GetAllOngoingDocumentPanels?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/Ongoing/GetOngoingSleeve?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/Ongoing/GetAllOngoingSizes?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/Ongoing/GetOngoingNeckType?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquiryNeck/GetNeckType?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=1`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=2`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=3`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=4`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=5`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              "Content-Type": "application/json",
            },
          }),
        ]);

        const fabricsJson = fabricsRes.ok ? await fabricsRes.json() : {};
        const fabrics = Array.isArray(fabricsJson?.result) ? fabricsJson.result : [];
        const panelsJson = panelsRes.ok ? await panelsRes.json() : {};
        const panels = Array.isArray(panelsJson?.result) ? panelsJson.result : [];
        const sleeveJson = sleeveRes.ok ? await sleeveRes.json() : {};
        const inquirySleeveJson = inquirySleeveRes.ok ? await inquirySleeveRes.json() : {};
        const sleeveOngoing = normalizeSleeveResult(sleeveJson);
        const sleeveInquiry = normalizeSleeveResult(inquirySleeveJson);
        const sleeveSource = hasSleeveSelection(sleeveOngoing) ? sleeveOngoing : sleeveInquiry;
        const patternDisplay = getPatternDisplay(sleeveSource);
        const sleeveFinishDisplay = getSleeveFinishDisplay(sleeveSource);
        const sleeveLengthDisplay = getSleeveLengthDisplay(sleeveSource);
        const sizesJson = sizesRes.ok ? await sizesRes.json() : {};
        const sizesList = Array.isArray(sizesJson?.result) ? sizesJson.result : [];
        const sizeRows = mapSizeRows(sizesList);
        const firstSizeRow = sizeRows[0] || {};
        const neckJson = neckRes.ok ? await neckRes.json() : {};
        const inquiryNeckTypeJson = inquiryNeckTypeRes.ok ? await inquiryNeckTypeRes.json() : {};
        const ongoingNeckListJson = ongoingNeckListRes.ok ? await ongoingNeckListRes.json() : {};
        const inquiryNeckRows = [
          ...((inquiryNeckList1Res.ok ? (await inquiryNeckList1Res.json())?.result : []) || []),
          ...((inquiryNeckList2Res.ok ? (await inquiryNeckList2Res.json())?.result : []) || []),
          ...((inquiryNeckList3Res.ok ? (await inquiryNeckList3Res.json())?.result : []) || []),
          ...((inquiryNeckList4Res.ok ? (await inquiryNeckList4Res.json())?.result : []) || []),
          ...((inquiryNeckList5Res.ok ? (await inquiryNeckList5Res.json())?.result : []) || []),
        ];
        const ongoingNeckRows = Array.isArray(ongoingNeckListJson?.result) ? ongoingNeckListJson.result : [];
        const neckRows = inquiryNeckRows.length > 0 ? inquiryNeckRows : ongoingNeckRows;
        const selectedCollarLabels = Array.from(new Set(neckRows.map(getCollarSelectionLabel).filter(Boolean)));

        const computedTotal = SIZE_KEYS.reduce(
          (sum, { key }) => sum + (Number(firstSizeRow?.[key]) || 0),
          0
        );

        const neckTypeName =
          inquiryNeckTypeJson?.result?.necKTypes != null
            ? getNeckTypeName(inquiryNeckTypeJson.result.necKTypes)
            : neckJson?.result?.necKTypes != null
              ? getNeckTypeName(neckJson.result.necKTypes)
              : "";
        const neckTypeSource = neckJson?.result || inquiryNeckTypeJson?.result || null;
        const windowTypeName = getWindowType(windowType) || "";
        const type =
          [neckTypeName, windowTypeName].filter(Boolean).join(" ") ||
          optionNameQuery ||
          selectedOptionQuery ||
          "-";
        const deliveryDateRaw = addWorkingDays(startDate, workingDays);
        const deliveryDate = deliveryDateRaw
          ? formatDeliveryDate(deliveryDateRaw.toISOString())
          : "-";

        setData({
          inquiryStyleName: init.styleName ?? styleNameQuery ?? "-",
          customerName: init.customerName ?? customerNameQuery ?? "-",
          fabricDisplay: getAllFabricDisplay(fabrics),
          colourDisplay: getAllColourDisplay(fabrics),
          patternDisplay,
          sleeveFinishDisplay,
          sleeveLengthDisplay,
          collarDisplay: selectedCollarLabels.length > 0 ? selectedCollarLabels.join(" / ") : "-",
          placketDisplay: getPlacketDisplay(neckTypeSource),
          innerPlacketColor: getPlacketColorDisplay(neckTypeSource, "inner"),
          outerPlacketColor: getPlacketColorDisplay(neckTypeSource, "outer"),
          sideVentDisplay: getSideVentDisplay(neckTypeSource),
          date: formatDateForHeader(startDate),
          deliveryDate,
          type,
          frontImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_FRONT, DOCUMENT_SUB_PLAIN_COMMON),
          backImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_BACK, DOCUMENT_SUB_PLAIN_COMMON),
          leftSleeveImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_LEFT_SLEEVE, DOCUMENT_SUB_PLAIN_COMMON),
          rightSleeveImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_RIGHT_SLEEVE, DOCUMENT_SUB_PLAIN_COMMON),
          sizeRows,
          sizeRow: firstSizeRow,
          totalQty:
            Number(firstSizeRow?.totalQty) > 0
              ? Number(firstSizeRow.totalQty)
              : computedTotal,
        });
      } catch (error) {
        console.error("Error loading cutting print:", error);
        toast.error("Failed to load cutting print data.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    customerNameQuery,
    inquiryId,
    optionId,
    optionNameQuery,
    router.isReady,
    selectedOptionQuery,
    sentQuotationId,
    startDate,
    styleNameQuery,
    workingDays,
  ]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    const images = contentRef.current.querySelectorAll("img");

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      await Promise.all(
        Array.from(images).map(async (img) => {
          const inlineSrc = await tryInlineImageSource(
            img.currentSrc || img.src,
            token
          );
          if (inlineSrc && inlineSrc !== img.src) {
            img.setAttribute("data-original-src", img.src);
            img.src = inlineSrc;
          }
        })
      );

      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
          });
        })
      );

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 15000,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const pageHeightPx = Math.floor((canvas.width * pageHeightMm) / pageWidthMm);
      const pageCount = Math.max(1, Math.ceil(canvas.height / pageHeightPx));
      let hasAddedPage = false;

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const sliceY = pageIndex * pageHeightPx;
        const sliceHeight = Math.min(pageHeightPx, canvas.height - sliceY);
        if (sliceHeight <= 0) continue;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const pageCtx = pageCanvas.getContext("2d");
        if (!pageCtx) continue;
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          sliceY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        if (!canvasSliceHasContent(pageCtx, pageCanvas.width, pageCanvas.height)) {
          continue;
        }

        const sliceImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        const sliceHeightMm = (sliceHeight * pageWidthMm) / canvas.width;
        if (hasAddedPage) pdf.addPage();
        pdf.addImage(sliceImgData, "JPEG", 0, 0, pageWidthMm, sliceHeightMm);
        hasAddedPage = true;
      }

      if (!hasAddedPage) {
        const fallbackData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(fallbackData, "JPEG", 0, 0, pageWidthMm, pageHeightMm);
      }

      pdf.save(`Cutting_${sentQuotationId || "document"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      Array.from(images).forEach((img) => {
        const originalSrc = img.getAttribute("data-original-src");
        if (originalSrc) {
          img.src = originalSrc;
          img.removeAttribute("data-original-src");
        }
      });
    }
  };

  const specs = useMemo(
    () => [
      { label: "FABRIC", value: data?.fabricDisplay ?? "-" },
      { label: "COLOUR", value: data?.colourDisplay ?? "-" },
      { label: "PATTERN", value: data?.patternDisplay ?? "-" },
      { label: "PLACKET", value: data?.placketDisplay ?? "-" },
      { label: "INNER PLACKET", value: data?.innerPlacketColor ?? "-" },
      { label: "OUTER PLACKET", value: data?.outerPlacketColor ?? "-" },
      { label: "SIDE VENT", value: data?.sideVentDisplay ?? "-" },
      { label: "SLEEVE", value: data?.sleeveFinishDisplay ?? "-" },
      { label: "SLEEVE TYPE", value: data?.sleeveLengthDisplay ?? "-" },
      { label: "COLLAR", value: data?.collarDisplay ?? "-" },
    ],
    [data]
  );
  const sizeRowsForColumns =
    data?.sizeRows && data.sizeRows.length > 0 ? data.sizeRows : [data?.sizeRow || {}];
  const numQtyColumns = Math.max(1, sizeRowsForColumns.length);
  const combinedTotal =
    numQtyColumns >= 2
      ? sizeRowsForColumns.reduce(
          (sum, row) =>
            sum +
            (Number(row?.totalQty) > 0
              ? Number(row.totalQty)
              : SIZE_KEYS.reduce((rowSum, { key }) => rowSum + (Number(row?.[key]) || 0), 0)),
          0
        )
      : 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        "@media print": { p: 0, backgroundColor: "#fff" },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          p: 2,
          "@media print": { maxWidth: "100%", borderRadius: 0, boxShadow: "none", p: 0 },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mb: 2, pb: 1, borderBottom: "2px solid #e0e0e0", "@media print": { display: "none" } }}>
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ textTransform: "none" }}>
              Print
            </Button>
            <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF} sx={{ textTransform: "none" }}>
              Download PDF
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ width: { xs: "100%", sm: "210mm" }, minHeight: { xs: "auto", sm: "297mm" }, mx: "auto", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", backgroundColor: "#fff" }}>
            <Typography variant="body2" color="text.secondary">
              Loading cutting print...
            </Typography>
          </Box>
        ) : data ? (
          <Box
            ref={contentRef}
            sx={{
              width: { xs: "100%", sm: "210mm" },
              minHeight: { xs: "auto", sm: "297mm" },
              mx: "auto",
              p: "0.4in",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "@media print": { boxShadow: "none" },
            }}
          >
            <Box
              sx={{
                minHeight: { sm: "297mm" },
                pageBreakAfter: "always",
                breakAfter: "page",
                "@media print": { minHeight: "297mm" },
              }}
            >
            <Box sx={{ border: "1px solid #000", mb: 1.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                <Box sx={{ p: 1, borderRight: "1px solid #000", fontSize: "0.8rem" }}>
                  <strong>STYLE NAME :</strong> {data.inquiryStyleName}
                </Box>
                <Box sx={{ p: 1, fontSize: "0.8rem" }}>
                  <strong>CLIENT NAME :</strong> {data.customerName}
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
                <Box sx={{ p: 1, borderRight: "1px solid #000", fontSize: "0.8rem" }}>
                  <strong>FABRIC :</strong> {data.fabricDisplay}
                </Box>
                <Box sx={{ p: 1, borderRight: "1px solid #000", fontSize: "0.8rem" }}>
                  <strong>DATE :</strong> {data.date}
                </Box>
                <Box sx={{ p: 1, fontSize: "0.8rem" }}>
                  <strong>TYPE :</strong> {data.type}
                </Box>
              </Box>
              <Box sx={{ p: 1, fontSize: "0.8rem" }}>
                <strong>DELIVERY DATE :</strong> {data.deliveryDate}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1.5 }}>
              <Box sx={{ border: "1px solid #ccc", p: 1, minHeight: 290, display: "flex", justifyContent: "center", alignItems: "center" }}>
                {data.frontImageUrl ? (
                  <img src={data.frontImageUrl} alt="Front panel" style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }} />
                ) : (
                  <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                )}
              </Box>
              <Box sx={{ border: "1px solid #ccc", p: 1, minHeight: 290, display: "flex", justifyContent: "center", alignItems: "center" }}>
                {data.backImageUrl ? (
                  <img src={data.backImageUrl} alt="Back panel" style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }} />
                ) : (
                  <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 0.38fr", gap: 1.5 }}>
              <Box sx={{ border: "1px solid #000" }}>
                {specs.map((spec) => (
                  <Box key={`${spec.label}-${spec.value}`} sx={{ display: "grid", gridTemplateColumns: "42% 58%", borderBottom: "1px solid #000", "&:last-of-type": { borderBottom: "none" } }}>
                    <Box sx={{ p: 0.7, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>{spec.label}</Box>
                    <Box sx={{ p: 0.7, fontSize: "0.72rem" }}>{spec.value}</Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ border: "1px solid #000" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${numQtyColumns}, 1fr)`, borderBottom: "1px solid #000", backgroundColor: "#f9f9f9" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>Size</Box>
                  {(numQtyColumns === 1 ? [null] : sizeRowsForColumns).map((_, idx) => (
                    <Box
                      key={`qty-head-${idx}`}
                      sx={{
                        p: 0.6,
                        borderRight: idx === numQtyColumns - 1 ? "none" : "1px solid #000",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        textAlign: "center",
                      }}
                    >
                      Qty
                    </Box>
                  ))}
                </Box>
                {SIZE_KEYS.map(({ key, label }) => (
                  <Box key={key} sx={{ display: "grid", gridTemplateColumns: `56px repeat(${numQtyColumns}, 1fr)`, borderBottom: "1px solid #000" }}>
                    <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontSize: "0.68rem", textAlign: "center" }}>{label}</Box>
                    {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, idx) => (
                      <Box
                        key={`${key}-${idx}`}
                        sx={{
                          p: 0.55,
                          borderRight: idx === numQtyColumns - 1 ? "none" : "1px solid #000",
                          fontSize: "0.68rem",
                          textAlign: "center",
                        }}
                      >
                        {getQty(row?.[key])}
                      </Box>
                    ))}
                  </Box>
                ))}
                <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${numQtyColumns}, 1fr)`, borderBottom: numQtyColumns >= 2 ? "1px solid #000" : "none" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>TOTAL</Box>
                  {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, idx) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box
                        key={`total-${idx}`}
                        sx={{
                          p: 0.6,
                          borderRight: idx === numQtyColumns - 1 ? "none" : "1px solid #000",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          textAlign: "center",
                        }}
                      >
                        {getQty(rowTotal)}
                      </Box>
                    );
                  })}
                </Box>
                {numQtyColumns >= 2 && (
                  <Box sx={{ display: "grid", gridTemplateColumns: "56px 1fr" }}>
                    <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>TOTAL</Box>
                    <Box sx={{ p: 0.6, fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>
                      {getQty(combinedTotal)}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                pageBreakBefore: "always",
                breakBefore: "page",
                pt: 0,
                mt: 1.5,
                minHeight: { sm: "297mm" },
                pageBreakAfter: "always",
                breakAfter: "page",
                order: 0,
                "@media print": { minHeight: "297mm" },
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1.5 }}>
                <Box>
                  <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Front</Typography>
                  <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 250, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                    {data.frontImageUrl ? (
                      <img src={data.frontImageUrl} alt="Emb/Sub Front" style={{ maxWidth: "100%", maxHeight: "235px", objectFit: "contain" }} />
                    ) : (
                      <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Back</Typography>
                  <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 250, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                    {data.backImageUrl ? (
                      <img src={data.backImageUrl} alt="Emb/Sub Back" style={{ maxWidth: "100%", maxHeight: "235px", objectFit: "contain" }} />
                    ) : (
                      <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1.2 }}>
                <Box>
                  <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Left Sleeve</Typography>
                  <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 120, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                    {data.leftSleeveImageUrl ? (
                      <img src={data.leftSleeveImageUrl} alt="Emb/Sub Left Sleeve" style={{ maxWidth: "100%", maxHeight: "105px", objectFit: "contain" }} />
                    ) : (
                      <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Right Sleeve</Typography>
                  <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 120, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                    {data.rightSleeveImageUrl ? (
                      <img src={data.rightSleeveImageUrl} alt="Emb/Sub Right Sleeve" style={{ maxWidth: "100%", maxHeight: "105px", objectFit: "contain" }} />
                    ) : (
                      <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ width: "100%", minWidth: 0, mb: 1.2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", mb: 0.4 }}>Quantity Breakdown</Typography>
                <Box sx={{ border: "1px solid #000" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: `72px repeat(${SIZE_KEYS.length}, minmax(0, 1fr)) 52px`, borderBottom: "1px solid #000", backgroundColor: "#f9f9f9" }}>
                    <Box sx={{ p: 0.45, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.62rem", textAlign: "center" }}>Size</Box>
                    {SIZE_KEYS.map(({ label }) => (
                      <Box key={label} sx={{ p: 0.45, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.62rem", textAlign: "center" }}>
                        {label}
                      </Box>
                    ))}
                    <Box sx={{ p: 0.45, fontWeight: 700, fontSize: "0.62rem", textAlign: "center" }}>TOTAL</Box>
                  </Box>
                  {((data.sizeRows && data.sizeRows.length > 0) ? data.sizeRows : [data.sizeRow]).map((row, rowIdx, arr) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box
                        key={`emb-row-${rowIdx}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: `72px repeat(${SIZE_KEYS.length}, minmax(0, 1fr)) 52px`,
                          borderBottom: rowIdx === arr.length - 1 ? "none" : "1px solid #000",
                        }}
                      >
                        <Box sx={{ p: 0.45, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.62rem" }}>
                          UNISEX {arr.length > 1 ? rowIdx + 1 : ""}
                        </Box>
                        {SIZE_KEYS.map(({ key }, idx) => (
                          <Box
                            key={`${key}-${rowIdx}`}
                            sx={{
                              p: 0.45,
                              borderRight: idx === SIZE_KEYS.length - 1 ? "1px solid #000" : "1px solid #000",
                              fontSize: "0.62rem",
                              textAlign: "center",
                            }}
                          >
                            {getQty(row?.[key])}
                          </Box>
                        ))}
                        <Box sx={{ p: 0.45, fontSize: "0.62rem", textAlign: "center", fontWeight: 700 }}>
                          {getQty(rowTotal)}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ border: "1px solid #000", width: "100%", mb: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.9fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem" }}>MARKER LENGTH</Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.8rem" }}></Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>REQVD</Box>
                  <Box sx={{ p: 0.6, fontSize: "0.8rem" }}></Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.9fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem" }}>FABRIC</Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.8rem" }}></Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>CUT</Box>
                  <Box sx={{ p: 0.6, color: "#b04343", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>RE-CUT</Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.9fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem" }}>COLOR</Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.8rem" }}></Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>OFF CUT</Box>
                  <Box sx={{ p: 0.6, color: "#b04343", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>OFF CUT</Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.9fr" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.8rem" }}></Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.8rem" }}></Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>BALANCE</Box>
                  <Box sx={{ p: 0.6, color: "#b04343", fontWeight: 700, fontSize: "0.8rem", textAlign: "center" }}>BALANCE</Box>
                </Box>
              </Box>

            </Box>

            <Box
              sx={{
                pageBreakBefore: "always",
                breakBefore: "page",
                pt: 0,
                mt: 1.5,
                minHeight: { sm: "297mm" },
                pageBreakAfter: "always",
                breakAfter: "page",
                order: 2,
                "@media print": { minHeight: "297mm" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: { xs: "auto", sm: "250mm" },
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", sm: "252mm" },
                    transform: { xs: "none", sm: "rotate(-90deg) scale(0.92)" },
                    transformOrigin: "center center",
                    transformBox: "fill-box",
                  }}
                >
              <Box sx={{ border: "1px solid #000", mb: 1.2 }}>
                <Box sx={{ p: 0.7, borderBottom: "1px solid #000", textAlign: "center", fontWeight: 700, fontSize: "0.95rem" }}>
                  STYLENAME : {data.inquiryStyleName || "-"}
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: `60px repeat(${numQtyColumns}, 45px) 1fr 1fr 1fr 1fr 1fr 1fr 120px`, borderBottom: "1px solid #000", backgroundColor: "#f9f9f9" }}>
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>SIZE</Box>
                  {(numQtyColumns === 1 ? [null] : sizeRowsForColumns).map((_, idx) => (
                    <Box key={`p3-qty-head-${idx}`} sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>QTY</Box>
                  ))}
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>FRONT</Box>
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>BACK</Box>
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>SL/R</Box>
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>SL/L</Box>
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>CLR</Box>
                  <Box sx={{ py: 0.72, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>PKT</Box>
                  <Box sx={{ py: 0.72, px: 0.55, fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>MARKER LENGTH</Box>
                </Box>

                {SIZE_KEYS.map(({ key, label }, idx, arr) => (
                  <Box
                    key={`third-page-${key}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: `60px repeat(${numQtyColumns}, 45px) 1fr 1fr 1fr 1fr 1fr 1fr 120px`,
                      minHeight: "10mm",
                      borderBottom: idx === arr.length - 1 ? "none" : "1px solid #000",
                    }}
                  >
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center" }}>{label}</Box>
                    {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, qIdx) => (
                      <Box key={`p3-${key}-${qIdx}`} sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center" }}>
                        {getQty(row?.[key])}
                      </Box>
                    ))}
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.62, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.62, px: 0.5 }} />
                  </Box>
                ))}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `60px repeat(${numQtyColumns}, 45px) 1fr 1fr 1fr 1fr 1fr 1fr 120px`,
                    borderTop: "1px solid #000",
                  }}
                >
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", fontWeight: 700, textAlign: "center" }}>
                    TOTAL
                  </Box>
                  {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, qIdx) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box
                        key={`p3-total-${qIdx}`}
                        sx={{ p: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", fontWeight: 700, textAlign: "center" }}
                      >
                        {getQty(rowTotal)}
                      </Box>
                    );
                  })}
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5 }} />
                </Box>
              </Box>

              <Box sx={{ border: "1px solid #000", width: "56%", ml: "auto", mb: 1.5 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>FABRIC</Box>
                  <Box sx={{ p: 0.55, fontSize: "0.72rem" }} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>COLOR</Box>
                  <Box sx={{ p: 0.55, fontSize: "0.72rem" }} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>RECIVD CUT</Box>
                  <Box sx={{ p: 0.55, fontSize: "0.72rem", color: "#b04343", fontWeight: 700 }}>RE-CUT</Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>OFF CUT</Box>
                  <Box sx={{ p: 0.55, fontSize: "0.72rem", color: "#b04343", fontWeight: 700 }}>OFF CUT</Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>BALANCE</Box>
                  <Box sx={{ p: 0.55, fontSize: "0.72rem", color: "#b04343", fontWeight: 700 }}>BALANCE</Box>
                </Box>
              </Box>
            </Box>
                </Box>
              </Box>

            <Box
              sx={{
                pageBreakBefore: "always",
                breakBefore: "page",
                pt: 0,
                mt: 1.5,
                minHeight: { sm: "297mm" },
                order: 1,
                "@media print": { minHeight: "297mm" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: { xs: "auto", sm: "250mm" },
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", sm: "258mm" },
                    transform: { xs: "none", sm: "rotate(-90deg) scale(0.93)" },
                    transformOrigin: "center center",
                    transformBox: "fill-box",
                  }}
                >
              <Box sx={{ border: "1px solid #000", mb: 1.2 }}>
                <Box sx={{ p: 0.7, borderBottom: "1px solid #000", textAlign: "center", fontWeight: 700, fontSize: "0.95rem" }}>
                  STYLENAME : {data.inquiryStyleName || "-"}
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `70px repeat(${numQtyColumns}, 45px) 100px 75px 95px 60px repeat(${numQtyColumns}, 45px) 60px`,
                    borderBottom: "1px solid #000",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <Box sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>SIZE</Box>
                  {(numQtyColumns === 1 ? [null] : sizeRowsForColumns).map((_, idx) => (
                    <Box key={`last-qty-head-a-${idx}`} sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center", color: "#b04343" }}>
                      QTY
                    </Box>
                  ))}
                  <Box sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>TUBE(2) / SNG: PLY(1)</Box>
                  <Box sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>RATIO</Box>
                  <Box sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>0.5 MARKER RATIO</Box>
                  <Box sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>PLY</Box>
                  {(numQtyColumns === 1 ? [null] : sizeRowsForColumns).map((_, idx) => (
                    <Box key={`last-qty-head-b-${idx}`} sx={{ py: 0.7, px: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>
                      QTY
                    </Box>
                  ))}
                  <Box sx={{ py: 0.7, px: 0.55, fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>+/-</Box>
                </Box>

                {SIZE_KEYS.map(({ key, label }, idx) => (
                  <Box
                    key={`last-page-${key}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: `70px repeat(${numQtyColumns}, 45px) 100px 75px 95px 60px repeat(${numQtyColumns}, 45px) 60px`,
                      minHeight: "10mm",
                      borderBottom: idx === SIZE_KEYS.length - 1 ? "none" : "1px solid #000",
                    }}
                  >
                    <Box sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center" }}>{label}</Box>
                    {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, qIdx) => (
                      <Box key={`last-a-${key}-${qIdx}`} sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center", color: "#b04343", fontWeight: 700 }}>
                        {getQty(row?.[key])}
                      </Box>
                    ))}
                    <Box sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center" }}>2</Box>
                    <Box sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000" }} />
                    <Box sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center", color: "#b04343", fontWeight: 700 }}>0</Box>
                    <Box sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000" }} />
                    {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, qIdx) => (
                      <Box key={`last-b-${key}-${qIdx}`} sx={{ py: 0.6, px: 0.5, borderRight: "1px solid #000", fontSize: "0.7rem", textAlign: "center", color: "#b04343", fontWeight: 700 }}>
                        {getQty(row?.[key])}
                      </Box>
                    ))}
                    <Box sx={{ py: 0.6, px: 0.5, fontSize: "0.7rem", textAlign: "center", color: "#b04343", fontWeight: 700 }}>0</Box>
                  </Box>
                ))}

                <Box sx={{ display: "grid", gridTemplateColumns: `70px repeat(${numQtyColumns}, 45px) 100px 75px 95px 60px repeat(${numQtyColumns}, 45px) 60px`, borderTop: "1px solid #000" }}>
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, idx) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box key={`last-total-a-${idx}`} sx={{ p: 0.5, borderRight: "1px solid #000", textAlign: "center", color: "#b04343", fontWeight: 700, fontSize: "0.78rem" }}>
                        {getQty(rowTotal)}
                      </Box>
                    );
                  })}
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000", textAlign: "center", fontSize: "0.72rem", fontWeight: 700 }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000", textAlign: "center", color: "#b04343", fontWeight: 700, fontSize: "0.78rem" }}>0</Box>
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  <Box sx={{ p: 0.5, borderRight: "1px solid #000" }} />
                  {(numQtyColumns === 1 ? [sizeRowsForColumns[0]] : sizeRowsForColumns).map((row, idx) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box key={`last-total-b-${idx}`} sx={{ p: 0.5, borderRight: "1px solid #000", textAlign: "center", color: "#b04343", fontWeight: 700, fontSize: "0.78rem" }}>
                        {getQty(rowTotal)}
                      </Box>
                    );
                  })}
                  <Box sx={{ p: 0.5, textAlign: "center", color: "#b04343", fontWeight: 700, fontSize: "1rem" }}>0</Box>
                </Box>
              </Box>
                </Box>
              </Box>
            </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ width: { xs: "100%", sm: "210mm" }, minHeight: { xs: "auto", sm: "297mm" }, mx: "auto", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", backgroundColor: "#fff" }}>
            <Typography variant="body2" color="error">
              Unable to load cutting print data.
            </Typography>
          </Box>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </Box>
    </Box>
  );
}
