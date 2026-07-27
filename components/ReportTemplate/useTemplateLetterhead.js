import { useEffect, useMemo, useState } from "react";
import BASE_URL from "Base/api";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";
import { escapeHtml } from "./applyTemplate";

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Loads the company/warehouse letterhead and resolves the four header tokens
 * shared by every print template: companyLogo, companyName, companyAddress and
 * companyContact. Pass the document's warehouseId when available, otherwise the
 * logged-in warehouse (localStorage) is used.
 */
export default function useTemplateLetterhead(warehouseId) {
  const { companyData } = useLoggedUserCompanyLetterhead();
  const [warehouseData, setWarehouseData] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = warehouseId || localStorage.getItem("warehouse");
    if (!id) return;

    fetch(`${BASE_URL}/Warehouse/GetWarehouseById?Id=${id}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.statusCode === 200) setWarehouseData(j.result);
      })
      .catch(() => {});

    fetch(`${BASE_URL}/Company/GetCompanyLogoByWarehouseId?warehouseId=${id}`, {
      headers: authHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setLogoUrl(j?.logoUrl || ""))
      .catch(() => setLogoUrl(""));
  }, [warehouseId]);

  const addressLines = useMemo(
    () =>
      [warehouseData?.addressLine1, warehouseData?.addressLine2, warehouseData?.addressLine3].filter(
        Boolean
      ),
    [warehouseData]
  );

  const contactLines = useMemo(() => {
    const out = [];
    const phones = [
      warehouseData?.contactNumber,
      warehouseData?.contactNumber2,
      warehouseData?.contactNumber3,
      companyData?.contactNumber,
    ].filter((v, i, arr) => v && arr.indexOf(v) === i);
    if (phones.length) out.push(phones.join(" / "));
    if (warehouseData?.email1) out.push(warehouseData.email1);
    return out;
  }, [companyData?.contactNumber, warehouseData]);

  const letterheadTokens = useMemo(
    () => ({
      companyLogo: logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Company Logo" />` : "",
      companyName: companyData?.name || warehouseData?.name || "Company",
      companyAddress: addressLines.join(", "),
      companyContact: contactLines.join("  |  "),
    }),
    [logoUrl, companyData?.name, warehouseData?.name, addressLines, contactLines]
  );

  return { letterheadTokens, companyData, warehouseData };
}
