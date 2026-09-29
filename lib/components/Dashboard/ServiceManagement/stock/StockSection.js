import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Inventory2,
  AddBox,
  Build,
  WarningAmber,
  Inventory,
  ReceiptLong,
  Warehouse,
  CalendarToday,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatDate, formatCurrency } from "@/components/utils/formatHelper";
import { CARD_SX } from "../constants";
import { useServiceDashboard } from "../ServiceDashboardProvider";
import { SummaryMetricGrid } from "../SummaryMetricCard";
import { DashboardPanelCard, PanelScrollList } from "../DashboardPanelCard";

function getItemStockLevel(item) {
  const raw =
    item?.quantity ??
    item?.qty ??
    item?.Qty ??
    item?.stockQty ??
    item?.availableQty ??
    item?.stockLevel;
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function getItemReorderLevel(item) {
  const raw = item?.reorderLevel ?? item?.ReorderLevel ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function mergeLowStockAlertItems(lowStockItems, zeroQtyItems) {
  const map = new Map();
  [...(lowStockItems || []), ...(zeroQtyItems || [])].forEach((item, idx) => {
    const key = item.id ?? item.stockBalanceId ?? item.code ?? item.Code ?? idx;
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

export function StockSummaryCards() {
  const { totalStockItems, itemsAddedToday, lowStockCount, jobCards } = useServiceDashboard();

  const itemsIssuedToday = jobCards.filter((jc) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = jc.updatedOn ? new Date(jc.updatedOn) : null;
    if (!d) return false;
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && jc.status >= 5;
  }).length;

  const cards = [
    {
      label: "Total Stock Items",
      hint: "Items in inventory",
      value: totalStockItems,
      rawValue: totalStockItems,
      icon: <Inventory2 />,
      accent: "#2563EB",
      borderColor: "rgba(37, 99, 235, 0.18)",
      glowColor: "rgba(37, 99, 235, 0.2)",
      gradient: "linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #60A5FA, #2563EB)",
    },
    {
      label: "Items Added Today",
      hint: "Stock received via purchase",
      value: itemsAddedToday,
      rawValue: itemsAddedToday,
      icon: <AddBox />,
      accent: "#059669",
      borderColor: "rgba(5, 150, 105, 0.18)",
      glowColor: "rgba(5, 150, 105, 0.2)",
      gradient: "linear-gradient(145deg, #ECFDF5 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #34D399, #059669)",
      badge: "Today",
    },
    {
      label: "Jobs Using Parts",
      hint: "Parts issued on jobs today",
      value: itemsIssuedToday,
      rawValue: itemsIssuedToday,
      icon: <Build />,
      accent: "#D97706",
      borderColor: "rgba(217, 119, 6, 0.18)",
      glowColor: "rgba(217, 119, 6, 0.2)",
      gradient: "linear-gradient(145deg, #FFFBEB 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #FBBF24, #D97706)",
      badge: "Today",
    },
    {
      label: "Low Stock Items",
      hint: "Below reorder level",
      value: lowStockCount,
      rawValue: lowStockCount,
      icon: <WarningAmber />,
      accent: "#DC2626",
      borderColor: "rgba(220, 38, 38, 0.2)",
      glowColor: "rgba(220, 38, 38, 0.22)",
      gradient: "linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #F87171, #DC2626)",
      alert: true,
      valueColor: lowStockCount > 0 ? "#DC2626" : "#0F172A",
    },
  ];

  return <SummaryMetricGrid cards={cards} />;
}

export function StockMovementChart() {
  const { purchaseInvoices, startDate, endDate } = useServiceDashboard();

  const chartData = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const stockIn = purchaseInvoices
      .filter((inv) => {
        if (inv.isDeleted) return false;
        const docDate = new Date(inv.documentDate || inv.createdOn);
        docDate.setHours(0, 0, 0, 0);
        const cmp = new Date(d);
        cmp.setHours(0, 0, 0, 0);
        return docDate.getTime() === cmp.getTime();
      })
      .reduce((acc, inv) => acc + Number(inv.netTotal || 0), 0);
    chartData.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      stockIn,
    });
  }

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Stock In (Purchase Value)
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="stockIn" name="Stock In Value" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function getStockStatus(stockLevel, reorder) {
  if (stockLevel <= 0) {
    return { label: "Critical", color: "#DC2626", bg: "#FEE2E2", bar: "#EF4444" };
  }
  if (reorder > 0 && stockLevel <= reorder) {
    return { label: "Low", color: "#D97706", bg: "#FEF3C7", bar: "#F59E0B" };
  }
  return { label: "Watch", color: "#059669", bg: "#D1FAE5", bar: "#10B981" };
}

export function LowStockAlerts() {
  const { lowStockItems, zeroQtyItems } = useServiceDashboard();
  const items = mergeLowStockAlertItems(lowStockItems, zeroQtyItems);
  const criticalCount = items.filter((item) => getItemStockLevel(item) <= 0).length;

  return (
    <DashboardPanelCard
      title="Low Stock Alerts"
      subtitle="Items at or below reorder threshold"
      icon={<WarningAmber />}
      accent="#DC2626"
      gradient="linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 65%)"
      badge={items.length ? `${items.length} items` : null}
      badgeBg={criticalCount > 0 ? "#FEE2E2" : "rgba(220, 38, 38, 0.12)"}
      badgeColor={criticalCount > 0 ? "#DC2626" : "#DC2626"}
      isEmpty={items.length === 0}
      emptyMessage="All stock levels are healthy."
      emptyIcon={<Inventory />}
    >
      <PanelScrollList>
        {items.map((item, idx) => {
          const stockLevel = getItemStockLevel(item);
          const reorder = getItemReorderLevel(item);
          const status = getStockStatus(stockLevel, reorder);
          const barMax = Math.max(reorder * 2, stockLevel, 1);
          const barWidth = `${Math.min(100, (stockLevel / barMax) * 100)}%`;

          return (
            <Box
              key={item.id || item.stockBalanceId || idx}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: idx < items.length - 1 ? "1px solid #F1F5F9" : "none",
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: "#FAFBFC" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: status.bar,
                    mt: 0.6,
                    flexShrink: 0,
                    boxShadow: `0 0 0 3px ${status.bg}`,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0F172A" }}
                  >
                    {item.name || item.productName}
                  </Typography>
                  <Typography
                    sx={{
                      display: "inline-block",
                      mt: 0.35,
                      px: 0.75,
                      py: 0.15,
                      borderRadius: 1,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      fontFamily: "ui-monospace, monospace",
                      bgcolor: "#F1F5F9",
                      color: "#475569",
                    }}
                  >
                    {item.code || item.Code || item.productCode || "—"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      lineHeight: 1,
                      color: status.color,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stockLevel}
                  </Typography>
                  <Typography sx={{ fontSize: "0.62rem", color: "#94A3B8", mt: 0.25 }}>
                    in stock
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 2.25 }}>
                <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: "#E2E8F0", overflow: "hidden" }}>
                  <Box
                    sx={{
                      height: "100%",
                      width: barWidth,
                      borderRadius: 2,
                      bgcolor: status.bar,
                      transition: "width 0.35s ease",
                    }}
                  />
                </Box>
                {reorder > 0 && (
                  <Typography sx={{ fontSize: "0.62rem", color: "#94A3B8", whiteSpace: "nowrap" }}>
                    Reorder: {reorder}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </PanelScrollList>
    </DashboardPanelCard>
  );
}

export function RecentlyAddedItems() {
  const { recentPurchases } = useServiceDashboard();

  return (
    <DashboardPanelCard
      title="Recent Purchase Invoices"
      subtitle="Latest stock received into warehouse"
      icon={<ReceiptLong />}
      accent="#059669"
      gradient="linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 65%)"
      badge={recentPurchases.length ? `${recentPurchases.length} docs` : null}
      badgeBg="rgba(5, 150, 105, 0.12)"
      badgeColor="#059669"
      isEmpty={recentPurchases.length === 0}
      emptyMessage="No purchase invoices recorded yet."
      emptyIcon={<AddBox />}
    >
      <PanelScrollList>
        {recentPurchases.map((inv, idx) => {
          const docDate = formatDate(inv.documentDate || inv.createdOn);
          const amount = Number(inv.netTotal || 0);

          return (
            <Box
              key={inv.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderBottom: idx < recentPurchases.length - 1 ? "1px solid #F1F5F9" : "none",
                transition: "background 0.15s ease",
                "&:hover": { bgcolor: "#FAFBFC" },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  bgcolor: "#ECFDF5",
                  color: "#059669",
                }}
              >
                <Inventory sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "#334155",
                    fontFamily: "ui-monospace, monospace",
                    mb: 0.25,
                  }}
                >
                  {inv.documentNo}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                    <CalendarToday sx={{ fontSize: 12, color: "#94A3B8" }} />
                    <Typography sx={{ fontSize: "0.68rem", color: "#64748B" }}>{docDate}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                    <Warehouse sx={{ fontSize: 12, color: "#94A3B8" }} />
                    <Typography noWrap sx={{ fontSize: "0.68rem", color: "#64748B", maxWidth: 100 }}>
                      {inv.warehouseName || "Default"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {amount > 0 && (
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "#059669",
                    flexShrink: 0,
                  }}
                >
                  {formatCurrency(amount)}
                </Typography>
              )}
            </Box>
          );
        })}
      </PanelScrollList>
    </DashboardPanelCard>
  );
}
