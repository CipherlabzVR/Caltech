import BASE_URL from "Base/api";

const DEBOUNCE_MS = 300;
const getToken = () => localStorage.getItem("token");
const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

function parseResult(res) {
  if (Array.isArray(res)) return res;
  if (res?.result != null) return Array.isArray(res.result) ? res.result : [res.result];
  if (res?.data != null) return Array.isArray(res.data) ? res.data : [res.data];
  return [];
}

export async function fetchReportFilterOptions(filterType, keyword, extra = {}) {
  const q = (keyword || "").trim();
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
        const url = `${BASE_URL}/Supplier/GetSuppliersByName?keyword=${encodeURIComponent(q)}`;
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = parseResult(data);
        return list.map((s) => ({ id: s.id, label: s.name || String(s.id) }));
      }
      case "category": {
        const url = `${BASE_URL}/Category/GetCategoriesByName?keyword=${encodeURIComponent(q)}`;
        const r = await fetch(url, { method: "POST", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        const list = parseResult(data);
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
          if (q) {
            const lower = q.toLowerCase();
            list = list.filter((sc) => (sc.name || "").toLowerCase().includes(lower));
          }
        } else {
          const url = `${BASE_URL}/SubCategory/GetSubCategoriesbyName?keyword=${encodeURIComponent(q)}`;
          const r = await fetch(url, { method: "POST", headers: getAuthHeaders() });
          if (!r.ok) return [];
          const data = await r.json();
          list = parseResult(data);
        }
        return list.map((c) => ({ id: c.id, label: c.name || String(c.id) }));
      }
      case "item": {
        const { supplierId } = extra;
        let url;
        if (supplierId) {
          url = `${BASE_URL}/Items/GetAllItemsBySupplierIdAndName?supplierId=${supplierId}&keyword=${encodeURIComponent(q)}`;
        } else {
          url = `${BASE_URL}/Items/GetAllItemsByName?keyword=${encodeURIComponent(q)}`;
        }
        if (!q) {
          if (supplierId || extra.categoryId || extra.subCategoryId) {
            url = `${BASE_URL}/Items/GetFilteredItems?supplier=${supplierId || 0}&category=${extra.categoryId || 0}&subCategory=${extra.subCategoryId || 0}`;
          } else {
            return [];
          }
        }
        const r = await fetch(url, { method: "GET", headers: getAuthHeaders() });
        if (!r.ok) return [];
        const data = await r.json();
        let list = parseResult(data);
        if (q && (extra.categoryId || extra.subCategoryId)) {
          if (extra.categoryId) list = list.filter((i) => (i.categoryId || i.CategoryId) === extra.categoryId);
          if (extra.subCategoryId) list = list.filter((i) => (i.subCategoryId || i.SubCategoryId) === extra.subCategoryId);
        }
        return list.map((i) => ({ id: i.id, label: i.name || String(i.id) }));
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
