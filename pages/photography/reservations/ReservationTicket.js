import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  Avatar,
  FormControlLabel,
  Switch,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import GroupsIcon from "@mui/icons-material/Groups";
import PhoneIcon from "@mui/icons-material/Phone";
import PersonIcon from "@mui/icons-material/Person";
import CakeIcon from "@mui/icons-material/Cake";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { toast } from "react-toastify";
import { formatDate } from "@/components/utils/formatHelper";
import useApi from "@/components/utils/useApi";
import ReservationNotes from "./ReservationNotes";
import ReservationHandover from "./ReservationHandover";
import ReservationDetailTabs from "./ReservationDetailTabs";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";

const CEREMONY_TYPES = [
  { value: 1, label: "Poruwa" },
  { value: 2, label: "Church" },
  { value: 3, label: "Other" },
];

const initialsOf = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

export default function ReservationTicket({ item, open, onClose, onRefresh }) {
  const [userAgentType, setUserAgentType] = useState(null);
  const [firstMeetingComplete, setFirstMeetingComplete] = useState(item?.firstMeetingComplete || false);
  const [updatingMeeting, setUpdatingMeeting] = useState(false);

  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];

  useEffect(() => {
    if (item) {
      setFirstMeetingComplete(item.firstMeetingComplete || false);
    }
  }, [item]);

  const fetchUserAgentType = useCallback(async () => {
    try {
      const response = await photographyReservationNoteService.getCurrentUserAgentType();
      if (response?.result) {
        setUserAgentType(response.result.agentType);
      }
    } catch (err) {
      console.error("Failed to fetch user agent type", err);
    }
  }, []);

  useEffect(() => {
    fetchUserAgentType();
  }, [fetchUserAgentType]);

  const handleFirstMeetingChange = async (checked) => {
    setUpdatingMeeting(true);
    try {
      const response = await photographyReservationNoteService.updateFirstMeeting({
        reservationId: item.id,
        firstMeetingComplete: checked,
      });
      if (response?.statusCode === "SUCCESS" || response?.statusCode === 200) {
        setFirstMeetingComplete(checked);
        toast.success(checked ? "First meeting marked complete" : "First meeting marked incomplete");
        onRefresh?.();
      } else {
        toast.error(response?.message || "Failed to update");
      }
    } catch (err) {
      toast.error("Failed to update first meeting status");
    } finally {
      setUpdatingMeeting(false);
    }
  };

  const isCustomerCoordinator = userAgentType === 1;

  if (!item) return null;

  const isWedding = (item.eventTypeName || "").toLowerCase().includes("wedding") || item.eventType === 1;
  const headerBg = isWedding
    ? "linear-gradient(135deg, #312E81 0%, #4F46E5 100%)"
    : "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          overflow: "hidden",
          maxWidth: 1280,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ background: headerBg, color: "#fff", p: 2.5, position: "relative" }}>
        <IconButton
          onClick={onClose}
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
            {initialsOf(item.coupleNames)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              {item.coupleNames}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                size="small"
                label={item.cardNo}
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }}
              />
              <Chip
                size="small"
                icon={isWedding ? <FavoriteIcon /> : <CakeIcon />}
                label={item.eventTypeName}
                sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 600, "& .MuiChip-icon": { color: "#fff" } }}
              />
              {item.currentStatusName && (
                <Chip
                  size="small"
                  label={item.currentStatusName}
                  sx={{ bgcolor: "rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600 }}
                />
              )}
            </Stack>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={firstMeetingComplete}
                  onChange={(e) => handleFirstMeetingChange(e.target.checked)}
                  disabled={!isCustomerCoordinator || updatingMeeting}
                  sx={{ "& .MuiSwitch-thumb": { bgcolor: "#fff" } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "#fff" }}>
                  First Meeting {firstMeetingComplete ? "✅" : ""}
                </Typography>
              }
            />
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Grid container sx={{ height: "calc(90vh - 150px)", minHeight: 500 }}>
          {/* Main Content - View Only */}
          <Grid item xs={12} md={7} sx={{ borderRight: "1px solid #E2E8F0", height: "100%", overflow: "auto" }}>
            <Box sx={{ p: 2.5 }}>
              {/* Event Details */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                🎉 Events
              </Typography>
              <Stack spacing={1.5} mb={3}>
                {(item.events && item.events.length > 0
                  ? item.events
                  : [{ eventTypeName: item.eventTypeName, eventDate: item.eventDate, eventTime: item.eventTime, location: item.receptionLocation, isMainEvent: true }]
                ).map((evt, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: evt.isMainEvent ? "#F0F9FF" : "#F8FAFC", border: "1px solid", borderColor: evt.isMainEvent ? "#BAE6FD" : "#E2E8F0", borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip
                        size="small"
                        label={evt.eventTypeName || eventTypes.find(t => t.id === evt.eventType)?.name}
                        color={evt.isMainEvent ? "primary" : "default"}
                        sx={{ fontWeight: 600 }}
                      />
                      {evt.isMainEvent && <Chip size="small" label="★ Main" color="warning" sx={{ fontWeight: 600 }} />}
                    </Stack>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon sx={{ fontSize: 18, color: "#64748B" }} />
                        <Typography variant="body2">{formatDate(evt.eventDate)} {evt.eventTime ? `• ${evt.eventTime}` : ""}</Typography>
                      </Stack>
                      {(evt.location || evt.receptionLocation) && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PlaceIcon sx={{ fontSize: 18, color: "#64748B" }} />
                          <Typography variant="body2">{evt.location || evt.receptionLocation}</Typography>
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
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon sx={{ fontSize: 18, color: "#64748B" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Name</Typography>
                        <Typography variant="body2" fontWeight={600}>{item.coupleNames}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 18, color: "#64748B" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Mobile</Typography>
                        <Typography variant="body2" fontWeight={600}>{item.customerMobileNo || "—"}</Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Ceremony Type</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {CEREMONY_TYPES.find(c => c.value === item.ceremonyType)?.label || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Guests</Typography>
                    <Typography variant="body2" fontWeight={600}>{item.noOfGuests || "—"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Makeup Artist</Typography>
                    <Typography variant="body2" fontWeight={600}>{item.makeupArtist || "—"}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Team Info */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                👥 Team Assignment
              </Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2, mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <GroupsIcon sx={{ fontSize: 18, color: "#64748B" }} />
                  <Typography variant="body2" fontWeight={600}>
                    {item.assignedTeamName || "Unassigned"}
                  </Typography>
                </Stack>
                {item.photographers && item.photographers.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={1}>
                    {item.photographers.map((p, i) => (
                      <Chip key={i} size="small" label={p.photographerName} variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Paper>

              {/* Remark */}
              {item.remark && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#4F46E5" }}>
                    📝 Remark
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 2 }}>
                    <Typography variant="body2">{item.remark}</Typography>
                  </Paper>
                </>
              )}
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={5} sx={{ height: "100%", overflow: "auto", bgcolor: "#F8FAFC" }}>
            <Box sx={{ p: 2 }}>
              <ReservationHandover
                reservation={item}
                onHandoverComplete={() => {
                  onRefresh?.();
                  onClose?.();
                }}
                userAgentType={userAgentType}
              />
              <ReservationDetailTabs reservationId={item.id} currentAgentType={item.currentAgentType} />
              <ReservationNotes reservationId={item.id} hideQuotations />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
