import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import BASE_URL from "Base/api";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import dynamic from "next/dynamic";
import { People, Person, AttachMoney, TrendingUp, CheckCircle } from "@mui/icons-material";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/** LKR per premium member — keep in sync with MatrimonialService.MatrimonialPremiumSubscriptionLkr */
const MATRIMONIAL_PREMIUM_FEE_LKR = 1990;

/** Must match SidebarData Matrimonial → Dashboard categoryId. */
const MATRIMONIAL_CATEGORY_DASHBOARD = 175;

const EMPTY_REVENUE_SUMMARY = {
  totalRevenue: 0,
  approvedTransferCount: 0,
  premiumSelfRevenue: 0,
  premiumSelfCount: 0,
  matchmakerClientRevenue: 0,
  matchmakerClientCount: 0,
  subAccountRevenue: 0,
  subAccountCount: 0,
  otherRevenue: 0,
  otherCount: 0,
  pendingTransferAmount: 0,
  pendingTransferCount: 0,
  reportAsOfUtc: null,
  periodFromUtc: null,
  periodToUtc: null,
};

function toDateInputValue(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseApiDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Resolve UTC query params for the dashboard revenue API from radio preset + optional custom dates. */
function resolveRevenuePeriod(periodMode, customFrom, customTo) {
  const today = new Date();
  const asOf = toDateInputValue(today);

  if (periodMode === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { fromDate: toDateInputValue(start), toDate: asOf };
  }
  if (periodMode === "year") {
    const start = new Date(today.getFullYear(), 0, 1);
    return { fromDate: toDateInputValue(start), toDate: asOf };
  }
  if (periodMode === "custom") {
    return {
      fromDate: customFrom || null,
      toDate: customTo || asOf,
    };
  }
  // all — cumulative through report date (today)
  return { fromDate: null, toDate: asOf };
}

// ---------------- STYLED COMPONENTS (Adapting 2nd Image Vibe) ----------------

const DashboardWrapper = styled(Box)({
  minHeight: "100vh",
  padding: "2rem",
  background: "#e9ecef",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

const MainContainer = styled(Box)({
  width: "100%",
  maxWidth: "1600px",
  minHeight: "90vh",
  background: "linear-gradient(135deg, #fdfbf7 0%, #fff7e6 100%)",
  borderRadius: "40px",
  padding: "40px 50px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
  position: "relative",
  overflow: "hidden",
});

const SoftCard = styled(Card)(({ theme, dark }) => ({
  backgroundColor: dark ? "#1E1E1E" : "#ffffff",
  borderRadius: "28px",
  boxShadow: dark ? "0 20px 40px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.03)",
  height: "100%",
  border: "none",
  color: dark ? "#ffffff" : "#111827",
  position: "relative",
  overflow: "visible",
}));

const ThinNumber = styled(Typography)({
  fontWeight: 300,
  fontSize: "2.5rem",
  lineHeight: 1,
  color: "#111827",
  letterSpacing: "-0.02em",
});

const SmallLabel = styled(Typography)(({ _color }) => ({
  fontSize: "0.8rem",
  fontWeight: 500,
  color: _color || "#6B7280",
  marginTop: "4px",
}));

function RevenueSummaryRow({ label, count, amount, formatCurrency, accent }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
      <Box>
        <Typography fontSize="0.78rem" fontWeight={600} color="#374151">
          {label}
        </Typography>
        <Typography fontSize="0.68rem" color="#9CA3AF">
          {count} approved transfer{count === 1 ? "" : "s"}
        </Typography>
      </Box>
      <Typography fontSize="0.85rem" fontWeight={700} color={accent || "#111827"}>
        {formatCurrency(amount)}
      </Typography>
    </Box>
  );
}

export default function MatrimonialDashboard() {
  // Always check this page's category — do not reuse a stale sessionStorage value
  // from Packages / Bank Transfers / etc. (that caused Access Denied on first visit).
  const { navigate, permissionsLoading } = IsPermissionEnabled(MATRIMONIAL_CATEGORY_DASHBOARD);
  const [stats, setStats] = useState({
    totalUserCount: 0,
    activeUserCount: 0,
    paidMemberCount: 0,
    freeMemberCount: 0,
    subscriptionAmountEarned: 0,
    revenueSummary: EMPTY_REVENUE_SUMMARY,
  });
  const [loading, setLoading] = useState(true);

  /** all | month | year | custom */
  const [revenuePeriodMode, setRevenuePeriodMode] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState(toDateInputValue(new Date()));

  const revenueQuery = useMemo(
    () => resolveRevenuePeriod(revenuePeriodMode, customFromDate, customToDate),
    [revenuePeriodMode, customFromDate, customToDate]
  );

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (revenueQuery.fromDate) params.set("fromDate", revenueQuery.fromDate);
      if (revenueQuery.toDate) params.set("toDate", revenueQuery.toDate);
      const qs = params.toString();
      const url = `${BASE_URL}/Matrimonial/GetMatrimonialDashboardStats${qs ? `?${qs}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const r = data.result;
          const rs = r.revenueSummary ?? r.RevenueSummary ?? {};
          setStats({
            totalUserCount: r.totalUserCount ?? r.TotalUserCount ?? 0,
            activeUserCount: r.activeUserCount ?? r.ActiveUserCount ?? 0,
            paidMemberCount: r.paidMemberCount ?? r.PaidMemberCount ?? 0,
            freeMemberCount: r.freeMemberCount ?? r.FreeMemberCount ?? 0,
            subscriptionAmountEarned: r.subscriptionAmountEarned ?? r.SubscriptionAmountEarned ?? 0,
            revenueSummary: {
              totalRevenue: rs.totalRevenue ?? rs.TotalRevenue ?? 0,
              approvedTransferCount: rs.approvedTransferCount ?? rs.ApprovedTransferCount ?? 0,
              premiumSelfRevenue: rs.premiumSelfRevenue ?? rs.PremiumSelfRevenue ?? 0,
              premiumSelfCount: rs.premiumSelfCount ?? rs.PremiumSelfCount ?? 0,
              matchmakerClientRevenue: rs.matchmakerClientRevenue ?? rs.MatchmakerClientRevenue ?? 0,
              matchmakerClientCount: rs.matchmakerClientCount ?? rs.MatchmakerClientCount ?? 0,
              subAccountRevenue: rs.subAccountRevenue ?? rs.SubAccountRevenue ?? 0,
              subAccountCount: rs.subAccountCount ?? rs.SubAccountCount ?? 0,
              otherRevenue: rs.otherRevenue ?? rs.OtherRevenue ?? 0,
              otherCount: rs.otherCount ?? rs.OtherCount ?? 0,
              pendingTransferAmount: rs.pendingTransferAmount ?? rs.PendingTransferAmount ?? 0,
              pendingTransferCount: rs.pendingTransferCount ?? rs.PendingTransferCount ?? 0,
              reportAsOfUtc: rs.reportAsOfUtc ?? rs.ReportAsOfUtc ?? null,
              periodFromUtc: rs.periodFromUtc ?? rs.PeriodFromUtc ?? null,
              periodToUtc: rs.periodToUtc ?? rs.PeriodToUtc ?? null,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [revenueQuery.fromDate, revenueQuery.toDate]);

  useEffect(() => {
    sessionStorage.setItem("category", String(MATRIMONIAL_CATEGORY_DASHBOARD));
  }, []);

  useEffect(() => {
    if (!permissionsLoading && navigate) fetchStats();
  }, [permissionsLoading, navigate, fetchStats]);

  if (permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    );
  }

  if (!navigate) return <AccessDenied />;

  const rev = stats.revenueSummary;
  const computedRevenue = rev.totalRevenue > 0
    ? rev.totalRevenue
    : (stats.paidMemberCount > 0
      ? stats.paidMemberCount * MATRIMONIAL_PREMIUM_FEE_LKR
      : stats.subscriptionAmountEarned);

  const total = stats.totalUserCount || 0;
  const activeRate = total > 0 ? Math.round((stats.activeUserCount / total) * 100) : 0;
  const premiumRate = total > 0 ? Math.round((stats.paidMemberCount / total) * 100) : 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(val || 0);

  const formatReportDate = (raw) => {
    const d = parseApiDate(raw);
    if (!d) return "—";
    return d.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
  };

  const periodLabel = (() => {
    if (revenuePeriodMode === "all") return "All time";
    if (revenuePeriodMode === "month") return "This month";
    if (revenuePeriodMode === "year") return "This year";
    if (customFromDate && customToDate) return `${customFromDate} → ${customToDate}`;
    if (customToDate) return `Through ${customToDate}`;
    return "Custom range";
  })();

  const radialOptions = {
    chart: { type: "radialBar", fontFamily: "inherit" },
    plotOptions: {
      radialBar: {
        hollow: { size: "65%" },
        track: { background: "#fef3c7", strokeWidth: "100%" },
        dataLabels: {
          name: { show: false },
          value: { fontSize: "32px", fontWeight: 300, color: "#111827", offsetY: 10, formatter: (val) => `${val}%` },
        },
      },
    },
    colors: ["#F59E0B"],
    stroke: { lineCap: "round" },
  };

  const barOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#111827", "#F59E0B", "#E5E7EB", "#6B7280"],
    plotOptions: {
      bar: {
        columnWidth: "20%",
        borderRadius: 6,
        distributed: true,
        dataLabels: { position: "top" },
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: { colors: ["#6B7280"], fontSize: "11px", fontWeight: 500 },
      formatter(val) {
        if (total === 0) return val;
        const percent = Math.round((val / total) * 100);
        return `${val} (${percent}%)`;
      },
    },
    stroke: { width: 0 },
    xaxis: {
      categories: ["Total", "Active", "Premium", "Free"],
      labels: { style: { colors: "#9CA3AF", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    legend: { show: false },
    tooltip: { enabled: true },
  };

  const barSeries = [{ name: "Count", data: [stats.totalUserCount, stats.activeUserCount, stats.paidMemberCount, stats.freeMemberCount] }];

  const targetsCompleted = [
    computedRevenue >= 100000,
    stats.totalUserCount > 1000,
    premiumRate >= 10,
  ].filter(Boolean).length;

  return (
    <DashboardWrapper>
      <MainContainer>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#F59E0B", mb: 4, textTransform: "uppercase", letterSpacing: "2px", fontSize: "1rem" }}>
          Dashboard
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={6} flexWrap="wrap" gap={4}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 400, color: "#111827", letterSpacing: "-0.03em" }}>
              Welcome in, <span style={{ fontWeight: 600 }}>Administrator</span>
            </Typography>

            <Box display="flex" gap={4} mt={3}>
              <Box width="150px">
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography fontSize="0.75rem" color="#6B7280" fontWeight={600}>Conversion</Typography>
                </Box>
                <Box height="24px" borderRadius="12px" bgcolor="#E5E7EB" position="relative" overflow="hidden" display="flex">
                  <Box width={`${premiumRate}%`} minWidth={premiumRate > 0 ? "35px" : "0"} bgcolor="#111827" display="flex" alignItems="center" justifyContent="center">
                    <Typography fontSize="0.65rem" color="white">{premiumRate}%</Typography>
                  </Box>
                  <Box flex={1} bgcolor="#FCD34D"></Box>
                </Box>
              </Box>

              <Box width="150px">
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography fontSize="0.75rem" color="#6B7280" fontWeight={600}>Engagement</Typography>
                </Box>
                <Box height="24px" borderRadius="12px" bgcolor="#E5E7EB" position="relative" overflow="hidden" display="flex">
                  <Box width={`${activeRate}%`} minWidth={activeRate > 0 ? "35px" : "0"} bgcolor="#E5E7EB" display="flex" alignItems="center" justifyContent="center">
                    <Typography fontSize="0.65rem" color="#6B7280">{activeRate}%</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box display="flex" gap={6} flexWrap="wrap" sx={{ width: { xs: "100%", md: "auto" } }} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Box textAlign="center" minWidth="90px">
              <Box display="flex" alignItems="center" gap={1} justifyContent="center" color="#6B7280">
                <People sx={{ fontSize: 18 }} />
                <ThinNumber>{loading ? "-" : stats.totalUserCount}</ThinNumber>
              </Box>
              <SmallLabel>Total Members</SmallLabel>
            </Box>
            <Box textAlign="center" minWidth="90px">
              <Box display="flex" alignItems="center" gap={1} justifyContent="center" color="#10B981">
                <Box width={12} height={12} borderRadius="50%" bgcolor="#10B981"></Box>
                <ThinNumber>{loading ? "-" : stats.activeUserCount}</ThinNumber>
              </Box>
              <SmallLabel>Active Users</SmallLabel>
            </Box>
            <Box textAlign="center" minWidth="90px">
              <Box display="flex" alignItems="center" gap={1} justifyContent="center" color="#F59E0B">
                <Box width={12} height={12} borderRadius="50%" bgcolor="#F59E0B"></Box>
                <ThinNumber>{loading ? "-" : stats.paidMemberCount}</ThinNumber>
              </Box>
              <SmallLabel>Premium</SmallLabel>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <SoftCard
              sx={{
                background: "linear-gradient(to bottom, #FEF3C7, #FDE68A)",
                p: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: "480px",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.1,
                  background: "url('https://www.transparenttextures.com/patterns/stardust.png')",
                }}
              />
              <Box sx={{ p: 3, position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box bgcolor="white" px={2} py={1} borderRadius="20px" display="inline-block" boxShadow="0 4px 10px rgba(0,0,0,0.05)">
                    <Typography fontWeight={700} color="#F59E0B" fontSize="0.8rem">Revenue Highlight</Typography>
                  </Box>
                  <Typography fontSize="0.72rem" color="#6B7280" fontWeight={600}>
                    Report as of {formatReportDate(rev.reportAsOfUtc)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="#374151" mb={0.5}>
                    Period
                  </Typography>
                  <RadioGroup
                    row
                    value={revenuePeriodMode}
                    onChange={(e) => setRevenuePeriodMode(e.target.value)}
                    sx={{ flexWrap: "wrap", gap: 0.5 }}
                  >
                    <FormControlLabel value="all" control={<Radio size="small" sx={{ color: "#F59E0B", "&.Mui-checked": { color: "#F59E0B" } }} />} label={<Typography fontSize="0.75rem">All time</Typography>} />
                    <FormControlLabel value="month" control={<Radio size="small" sx={{ color: "#F59E0B", "&.Mui-checked": { color: "#F59E0B" } }} />} label={<Typography fontSize="0.75rem">This month</Typography>} />
                    <FormControlLabel value="year" control={<Radio size="small" sx={{ color: "#F59E0B", "&.Mui-checked": { color: "#F59E0B" } }} />} label={<Typography fontSize="0.75rem">This year</Typography>} />
                    <FormControlLabel value="custom" control={<Radio size="small" sx={{ color: "#F59E0B", "&.Mui-checked": { color: "#F59E0B" } }} />} label={<Typography fontSize="0.75rem">Custom</Typography>} />
                  </RadioGroup>
                </Box>

                {revenuePeriodMode === "custom" && (
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <TextField
                      label="From"
                      type="date"
                      size="small"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: "1 1 120px", bgcolor: "rgba(255,255,255,0.7)", borderRadius: 1 }}
                    />
                    <TextField
                      label="To (report date)"
                      type="date"
                      size="small"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: "1 1 120px", bgcolor: "rgba(255,255,255,0.7)", borderRadius: 1 }}
                    />
                  </Box>
                )}

                <Box
                  bgcolor="rgba(255,255,255,0.65)"
                  backdropFilter="blur(10px)"
                  borderRadius="16px"
                  border="1px solid rgba(255,255,255,0.8)"
                  px={2.5}
                  py={2}
                >
                  <Typography fontSize="0.72rem" color="#6B7280" mb={0.5}>
                    {periodLabel} · {rev.approvedTransferCount} approved payment{rev.approvedTransferCount === 1 ? "" : "s"}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#111827" mb={1.5}>
                    {loading ? "..." : formatCurrency(computedRevenue)}
                  </Typography>
                  <Divider sx={{ mb: 1.5, borderColor: "rgba(0,0,0,0.06)" }} />
                  <RevenueSummaryRow label="Premium (Self)" count={rev.premiumSelfCount} amount={rev.premiumSelfRevenue} formatCurrency={formatCurrency} />
                  <RevenueSummaryRow label="Matchmaker client accounts" count={rev.matchmakerClientCount} amount={rev.matchmakerClientRevenue} formatCurrency={formatCurrency} accent="#D97706" />
                  <RevenueSummaryRow label="Sub-account slots" count={rev.subAccountCount} amount={rev.subAccountRevenue} formatCurrency={formatCurrency} accent="#2563EB" />
                  {rev.otherCount > 0 && (
                    <RevenueSummaryRow label="Other amounts" count={rev.otherCount} amount={rev.otherRevenue} formatCurrency={formatCurrency} accent="#6B7280" />
                  )}
                  <Divider sx={{ my: 1.5, borderColor: "rgba(0,0,0,0.06)" }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography fontSize="0.78rem" fontWeight={600} color="#374151">Pending transfers</Typography>
                      <Typography fontSize="0.68rem" color="#9CA3AF">{rev.pendingTransferCount} awaiting approval</Typography>
                    </Box>
                    <Typography fontSize="0.85rem" fontWeight={600} color="#92400E">
                      {formatCurrency(rev.pendingTransferAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </SoftCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <SoftCard>
                  <CardContent sx={{ p: 4 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6" fontWeight={500}>Analytics</Typography>
                      <Typography color="#6B7280" fontSize="0.8rem">Volume Breakdown</Typography>
                    </Box>
                    <Box sx={{ mt: 3, height: 180 }}>
                      {!loading && <ReactApexChart options={barOptions} series={barSeries} type="bar" height="100%" />}
                    </Box>
                  </CardContent>
                </SoftCard>
              </Grid>

              <Grid item xs={12}>
                <SoftCard>
                  <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={500} alignSelf="flex-start">Engagement</Typography>
                    <Box sx={{ height: 200, width: "100%", display: "flex", justifyContent: "center" }}>
                      {!loading && <ReactApexChart options={radialOptions} series={[activeRate]} type="radialBar" height="250" />}
                    </Box>
                    <Box display="flex" gap={2} mt={1}>
                      <Typography fontSize="0.75rem" color="#6B7280">Avg. Platform Activity</Typography>
                    </Box>
                  </CardContent>
                </SoftCard>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={3}>
            <SoftCard dark sx={{ minHeight: "100%" }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                  <Typography variant="h6" fontWeight={500} color="white">MyMatch Targets</Typography>
                  <Typography fontSize="1.5rem" fontWeight={300} color="white">{targetsCompleted}/3</Typography>
                </Box>

                <Box display="flex" flexDirection="column" gap={3}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box bgcolor="#374151" p={1} borderRadius="10px"><AttachMoney sx={{ fontSize: 18, color: "white" }} /></Box>
                    <Box flex={1}>
                      <Typography fontSize="0.85rem" fontWeight={600} color="white">Revenue Target</Typography>
                      <Typography fontSize="0.7rem" color="#9CA3AF">LKR 100k Monthly</Typography>
                    </Box>
                    <CheckCircle sx={{ color: computedRevenue >= 100000 ? "#FCD34D" : "#4B5563", fontSize: 20 }} />
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Box bgcolor="#374151" p={1} borderRadius="10px"><Person sx={{ fontSize: 18, color: "white" }} /></Box>
                    <Box flex={1}>
                      <Typography fontSize="0.85rem" fontWeight={600} color="white">Member Growth</Typography>
                      <Typography fontSize="0.7rem" color="#9CA3AF">&gt; 1000 Users</Typography>
                    </Box>
                    <CheckCircle sx={{ color: stats.totalUserCount > 1000 ? "#FCD34D" : "#4B5563", fontSize: 20 }} />
                  </Box>

                  <Box display="flex" alignItems="center" gap={2}>
                    <Box bgcolor="#374151" p={1} borderRadius="10px"><TrendingUp sx={{ fontSize: 18, color: "white" }} /></Box>
                    <Box flex={1}>
                      <Typography fontSize="0.85rem" fontWeight={600} color="white">Premium Conversion</Typography>
                      <Typography fontSize="0.7rem" color="#9CA3AF">&gt; 10% Required</Typography>
                    </Box>
                    <CheckCircle sx={{ color: premiumRate >= 10 ? "#FCD34D" : "#4B5563", fontSize: 20 }} />
                  </Box>
                </Box>

                <Box mt={6} p={3} bgcolor="#2D2D2D" borderRadius="20px">
                  <Typography fontSize="0.75rem" color="#9CA3AF" mb={1}>Current Free Accounts</Typography>
                  <Typography variant="h4" fontWeight={300} color="white">{stats.freeMemberCount}</Typography>
                </Box>
              </CardContent>
            </SoftCard>
          </Grid>
        </Grid>
      </MainContainer>
    </DashboardWrapper>
  );
}
