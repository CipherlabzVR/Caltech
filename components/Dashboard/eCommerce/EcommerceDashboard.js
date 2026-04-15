import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import EcommerceMetricCard from "@/components/Dashboard/eCommerce/EcommerceMetricCard";

const SPARKLINE_DAYS = 30;
const MAX_ORDER_PAGES = 8;

/** Distinct bar fills for revenue overview (theme-friendly; not the dark/purple reference palette). */
const REVENUE_BAR_COLORS = [
  "#1565c0",
  "#2e7d32",
  "#6a1b9a",
  "#c62828",
  "#ef6c00",
  "#00838f",
  "#4527a0",
  "#5d4037",
  "#ad1457",
  "#00695c",
];

/** Pie slices for category revenue share (distinct from bar chart). */
const CATEGORY_PIE_COLORS = [
  "#3949ab",
  "#00897b",
  "#d84315",
  "#6a1b9a",
  "#c62828",
  "#0277bd",
  "#558b2f",
  "#ad1457",
];

function dateKeyLocal(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPreviousPeriodRange(filterType, filterMonth, filterYear, start, end) {
  if (filterType === "year") {
    const py = filterYear - 1;
    return {
      start: new Date(py, 0, 1, 0, 0, 0, 0),
      end: new Date(py, 11, 31, 23, 59, 59, 999),
    };
  }
  if (filterType === "month") {
    const d = new Date(filterYear, filterMonth - 1, 1);
    d.setMonth(d.getMonth() - 1);
    const py = d.getFullYear();
    const pm = d.getMonth();
    const lastDay = new Date(py, pm + 1, 0).getDate();
    return {
      start: new Date(py, pm, 1, 0, 0, 0, 0),
      end: new Date(py, pm, lastDay, 23, 59, 59, 999),
    };
  }
  const len = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - len);
  return { start: prevStart, end: prevEnd };
}

function comparisonPhrase(filterType) {
  if (filterType === "month") return "last month";
  if (filterType === "year") return "last year";
  return "previous period";
}

function pctChange(current, previous) {
  if (previous == null || Number.isNaN(previous)) return null;
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function filterOrdersInRange(orders, rangeStart, rangeEnd) {
  return orders.filter((o) => {
    if (!o.createdOn) return false;
    return o.createdOn >= rangeStart && o.createdOn <= rangeEnd;
  });
}

function sumNetTotal(orders) {
  return orders.reduce((s, o) => s + (Number(o.netTotal) || 0), 0);
}

function completionRatePercent(orders) {
  if (!orders.length) return 0;
  const done = orders.filter((o) => o.statusValue === 5).length;
  return (done / orders.length) * 100;
}

function buildLastNDaysSparkline(orders, nDays, endDate) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const keys = [];
  for (let i = nDays - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    keys.push(dateKeyLocal(d));
  }
  const map = Object.fromEntries(keys.map((k) => [k, { revenue: 0, orders: 0 }]));
  orders.forEach((o) => {
    if (!o.createdOn) return;
    const k = dateKeyLocal(o.createdOn);
    if (map[k]) {
      map[k].revenue += Number(o.netTotal) || 0;
      map[k].orders += 1;
    }
  });
  return {
    revenue: keys.map((k) => ({ value: map[k].revenue })),
    orders: keys.map((k) => ({ value: map[k].orders })),
    aov: keys.map((k) => ({
      value: map[k].orders ? map[k].revenue / map[k].orders : 0,
    })),
    completion: keys.map((k) => {
      const dayOrders = orders.filter((o) => o.createdOn && dateKeyLocal(o.createdOn) === k);
      return { value: completionRatePercent(dayOrders) };
    }),
  };
}


const ORDER_STATUS_NAME_TO_NUM = {
  queued: 1,
  inprogress: 2,
  dispatched: 3,
  delivered: 4,
  completed: 5,
};

function normalizeEnumKey(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  const tail = s.includes(".") ? s.split(".").pop() : s;
  return tail.replace(/\s+/g, "").toLowerCase();
}

function parseOrderStatus(raw) {
  if (raw == null || raw === "") return NaN;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw >= 1 && raw <= 5 ? raw : NaN;
  }
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
    const key = normalizeEnumKey(raw);
    if (ORDER_STATUS_NAME_TO_NUM[key] != null) return ORDER_STATUS_NAME_TO_NUM[key];
  }
  return NaN;
}

const STATUS_LABELS = {
  1: "Queued",
  2: "In Progress",
  3: "Dispatched",
  4: "Delivered",
  5: "Completed",
};

/** Distinct bar colors per `ECommerceOrderStatus` (1–5). */
const STATUS_BAR_COLORS = {
  1: "#607d8b",
  2: "#0288d1",
  3: "#ed6c02",
  4: "#7b1fa2",
  5: "#2e7d32",
};

function buildListUrl(endpoint, skip, max, extra = {}) {
  const params = new URLSearchParams({
    SkipCount: String(skip),
    MaxResultCount: String(max),
    Search: "null",
    Filter: "null",
    isCurrentDate: "false",
  });
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      params.set(k, String(v));
    }
  });
  return `${BASE_URL}/${endpoint}?${params.toString()}`;
}

/**
 * E-Commerce list APIs return PagedResult at the JSON root ({ totalCount, items }).
 * Some responses may nest under result (legacy / wrapper).
 */
function parsePagedResponse(data) {
  if (!data || typeof data !== "object") {
    return { totalCount: 0, items: [] };
  }

  const tryNode = (node) => {
    if (!node || typeof node !== "object") return null;
    const items = node.items ?? node.Items;
    const tc = node.totalCount ?? node.TotalCount;
    if (items !== undefined || tc !== undefined) {
      return {
        totalCount: Number(tc) || 0,
        items: Array.isArray(items) ? items : [],
      };
    }
    return null;
  };

  let out = tryNode(data);
  if (out) return out;

  const wrapped = data.result ?? data.Result;
  if (wrapped) {
    out = tryNode(wrapped);
    if (out) return out;
    const deeper = wrapped.result ?? wrapped.Result;
    if (deeper) {
      out = tryNode(deeper);
      if (out) return out;
    }
  }

  return { totalCount: 0, items: [] };
}

async function fetchPaged(endpoint, skip, max, token, extra = {}) {
  const url = buildListUrl(endpoint, skip, max, extra);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return { totalCount: 0, items: [] };
  const data = await res.json().catch(() => null);
  return parsePagedResponse(data);
}

function normalizeOrderLine(line) {
  if (!line || typeof line !== "object") return null;
  const productId = Number(line.productId ?? line.ProductId ?? 0) || 0;
  const productName = (line.productName ?? line.ProductName ?? "").trim() || "Product";
  const quantity = Number(line.quantity ?? line.Quantity ?? 0) || 0;
  const lineTotal = Number(line.lineTotal ?? line.LineTotal ?? 0) || 0;
  const subRaw = line.subTotal ?? line.SubTotal;
  const subParsed = subRaw != null && subRaw !== "" ? Number(subRaw) : null;
  const subTotal = Number.isFinite(subParsed) ? subParsed : null;
  const categoryId = Number(line.categoryId ?? line.CategoryId ?? 0) || 0;
  const categoryName = (line.categoryName ?? line.CategoryName ?? "").trim();
  return { productId, productName, quantity, lineTotal, subTotal, categoryId, categoryName };
}

function normalizeOrderLines(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeOrderLine).filter(Boolean);
}

/** Aggregate line items across orders; rank by revenue (line totals). */
function aggregateTopProducts(orders, limit = 10) {
  const map = new Map();
  for (const order of orders) {
    if (!Array.isArray(order.lines)) continue;
    for (const line of order.lines) {
      if (!line) continue;
      const pid = line.productId ?? 0;
      const name = line.productName || "Unknown";
      const key = pid > 0 ? `id:${pid}` : `name:${name}`;
      const qty = Number(line.quantity) || 0;
      const rev = Number(line.lineTotal) || 0;
      const prev = map.get(key) || { productId: pid, name, quantity: 0, revenue: 0 };
      map.set(key, {
        productId: pid,
        name: name || prev.name,
        quantity: prev.quantity + qty,
        revenue: prev.revenue + rev,
      });
    }
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Sum line revenue by product category for the selected period (uses API categoryName when present). */
function aggregateTopCategories(orders, limit = 6) {
  const map = new Map();
  for (const order of orders) {
    if (!Array.isArray(order.lines)) continue;
    for (const line of order.lines) {
      if (!line) continue;
      const cat = line.categoryName?.trim() || "Uncategorized";
      const rev =
        line.subTotal != null && Number.isFinite(line.subTotal) ? line.subTotal : Number(line.lineTotal) || 0;
      map.set(cat, (map.get(cat) || 0) + rev);
    }
  }
  const rows = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  if (rows.length <= limit) return rows;
  const top = rows.slice(0, limit - 1);
  const restSum = rows.slice(limit - 1).reduce((s, x) => s + x.value, 0);
  if (restSum > 0) top.push({ name: "Other", value: restSum });
  return top;
}

function startOfWeekSunday(d) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Revenue overview series for the global date range + Daily / Weekly / Monthly toggle.
 */
function buildRevenueOverviewSeries(mode, start, end, orders) {
  const list = filterOrdersInRange(orders, start, end);
  const byDay = new Map();
  list.forEach((o) => {
    if (!o.createdOn) return;
    const k = dateKeyLocal(o.createdOn);
    byDay.set(k, (byDay.get(k) || 0) + (Number(o.netTotal) || 0));
  });

  let chartData = [];

  if (mode === "daily") {
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(23, 59, 59, 999);
    let spanDays = 0;
    const t = new Date(cursor);
    while (t <= endDay) {
      spanDays++;
      t.setDate(t.getDate() + 1);
    }
    const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const c = new Date(cursor);
    while (c <= endDay) {
      const key = dateKeyLocal(c);
      const name = spanDays <= 7 ? dow[c.getDay()] : `${c.getMonth() + 1}/${c.getDate()}`;
      chartData.push({ name, revenue: byDay.get(key) || 0, idx: chartData.length });
      c.setDate(c.getDate() + 1);
    }
  } else if (mode === "weekly") {
    const byWeek = new Map();
    list.forEach((o) => {
      if (!o.createdOn) return;
      const sw = startOfWeekSunday(o.createdOn);
      const wk = dateKeyLocal(sw);
      byWeek.set(wk, (byWeek.get(wk) || 0) + (Number(o.netTotal) || 0));
    });
    const sorted = [...byWeek.keys()].sort();
    sorted.forEach((wk, i) => {
      chartData.push({
        name: `Week ${i + 1}`,
        revenue: byWeek.get(wk) || 0,
        idx: i,
      });
    });
  } else {
    const byMonth = new Map();
    list.forEach((o) => {
      if (!o.createdOn) return;
      const mk = `${o.createdOn.getFullYear()}-${String(o.createdOn.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(mk, (byMonth.get(mk) || 0) + (Number(o.netTotal) || 0));
    });
    const sorted = [...byMonth.keys()].sort();
    sorted.forEach((mk, i) => {
      const [y, m] = mk.split("-").map(Number);
      const name = new Date(y, m - 1, 1).toLocaleString("en", { month: "short", year: "2-digit" });
      chartData.push({ name, revenue: byMonth.get(mk) || 0, idx: i });
    });
  }

  const total = chartData.reduce((s, x) => s + x.revenue, 0);
  const best = chartData.length ? Math.max(...chartData.map((x) => x.revenue)) : 0;
  const n = chartData.length || 1;
  const avgPerBucket = total / n;
  return { chartData, total, best, avgPerBucket };
}

function normalizeOrder(row) {
  const statusRaw = row.orderStatus ?? row.OrderStatus;
  const statusValue = parseOrderStatus(statusRaw);
  const createdOnRaw = row.createdOn ?? row.CreatedOn;
  const net =
    row.netTotal ??
    row.NetTotal ??
    row.net_total ??
    0;
  return {
    orderId: row.orderId ?? row.OrderId,
    orderNo: row.orderNo ?? row.OrderNo ?? "",
    netTotal: Number(net) || 0,
    createdOn: createdOnRaw ? new Date(createdOnRaw) : null,
    customerName: (row.customerName ?? row.CustomerName ?? "").trim(),
    statusValue: Number.isFinite(statusValue) ? statusValue : null,
    statusLabel:
      Number.isFinite(statusValue) && STATUS_LABELS[statusValue]
        ? STATUS_LABELS[statusValue]
        : "—",
    lines: normalizeOrderLines(row.lines ?? row.Lines ?? []),
  };
}

async function fetchAllOrdersBatched(token) {
  const all = [];
  for (let p = 0; p < MAX_ORDER_PAGES; p++) {
    const batch = await fetchPaged("ECommerce/GetAllOnlineOrders", p * 500, 500, token);
    const raw = batch.items.map((row) => normalizeOrder(row));
    all.push(...raw);
    if (batch.items.length < 500) break;
  }
  return all;
}

export default function EcommerceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterType, setFilterType] = useState("month");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [totalOrdersAllTime, setTotalOrdersAllTime] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [promotionCount, setPromotionCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  /** Period KPIs + 30d sparklines (from batched order sample). */
  const [kpi, setKpi] = useState({
    revenue: { amount: 0, changePct: null, comparison: "", sparkline: [] },
    orders: { count: 0, changePct: null, comparison: "", sparkline: [] },
    aov: { amount: 0, changePct: null, comparison: "", sparkline: [] },
    completion: { rate: 0, changePct: null, comparison: "", sparkline: [] },
  });
  /** Top products by line revenue in the selected period. */
  const [topProducts, setTopProducts] = useState([]);
  /** Category revenue shares for pie chart (selected period, loaded sample). */
  const [topCategories, setTopCategories] = useState([]);
  /** Full order sample for revenue chart aggregation. */
  const [ordersSample, setOrdersSample] = useState([]);
  /** Revenue chart: Daily / Weekly / Monthly buckets within the global period. */
  const [revenueViewMode, setRevenueViewMode] = useState("daily");

  const theme = useTheme();

  const getDateRange = useCallback(() => {
    const now = new Date();
    let start;
    let end;
    if (filterType === "year") {
      start = new Date(filterYear, 0, 1);
      end = new Date(filterYear, 11, 31, 23, 59, 59, 999);
    } else if (filterType === "month") {
      const lastDay = new Date(filterYear, filterMonth, 0).getDate();
      start = new Date(filterYear, filterMonth - 1, 1);
      end = new Date(filterYear, filterMonth - 1, lastDay, 23, 59, 59, 999);
    } else {
      const from = customFrom || `${filterYear}-01-01`;
      const to = customTo || now.toISOString().split("T")[0];
      start = new Date(from);
      end = new Date(to);
      end.setHours(23, 59, 59, 999);
    }
    if (end > now) end = now;
    return { start, end };
  }, [filterType, filterMonth, filterYear, customFrom, customTo]);

  const revenueOverview = useMemo(() => {
    const { start, end } = getDateRange();
    return buildRevenueOverviewSeries(revenueViewMode, start, end, ordersSample);
  }, [revenueViewMode, ordersSample, getDateRange]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      setError("Not signed in.");
      return;
    }

    try {
      const { start, end } = getDateRange();
      const prevRange = getPreviousPeriodRange(
        filterType,
        filterMonth,
        filterYear,
        start,
        end
      );
      const phrase = comparisonPhrase(filterType);

      const [
        allOrdersMeta,
        c1,
        c2,
        c3,
        c4,
        c5,
        customersMeta,
        promotionsMeta,
      ] = await Promise.all([
        fetchPaged("ECommerce/GetAllOnlineOrders", 0, 1, token),
        fetchPaged("ECommerce/GetAllOnlineOrders", 0, 1, token, { OrderStatus: 1 }),
        fetchPaged("ECommerce/GetAllOnlineOrders", 0, 1, token, { OrderStatus: 2 }),
        fetchPaged("ECommerce/GetAllOnlineOrders", 0, 1, token, { OrderStatus: 3 }),
        fetchPaged("ECommerce/GetAllOnlineOrders", 0, 1, token, { OrderStatus: 4 }),
        fetchPaged("ECommerce/GetAllOnlineOrders", 0, 1, token, { OrderStatus: 5 }),
        fetchPaged("ECommerce/GetAllECommerceCustomers", 0, 1, token),
        fetchPaged("ECommerce/GetAllPromotions", 0, 1, token),
      ]);

      const normalizedOrders = await fetchAllOrdersBatched(token);
      setOrdersSample(normalizedOrders);

      setTotalOrdersAllTime(allOrdersMeta.totalCount);
      setCustomerCount(customersMeta.totalCount);
      setPromotionCount(promotionsMeta.totalCount);
      setStatusCounts({
        1: c1.totalCount,
        2: c2.totalCount,
        3: c3.totalCount,
        4: c4.totalCount,
        5: c5.totalCount,
      });

      const currentList = filterOrdersInRange(normalizedOrders, start, end);
      const prevList = filterOrdersInRange(normalizedOrders, prevRange.start, prevRange.end);

      const curRev = sumNetTotal(currentList);
      const prevRev = sumNetTotal(prevList);
      const curOrd = currentList.length;
      const prevOrd = prevList.length;
      const curAov = curOrd ? curRev / curOrd : 0;
      const prevAov = prevOrd ? prevRev / prevOrd : 0;
      const curComp = completionRatePercent(currentList);
      const prevComp = completionRatePercent(prevList);

      const now = new Date();
      const sparkEnd = new Date(Math.min(end.getTime(), now.getTime()));
      const spark = buildLastNDaysSparkline(normalizedOrders, SPARKLINE_DAYS, sparkEnd);

      setKpi({
        revenue: {
          amount: curRev,
          changePct: pctChange(curRev, prevRev),
          comparison: `vs ${formatCurrency(prevRev)} ${phrase}`,
          sparkline: spark.revenue,
        },
        orders: {
          count: curOrd,
          changePct: pctChange(curOrd, prevOrd),
          comparison: `vs ${prevOrd} ${phrase}`,
          sparkline: spark.orders,
        },
        aov: {
          amount: curAov,
          changePct: pctChange(curAov, prevAov),
          comparison: `vs ${formatCurrency(prevAov)} ${phrase}`,
          sparkline: spark.aov,
        },
        completion: {
          rate: curComp,
          changePct: pctChange(curComp, prevComp),
          comparison: `vs ${prevComp.toFixed(1)}% ${phrase}`,
          sparkline: spark.completion,
        },
      });

      setTopProducts(aggregateTopProducts(currentList, 10));
      setTopCategories(aggregateTopCategories(currentList, 7));

      const sorted = [...normalizedOrders].sort((a, b) => {
        const ta = a.createdOn ? a.createdOn.getTime() : 0;
        const tb = b.createdOn ? b.createdOn.getTime() : 0;
        return tb - ta;
      });
      setRecentOrders(sorted.slice(0, 8));
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [getDateRange, filterType, filterMonth, filterYear]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- period filters refresh via Apply only
  }, []);

  const chartData = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((k) => ({
        name: STATUS_LABELS[k],
        orders: statusCounts[k] ?? 0,
        statusKey: k,
        fill: STATUS_BAR_COLORS[k],
      })),
    [statusCounts]
  );

  const quickLinks = [
    {
      title: "Online Orders",
      href: "/ecom/orders/",
      description: "Fulfillment & status",
      color: "#3f51b5",
      icon: <ShoppingBagOutlinedIcon fontSize="small" />,
    },
    {
      title: "E-Commerce Customers",
      href: "/ecom/customers/",
      description: "Registered shoppers",
      color: "#00897b",
      icon: <PeopleAltOutlinedIcon fontSize="small" />,
    },
    {
      title: "Promotions",
      href: "/ecom/promotions/",
      description: "Coupons & campaigns",
      color: "#f57c00",
      icon: <LocalOfferOutlinedIcon fontSize="small" />,
    },
    {
      title: "Hero Banners",
      href: "/ecom/hero-banners/",
      description: "Homepage carousel",
      color: "#8e24aa",
      icon: <AutoGraphOutlinedIcon fontSize="small" />,
    },
    {
      title: "Blog Posts",
      href: "/ecom/blog-posts/",
      description: "Content management",
      color: "#d81b60",
      icon: <SellOutlinedIcon fontSize="small" />,
    },
    {
      title: "Topbar Notifications",
      href: "/ecom/topbar-notifications/",
      description: "Site alerts",
      color: "#3949ab",
      icon: <QueryStatsOutlinedIcon fontSize="small" />,
    },
  ];

  const spotlightCards = [
    {
      title: "Backlog to process",
      value: statusCounts[1] + statusCounts[2],
      description: "Queued and in-progress orders needing action.",
      color: "#5e35b1",
      icon: <Inventory2OutlinedIcon fontSize="small" />,
    },
    {
      title: "Shipping pipeline",
      value: statusCounts[3] + statusCounts[4],
      description: "Orders already moving through delivery.",
      color: "#1e88e5",
      icon: <LocalShippingOutlinedIcon fontSize="small" />,
    },
    {
      title: "Completed orders",
      value: statusCounts[5],
      description: `${totalOrdersAllTime ? ((statusCounts[5] / totalOrdersAllTime) * 100).toFixed(1) : "0.0"}% of all orders are completed.`,
      color: "#2e7d32",
      icon: <DoneAllOutlinedIcon fontSize="small" />,
    },
  ];

  const statusSummary = [1, 2, 3, 4, 5].map((key) => ({
    key,
    label: STATUS_LABELS[key],
    value: statusCounts[key] ?? 0,
    color: STATUS_BAR_COLORS[key],
  }));

  const revenueAvgLabel =
    revenueViewMode === "daily" ? "Avg per day" : revenueViewMode === "weekly" ? "Avg per week" : "Avg per month";

  const bestDayLabel =
    revenueViewMode === "daily" ? "Best day" : revenueViewMode === "weekly" ? "Best week" : "Best month";

  if (loading && !recentOrders.length && totalOrdersAllTime === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={280}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: 4,
          border: (t) => `1px solid ${t.palette.divider}`,
          background: (t) =>
            `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${t.palette.background.paper} 100%)`,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Explore a time range
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Pick a month, year, or custom date window and refresh the dashboard when you are ready.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="ecom-dash-period-type">Period</InputLabel>
            <Select
              labelId="ecom-dash-period-type"
              label="Period"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="custom">Custom range</MenuItem>
            </Select>
          </FormControl>

          {filterType === "month" && (
            <>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel id="ecom-dash-month">Month</InputLabel>
                <Select
                  labelId="ecom-dash-month"
                  label="Month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString("en", { month: "long" })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Year"
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                sx={{ width: 110 }}
              />
            </>
          )}

          {filterType === "year" && (
            <TextField
              size="small"
              label="Year"
              type="number"
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              sx={{ width: 120 }}
            />
          )}

          {filterType === "custom" && (
            <>
              <TextField
                size="small"
                label="From"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                sx={{ minWidth: 170 }}
              />
              <TextField
                size="small"
                label="To"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                sx={{ minWidth: 170 }}
              />
            </>
          )}

          <Button
            variant="contained"
            onClick={load}
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 2.5,
              px: 3,
              py: 1,
              minWidth: { xs: "100%", sm: 140 },
              boxShadow: "none",
              ml: { xs: 0, sm: "auto" },
              alignSelf: { xs: "stretch", sm: "center" },
              background: "linear-gradient(135deg, #5c6bc0 0%, #29b6f6 100%)",
            }}
          >
            {loading ? "Refreshing…" : "Apply filter"}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          KPIs compare the selected period to {comparisonPhrase(filterType)}. Values are computed from up to{" "}
          {MAX_ORDER_PAGES * 500} recent online orders loaded for this page; totals may be incomplete if you
          have more orders than that sample.
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <EcommerceMetricCard
            title="Total revenue"
            mainValue={formatCurrency(kpi.revenue.amount)}
            helperText="Sales collected in the selected period"
            changePercent={kpi.revenue.changePct}
            positiveIsGood
            comparisonText={kpi.revenue.comparison}
            sparklineData={kpi.revenue.sparkline}
            sparklineHigherIsBetter
            accentColor="#00897b"
            icon={<AutoGraphOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EcommerceMetricCard
            title="Orders"
            mainValue={String(kpi.orders.count)}
            helperText="How many online orders were placed"
            changePercent={kpi.orders.changePct}
            positiveIsGood
            comparisonText={kpi.orders.comparison}
            sparklineData={kpi.orders.sparkline}
            sparklineHigherIsBetter
            accentColor="#3949ab"
            icon={<ShoppingBagOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EcommerceMetricCard
            title="Avg. order value"
            mainValue={formatCurrency(kpi.aov.amount)}
            helperText="Average spend per order in this range"
            changePercent={kpi.aov.changePct}
            positiveIsGood
            comparisonText={kpi.aov.comparison}
            sparklineData={kpi.aov.sparkline}
            sparklineHigherIsBetter
            accentColor="#8e24aa"
            icon={<QueryStatsOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EcommerceMetricCard
            title="Completion rate"
            mainValue={`${kpi.completion.rate.toFixed(1)}%`}
            helperText="Share of sampled orders marked completed"
            changePercent={kpi.completion.changePct}
            positiveIsGood
            comparisonText={kpi.completion.comparison}
            sparklineData={kpi.completion.sparkline}
            sparklineHigherIsBetter
            accentColor="#ef6c00"
            icon={<DoneAllOutlinedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <EcommerceMetricCard
            title="All-time orders"
            mainValue={String(totalOrdersAllTime)}
            helperText="Full lifetime order count from the API"
            changePercent={null}
            comparisonText="Covers all recorded online orders"
            accentColor="#3949ab"
            icon={<ShoppingBagOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <EcommerceMetricCard
            title="Customers"
            mainValue={String(customerCount)}
            helperText="Registered e-commerce accounts"
            changePercent={null}
            comparisonText="All-time shopper base"
            accentColor="#00897b"
            icon={<PeopleAltOutlinedIcon fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <EcommerceMetricCard
            title="Promotions"
            mainValue={String(promotionCount)}
            helperText="Active and configured campaign records"
            changePercent={null}
            comparisonText="Available marketing offers"
            accentColor="#ef6c00"
            icon={<LocalOfferOutlinedIcon fontSize="small" />}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {spotlightCards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                height: "100%",
                borderRadius: 4,
                border: (t) => `1px solid ${alpha(card.color, 0.18)}`,
                background: `linear-gradient(180deg, ${alpha(card.color, 0.12)} 0%, rgba(255,255,255,0.96) 100%)`,
                boxShadow: `0 18px 38px ${alpha(card.color, 0.08)}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: card.color }}>
                    {card.value.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, maxWidth: 280 }}>
                    {card.description}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    color: card.color,
                    bgcolor: alpha(card.color, 0.14),
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              borderRadius: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) =>
                `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.05)} 0%, ${t.palette.background.paper} 100%)`,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Revenue overview
              </Typography>
              <ToggleButtonGroup
                value={revenueViewMode}
                exclusive
                size="small"
                onChange={(_e, v) => v && setRevenueViewMode(v)}
                aria-label="Revenue chart granularity"
              >
                <ToggleButton value="daily" sx={{ textTransform: "none", px: 1.5, borderRadius: 2 }}>
                  Daily
                </ToggleButton>
                <ToggleButton value="weekly" sx={{ textTransform: "none", px: 1.5, borderRadius: 2 }}>
                  Weekly
                </ToggleButton>
                <ToggleButton value="monthly" sx={{ textTransform: "none", px: 1.5, borderRadius: 2 }}>
                  Monthly
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Net order totals for the selected period ({revenueViewMode} buckets). Uses the loaded order
              sample.
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
              {statusSummary.map((status) => (
                <Chip
                  key={status.key}
                  label={`${status.label}: ${status.value.toLocaleString()}`}
                  sx={{
                    bgcolor: alpha(status.color, 0.12),
                    color: status.color,
                    border: `1px solid ${alpha(status.color, 0.18)}`,
                    fontWeight: 600,
                  }}
                />
              ))}
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha("#00897b", 0.06),
                    borderColor: alpha("#00897b", 0.14),
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Total revenue
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
                    {formatCurrency(revenueOverview.total)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha("#3949ab", 0.06),
                    borderColor: alpha("#3949ab", 0.14),
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {revenueAvgLabel}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#3949ab" sx={{ mt: 0.5 }}>
                    {formatCurrency(revenueOverview.avgPerBucket)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: alpha("#8e24aa", 0.06),
                    borderColor: alpha("#8e24aa", 0.14),
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {bestDayLabel}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#8e24aa" sx={{ mt: 0.5 }}>
                    {formatCurrency(revenueOverview.best)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {revenueOverview.chartData.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No data for this period.
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={revenueOverview.chartData}
                  margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={
                      revenueOverview.chartData.length > 24
                        ? Math.ceil(revenueOverview.chartData.length / 12)
                        : 0
                    }
                    angle={revenueOverview.chartData.length > 12 ? -25 : 0}
                    textAnchor={revenueOverview.chartData.length > 12 ? "end" : "middle"}
                    height={revenueOverview.chartData.length > 12 ? 56 : 32}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v)
                    }
                    width={56}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {revenueOverview.chartData.map((entry, index) => (
                      <Cell
                        key={`rev-${entry.idx}-${index}`}
                        fill={REVENUE_BAR_COLORS[index % REVENUE_BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Trend"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: theme.palette.background.paper,
                      stroke: theme.palette.primary.main,
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.75,
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                background: (t) =>
                  `linear-gradient(180deg, ${alpha(t.palette.warning.main, 0.08)} 0%, ${alpha(
                    t.palette.warning.main,
                    0.02
                  )} 100%)`,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Top products
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Ranked by line revenue in the selected period (orders in the loaded sample).
              </Typography>
            </Box>
            <TableContainer sx={{ flex: 1, maxHeight: { xs: 360, lg: 520 }, overflow: "auto" }}>
              <Table size="small" stickyHeader aria-label="Top products">
                <TableHead>
                  <TableRow>
                    <TableCell width={40}>#</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">
                          No line items in this period, or no orders in the current sample.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map((row, index) => (
                      <TableRow
                        key={row.productId ? `pid-${row.productId}` : `name-${row.name}-${index}`}
                        hover
                      >
                        <TableCell>
                          <Box
                            sx={{
                              minWidth: 28,
                              height: 28,
                              borderRadius: 2,
                              display: "grid",
                              placeItems: "center",
                              bgcolor: alpha("#5c6bc0", 0.12),
                              color: "#3949ab",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            {index + 1}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} noWrap title={row.name}>
                            {row.name}
                          </Typography>
                          {row.productId > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              ID {row.productId}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={row.quantity.toLocaleString()}
                            sx={{
                              bgcolor: alpha("#1e88e5", 0.1),
                              color: "#1565c0",
                              fontWeight: 700,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={700}>{formatCurrency(row.revenue)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              height: 360,
              borderRadius: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) =>
                `linear-gradient(180deg, ${alpha(t.palette.info.main, 0.05)} 0%, ${t.palette.background.paper} 100%)`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Orders by status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              A colorful breakdown of where orders currently sit in the fulfillment journey.
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
                  formatter={(value) => [value, "Orders"]}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]} name="Orders">
                  {chartData.map((entry) => (
                    <Cell key={entry.statusKey} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              height: 360,
              borderRadius: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
              overflow: "auto",
              background: (t) =>
                `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.05)} 0%, ${t.palette.background.paper} 100%)`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Admin shortcuts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Jump directly into the areas your team uses most often.
            </Typography>
            <Stack spacing={1}>
              {quickLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  fullWidth
                  variant="outlined"
                  sx={{
                    justifyContent: "space-between",
                    textTransform: "none",
                    py: 1.35,
                    px: 1.25,
                    borderRadius: 3,
                    borderColor: alpha(link.color, 0.18),
                    bgcolor: alpha(link.color, 0.04),
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ textAlign: "left" }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: alpha(link.color, 0.12),
                        color: link.color,
                        flexShrink: 0,
                      }}
                    >
                      {link.icon}
                    </Box>
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body2" fontWeight={700}>
                        {link.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {link.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Button>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} md={5} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.75,
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                background: (t) =>
                  `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.07)} 0%, ${alpha(
                    t.palette.primary.main,
                    0.02
                  )} 100%)`,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                Top categories
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Share of line revenue in the selected period (loaded order sample).
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 300, px: 1, py: 2 }}>
              {topCategories.length === 0 ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
                  <Typography variant="body2" color="text.secondary" textAlign="center" px={2}>
                    No line-level revenue in this period for the loaded order sample.
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={topCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      outerRadius={96}
                      paddingAngle={1}
                      labelLine={false}
                    >
                      {topCategories.map((entry, index) => (
                        <Cell
                          key={`cat-${index}-${entry.name}`}
                          fill={CATEGORY_PIE_COLORS[index % CATEGORY_PIE_COLORS.length]}
                          stroke={theme.palette.background.paper}
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span style={{ color: theme.palette.text.primary, fontSize: "0.8rem" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.75,
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                background: (t) =>
                  `linear-gradient(180deg, ${alpha(t.palette.success.main, 0.06)} 0%, ${alpha(
                    t.palette.success.main,
                    0.02
                  )} 100%)`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Recent online orders
                </Typography>
                <Button component={Link} href="/ecom/orders/" size="small" sx={{ textTransform: "none" }}>
                  View all
                </Button>
              </Stack>
            </Box>
            <Table size="small" sx={{ flex: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Net total</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary">
                        No orders yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((o) => (
                    <TableRow key={o.orderId ?? o.orderNo} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {o.orderNo ?? o.orderId}
                        </Typography>
                      </TableCell>
                      <TableCell>{o.customerName || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={o.statusLabel}
                          sx={{
                            bgcolor: alpha(STATUS_BAR_COLORS[o.statusValue] || theme.palette.grey[500], 0.12),
                            color: STATUS_BAR_COLORS[o.statusValue] || theme.palette.text.primary,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700}>{formatCurrency(o.netTotal)}</Typography>
                      </TableCell>
                      <TableCell>
                        {o.createdOn ? formatDate(o.createdOn) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
