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
const DOCUMENT_SUB_EMB = 1;
const DOCUMENT_SUB_SUB = 2;
const DOCUMENT_SUB_PLAIN_COMMON = 5;

const FIRST_PAGE_SIZE_KEYS = [
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

const EMB_PAGE_SIZE_KEYS = [
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

const getPanelImageUrl = (panels, contentType) => {
  if (!Array.isArray(panels)) return "";
  const emb = panels.find(
    (d) =>
      Number(d?.documentContentType) === Number(contentType) &&
      Number(d?.documentSubContentType) === DOCUMENT_SUB_EMB &&
      d?.documentURL
  );
  if (emb?.documentURL) return emb.documentURL;

  const sub = panels.find(
    (d) =>
      Number(d?.documentContentType) === Number(contentType) &&
      Number(d?.documentSubContentType) === DOCUMENT_SUB_SUB &&
      d?.documentURL
  );
  if (sub?.documentURL) return sub.documentURL;

  return "";
};

const getPlainPanelImageUrl = (panels, contentType) => {
  if (!Array.isArray(panels)) return "";
  const exact = panels.find(
    (d) =>
      Number(d?.documentContentType) === Number(contentType) &&
      Number(d?.documentSubContentType) === Number(DOCUMENT_SUB_PLAIN_COMMON) &&
      d?.documentURL
  );
  if (exact?.documentURL) return exact.documentURL;

  const fallback = panels.find(
    (d) => Number(d?.documentContentType) === Number(contentType) && d?.documentURL
  );
  return fallback?.documentURL || "";
};

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
      const fabricCore = [name, gsm].filter(Boolean).join(" ");
      if (!fabricCore && !color) return "";
      if (fabricCore && color) return `${fabricCore} (${color})`;
      return fabricCore || color;
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

const getSelectedCollarType = (neckResult) => {
  if (!neckResult) return "-";
  const second = Number(neckResult.neck2ndRowS ?? neckResult.Neck2ndRowS);
  if (second === 5) return "RIB";
  if (second === 6) return "Fabric";
  if (second === 3) return "Normal";
  if (second === 4) return "1 / 8 Line";
  if (second === 1) return "Full";
  if (second === 2) return "Chinese";
  return "-";
};

const normalizeSleeveResult = (json) => {
  const result = json?.result;
  if (Array.isArray(result)) return result[0] || null;
  return result || null;
};

const hasSleeveSelection = (sleeveResult) => {
  if (!sleeveResult) return false;
  const shortOn =
    sleeveResult.short === 1 ||
    sleeveResult.short === "1" ||
    sleeveResult.Short === 1 ||
    sleeveResult.Short === "1";
  const longOn =
    sleeveResult.long === 1 ||
    sleeveResult.long === "1" ||
    sleeveResult.Long === 1 ||
    sleeveResult.Long === "1";
  const normalOn =
    sleeveResult.normal === 1 ||
    sleeveResult.normal === "1" ||
    sleeveResult.Normal === 1 ||
    sleeveResult.Normal === "1";
  const raglanOn =
    sleeveResult.wrangler === 1 ||
    sleeveResult.wrangler === "1" ||
    sleeveResult.Wrangler === 1 ||
    sleeveResult.Wrangler === "1";
  if (shortOn || longOn || normalOn || raglanOn) return true;

  const shortType = Number(sleeveResult.shortType ?? sleeveResult.ShortType);
  const longType = Number(sleeveResult.longType ?? sleeveResult.LongType);
  const shortHasType = Number.isFinite(shortType) && shortType > 0 && shortType !== 9;
  const longHasType = Number.isFinite(longType) && longType > 0 && longType !== 9;
  return shortHasType || longHasType;
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

const getCollarTypeFromRow = (row) => {
  const neckType = Number(row?.necKTypes);
  const firstRow = Number(row?.neckFirstRows);
  const secondRow = Number(row?.neck2ndRowS);

  // Crew/V-Neck "Normal/1/8 Line"
  if (
    (neckType === 2 && firstRow === 5) ||
    (neckType === 3 && (firstRow === 8 || firstRow === 9))
  ) {
    if (secondRow === 3) return "Normal";
    if (secondRow === 4) return "1 / 8 Line";
    return "";
  }

  // Crew/V-Neck "RIB/Fabric"
  if ((neckType === 2 && firstRow === 6) || (neckType === 3 && firstRow === 7)) {
    if (secondRow === 5) return "RIB";
    if (secondRow === 6) return "Fabric";
    return "";
  }

  // Polo design
  if (neckType === 1) {
    if (secondRow === 1) return "Full";
    if (secondRow === 2) return "Chinese";
    return "";
  }

  return "";
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
    totalQty: row.totalQty ?? row.TotalQty ?? 0,
  }));

const getQty = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : "-";
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

export default function EmbSubPrintPage() {
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
          neckListRes,
          inquiryNeckList1Res,
          inquiryNeckList2Res,
          inquiryNeckList3Res,
          inquiryNeckList4Res,
          inquiryNeckList5Res,
        ] = await Promise.all([
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
            {
              method: "GET",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=2`,
            {
              method: "GET",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=3`,
            {
              method: "GET",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=4`,
            {
              method: "GET",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${selectedOptionId}&WindowType=${windowType}&necKTypes=5`,
            {
              method: "GET",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                "Content-Type": "application/json",
              },
            }
          ),
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

        const neckJson = neckRes.ok ? await neckRes.json() : {};
        const inquiryNeckTypeJson = inquiryNeckTypeRes.ok ? await inquiryNeckTypeRes.json() : {};
        const neckListJson = neckListRes.ok ? await neckListRes.json() : {};
        const inquiryNeckList1Json = inquiryNeckList1Res.ok ? await inquiryNeckList1Res.json() : {};
        const inquiryNeckList2Json = inquiryNeckList2Res.ok ? await inquiryNeckList2Res.json() : {};
        const inquiryNeckList3Json = inquiryNeckList3Res.ok ? await inquiryNeckList3Res.json() : {};
        const inquiryNeckList4Json = inquiryNeckList4Res.ok ? await inquiryNeckList4Res.json() : {};
        const inquiryNeckList5Json = inquiryNeckList5Res.ok ? await inquiryNeckList5Res.json() : {};
        const ongoingNeckRows = Array.isArray(neckListJson?.result) ? neckListJson.result : [];
        const inquiryNeckRows = [
          ...(Array.isArray(inquiryNeckList1Json?.result) ? inquiryNeckList1Json.result : []),
          ...(Array.isArray(inquiryNeckList2Json?.result) ? inquiryNeckList2Json.result : []),
          ...(Array.isArray(inquiryNeckList3Json?.result) ? inquiryNeckList3Json.result : []),
          ...(Array.isArray(inquiryNeckList4Json?.result) ? inquiryNeckList4Json.result : []),
          ...(Array.isArray(inquiryNeckList5Json?.result) ? inquiryNeckList5Json.result : []),
        ];
        const neckTypeRows = inquiryNeckRows.length > 0 ? inquiryNeckRows : ongoingNeckRows;
        const sleeveLengthDisplay = getSleeveLengthDisplay(sleeveSource);
        const sleeveFinishDisplay = getSleeveFinishDisplay(sleeveSource);
        const patternDisplay = getPatternDisplay(sleeveSource);

        const sizesJson = sizesRes.ok ? await sizesRes.json() : {};
        const sizesList = Array.isArray(sizesJson?.result) ? sizesJson.result : [];
        const sizeRows = mapSizeRows(sizesList);
        const primarySizeRow = sizeRows[0] || {};

        const computedTotal = FIRST_PAGE_SIZE_KEYS.reduce(
          (sum, { key }) => sum + (Number(primarySizeRow?.[key]) || 0),
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
        const selectedCollarLabels = Array.from(
          new Set(
            neckTypeRows
              .map((row) => getCollarSelectionLabel(row))
              .filter((value) => value && value !== "-")
          )
        );
        const selectedCollarTypes = Array.from(
          new Set(
            neckTypeRows
              .map((row) => getCollarTypeFromRow(row))
              .filter((value) => value && value !== "-")
          )
        );

        setData({
          inquiryStyleName: init.styleName ?? styleNameQuery ?? "-",
          customerName: init.customerName ?? customerNameQuery ?? "-",
          fabricDisplay: getAllFabricDisplay(fabrics),
          colourDisplay: getAllColourDisplay(fabrics),
          selectedNeck: neckTypeName || "-",
          selectedCollar:
            selectedCollarLabels.length > 0 ? selectedCollarLabels.join(" / ") : "-",
          selectedCollarType:
            selectedCollarTypes.length > 0
              ? selectedCollarTypes.join(" / ")
              : getSelectedCollarType(neckJson?.result),
          placketDisplay: getPlacketDisplay(neckTypeSource),
          innerPlacketColor: getPlacketColorDisplay(neckTypeSource, "inner"),
          outerPlacketColor: getPlacketColorDisplay(neckTypeSource, "outer"),
          sideVentDisplay: getSideVentDisplay(neckTypeSource),
          patternDisplay,
          sleeveFinishDisplay,
          sleeveLengthDisplay,
          date: formatDateForHeader(startDate),
          deliveryDate,
          type,
          plainFrontImageUrl: getPlainPanelImageUrl(panels, DOCUMENT_CONTENT_FRONT),
          plainBackImageUrl: getPlainPanelImageUrl(panels, DOCUMENT_CONTENT_BACK),
          frontImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_FRONT),
          backImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_BACK),
          leftSleeveImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_LEFT_SLEEVE),
          rightSleeveImageUrl: getPanelImageUrl(panels, DOCUMENT_CONTENT_RIGHT_SLEEVE),
          sizeRows,
          sizeRow: primarySizeRow,
          totalQty:
            Number(primarySizeRow?.totalQty) > 0
              ? Number(primarySizeRow.totalQty)
              : computedTotal,
        });
      } catch (error) {
        console.error("Error loading emb/sub print:", error);
        toast.error("Failed to load emb/sub data.");
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

  const hasAnyImage = useMemo(() => {
    return Boolean(
      data?.frontImageUrl ||
        data?.backImageUrl ||
        data?.leftSleeveImageUrl ||
        data?.rightSleeveImageUrl
    );
  }, [data]);
  const firstPageSizeRows =
    data?.sizeRows && data.sizeRows.length > 0 ? data.sizeRows : [data?.sizeRow || {}];
  const firstPageNumQtyColumns = Math.max(1, firstPageSizeRows.length);
  const firstPageCombinedTotal =
    firstPageNumQtyColumns >= 2
      ? firstPageSizeRows.reduce(
          (sum, row) =>
            sum +
            (Number(row?.totalQty) > 0
              ? Number(row.totalQty)
              : FIRST_PAGE_SIZE_KEYS.reduce(
                  (rowSum, { key }) => rowSum + (Number(row?.[key]) || 0),
                  0
                )),
          0
        )
      : 0;

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

      pdf.save(`Emb_Sub_${sentQuotationId || "document"}.pdf`);
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
            "@media print": { display: "none" },
          }}
        >
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
              Loading emb/sub print...
            </Typography>
          </Box>
        ) : data ? (
          <Box
            ref={contentRef}
            sx={{
              width: { xs: "100%", sm: "210mm" },
              minHeight: { xs: "auto", sm: "297mm" },
              mx: "auto",
              p: "0.35in",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "@media print": {
                boxShadow: "none",
              },
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
                {data.plainFrontImageUrl ? (
                  <img
                    src={data.plainFrontImageUrl}
                    alt="Sewing Front"
                    style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }}
                  />
                ) : (
                  <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                )}
              </Box>
              <Box sx={{ border: "1px solid #ccc", p: 1, minHeight: 290, display: "flex", justifyContent: "center", alignItems: "center" }}>
                {data.plainBackImageUrl ? (
                  <img
                    src={data.plainBackImageUrl}
                    alt="Sewing Back"
                    style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }}
                  />
                ) : (
                  <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 0.38fr", gap: 1.5, mb: 1.5 }}>
              <Box sx={{ border: "1px solid #000" }}>
                {[
                  { label: "FABRIC", value: data.fabricDisplay ?? "-" },
                  { label: "COLOUR", value: data.colourDisplay ?? "-" },
                  { label: "PATTERN", value: data.patternDisplay ?? "-" },
                  { label: "PLACKET", value: data.placketDisplay ?? "-" },
                  { label: "INNER PLACKET", value: data.innerPlacketColor ?? "-" },
                  { label: "OUTER PLACKET", value: data.outerPlacketColor ?? "-" },
                  { label: "SIDE VENT", value: data.sideVentDisplay ?? "-" },
                  { label: "SLEEVE", value: data.sleeveFinishDisplay ?? "-" },
                  { label: "SLEEVE TYPE", value: data.sleeveLengthDisplay ?? "-" },
                  { label: "NECK", value: data.selectedNeck ?? "-" },
                  { label: "COLLAR", value: data.selectedCollar ?? "-" },
                  { label: "COLLAR TYPE", value: data.selectedCollarType ?? "-" },
                ].map((spec) => (
                  <Box key={spec.label} sx={{ display: "grid", gridTemplateColumns: "42% 58%", borderBottom: "1px solid #000", "&:last-of-type": { borderBottom: "none" } }}>
                    <Box sx={{ p: 0.7, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem" }}>{spec.label}</Box>
                    <Box sx={{ p: 0.7, fontSize: "0.72rem" }}>{spec.value}</Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ border: "1px solid #000" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${firstPageNumQtyColumns}, 1fr)`, borderBottom: "1px solid #000" }}>
                  <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.7rem", textAlign: "center" }}>Size</Box>
                  {(firstPageNumQtyColumns === 1 ? [null] : firstPageSizeRows).map((_, idx) => (
                    <Box
                      key={`first-qty-head-${idx}`}
                      sx={{
                        p: 0.55,
                        borderRight: idx === firstPageNumQtyColumns - 1 ? "none" : "1px solid #000",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        textAlign: "center",
                      }}
                    >
                      Qty
                    </Box>
                  ))}
                </Box>
                {FIRST_PAGE_SIZE_KEYS.map(({ key, label }) => (
                  <Box key={key} sx={{ display: "grid", gridTemplateColumns: `56px repeat(${firstPageNumQtyColumns}, 1fr)`, borderBottom: "1px solid #000" }}>
                    <Box sx={{ p: 0.55, borderRight: "1px solid #000", fontSize: "0.68rem", textAlign: "center" }}>{label}</Box>
                    {(firstPageNumQtyColumns === 1 ? [firstPageSizeRows[0]] : firstPageSizeRows).map((row, idx) => (
                      <Box
                        key={`${key}-${idx}`}
                        sx={{
                          p: 0.55,
                          borderRight: idx === firstPageNumQtyColumns - 1 ? "none" : "1px solid #000",
                          fontSize: "0.68rem",
                          textAlign: "center",
                        }}
                      >
                        {getQty(row?.[key])}
                      </Box>
                    ))}
                  </Box>
                ))}
                <Box sx={{ display: "grid", gridTemplateColumns: `56px repeat(${firstPageNumQtyColumns}, 1fr)`, borderBottom: firstPageNumQtyColumns >= 2 ? "1px solid #000" : "none" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>TOTAL</Box>
                  {(firstPageNumQtyColumns === 1 ? [firstPageSizeRows[0]] : firstPageSizeRows).map((row, idx) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : FIRST_PAGE_SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box
                        key={`first-total-${idx}`}
                        sx={{
                          p: 0.6,
                          borderRight: idx === firstPageNumQtyColumns - 1 ? "none" : "1px solid #000",
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
                {firstPageNumQtyColumns >= 2 && (
                  <Box sx={{ display: "grid", gridTemplateColumns: "56px 1fr" }}>
                    <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>TOTAL</Box>
                    <Box sx={{ p: 0.6, fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>{getQty(firstPageCombinedTotal)}</Box>
                  </Box>
                )}
              </Box>
            </Box>
            </Box>

            <Box
              sx={{
                pageBreakBefore: "always",
                breakBefore: "page",
                pt: 0,
                mt: 0,
                minHeight: { sm: "297mm" },
                "@media print": { minHeight: "297mm" },
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.9fr", gap: 1.2, mb: 1.2 }}>
                <Box>
                  <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Front</Typography>
                  <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 215, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                    {data.frontImageUrl ? (
                      <img src={data.frontImageUrl} alt="Cutting Front" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />
                    ) : (
                      <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Back</Typography>
                  <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 215, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                    {data.backImageUrl ? (
                      <img src={data.backImageUrl} alt="Cutting Back" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />
                    ) : (
                      <Typography color="text.secondary" fontSize="0.75rem">No image</Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 1 }}>
                  <Box>
                    <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Left Sleeve</Typography>
                    <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 100, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                      {data.leftSleeveImageUrl ? (
                        <img src={data.leftSleeveImageUrl} alt="Cutting Left Sleeve" style={{ maxWidth: "100%", maxHeight: "90px", objectFit: "contain" }} />
                      ) : (
                        <Typography color="text.secondary" fontSize="0.72rem">No image</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ textAlign: "center", fontWeight: 600, mb: 0.4 }}>Right Sleeve</Typography>
                    <Box sx={{ border: "1px solid #999", borderRadius: "12px", minHeight: 100, display: "flex", justifyContent: "center", alignItems: "center", p: 1 }}>
                      {data.rightSleeveImageUrl ? (
                        <img src={data.rightSleeveImageUrl} alt="Cutting Right Sleeve" style={{ maxWidth: "100%", maxHeight: "90px", objectFit: "contain" }} />
                      ) : (
                        <Typography color="text.secondary" fontSize="0.72rem">No image</Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ border: "1px solid #000", mb: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: `90px repeat(${firstPageNumQtyColumns}, 55px) 1fr 1fr 1fr 1fr`, borderBottom: "1px solid #000", backgroundColor: "#f9f9f9" }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>Size</Box>
                  {(firstPageNumQtyColumns === 1 ? [null] : firstPageSizeRows).map((_, idx) => (
                    <Box key={`p2-qty-head-${idx}`} sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>
                      Qty
                    </Box>
                  ))}
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>Front</Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>Back</Box>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>L/Sleeve</Box>
                  <Box sx={{ p: 0.6, fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>R/Sleeve</Box>
                </Box>

                {FIRST_PAGE_SIZE_KEYS.map(({ key, label }) => (
                  <Box key={`cutting-row-${key}`} sx={{ display: "grid", gridTemplateColumns: `90px repeat(${firstPageNumQtyColumns}, 55px) 1fr 1fr 1fr 1fr`, borderBottom: "1px solid #000", "&:last-of-type": { borderBottom: "none" } }}>
                    <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }}>{label}</Box>
                    {(firstPageNumQtyColumns === 1 ? [firstPageSizeRows[0]] : firstPageSizeRows).map((row, idx) => (
                      <Box key={`p2-${key}-${idx}`} sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }}>
                        {getQty(row?.[key])}
                      </Box>
                    ))}
                    <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }} />
                    <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }} />
                    <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }} />
                    <Box sx={{ p: 0.6, fontSize: "0.72rem", textAlign: "center" }} />
                  </Box>
                ))}
                <Box sx={{ display: "grid", gridTemplateColumns: `90px repeat(${firstPageNumQtyColumns}, 55px) 1fr 1fr 1fr 1fr` }}>
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}>
                    TOTAL
                  </Box>
                  {(firstPageNumQtyColumns === 1 ? [firstPageSizeRows[0]] : firstPageSizeRows).map((row, idx) => {
                    const rowTotal =
                      Number(row?.totalQty) > 0
                        ? Number(row.totalQty)
                        : FIRST_PAGE_SIZE_KEYS.reduce((sum, { key }) => sum + (Number(row?.[key]) || 0), 0);
                    return (
                      <Box
                        key={`p2-total-${idx}`}
                        sx={{ p: 0.6, borderRight: "1px solid #000", fontWeight: 700, fontSize: "0.72rem", textAlign: "center" }}
                      >
                        {getQty(rowTotal)}
                      </Box>
                    );
                  })}
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }} />
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }} />
                  <Box sx={{ p: 0.6, borderRight: "1px solid #000", fontSize: "0.72rem", textAlign: "center" }} />
                  <Box sx={{ p: 0.6, fontSize: "0.72rem", textAlign: "center" }} />
                </Box>
              </Box>

              {!hasAnyImage && (
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  No EMB/SUB images found. Upload images in tech-pack document panel (EMB or SUB).
                </Typography>
              )}
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
              Unable to load emb/sub data.
            </Typography>
          </Box>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </Box>
    </Box>
  );
}
