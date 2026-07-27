import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import {
  Assignment,
  CheckCircle,
  AttachMoney,
  ShoppingCart,
  Warning,
  Payment,
  Engineering,
  PersonAdd,
  ArrowForward,
  TrendingUp,
} from "@mui/icons-material";
import { formatCurrency } from "@/components/utils/formatHelper";
import { getPipelineGroup, isSameDay } from "./constants";
import { useServiceDashboard } from "./ServiceDashboardProvider";
import JobCardListModal from "./modals/JobCardListModal";

function StatCard({ card }) {
  const isAlert = card.alert && Number(card.rawValue) > 0;
  const clickable = !!card.onClick;

  return (
    <Box
      onClick={card.onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.onClick();
              }
            }
          : undefined
      }
      sx={{
        position: "relative",
        height: "100%",
        minHeight: 148,
        borderRadius: 3,
        overflow: "hidden",
        cursor: clickable ? "pointer" : "default",
        background: card.gradient,
        border: `1px solid ${card.borderColor}`,
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        "&:hover": clickable
          ? {
              transform: "translateY(-6px)",
              boxShadow: `0 16px 32px ${card.glowColor}`,
            }
          : {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
            },
        "&:focus-visible": clickable
          ? {
              outline: `2px solid ${card.accent}`,
              outlineOffset: 2,
            }
          : {},
      }}
    >
      {/* Decorative shapes */}
      <Box
        sx={{
          position: "absolute",
          top: -28,
          right: -28,
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: card.accent,
          opacity: 0.12,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -16,
          left: -16,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: card.accent,
          opacity: 0.08,
        }}
      />

      <Box sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: card.iconGradient,
              color: "#fff",
              boxShadow: `0 6px 16px ${card.glowColor}`,
            }}
          >
            {React.cloneElement(card.icon, { sx: { fontSize: 26 } })}
          </Box>
          {isAlert && (
            <Chip
              label="Needs attention"
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 600,
                bgcolor: "rgba(239, 68, 68, 0.12)",
                color: "#DC2626",
                border: "1px solid rgba(239, 68, 68, 0.25)",
              }}
            />
          )}
          {card.badge && !isAlert && (
            <Chip
              label={card.badge}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 600,
                bgcolor: "rgba(255,255,255,0.7)",
                color: card.accent,
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.75rem", md: "2rem" },
            lineHeight: 1.1,
            color: "#0F172A",
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          {card.value}
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "0.9rem",
            color: "#334155",
            mb: 0.25,
          }}
        >
          {card.title}
        </Typography>

        <Typography
          sx={{
            fontSize: "0.75rem",
            color: "#64748B",
            lineHeight: 1.4,
          }}
        >
          {card.subtitle}
        </Typography>

        {clickable && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 1.5,
              color: card.accent,
              fontSize: "0.75rem",
              fontWeight: 600,
              opacity: 0.85,
            }}
          >
            View details
            <ArrowForward sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function StatCards() {
  const {
    loading,
    activeJobs,
    completedToday,
    todayServiceIncome,
    todayPurchaseExpense,
    lowStockCount,
    pendingPaymentsCount,
    activeTechnicians,
    newCustomersToday,
    jobCards,
  } = useServiceDashboard();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalJobs, setModalJobs] = useState([]);

  const openModal = (title, filterFn) => {
    setModalTitle(title);
    setModalJobs(jobCards.filter(filterFn));
    setModalOpen(true);
  };

  const cards = [
    {
      title: "Active Jobs",
      subtitle: "Jobs currently in your service pipeline",
      value: activeJobs,
      rawValue: activeJobs,
      icon: <Assignment />,
      accent: "#2563EB",
      borderColor: "rgba(37, 99, 235, 0.18)",
      glowColor: "rgba(37, 99, 235, 0.22)",
      gradient: "linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      badge: "Live",
      onClick: () =>
        openModal("Active Jobs", (jc) => {
          const group = getPipelineGroup(jc.status);
          return group !== "Completed" && group !== "Cancelled" && group !== "Unrepairable";
        }),
    },
    {
      title: "Completed Today",
      subtitle: "Jobs finished and ready or delivered",
      value: completedToday,
      rawValue: completedToday,
      icon: <CheckCircle />,
      accent: "#059669",
      borderColor: "rgba(5, 150, 105, 0.18)",
      glowColor: "rgba(5, 150, 105, 0.2)",
      gradient: "linear-gradient(145deg, #ECFDF5 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
      onClick: () =>
        openModal("Completed Today", (jc) => {
          const group = getPipelineGroup(jc.status);
          return (
            group === "Completed" &&
            (isSameDay(jc.updatedOn) || isSameDay(jc.deliveredDate))
          );
        }),
    },
    {
      title: "Today's Income",
      subtitle: "Revenue from service invoices today",
      value: formatCurrency(todayServiceIncome),
      rawValue: todayServiceIncome,
      icon: <AttachMoney />,
      accent: "#7C3AED",
      borderColor: "rgba(124, 58, 237, 0.18)",
      glowColor: "rgba(124, 58, 237, 0.2)",
      gradient: "linear-gradient(145deg, #F5F3FF 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
      badge: "Today",
    },
    {
      title: "Today's Expenses",
      subtitle: "Stock purchases and costs recorded today",
      value: formatCurrency(todayPurchaseExpense),
      rawValue: todayPurchaseExpense,
      icon: <ShoppingCart />,
      accent: "#D97706",
      borderColor: "rgba(217, 119, 6, 0.18)",
      glowColor: "rgba(217, 119, 6, 0.2)",
      gradient: "linear-gradient(145deg, #FFFBEB 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #FBBF24 0%, #D97706 100%)",
      badge: "Today",
    },
    {
      title: "Low Stock Items",
      subtitle: "Parts below reorder level — restock soon",
      value: lowStockCount,
      rawValue: lowStockCount,
      icon: <Warning />,
      accent: "#DC2626",
      borderColor: "rgba(220, 38, 38, 0.2)",
      glowColor: "rgba(220, 38, 38, 0.22)",
      gradient: "linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #F87171 0%, #DC2626 100%)",
      alert: true,
    },
    {
      title: "Pending Payments",
      subtitle: "Outstanding customer invoice balances",
      value: pendingPaymentsCount,
      rawValue: pendingPaymentsCount,
      icon: <Payment />,
      accent: "#DB2777",
      borderColor: "rgba(219, 39, 119, 0.18)",
      glowColor: "rgba(219, 39, 119, 0.2)",
      gradient: "linear-gradient(145deg, #FDF2F8 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #F472B6 0%, #DB2777 100%)",
      alert: true,
    },
    {
      title: "Active Technicians",
      subtitle: "Technicians with jobs in progress",
      value: activeTechnicians,
      rawValue: activeTechnicians,
      icon: <Engineering />,
      accent: "#4F46E5",
      borderColor: "rgba(79, 70, 229, 0.18)",
      glowColor: "rgba(79, 70, 229, 0.2)",
      gradient: "linear-gradient(145deg, #EEF2FF 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)",
    },
    {
      title: "New Customers Today",
      subtitle: "First-time visitors to your service center",
      value: newCustomersToday,
      rawValue: newCustomersToday,
      icon: <PersonAdd />,
      accent: "#0D9488",
      borderColor: "rgba(13, 148, 136, 0.18)",
      glowColor: "rgba(13, 148, 136, 0.2)",
      gradient: "linear-gradient(145deg, #F0FDFA 0%, #FFFFFF 55%, #F8FAFC 100%)",
      iconGradient: "linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)",
      badge: newCustomersToday > 0 ? "Growing" : null,
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
          gap: 1.5,
        }}
      >
        <CircularProgress size={36} sx={{ color: "#2563EB" }} />
        <Typography variant="body2" color="text.secondary">
          Loading overview…
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2.5,
          px: 0.5,
        }}
      >
        <TrendingUp sx={{ color: "#2563EB", fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500 }}>
          Real-time snapshot of your service center — tap a card to explore details
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <StatCard card={card} />
          </Grid>
        ))}
      </Grid>

      <JobCardListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        jobCards={modalJobs}
      />
    </>
  );
}
