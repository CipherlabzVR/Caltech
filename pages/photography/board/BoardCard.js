import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Avatar,
  Dialog,
  DialogContent,
  IconButton,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Collapse,
  Tabs,
  Tab,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import PlaceIcon from "@mui/icons-material/Place";
import EventIcon from "@mui/icons-material/Event";
import PhoneIcon from "@mui/icons-material/Phone";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CakeIcon from "@mui/icons-material/Cake";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptIcon from "@mui/icons-material/Receipt";
import EmailIcon from "@mui/icons-material/Email";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ViewReservation from "../reservations/view";
import EditReservation from "../reservations/edit";
import ChangeStatus from "../reservations/change-status";
import { formatDate } from "@/components/utils/formatHelper";
import { hexToRgba } from "../../../utils/photography/boardTheme";
import BASE_URL from "Base/api";

const CEREMONY_TYPES = [
  { value: 1, label: "Poruwa" },
  { value: 2, label: "Church" },
  { value: 3, label: "Other" },
];

const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const MetaRow = ({ icon, children, scale }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
    <Box
      sx={{
        width: scale.metaIconBox,
        height: scale.metaIconBox,
        borderRadius: 1.25,
        bgcolor: "#F1F5F9",
        color: "#64748B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        mt: 0.1,
      }}
    >
      {icon}
    </Box>
    <Typography
      sx={{
        fontWeight: 600,
        fontSize: scale.meta,
        color: "#334155",
        lineHeight: 1.35,
        wordBreak: "break-word",
        pt: 0.35,
      }}
    >
      {children}
    </Typography>
  </Stack>
);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function BoardCard({
  item,
  accent,
  scale,
  canEdit,
  canChangeStatus,
  onRefresh,
  stepIndex = 0,
  totalSteps = 1,
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [expandedQuotation, setExpandedQuotation] = useState(null);
  const [ticketTab, setTicketTab] = useState(0);
  const id = pick(item, "id", "Id");
  const cardNo = pick(item, "cardNo", "CardNo") || "";
  const coupleNames = pick(item, "coupleNames", "CoupleNames") || "—";
  const eventDate = pick(item, "eventDate", "EventDate");
  const eventTime = pick(item, "eventTime", "EventTime");
  const eventTypeName = pick(item, "eventTypeName", "EventTypeName") || "Event";
  const teamName = pick(item, "assignedTeamName", "AssignedTeamName");
  const location = pick(item, "receptionLocation", "ReceptionLocation");
  const statusId = pick(item, "currentStatusId", "CurrentStatusId");
  const color = accent || "#4F6D8C";

  const eventDt = eventDate ? new Date(eventDate) : null;
  const today = new Date();
  const isToday = eventDt && !Number.isNaN(eventDt.getTime()) && isSameDay(eventDt, today);
  const isTomorrow =
    eventDt &&
    !Number.isNaN(eventDt.getTime()) &&
    isSameDay(eventDt, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));

  const actionItem = {
    id,
    cardNo,
    coupleNames,
    eventDate,
    eventTime,
    eventType: pick(item, "eventType", "EventType"),
    eventTypeName,
    receptionLocation: location,
    customerMobileNo: pick(item, "customerMobileNo", "CustomerMobileNo"),
    ceremonyType: pick(item, "ceremonyType", "CeremonyType"),
    ceremonyTypeOther: pick(item, "ceremonyTypeOther", "CeremonyTypeOther"),
    noOfGuests: pick(item, "noOfGuests", "NoOfGuests"),
    makeupArtist: pick(item, "makeupArtist", "MakeupArtist"),
    remark: pick(item, "remark", "Remark"),
    assignedTeamId: pick(item, "assignedTeamId", "AssignedTeamId"),
    assignedTeamName: teamName,
    currentStatusId: statusId,
    currentStatusName: pick(item, "currentStatusName", "CurrentStatusName"),
    photographers: pick(item, "photographers", "Photographers") || [],
    events: pick(item, "events", "Events") || [],
    firstMeetingComplete: pick(item, "firstMeetingComplete", "FirstMeetingComplete") || false,
    currentAgentType: pick(item, "currentAgentType", "CurrentAgentType"),
    currentAgentTypeName: pick(item, "currentAgentTypeName", "CurrentAgentTypeName"),
  };
  
  const mobileNo = pick(item, "customerMobileNo", "CustomerMobileNo");
  const isWedding = (eventTypeName || "").toLowerCase().includes("wedding");
  const initials = (coupleNames || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const fetchQuotations = useCallback(async () => {
    if (!id) return;
    setQuotationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/PhotographyQuotation/GetQuotationsByReservation/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data?.result) {
        setQuotations(Array.isArray(data.result) ? data.result : [data.result]);
      }
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    } finally {
      setQuotationsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (editOpen) {
      fetchQuotations();
    }
  }, [editOpen, fetchQuotations]);

  const handleCardClick = (e) => {
    if (e.target.closest("button") || e.target.closest(".MuiIconButton-root")) return;
    if (canEdit) setEditOpen(true);
  };

  // Get status step info
  const statusName = actionItem.currentStatusName || "Tentative";

  return (
    <>
      <Box
        onClick={handleCardClick}
        sx={{
          flexShrink: 0,
          bgcolor: "#fff",
          borderRadius: 3,
          border: "1px solid #E8EDF3",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
          transition: "all 0.2s ease",
          cursor: canEdit ? "pointer" : "default",
          "&:hover": {
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            borderColor: hexToRgba(color, 0.5),
            transform: canEdit ? "translateY(-2px)" : "none",
          },
        }}
      >
        {/* Header with gradient */}
        <Box
          sx={{
            background: isWedding
              ? "linear-gradient(135deg, #312E81 0%, #6366F1 100%)"
              : "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)",
            p: 1.5,
            color: "#fff",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: "rgba(255,255,255,0.25)",
                fontSize: 15,
                fontWeight: 700,
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              {initials}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 14,
                  lineHeight: 1.2,
                  color: "#fff",
                  wordBreak: "break-word",
                }}
              >
                {coupleNames}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.8)",
                  fontVariantNumeric: "tabular-nums",
                  mt: 0.25,
                }}
              >
                {cardNo}
              </Typography>
            </Box>
            <Chip
              size="small"
              icon={isWedding ? <FavoriteIcon /> : <CakeIcon />}
              label={`${eventTypeName} ★`}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 10,
                height: 24,
                "& .MuiChip-icon": { color: "#fff", fontSize: 14 },
              }}
            />
          </Stack>
        </Box>

        {/* Body */}
        <Box sx={{ p: 1.5 }}>
          {/* Date & Time */}
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1,
                bgcolor: "#F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EventIcon sx={{ fontSize: 14, color: "#64748B" }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
              {formatDate(eventDate) || "—"}
              {eventTime ? ` · ${eventTime}` : ""}
            </Typography>
          </Stack>

          {/* Location */}
          {location && (
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlaceIcon sx={{ fontSize: 14, color: "#64748B" }} />
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#334155", wordBreak: "break-word" }}
              >
                {location}
              </Typography>
            </Stack>
          )}

          {/* Team Chip */}
          <Chip
            size="small"
            label={teamName || "Unassigned"}
            sx={{
              mb: 1.5,
              fontWeight: 600,
              fontSize: 11,
              height: 24,
              bgcolor: teamName ? "#E0F2FE" : "#FEE2E2",
              color: teamName ? "#0369A1" : "#DC2626",
              border: `1px solid ${teamName ? "#BAE6FD" : "#FECACA"}`,
            }}
          />

          {/* Mobile */}
          {mobileNo && (
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: "#F1F5F9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhoneIcon sx={{ fontSize: 14, color: "#64748B" }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
                {mobileNo}
              </Typography>
            </Stack>
          )}

          {/* Status Footer with Progress */}
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: color }}
            >
              {statusName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 500, color: "#94A3B8" }}
            >
              Step {stepIndex} / {totalSteps}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "#E2E8F0",
              mb: 1,
              "& .MuiLinearProgress-bar": {
                bgcolor: color,
                borderRadius: 3,
              },
            }}
          />
          {(isToday || isTomorrow) && (
            <Box sx={{ mb: 0.5 }}>
              <Chip
                size="small"
                label={isToday ? "🔥 TODAY" : "⏰ TOMORROW"}
                sx={{
                  fontWeight: 700,
                  fontSize: 10,
                  height: 22,
                  bgcolor: isToday ? "#FEE2E2" : "#FEF3C7",
                  color: isToday ? "#DC2626" : "#D97706",
                }}
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="flex-end"
            alignItems="center"
            mt={1}
            sx={{
              "& .MuiIconButton-root": {
                width: 28,
                height: 28,
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 1,
                "&:hover": {
                  bgcolor: hexToRgba(color, 0.08),
                  borderColor: hexToRgba(color, 0.28),
                },
              },
              "& .MuiSvgIcon-root": {
                fontSize: 16,
              },
            }}
          >
            <ViewReservation item={actionItem} />
            {canChangeStatus && <ChangeStatus item={actionItem} fetchItems={onRefresh} />}
            {canEdit && <EditReservation item={actionItem} fetchItems={onRefresh} />}
          </Stack>
        </Box>
      </Box>

      {/* View-Only Ticket Modal */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "85vh",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: isWedding
              ? "linear-gradient(135deg, #312E81 0%, #4F46E5 100%)"
              : "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)",
            color: "#fff",
            p: 2.5,
            position: "relative",
          }}
        >
          <IconButton
            onClick={() => setEditOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff" }}
          >
            <CloseIcon />
          </IconButton>

          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                {coupleNames}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={`#${cardNo}`}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }}
                />
                <Chip
                  size="small"
                  icon={isWedding ? <FavoriteIcon /> : <CakeIcon />}
                  label={eventTypeName}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.25)",
                    color: "#fff",
                    fontWeight: 600,
                    "& .MuiChip-icon": { color: "#fff" },
                  }}
                />
                {actionItem.currentStatusName && (
                  <Chip
                    size="small"
                    label={actionItem.currentStatusName}
                    sx={{ bgcolor: "rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tabs value={ticketTab} onChange={(e, v) => setTicketTab(v)}>
            <Tab label="📋 Details" />
            <Tab label={`💵 Quotations (${quotations.length})`} />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {ticketTab === 0 && (
            <>
              {/* Events */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                🎉 Event Details
              </Typography>
              <Stack spacing={1.5} mb={3}>
                {(actionItem.events && actionItem.events.length > 0
                  ? actionItem.events
                  : [
                      {
                        eventTypeName,
                        eventDate,
                        eventTime,
                        location: location,
                        isMainEvent: true,
                      },
                    ]
                ).map((evt, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: evt.isMainEvent ? "#F0F9FF" : "#F8FAFC",
                      border: "1px solid",
                      borderColor: evt.isMainEvent ? "#BAE6FD" : "#E2E8F0",
                      borderRadius: 2,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip
                        size="small"
                        label={evt.eventTypeName || eventTypeName}
                        color={evt.isMainEvent ? "primary" : "default"}
                        sx={{ fontWeight: 600 }}
                      />
                      {evt.isMainEvent && (
                        <Chip size="small" label="★ Main" color="warning" sx={{ fontWeight: 600 }} />
                      )}
                    </Stack>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon sx={{ fontSize: 18, color: "#64748B" }} />
                        <Typography variant="body2">
                          {formatDate(evt.eventDate || eventDate)}{" "}
                          {(evt.eventTime || eventTime) ? `• ${evt.eventTime || eventTime}` : ""}
                        </Typography>
                      </Stack>
                      {(evt.location || evt.receptionLocation || location) && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PlaceIcon sx={{ fontSize: 18, color: "#64748B" }} />
                          <Typography variant="body2">
                            {evt.location || evt.receptionLocation || location}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              {/* Customer Info */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                👤 Customer Info
              </Typography>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2, mb: 3 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon sx={{ fontSize: 18, color: "#64748B" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {coupleNames}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 18, color: "#64748B" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Mobile
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {mobileNo || "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Ceremony Type
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {CEREMONY_TYPES.find((c) => c.value === actionItem.ceremonyType)?.label || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Guests
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {actionItem.noOfGuests || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Makeup Artist
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {actionItem.makeupArtist || "—"}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Team Info */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                👥 Team Assignment
              </Typography>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2, mb: 3 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <GroupsIcon sx={{ fontSize: 18, color: "#64748B" }} />
                  <Typography variant="body2" fontWeight={600}>
                    {teamName || "Unassigned"}
                  </Typography>
                </Stack>
                {actionItem.photographers && actionItem.photographers.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={1}>
                    {actionItem.photographers.map((p, i) => (
                      <Chip key={i} size="small" label={p.photographerName} variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Paper>

              {/* Remark */}
              {actionItem.remark && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                    📝 Remark
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 2 }}
                  >
                    <Typography variant="body2">{actionItem.remark}</Typography>
                  </Paper>
                </>
              )}
            </>
          )}

          {ticketTab === 1 && (
            <>
              {quotationsLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : quotations.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: 2 }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: "#CBD5E1", mb: 1 }} />
                  <Typography color="text.secondary">No quotations found</Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {quotations.map((q) => {
                    const isExpanded = expandedQuotation === q.id;
                    const getStatusColor = (status) => {
                      const s = (status || "").toLowerCase();
                      if (s.includes("approved")) return "success";
                      if (s.includes("pending")) return "warning";
                      if (s.includes("rejected")) return "error";
                      if (s.includes("sent")) return "info";
                      return "default";
                    };
                    return (
                      <Paper
                        key={q.id}
                        elevation={0}
                        sx={{
                          border: "1px solid #E2E8F0",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        {/* Invoice-style Header */}
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "#F8FAFC",
                            borderBottom: "1px solid #E2E8F0",
                            cursor: "pointer",
                          }}
                          onClick={() => setExpandedQuotation(isExpanded ? null : q.id)}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <ReceiptIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>
                                  {q.quotationNo}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={q.statusName || q.status}
                                  color={getStatusColor(q.statusName)}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Issue Date: {q.createdOn ? formatDate(q.createdOn) : "—"}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="h6" fontWeight={800} color="primary">
                                {formatCurrency(q.netTotal || q.total)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total Amount
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                            <Stack direction="row" spacing={2}>
                              <Typography variant="body2">
                                <strong>Event:</strong> {q.eventTypeName} • {formatDate(q.eventDate)}
                              </Typography>
                              {q.venue && (
                                <Typography variant="body2">
                                  <strong>Venue:</strong> {q.venue}
                                </Typography>
                              )}
                            </Stack>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </Stack>
                        </Box>

                        {/* Expanded Invoice Details */}
                        <Collapse in={isExpanded}>
                          <Box sx={{ p: 2 }}>
                            {/* Customer Info Row */}
                            <Grid container spacing={2} mb={2}>
                              <Grid item xs={6}>
                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F0F9FF", borderRadius: 1 }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    INVOICE FOR
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>{q.customerName}</Typography>
                                  {q.customerMobileNo && (
                                    <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                                      <PhoneIcon sx={{ fontSize: 14, color: "#64748B" }} />
                                      <Typography variant="caption">{q.customerMobileNo}</Typography>
                                    </Stack>
                                  )}
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F0FDF4", borderRadius: 1 }}>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    EVENT DETAILS
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>
                                    {q.eventTypeName}
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
                                    <EventIcon sx={{ fontSize: 14, color: "#64748B" }} />
                                    <Typography variant="caption">
                                      {q.eventTime || ""} | {formatDate(q.eventDate)}
                                    </Typography>
                                  </Stack>
                                  {q.venue && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <PlaceIcon sx={{ fontSize: 14, color: "#64748B" }} />
                                      <Typography variant="caption">{q.venue}</Typography>
                                    </Stack>
                                  )}
                                </Paper>
                              </Grid>
                            </Grid>

                            {/* Package Lines Table */}
                            {q.lines && q.lines.length > 0 && (
                              <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: "1px solid #E2E8F0" }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: "#F1F5F9" }}>
                                      <TableCell sx={{ fontWeight: 700 }}>Product / Package</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {q.lines.map((line, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>
                                          <Typography variant="body2" fontWeight={600}>
                                            {line.packageName}
                                          </Typography>
                                          {line.items && line.items.length > 0 && (
                                            <Box sx={{ mt: 1, pl: 1, borderLeft: "2px solid #E2E8F0" }}>
                                              {line.items.filter(i => i.isIncluded).map((item, iIdx) => (
                                                <Typography key={iIdx} variant="caption" display="block" color="text.secondary">
                                                  ° {item.lineText}
                                                </Typography>
                                              ))}
                                            </Box>
                                          )}
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2">{formatCurrency(line.unitPrice)}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Typography variant="body2">{line.qty}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" fontWeight={600}>{formatCurrency(line.lineTotal)}</Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}

                            {/* Add-ons */}
                            {q.addOns && q.addOns.length > 0 && (
                              <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: "1px solid #E2E8F0" }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: "#FEF3C7" }}>
                                      <TableCell sx={{ fontWeight: 700 }}>Add-on</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Price</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {q.addOns.map((addon, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{addon.name}</TableCell>
                                        <TableCell align="right">{formatCurrency(addon.price)}</TableCell>
                                        <TableCell align="center">{addon.qty}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(addon.lineTotal)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}

                            {/* Totals */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 2 }}>
                              <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography variant="body2">Subtotal</Typography>
                                  <Typography variant="body2">{formatCurrency(q.subTotal)}</Typography>
                                </Stack>
                                {q.discountAmount > 0 && (
                                  <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="success.main">Discount</Typography>
                                    <Typography variant="body2" color="success.main">-{formatCurrency(q.discountAmount)}</Typography>
                                  </Stack>
                                )}
                                {q.transportationCost > 0 && (
                                  <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2">Transportation</Typography>
                                    <Typography variant="body2">{formatCurrency(q.transportationCost)}</Typography>
                                  </Stack>
                                )}
                                <Divider />
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography variant="subtitle1" fontWeight={800}>Total</Typography>
                                  <Typography variant="subtitle1" fontWeight={800} color="primary">
                                    {formatCurrency(q.netTotal)}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Paper>

                            {/* Remark */}
                            {q.remark && (
                              <Paper elevation={0} sx={{ mt: 2, p: 1.5, bgcolor: "#FFFBEB", borderRadius: 1 }}>
                                <Typography variant="caption" fontWeight={600}>Note:</Typography>
                                <Typography variant="body2">{q.remark}</Typography>
                              </Paper>
                            )}
                          </Box>
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
