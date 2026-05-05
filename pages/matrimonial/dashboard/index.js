import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import { styled } from "@mui/material/styles";
import BASE_URL from "Base/api";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import dynamic from "next/dynamic";
import { People, Person, AttachMoney, TrendingUp, CheckCircle } from "@mui/icons-material";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/** LKR per premium member — keep in sync with MatrimonialService.MatrimonialPremiumSubscriptionLkr */
const MATRIMONIAL_PREMIUM_FEE_LKR = 1990;

// ---------------- STYLED COMPONENTS (Adapting 2nd Image Vibe) ----------------

const DashboardWrapper = styled(Box)({
  minHeight: "100vh",
  padding: "2rem",
  background: "#e9ecef", // Outer gray like in the image borders
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
});

const MainContainer = styled(Box)({
  width: "100%",
  maxWidth: "1600px",
  minHeight: "90vh",
  background: "linear-gradient(135deg, #fdfbf7 0%, #fff7e6 100%)", // Soft cream to yellow/orange
  borderRadius: "40px",
  padding: "40px 50px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
  position: "relative",
  overflow: "hidden"
});

const SoftCard = styled(Card)(({ theme, dark }) => ({
  backgroundColor: dark ? "#1E1E1E" : "#ffffff", // Some cards are dark in the design
  borderRadius: "28px",
  boxShadow: dark ? "0 20px 40px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.03)",
  height: "100%",
  border: "none",
  color: dark ? "#ffffff" : "#111827",
  position: "relative",
  overflow: "visible"
}));

const ThinNumber = styled(Typography)({
  fontWeight: 300,
  fontSize: "2.5rem",
  lineHeight: 1,
  color: "#111827",
  letterSpacing: "-0.02em"
});

const SmallLabel = styled(Typography)(({ _color }) => ({
  fontSize: "0.8rem",
  fontWeight: 500,
  color: _color || "#6B7280",
  marginTop: "4px"
}));

export default function MatrimonialDashboard() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const [stats, setStats] = useState({
    totalUserCount: 0,
    activeUserCount: 0,
    paidMemberCount: 0,
    freeMemberCount: 0,
    subscriptionAmountEarned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionStorage.setItem("category", "169");
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Matrimonial/GetMatrimonialDashboardStats`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) setStats(data.result);
      }
    } catch (error) {
      console.error("Error formatting:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!navigate) return <AccessDenied />;

  // Frontend calculation to ensure Revenue is instantly correct even if backend sum is 0
  const computedRevenue = (stats.paidMemberCount > 0) 
    ? stats.paidMemberCount * MATRIMONIAL_PREMIUM_FEE_LKR 
    : stats.subscriptionAmountEarned;

  const total = stats.totalUserCount || 0;
  const activeRate = total > 0 ? Math.round((stats.activeUserCount / total) * 100) : 0;
  const premiumRate = total > 0 ? Math.round((stats.paidMemberCount / total) * 100) : 0;

  const formatCurrency = (val) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(val);

  // --- CHART CONFIGS (Matching the requested aesthetic) ---
  
  // Radial Chart (Time Tracker style)
  const radialOptions = {
    chart: { type: 'radialBar', fontFamily: 'inherit' },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%' },
        track: { background: '#fef3c7', strokeWidth: '100%' },
        dataLabels: {
          name: { show: false },
          value: { fontSize: '32px', fontWeight: 300, color: '#111827', offsetY: 10, formatter: (val) => `${val}%` }
        }
      }
    },
    colors: ['#F59E0B'],
    stroke: { lineCap: 'round' }
  };

  // Bar Chart (Progress style with dots instead of solid lines if possible)
  const barOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: ['#111827', '#F59E0B', '#E5E7EB', '#6B7280'],
    plotOptions: {
      bar: {
        columnWidth: '20%',
        borderRadius: 6,
        distributed: true,
        dataLabels: { position: 'top' }
      }
    },
    dataLabels: { 
      enabled: true,
      offsetY: -20,
      style: { colors: ['#6B7280'], fontSize: '11px', fontWeight: 500 },
      formatter: function (val) {
        if (total === 0) return val;
        let percent = Math.round((val / total) * 100);
        return val + " (" + percent + "%)";
      }
    },
    stroke: { width: 0 },
    xaxis: { 
      categories: ['Total', 'Active', 'Premium', 'Free'], 
      labels: { style: { colors: '#9CA3AF', fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    grid: { show: false },
    legend: { show: false },
    tooltip: { enabled: true }
  };

  const barSeries = [{ name: 'Count', data: [stats.totalUserCount, stats.activeUserCount, stats.paidMemberCount, stats.freeMemberCount] }];

  const targetsCompleted = [
    computedRevenue >= 100000,
    stats.totalUserCount > 1000,
    premiumRate >= 10
  ].filter(Boolean).length;

  return (
    <DashboardWrapper>
      <MainContainer>
        {/* Title */}
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#F59E0B", mb: 4, textTransform: "uppercase", letterSpacing: "2px", fontSize: "1rem" }}>
          Dashboard
        </Typography>

        {/* Top Header Row */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={6} flexWrap="wrap" gap={4}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 400, color: "#111827", letterSpacing: "-0.03em" }}>
              Welcome in, <span style={{ fontWeight: 600 }}>Administrator</span>
            </Typography>
            
            {/* Soft progress bars mimicking the top left of the ref image */}
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

          {/* Top Right Stats - Thin Numbers */}
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

        {/* Main Grid Content */}
        <Grid container spacing={4}>
          
          {/* Left Large Portrait Card */}
          <Grid item xs={12} md={4}>
             <SoftCard sx={{ 
               background: "linear-gradient(to bottom, #FEF3C7, #FDE68A)", 
               p: 1, 
               display: "flex", 
               flexDirection: "column",
               justifyContent: "flex-end",
               minHeight: "380px"
             }}>
               {/* Decorative Graphic mimicking the photo */}
               <Box sx={{ 
                 position: "absolute", inset: 0, opacity: 0.1, 
                 background: "url('https://www.transparenttextures.com/patterns/stardust.png')" 
               }} />
               <Box sx={{ p: 4, position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box bgcolor="white" px={2} py={1} borderRadius="20px" display="inline-block" boxShadow="0 4px 10px rgba(0,0,0,0.05)">
                       <Typography fontWeight={700} color="#F59E0B" fontSize="0.8rem">Revenue Highlight</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={600} mb={1}>Current Earnings</Typography>
                    <Typography variant="body2" color="#6B7280" mb={3}>Total subscription revenue generated.</Typography>
                    <Box 
                      bgcolor="rgba(255,255,255,0.6)" 
                      backdropFilter="blur(10px)"
                      px={3} py={1.5} 
                      borderRadius="20px" 
                      display="inline-block"
                      border="1px solid rgba(255,255,255,0.8)"
                    >
                      <Typography variant="h5" fontWeight={700} color="#111827">
                        {loading ? "..." : formatCurrency(computedRevenue)}
                      </Typography>
                    </Box>
                  </Box>
               </Box>
             </SoftCard>
          </Grid>

          {/* Center Column: Progress & Radial */}
          <Grid item xs={12} md={5}>
            <Grid container spacing={4}>
               {/* Progress Bar Chart */}
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

               {/* Time Tracker / Radial Chart */}
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

          {/* Right Column: Dark Panel */}
          <Grid item xs={12} md={3}>
             <SoftCard dark sx={{ minHeight: "100%" }}>
                <CardContent sx={{ p: 4 }}>
                   <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                      <Typography variant="h6" fontWeight={500} color="white">MyMatch Targets</Typography>
                      <Typography fontSize="1.5rem" fontWeight={300} color="white">{targetsCompleted}/3</Typography>
                   </Box>

                   <Box display="flex" flexDirection="column" gap={3}>
                      {/* KPI List Items */}
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
