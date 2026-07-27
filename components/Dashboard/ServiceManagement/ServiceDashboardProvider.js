import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import BASE_URL from "Base/api";
import {
  getPipelineGroup,
  isInDateRange,
  isSameDay,
  statusLabel,
} from "./constants";

const ServiceDashboardContext = createContext(null);

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function fetchList(endpoint, includeCurrentDate = false) {
  const separator = endpoint.includes("?") ? "&" : "?";
  let url = `${BASE_URL}/${endpoint}${separator}SkipCount=0&MaxResultCount=10000&Search=null&Filter=null`;
  if (includeCurrentDate) {
    url += "&isCurrentDate=false";
  }
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) return [];
  const json = await response.json();
  return json?.result?.items || json?.result || [];
}

async function fetchDashboardSummary(startDate, endDate) {
  try {
    const response = await fetch(
      `${BASE_URL}/ServiceManagement/GetDashboardSummary?startDate=${startDate}&endDate=${endDate}`,
      { headers: authHeaders() }
    );
    if (!response.ok) return null;
    const json = await response.json();
    return json?.result || null;
  } catch {
    return null;
  }
}

async function fetchFreeServiceEntitlements(warehouseId, search) {
  try {
    const params = new URLSearchParams();
    if (warehouseId && warehouseId > 0) params.set("warehouseId", String(warehouseId));
    if (search) params.set("search", search);
    const qs = params.toString();
    const response = await fetch(
      `${BASE_URL}/ServiceManagement/GetFreeServiceEntitlements${qs ? `?${qs}` : ""}`,
      { headers: authHeaders() }
    );
    if (!response.ok) return null;
    const json = await response.json();
    return json?.result || null;
  } catch {
    return null;
  }
}

function sumNetTotal(rows, dateField, startDate, endDate) {
  return (rows || []).reduce((acc, row) => {
    if (row.isDeleted) return acc;
    if (!isInDateRange(row[dateField] || row.createdOn, startDate, endDate)) return acc;
    return acc + Number(row.netTotal || row.grandTotal || 0);
  }, 0);
}

function isInvoicePending(inv) {
  const cancelled = !!inv.isDeleted || inv.status === "Cancelled";
  if (cancelled) return false;
  const total = Number(inv.netTotal || 0);
  return total > 0;
}

function technicianDisplayName(entry) {
  return (
    entry?.fullName ||
    entry?.name ||
    entry?.userName ||
    entry?.technicianName ||
    entry?.email ||
    null
  );
}

function buildTechnicianNameMap(technicians, technicianLoad) {
  const map = {};
  const register = (entry) => {
    if (!entry) return;
    const name = technicianDisplayName(entry);
    if (!name) return;
    [entry.id, entry.technicianId, entry.userId].forEach((id) => {
      if (id != null && id !== "") map[String(id)] = name;
    });
  };
  (technicianLoad || []).forEach(register);
  (technicians || []).forEach(register);
  return map;
}

function resolveAssignedTechnicianName(jc, nameMap) {
  const direct =
    jc?.assignedTechnicianName ||
    jc?.AssignedTechnicianName ||
    jc?.technicianName ||
    jc?.TechnicianName;
  if (direct) return direct;

  const techId = jc?.assignedTechnicianId ?? jc?.AssignedTechnicianId;
  if (techId == null || techId === "") return null;
  return nameMap[String(techId)] || null;
}

function enrichJobCard(jc, nameMap) {
  const assignedTechnicianId = jc?.assignedTechnicianId ?? jc?.AssignedTechnicianId ?? null;
  return {
    ...jc,
    assignedTechnicianId,
    assignedTechnicianName: resolveAssignedTechnicianName(jc, nameMap),
  };
}

function filterByWarehouse(rows, warehouseId) {
  if (!warehouseId || warehouseId === 0) return rows || [];
  return (rows || []).filter((row) => {
    const wid = row.warehouseId ?? row.WarehouseId;
    return Number(wid) === Number(warehouseId);
  });
}

export function ServiceDashboardProvider({ startDate, endDate, warehouseId = 0, children }) {
  const [loading, setLoading] = useState(true);
  const [jobCards, setJobCards] = useState([]);
  const [serviceInvoices, setServiceInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [technicianLoad, setTechnicianLoad] = useState([]);
  const [items, setItems] = useState([]);
  const [zeroQtyItems, setZeroQtyItems] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [freeServiceEntitlements, setFreeServiceEntitlements] = useState(null);
  const [freeServiceLoading, setFreeServiceLoading] = useState(true);

  const loadFreeServices = useCallback(async (search = "") => {
    if (typeof window === "undefined") return;
    setFreeServiceLoading(true);
    try {
      const data = await fetchFreeServiceEntitlements(warehouseId, search);
      setFreeServiceEntitlements(data);
    } catch (error) {
      console.error("Free service entitlements load error:", error);
      setFreeServiceEntitlements(null);
    } finally {
      setFreeServiceLoading(false);
    }
  }, [warehouseId]);

  const loadData = useCallback(async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const summary = await fetchDashboardSummary(startDate, endDate);
      setApiSummary(summary);

      const [
        jcRows,
        siRows,
        piRows,
        techRows,
        loadRows,
        itemResult,
        zeroQtyResult,
      ] = await Promise.all([
        fetchList("ServiceJobCard/GetAll", true),
        fetchList("ServiceInvoice/GetAll", true),
        fetchList("PurchaseInvoice/GetAll", true),
        fetch(`${BASE_URL}/WorkTrackDetail/GetTechnicians`, { headers: authHeaders() })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => j?.result || j?.data || [])
          .catch(() => []),
        fetch(`${BASE_URL}/ServiceJobCard/GetTechniciansWithLoad`, { headers: authHeaders() })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => j?.result || [])
          .catch(() => []),
        fetch(
          `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=0&MaxResultCount=5000&Search=null`,
          { headers: authHeaders() }
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => j?.result?.items || [])
          .catch(() => []),
        fetchList("Items/GetAllItemWithZeroQuantityPage", false),
      ]);

      setJobCards(Array.isArray(jcRows) ? jcRows : []);
      setServiceInvoices(Array.isArray(siRows) ? siRows : []);
      setPurchaseInvoices(Array.isArray(piRows) ? piRows : []);
      setTechnicians(Array.isArray(techRows) ? techRows : []);
      setTechnicianLoad(Array.isArray(loadRows) ? loadRows : []);
      setItems(Array.isArray(itemResult) ? itemResult : []);
      setZeroQtyItems(Array.isArray(zeroQtyResult) ? zeroQtyResult : []);
    } catch (error) {
      console.error("Service dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadFreeServices("");
  }, [loadFreeServices]);

  const computed = useMemo(() => {
    const scopedJobCards = filterByWarehouse(jobCards, warehouseId);
    const scopedServiceInvoices = filterByWarehouse(serviceInvoices, warehouseId);
    const scopedPurchaseInvoices = filterByWarehouse(purchaseInvoices, warehouseId);

    const today = new Date();
    const activeJobs = scopedJobCards.filter((jc) => {
      const g = getPipelineGroup(jc.status);
      return g !== "Completed" && g !== "Cancelled" && g !== "Unrepairable";
    });

    const completedToday = scopedJobCards.filter(
      (jc) =>
        getPipelineGroup(jc.status) === "Completed" &&
        (isSameDay(jc.updatedOn, today) || isSameDay(jc.deliveredDate, today))
    );

    const jobsInRange = scopedJobCards.filter((jc) =>
      isInDateRange(jc.receivedDate || jc.createdOn, startDate, endDate)
    );

    const pipelineCounts = {
      Pending: 0,
      Assigned: 0,
      InProgress: 0,
      Completed: 0,
      Cancelled: 0,
      Unrepairable: 0,
    };
    scopedJobCards.forEach((jc) => {
      const group = getPipelineGroup(jc.status);
      pipelineCounts[group] = (pipelineCounts[group] || 0) + 1;
    });

    const statusCounts = {};
    scopedJobCards.forEach((jc) => {
      const name = statusLabel(jc.status);
      statusCounts[name] = (statusCounts[name] || 0) + 1;
    });

    const serviceIncome = sumNetTotal(
      scopedServiceInvoices.filter((inv) => !inv.isDeleted && inv.status !== "Cancelled"),
      "documentDate",
      startDate,
      endDate
    );
    const purchaseExpenses = sumNetTotal(
      scopedPurchaseInvoices.filter((inv) => !inv.isDeleted),
      "documentDate",
      startDate,
      endDate
    );

    const todayServiceIncome = scopedServiceInvoices
      .filter(
        (inv) =>
          !inv.isDeleted &&
          inv.status !== "Cancelled" &&
          isSameDay(inv.documentDate || inv.createdOn, today)
      )
      .reduce((acc, inv) => acc + Number(inv.netTotal || 0), 0);

    const todayPurchaseExpense = scopedPurchaseInvoices
      .filter((inv) => !inv.isDeleted && isSameDay(inv.documentDate || inv.createdOn, today))
      .reduce((acc, inv) => acc + Number(inv.netTotal || 0), 0);

    const lowStockItems = items.filter((item) => {
      const qty = Number(item.quantity ?? item.qty ?? item.stockQty ?? item.availableQty ?? -1);
      const reorder = Number(item.reorderLevel ?? item.ReorderLevel ?? 0);
      if (qty >= 0 && reorder > 0) return qty <= reorder;
      return false;
    });

    const purchaseToday = scopedPurchaseInvoices.filter(
      (inv) => !inv.isDeleted && isSameDay(inv.documentDate || inv.createdOn, today)
    );

    const pendingPayments = scopedServiceInvoices.filter(isInvoicePending);

    const customerMap = {};
    scopedJobCards.forEach((jc) => {
      const key = jc.customerId || jc.customerName;
      if (!key) return;
      if (!customerMap[key]) {
        customerMap[key] = {
          id: jc.customerId,
          name: jc.customerName,
          contactNo: jc.contactNo,
          jobCount: 0,
          lastVisit: jc.receivedDate || jc.createdOn,
        };
      }
      customerMap[key].jobCount += 1;
      const visit = jc.receivedDate || jc.createdOn;
      if (visit && new Date(visit) > new Date(customerMap[key].lastVisit || 0)) {
        customerMap[key].lastVisit = visit;
      }
    });

    const customers = Object.values(customerMap);
    const newCustomersInRange = customers.filter((c) =>
      isInDateRange(c.lastVisit, startDate, endDate)
    );

    const newCustomersToday = customers.filter((c) => isSameDay(c.lastVisit, today));

    const activeTechnicianIds = new Set(
      scopedJobCards
        .filter((jc) => {
          const g = getPipelineGroup(jc.status);
          return (g === "Assigned" || g === "InProgress") && jc.assignedTechnicianId;
        })
        .map((jc) => jc.assignedTechnicianId)
    );

    const completedJobs = scopedJobCards.filter((jc) => getPipelineGroup(jc.status) === "Completed");
    const pendingJobs = scopedJobCards.filter((jc) => {
      const g = getPipelineGroup(jc.status);
      return g === "Pending" || g === "Assigned" || g === "InProgress";
    });

    const awaitingApproval = scopedJobCards.filter((jc) => {
      const s = statusLabel(jc.status);
      return s === "AwaitingApproval" || s === "AwaitingPartsApproval";
    });

    const warrantyJobs = scopedJobCards.filter(
      (jc) => jc.serviceType === 1 || jc.isWarrantyClaim
    );

    const technicianNameMap = buildTechnicianNameMap(technicians, technicianLoad);
    const enrichedJobCards = scopedJobCards.map((jc) => enrichJobCard(jc, technicianNameMap));

    const recentJobCards = [...enrichedJobCards]
      .sort(
        (a, b) =>
          new Date(b.receivedDate || b.createdOn || 0) -
          new Date(a.receivedDate || a.createdOn || 0)
      )
      .slice(0, 8);

    const recentPurchases = [...scopedPurchaseInvoices]
      .filter((inv) => !inv.isDeleted)
      .sort(
        (a, b) =>
          new Date(b.documentDate || b.createdOn || 0) -
          new Date(a.documentDate || b.createdOn || 0)
      )
      .slice(0, 6);

    const incomeChartData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split("T")[0];
      const dayIncome = scopedServiceInvoices
        .filter(
          (inv) =>
            !inv.isDeleted &&
            inv.status !== "Cancelled" &&
            isSameDay(inv.documentDate || inv.createdOn, d)
        )
        .reduce((acc, inv) => acc + Number(inv.netTotal || 0), 0);
      incomeChartData.push({
        date: dayStr,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        income: dayIncome,
      });
    }

    return {
      activeJobs: activeJobs.length,
      completedToday: completedToday.length,
      todayServiceIncome,
      todayPurchaseExpense,
      totalStockItems: items.length || apiSummary?.stock?.totalItems || 0,
      itemsAddedToday: purchaseToday.length,
      lowStockCount: lowStockItems.length || zeroQtyItems.length,
      pendingPaymentsCount: pendingPayments.length,
      activeTechnicians: activeTechnicianIds.size,
      newCustomersToday: newCustomersToday.length,
      totalIncome: serviceIncome,
      totalExpenses: purchaseExpenses,
      profit: serviceIncome - purchaseExpenses,
      profitMargin: serviceIncome > 0 ? ((serviceIncome - purchaseExpenses) / serviceIncome) * 100 : 0,
      pipelineCounts,
      statusCounts,
      jobsInRange: jobsInRange.length,
      newJobsInRange: jobsInRange.filter((jc) => getPipelineGroup(jc.status) === "Pending").length,
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      cancelledJobs: pipelineCounts.Cancelled,
      totalTechnicians: technicians.length,
      technicianLoad,
      technicians,
      lowStockItems: lowStockItems.slice(0, 8),
      zeroQtyItems: zeroQtyItems.slice(0, 8),
      recentPurchases,
      pendingPayments: pendingPayments.slice(0, 8),
      totalCustomers: customers.length,
      newCustomersInRange: newCustomersInRange.length,
      topCustomers: [...customers]
        .sort((a, b) => b.jobCount - a.jobCount)
        .slice(0, 6),
      recentJobCards,
      awaitingApproval,
      warrantyJobs,
      incomeChartData,
      jobCards: enrichedJobCards,
      serviceInvoices: scopedServiceInvoices,
      purchaseInvoices: scopedPurchaseInvoices,
    };
  }, [
    jobCards,
    serviceInvoices,
    purchaseInvoices,
    technicians,
    technicianLoad,
    items,
    zeroQtyItems,
    startDate,
    endDate,
    warehouseId,
    apiSummary,
  ]);

  const value = useMemo(
    () => ({
      loading,
      refresh: loadData,
      refreshFreeServices: loadFreeServices,
      freeServiceEntitlements,
      freeServiceLoading,
      startDate,
      endDate,
      warehouseId,
      ...computed,
      apiSummary,
    }),
    [
      loading,
      loadData,
      loadFreeServices,
      freeServiceEntitlements,
      freeServiceLoading,
      startDate,
      endDate,
      warehouseId,
      computed,
      apiSummary,
    ]
  );

  return (
    <ServiceDashboardContext.Provider value={value}>
      {children}
    </ServiceDashboardContext.Provider>
  );
}

export function useServiceDashboard() {
  const ctx = useContext(ServiceDashboardContext);
  if (!ctx) {
    throw new Error("useServiceDashboard must be used within ServiceDashboardProvider");
  }
  return ctx;
}
