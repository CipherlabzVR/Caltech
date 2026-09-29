import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  Percent,
  ShowChart,
} from "@mui/icons-material";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/components/utils/formatHelper";
import { CARD_SX } from "../constants";
import { useServiceDashboard } from "../ServiceDashboardProvider";
import { SummaryMetricGrid } from "../SummaryMetricCard";
import { DashboardPanelCard } from "../DashboardPanelCard";

export function FinanceSummaryCards() {
  const { totalIncome, totalExpenses, profit, profitMargin } = useServiceDashboard();
  const profitPositive = profit >= 0;

  const cards = [
    {
      label: "Total Income",
      hint: "Service invoice revenue",
      value: formatCurrency(totalIncome),
      rawValue: totalIncome,
      icon: <TrendingUp />,
      accent: "#059669",
      borderColor: "rgba(5, 150, 105, 0.18)",
      glowColor: "rgba(5, 150, 105, 0.2)",
      gradient: "linear-gradient(145deg, #ECFDF5 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #34D399, #059669)",
      badge: "Period",
    },
    {
      label: "Total Expenses",
      hint: "Purchase & operating costs",
      value: formatCurrency(totalExpenses),
      rawValue: totalExpenses,
      icon: <TrendingDown />,
      accent: "#DC2626",
      borderColor: "rgba(220, 38, 38, 0.18)",
      glowColor: "rgba(220, 38, 38, 0.16)",
      gradient: "linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #F87171, #DC2626)",
      badge: "Period",
    },
    {
      label: "Net Profit",
      hint: "Income minus expenses",
      value: formatCurrency(profit),
      rawValue: profit,
      icon: <AccountBalanceWallet />,
      accent: profitPositive ? "#2563EB" : "#DC2626",
      borderColor: profitPositive ? "rgba(37, 99, 235, 0.18)" : "rgba(220, 38, 38, 0.2)",
      glowColor: profitPositive ? "rgba(37, 99, 235, 0.2)" : "rgba(220, 38, 38, 0.2)",
      gradient: profitPositive
        ? "linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 70%)"
        : "linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 70%)",
      iconGradient: profitPositive
        ? "linear-gradient(135deg, #60A5FA, #2563EB)"
        : "linear-gradient(135deg, #F87171, #DC2626)",
      valueColor: profitPositive ? "#2563EB" : "#DC2626",
      badge: profitPositive ? "Positive" : "Negative",
    },
    {
      label: "Profit Margin",
      hint: "Net margin for period",
      value: `${profitMargin.toFixed(1)}%`,
      rawValue: profitMargin,
      icon: <Percent />,
      accent: "#7C3AED",
      borderColor: "rgba(124, 58, 237, 0.18)",
      glowColor: "rgba(124, 58, 237, 0.2)",
      gradient: "linear-gradient(145deg, #F5F3FF 0%, #FFFFFF 70%)",
      iconGradient: "linear-gradient(135deg, #A78BFA, #7C3AED)",
      valueSize: "1.35rem",
    },
  ];

  return <SummaryMetricGrid cards={cards} />;
}
export function DailyMonthlyIncomeChart() {
  const { incomeChartData } = useServiceDashboard();

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Daily Service Income
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={incomeChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Legend />
            <Line type="monotone" dataKey="income" name="Income" stroke="#2563EB" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProfitSummaryCard() {
  const { totalIncome, totalExpenses, profit, profitMargin } = useServiceDashboard();
  const profitPositive = profit >= 0;
  const accent = profitPositive ? "#2563EB" : "#DC2626";
  const totalFlow = Math.max(totalIncome + totalExpenses, 1);
  const incomePct = (totalIncome / totalFlow) * 100;
  const expensePct = (totalExpenses / totalFlow) * 100;
  const hasData = totalIncome > 0 || totalExpenses > 0;

  const rows = [
    {
      label: "Total Income",
      value: formatCurrency(totalIncome),
      icon: <TrendingUp sx={{ fontSize: 16 }} />,
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totalExpenses),
      icon: <TrendingDown sx={{ fontSize: 16 }} />,
      color: "#DC2626",
      bg: "#FEF2F2",
    },
  ];

  return (
    <DashboardPanelCard
      title="Profit Summary"
      subtitle="Financial snapshot for selected period"
      icon={<ShowChart />}
      accent={accent}
      gradient={
        profitPositive
          ? "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 65%)"
          : "linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 65%)"
      }
      badge={`${profitMargin.toFixed(1)}% margin`}
      badgeBg={profitPositive ? "rgba(37, 99, 235, 0.12)" : "rgba(220, 38, 38, 0.12)"}
      badgeColor={accent}
      minBodyHeight={280}
    >
      <Box sx={{ px: 2.5, py: 2, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            textAlign: "center",
            py: 2,
            px: 2,
            mb: 2,
            borderRadius: 2.5,
            background: profitPositive
              ? "linear-gradient(145deg, #EFF6FF 0%, #F8FAFC 100%)"
              : "linear-gradient(145deg, #FEF2F2 0%, #F8FAFC 100%)",
            border: `1px solid ${profitPositive ? "rgba(37, 99, 235, 0.15)" : "rgba(220, 38, 38, 0.15)"}`,
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748B", mb: 0.5 }}>
            Net Profit
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.75rem",
              lineHeight: 1.1,
              color: accent,
              letterSpacing: "-0.03em",
            }}
          >
            {formatCurrency(profit)}
          </Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "#94A3B8", mt: 0.75 }}>
            {profitPositive ? "Positive performance" : "Review expenses"}
          </Typography>
        </Box>

        {hasData && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "#059669" }}>
                Income {incomePct.toFixed(0)}%
              </Typography>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "#DC2626" }}>
                Expenses {expensePct.toFixed(0)}%
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                height: 8,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "#E2E8F0",
              }}
            >
              <Box
                sx={{
                  width: `${incomePct}%`,
                  bgcolor: "#10B981",
                  transition: "width 0.4s ease",
                }}
              />
              <Box
                sx={{
                  width: `${expensePct}%`,
                  bgcolor: "#EF4444",
                  transition: "width 0.4s ease",
                }}
              />
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mt: "auto" }}>
          {rows.map((row) => (
            <Box
              key={row.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                p: 1.25,
                borderRadius: 2,
                bgcolor: "#FAFBFC",
                border: "1px solid #F1F5F9",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: row.bg,
                  color: row.color,
                  flexShrink: 0,
                }}
              >
                {row.icon}
              </Box>
              <Typography sx={{ flex: 1, fontSize: "0.78rem", color: "#64748B", fontWeight: 500 }}>
                {row.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8125rem", color: row.color }}>
                {row.label === "Total Expenses" && totalExpenses > 0 ? `-${row.value}` : row.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </DashboardPanelCard>
  );
}
