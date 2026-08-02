import BASE_URL from "Base/api";

const DEBOUNCE_MS = 300;
const getToken = () => localStorage.getItem("token");
const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

function parseResult(res) {
  if (Array.isArray(res)) return res;
  if (res?.result != null) {
    if (Array.isArray(res.result)) return res.result;
    if (Array.isArray(res.result?.items)) return res.result.items;
    return [res.result];
  }
  if (res?.data != null) return Array.isArray(res.data) ? res.data : [res.data];
  return [];
}

function normalizeSearchKeyword(keyword) {
  const q = (keyword || "").trim();
  if (!q || q.toLowerCase() === "all") return "";
  return q;
}

function filterByKeyword(list, q, fields = ["name"]) {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter((row) =>
    fields.some((field) => String(row?.[field] ?? "").toLowerCase().includes(lower))
  );
}

export async function fetchReportFilterOptions(filterType, keyword, extra = {}) {
  const q = normalizeSearchKeyword(keyword);
  const token = getToken();
  if (!token) return [];

  try {
    switch (filterType) {
      case "customer": {
        const url = `${BASE_URL}/Customer/GetCustomersByName?keyword=${encodeURIComponent(q)}`;
        const r = await fetch(url, { method: "POST", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = parseResult(data);
        return list.map((c) => ({
          id: c.id,
          label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || String(c.id),
        }));
      }
      case "supplier": {
        // Load all system suppliers, then filter locally when user types.
        const url = `${BASE_URL}/Supplier/GetAllSupplier`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = filterByKeyword(parseResult(data), q, ["name", "firstName", "lastName"]);
        return list.map((s) => ({
          id: s.id,
          label: s.name || `${s.firstName || ""} ${s.lastName || ""}`.trim() || String(s.id),
        }));
      }
      case "category": {
        // Load all system categories, then filter locally when user types.
        const url = `${BASE_URL}/Category/GetAllCategory`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = filterByKeyword(parseResult(data), q, ["name"]);
        return list.map((c) => ({ id: c.id, label: c.name || String(c.id) }));
      }
      case "subCategory": {
        const { categoryId } = extra;
        let list = [];
        if (categoryId) {
          const url = `${BASE_URL}/SubCategory/GetAllSubCategoriesByCategoryId?categoryId=${categoryId}`;
          const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
          if (!r.ok) return [];
          const data = await r.json();
          list = parseResult(data);
        } else {
          // Load all system sub categories when no parent category is selected.
          const url = `${BASE_URL}/SubCategory/GetAllSubCategory`;
          const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
          if (!r.ok) return [];
          const data = await r.json();
          list = parseResult(data);
        }
        list = filterByKeyword(list, q, ["name"]);
        return list.map((c) => ({ id: c.id, label: c.name || String(c.id) }));
      }
      case "item": {
        const supplierId = extra.supplierId || 0;
        const categoryId = extra.categoryId || 0;
        const subCategoryId = extra.subCategoryId || 0;

        // Load items created in the system (optionally scoped by selected filters).
        const url = `${BASE_URL}/Items/GetFilteredItems?supplier=${supplierId}&category=${categoryId}&subCategory=${subCategoryId}`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        list = filterByKeyword(list, q, ["name", "code"]);
        return list.map((i) => ({
          id: i.id,
          label: i.code ? `${i.code} - ${i.name || ""}`.trim() : i.name || String(i.id),
        }));
      }
      case "doctor": {
        const url = `${BASE_URL}/Doctors/GetAllDoctors?SkipCount=0&MaxResultCount=50&Search=${encodeURIComponent(q)}`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = parseResult(data);
        return list.map((d) => ({ id: d.id, label: d.name || String(d.id) }));
      }
      case "bank": {
        const url = `${BASE_URL}/Bank/GetAllBanks`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        if (q) {
          const lower = q.toLowerCase();
          list = list.filter(
            (b) =>
              (b.name || "").toLowerCase().includes(lower) ||
              (b.accountUsername || "").toLowerCase().includes(lower) ||
              (b.accountNo || "").toLowerCase().includes(lower)
          );
        }
        return list.map((b) => ({
          id: b.id,
          label: `${b.name || ""} - ${b.accountUsername || ""} (${b.accountNo || ""})`.trim() || String(b.id),
        }));
      }
      case "fiscalPeriod": {
        const url = `${BASE_URL}/Fiscal/GetAllFiscalPeriods`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        if (q) {
          const lower = q.toLowerCase();
          list = list.filter((p) => (p.startDate && String(p.startDate).toLowerCase().includes(lower)) || (p.endDate && String(p.endDate).toLowerCase().includes(lower)));
        }
        return list.map((p) => ({
          id: p.id,
          label: p.startDate && p.endDate ? `${p.startDate} - ${p.endDate}` : p.startDate ? `${p.startDate} - Still Active` : String(p.id),
        }));
      }
      case "user": {
        const url = `${BASE_URL}/User/GetAllUsersWithoutSuperAdmin?SkipCount=0&MaxResultCount=50&keyword=${encodeURIComponent(q)}`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = parseResult(data);
        return list
          .filter((u) => (u.email || "").toLowerCase() !== "superadmin@gmail.com")
          .map((u) => ({
            id: u.id,
            label: `${u.firstName || ""} ${u.lastName || ""} ${u.userName ? `(${u.userName})` : ""}`.trim() || String(u.id),
          }));
      }
      case "terminal": {
        const url = `${BASE_URL}/Terminal/GetAllShiftNotEnabledTerminals`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        if (q) {
          const lower = q.toLowerCase();
          list = list.filter((t) => (t.name || "").toLowerCase().includes(lower) || (t.code || "").toLowerCase().includes(lower));
        }
        return list.map((t) => ({ id: t.id, label: `${t.name || ""} (${t.code || ""})`.trim() || String(t.id) }));
      }
      case "cashFlowType": {
        const url = extra.bankTypeOnly
          ? `${BASE_URL}/CashFlowType/GetCashFlowTypesByType?cashType=3`
          : `${BASE_URL}/CashFlowType/GetCashFlowTypes`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        if (q) {
          const lower = q.toLowerCase();
          list = list.filter((c) => (c.name || "").toLowerCase().includes(lower));
        }
        return list.map((c) => ({ id: c.id, label: c.name || String(c.id) }));
      }
      case "reservation": {
        const url = `${BASE_URL}/Reservation/GetAllReservationSkipAndTake?SkipCount=0&MaxResultCount=50&Search=${encodeURIComponent(q || "null")}&reservationType=0&appointmentType=0&bridalType=0`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = data?.result?.items || parseResult(data) || [];
        return list.map((res) => ({
          id: res.id,
          label: `${res.documentNo || res.id} - ${res.customerName || ""}`.trim(),
        }));
      }
      case "invoice": {
        const { customerId } = extra;
        if (!customerId) return [];
        const url = `${BASE_URL}/SalesInvoice/GetInvoicesByCustomerId?customerId=${customerId}`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        if (q) {
          const lower = q.toLowerCase();
          list = list.filter(
            (inv) =>
              (inv.documentNo || "").toLowerCase().includes(lower) ||
              String(inv.grossTotal || "").toLowerCase().includes(lower)
          );
        }
        return list.map((inv) => ({
          id: inv.id,
          label: `${inv.documentNo || inv.id} - ${inv.grossTotal != null ? Number(inv.grossTotal).toFixed(2) : ""}`,
        }));
      }
      case "salesPerson": {
        const { supplierId } = extra;
        if (!supplierId) return [];
        const url = `${BASE_URL}/SalesPerson/GetSalesPersonsBySupplier?supplierId=${supplierId}`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = Array.isArray(data) ? data : parseResult(data);
        return list.map((p) => ({ id: p.id, label: p.name || String(p.id) }));
      }
      default:
        return [];
    }
  } catch (err) {
    console.error(err);
    return [];
  }
}

export { DEBOUNCE_MS };
