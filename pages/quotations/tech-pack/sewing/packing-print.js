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

const getSleeveDisplay = (sleeveResult) => {
  if (!sleeveResult) return "-";
  const longVal = sleeveResult.long === 1 || sleeveResult.long === "1";
  const shortVal = sleeveResult.short === 1 || sleeveResult.short === "1";
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
  const n = Number(rawValue);
  if (n === 1) return "Yes";
  if (n === 2) return "No";
  return "-";
};

const getYesNoDisplay = (rawValue) => {
  if (typeof rawValue === "boolean") return rawValue ? "Yes" : "No";
  const n = Number(rawValue);
  if (n === 1) return "Yes";
  if (n === 2) return "No";
  return "-";
};

const getShoulderOutlineDisplay = (neckTypeSource) => {
  if (!neckTypeSource) return "-";
  return getYesNoDisplay(
    neckTypeSource.shoulderOutline ??
      neckTypeSource.shoulderOutlines ??
      neckTypeSource.ShoulderOutline ??
      neckTypeSource.ShoulderOutlines
  );
};

const getAHoleOutlineDisplay = (neckTypeSource) => {
  if (!neckTypeSource) return "-";
  return getYesNoDisplay(
    neckTypeSource.aHoleOutline ??
      neckTypeSource.aholeOutline ??
      neckTypeSource.AHoleOutline ??
      neckTypeSource.AholeOutline
  );
};

const getButtonTypeDisplay = (neckTypeSource) => {
  if (!neckTypeSource) return "-";
  const rawValue =
    neckTypeSource.buttonType ??
    neckTypeSource.buttonTypes ??
    neckTypeSource.ButtonType ??
    neckTypeSource.ButtonTypes;
  const n = Number(rawValue);
  if (n === 1) return "Glass";
  if (n === 2) return "Client's";
  return "-";
};

const getButtonsDisplay = (neckTypeSource) => {
  if (!neckTypeSource) return "-";
  const rawButtonCount =
    neckTypeSource.poloButton ??
    neckTypeSource.pOLOButton ??
    neckTypeSource.POLOButton;
  const buttonCount = String(rawButtonCount ?? "").trim();
  const buttonType = getButtonTypeDisplay(neckTypeSource);
  const hasButtonCount = Boolean(buttonCount && buttonCount !== "0");
  const hasButtonType = buttonType !== "-";
  if (hasButtonCount && hasButtonType) return `${buttonCount} (${buttonType})`;
  if (hasButtonCount) return buttonCount;
  if (hasButtonType) return buttonType;
  return "-";
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
    (d) =>
      Number(d?.documentContentType) === Number(contentType) && d?.documentURL
  );
  return fallback?.documentURL || "";
};

const formatSizeQty = (val) => {
  if (val == null || val === "" || Number(val) === 0) return "-";
  const n = Number(val);
  return Number.isNaN(n) ? "-" : String(Math.round(n));
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
    return new URL(value, typeof window !== "undefined" ? window.location.origin : undefined).origin;
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

  // 1) Try through local proxy first (bypasses browser CORS restrictions).
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
    // Fall through to direct browser fetch attempts.
  }

  // 2) Direct browser fetch attempts (works when CORS allows it).
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

  try {
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
  } catch {
    return src;
  }
};

export default function SewingPackingPrintPage() {
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
  const [headerData, setHeaderData] = useState(null);

  useEffect(() => {
    if (!router.isReady || !inquiryId || !optionId || !sentQuotationId) {
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

        if (!initRes.ok) {
          throw new Error("Failed to initialize tech pack.");
        }

        const initJson = await initRes.json();
        const init = initJson?.result;
        if (!init) {
          throw new Error("Invalid tech pack response.");
        }

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
        ] =
          await Promise.all([
            fetch(
              `${BASE_URL}/Ongoing/GetAllOngoingFabrics?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/Ongoing/GetAllOngoingDocumentPanels?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/Ongoing/GetOngoingSleeve?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/Ongoing/GetAllOngoingSizes?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/Ongoing/GetOngoingNeckType?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/InquiryNeck/GetNeckType?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingInquiryId}&optionId=${selectedOptionId}&windowType=${windowType}`,
              {
                method: "GET",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  "Content-Type": "application/json",
                },
              }
            ),
            fetch(
              `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=1`,
              { method: "GET", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" } }
            ),
            fetch(
              `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=2`,
              { method: "GET", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" } }
            ),
            fetch(
              `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=3`,
              { method: "GET", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" } }
            ),
            fetch(
              `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=4`,
              { method: "GET", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" } }
            ),
            fetch(
              `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=5`,
              { method: "GET", headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" } }
            ),
          ]);

        const fabricsJson = fabricsRes.ok ? await fabricsRes.json() : {};
        const fabrics = Array.isArray(fabricsJson?.result) ? fabricsJson.result : [];

        const panelsJson = panelsRes.ok ? await panelsRes.json() : {};
        const panels = Array.isArray(panelsJson?.result) ? panelsJson.result : [];
        const frontImageUrl = getPanelImageUrl(
          panels,
          DOCUMENT_CONTENT_FRONT,
          DOCUMENT_SUB_PLAIN_COMMON
        );
        const backImageUrl = getPanelImageUrl(
          panels,
          DOCUMENT_CONTENT_BACK,
          DOCUMENT_SUB_PLAIN_COMMON
        );

        const sleeveJson = sleeveRes.ok ? await sleeveRes.json() : {};
        const inquirySleeveJson = inquirySleeveRes.ok ? await inquirySleeveRes.json() : {};
        const sleeveOngoing = normalizeSleeveResult(sleeveJson);
        const sleeveInquiry = normalizeSleeveResult(inquirySleeveJson);
        const sleeveSource = hasSleeveSelection(sleeveOngoing) ? sleeveOngoing : sleeveInquiry;
        const sleeveDisplay = getSleeveDisplay(sleeveSource);
        const patternDisplay = getPatternDisplay(sleeveSource);

        const sizesJson = sizesRes.ok ? await sizesRes.json() : {};
        const sizesList = Array.isArray(sizesJson?.result) ? sizesJson.result : [];
        const sizeRows = sizesList.map((row) => ({
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

        setHeaderData({
          inquiryStyleName: init.styleName ?? styleNameQuery ?? "-",
          customerName: init.customerName ?? customerNameQuery ?? "-",
          fabricDisplay: getAllFabricDisplay(fabrics),
          colourDisplay: getAllColourDisplay(fabrics),
          patternDisplay,
          sleeveDisplay,
          collarDisplay: selectedCollarLabels.length > 0 ? selectedCollarLabels.join(" / ") : "-",
          placketDisplay: getPlacketDisplay(neckTypeSource),
          innerPlacketColor: getPlacketColorDisplay(neckTypeSource, "inner"),
          outerPlacketColor: getPlacketColorDisplay(neckTypeSource, "outer"),
          shoulderOutlineDisplay: getShoulderOutlineDisplay(neckTypeSource),
          aHoleOutlineDisplay: getAHoleOutlineDisplay(neckTypeSource),
          sideVentDisplay: getSideVentDisplay(neckTypeSource),
          buttonsDisplay: getButtonsDisplay(neckTypeSource),
          date: formatDateForHeader(startDate),
          deliveryDate,
          type,
          frontImageUrl: frontImageUrl || "",
          backImageUrl: backImageUrl || "",
          sizeRows,
        });
      } catch (error) {
        console.error("Error loading sewing/packing print:", error);
        toast.error("Failed to load sewing/packing data.");
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

  const specs = useMemo(
    () => [
      { label: "FABRIC", value: headerData?.fabricDisplay ?? "-" },
      { label: "COLOUR", value: headerData?.colourDisplay ?? "-" },
      { label: "PATTERN", value: headerData?.patternDisplay ?? "-" },
      { label: "PLACKET", value: headerData?.placketDisplay ?? "-" },
      { label: "INNER PLACKET", value: headerData?.innerPlacketColor ?? "-" },
      { label: "OUTER PLACKET", value: headerData?.outerPlacketColor ?? "-" },
      { label: "SHOULDER OUTLINE", value: headerData?.shoulderOutlineDisplay ?? "-" },
      { label: "A/HOLE OUTLINE", value: headerData?.aHoleOutlineDisplay ?? "-" },
      { label: "SIDE VENT", value: headerData?.sideVentDisplay ?? "-" },
      { label: "COLLAR", value: headerData?.collarDisplay ?? "-" },
      { label: "SLEEVE", value: headerData?.sleeveDisplay ?? "-" },
      { label: "BUTTONS", value: headerData?.buttonsDisplay ?? "-" },
      { label: "NECK TAPE", value: "-" },
      { label: "LABELS", value: "-" },
    ],
    [headerData]
  );

  const sizeRows = headerData?.sizeRows ?? [];
  const numQtyColumns = Math.max(1, sizeRows.length);
  const totalCombinedQty =
    numQtyColumns >= 2
      ? sizeRows.reduce((sum, row) => sum + (Number(row?.totalQty) || 0), 0)
      : 0;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
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
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      pdf.save(`Sewing_Packing_${sentQuotationId || "document"}.pdf`);
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        "@media print": {
          p: 0,
          backgroundColor: "#fff",
        },
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
          "@media print": {
            maxWidth: "100%",
            borderRadius: 0,
            boxShadow: "none",
            p: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
            pb: 1,
            borderBottom: "2px solid #e0e0e0",
            "@media print": {
              display: "none",
            },
          }}
        >
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ textTransform: "none" }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              sx={{ textTransform: "none" }}
            >
              Download PDF
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              width: { xs: "100%", sm: "210mm" },
              minHeight: { xs: "auto", sm: "297mm" },
              mx: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              backgroundColor: "#fff",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Loading sewing/packing print...
            </Typography>
          </Box>
        ) : headerData ? (
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
              "@media print": {
                boxShadow: "none",
              },
            }}
          >
            <Box sx={{ border: "1px solid #000", mb: 1.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #000" }}>
                <Box sx={{ p: 1, borderRight: "1px solid #000", fontSize: "0.8rem" }}>
                  <strong>STYLE NAME :</strong> {headerData.inquiryStyleName}
                </Box>
                <Box sx={{ p: 1, fontSize: "0.8rem" }}>
                  <strong>CLIENT NAME :</strong> {headerData.customerName}
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
                <Box sx={{ p: 1, borderRight: "1px solid #000", fontSize: "0.8rem" }}>
                  <strong>FABRIC :</strong> {headerData.fabricDisplay}
                </Box>
                <Box sx={{ p: 1, borderRight: "1px solid #000", fontSize: "0.8rem" }}>
                  <strong>DATE :</strong> {headerData.date}
                </Box>
                <Box sx={{ p: 1, fontSize: "0.8rem" }}>
                  <strong>TYPE :</strong> {headerData.type}
                </Box>
              </Box>
              <Box sx={{ p: 1, fontSize: "0.8rem" }}>
                <strong>DELIVERY DATE :</strong> {headerData.deliveryDate}
              </Box>
            </Box>

            {(headerData.frontImageUrl || headerData.backImageUrl) && (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 1.5 }}>
                {headerData.frontImageUrl ? (
                  <Box sx={{ border: "1px solid #ccc", p: 1, minHeight: 290, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <img
                      src={headerData.frontImageUrl}
                      alt="Front panel"
                      style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }}
                    />
                  </Box>
                ) : (
                  <Box />
                )}
                {headerData.backImageUrl ? (
                  <Box sx={{ border: "1px solid #ccc", p: 1, minHeight: 290, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <img
                      src={headerData.backImageUrl}
                      alt="Back panel"
                      style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }}
                    />
                  </Box>
                ) : (
                  <Box />
                )}
              </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 0.7fr", gap: 1.5 }}>
              <Box sx={{ border: "1px solid #000" }}>
                {specs.map((spec) => (
                  <Box
                    key={spec.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "40% 60%",
                      borderBottom: "1px solid #000",
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    <Box sx={{ p: 0.8, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>{spec.label}</Box>
                    <Box sx={{ p: 0.8, fontSize: "0.72rem" }}>{spec.value}</Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ border: "1px solid #000" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${numQtyColumns}, 1fr)`, borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.8, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>Size</Box>
                  {(numQtyColumns === 1 ? [null] : sizeRows).map((_, idx) => (
                    <Box
                      key={`qty-head-${idx}`}
                      sx={{
                        p: 0.8,
                        borderRight: idx === numQtyColumns - 1 ? "none" : "1px solid #000",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                      }}
                    >
                      Qty
                    </Box>
                  ))}
                </Box>

                {SIZE_KEYS.map(({ key, label }) => (
                  <Box
                    key={key}
                    sx={{ display: "grid", gridTemplateColumns: `56px repeat(${numQtyColumns}, 1fr)`, borderBottom: "1px solid #000" }}
                  >
                    <Box sx={{ p: 0.8, borderRight: "1px solid #000", fontSize: "0.72rem" }}>{label}</Box>
                    {(numQtyColumns === 1 ? [sizeRows[0]] : sizeRows).map((row, idx) => (
                      <Box
                        key={`${key}-${idx}`}
                        sx={{
                          p: 0.8,
                          borderRight: idx === numQtyColumns - 1 ? "none" : "1px solid #000",
                          fontSize: "0.72rem",
                        }}
                      >
                        {row ? formatSizeQty(row[key]) : "-"}
                      </Box>
                    ))}
                  </Box>
                ))}

                <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${numQtyColumns}, 1fr)`, borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.8, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>TOTAL</Box>
                  {(numQtyColumns === 1 ? [sizeRows[0]] : sizeRows).map((row, idx) => (
                    <Box
                      key={`total-${idx}`}
                      sx={{
                        p: 0.8,
                        borderRight: idx === numQtyColumns - 1 ? "none" : "1px solid #000",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                      }}
                    >
                      {row?.totalQty ? String(Math.round(row.totalQty)) : "-"}
                    </Box>
                  ))}
                </Box>

                {numQtyColumns >= 2 && (
                  <Box sx={{ display: "grid", gridTemplateColumns: "56px 1fr" }}>
                    <Box sx={{ p: 0.8, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>TOTAL</Box>
                    <Box sx={{ p: 0.8, fontWeight: 700, fontSize: "0.72rem" }}>
                      {totalCombinedQty ? String(Math.round(totalCombinedQty)) : "-"}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: { xs: "100%", sm: "210mm" },
              minHeight: { xs: "auto", sm: "297mm" },
              mx: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              backgroundColor: "#fff",
            }}
          >
            <Typography variant="body2" color="error">
              Unable to load sewing/packing data.
            </Typography>
          </Box>
        )}

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
