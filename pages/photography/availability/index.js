import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CakeIcon from "@mui/icons-material/Cake";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import PeopleIcon from "@mui/icons-material/People";
import PhoneIcon from "@mui/icons-material/Phone";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import BrushIcon from "@mui/icons-material/Brush";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import ViewReservation from "../reservations/view";
import AddReservation from "../reservations/create";
import useApi from "@/components/utils/useApi";

const CATEGORY_ID = 229;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(16,24,40,0.12)",
    padding: "10px 14px",
  },
  itemStyle: { color: "#111827", fontSize: 13 },
  labelStyle: { color: "#6B7280", fontWeight: 600, marginBottom: 4 },
};

const panelSx = {
  p: { xs: 2, sm: 3 },
  borderRadius: 3,
  border: "1px solid #EEF0F4",
  bgcolor: "#fff",
  height: "100%",
  boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
  overflow: "hidden",
};

const pad2 = (n) => String(n).padStart(2, "0");

const toDateInput = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const toMonthInput = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
};

const shiftMonth = (yyyyMm, delta) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return toMonthInput(dt);
};

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

const initialsOf = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const eventTypeLabel = (type, name, eventTypes = []) => {
  const fromMaster = eventTypes.find((t) => Number(t.id) === Number(type));
  if (fromMaster?.name) return fromMaster.name;
  const n = Number(type);
  if (n === 1 || name === "Wedding") return "Wedding";
  if (n === 2 || name === "BirthdayParty" || name === "Birthday Party") return "Birthday Party";
  return name || "Event";
};

const matchesEventFilter = (row, filter) => {
  if (!filter || filter === "all") return true;
  const type = Number(pick(row, "eventType", "EventType"));
  return String(type) === String(filter);
};

const SummaryStat = ({ icon, label, value, gradient }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      borderRadius: 3,
      color: "#fff",
      background: gradient,
      boxShadow: "0 8px 20px rgba(16,24,40,0.14)",
      height: "100%",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        right: -14,
        top: -14,
        width: 72,
        height: 72,
        borderRadius: "50%",
        bgcolor: "rgba(255,255,255,0.14)",
      }}
    />
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: "relative" }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.05 }}>
          {value ?? 0}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.92, fontWeight: 600 }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const MetaChip = ({ icon, children }) => {
  if (!children) return null;
  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      sx={{
        px: 1.25,
        py: 0.65,
        borderRadius: 2,
        bgcolor: "#F8FAFC",
        border: "1px solid #EEF2F7",
        minHeight: 34,
      }}
    >
      <Box sx={{ color: "#94A3B8", display: "flex", alignItems: "center" }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "#334155", fontWeight: 500, lineHeight: 1.25 }}>
        {children}
      </Typography>
    </Stack>
  );
};

function DayReservationCard({ row, eventTypes }) {
  const item = {
    id: pick(row, "id", "Id"),
    cardNo: pick(row, "cardNo", "CardNo"),
    coupleNames: pick(row, "coupleNames", "CoupleNames"),
    eventTime: pick(row, "eventTime", "EventTime"),
    eventType: pick(row, "eventType", "EventType"),
    eventTypeName: pick(row, "eventTypeName", "EventTypeName"),
    receptionLocation: pick(row, "receptionLocation", "ReceptionLocation"),
    ceremonyTypeName: pick(row, "ceremonyTypeName", "CeremonyTypeName"),
    ceremonyTypeOther: pick(row, "ceremonyTypeOther", "CeremonyTypeOther"),
    noOfGuests: pick(row, "noOfGuests", "NoOfGuests"),
    makeupArtist: pick(row, "makeupArtist", "MakeupArtist"),
    customerMobileNo: pick(row, "customerMobileNo", "CustomerMobileNo"),
    assignedTeamName: pick(row, "assignedTeamName", "AssignedTeamName"),
    currentStatusName: pick(row, "currentStatusName", "CurrentStatusName"),
    remark: pick(row, "remark", "Remark"),
    photographerNames: pick(row, "photographerNames", "PhotographerNames") || [],
  };

  const typeLabel = eventTypeLabel(item.eventType, item.eventTypeName, eventTypes);
  const typeMeta = (eventTypes || []).find((t) => Number(t.id) === Number(item.eventType));
  const isWedding =
    typeMeta?.consumesWeddingCapacity ||
    typeMeta?.ConsumesWeddingCapacity ||
    typeLabel === "Wedding";
  const ceremony =
    item.ceremonyTypeName === "Other"
      ? item.ceremonyTypeOther || "Other"
      : item.ceremonyTypeName;
  const headerBg = isWedding
    ? "linear-gradient(135deg, #312E81 0%, #4F46E5 100%)"
    : "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid #EEF0F4",
        transition: "transform .15s, box-shadow .15s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(16,24,40,0.1)",
        },
      }}
    >
      <Box sx={{ p: 2, color: "#fff", background: headerBg }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1.5}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(255,255,255,0.28)",
                fontWeight: 700,
                width: 46,
                height: 46,
                flexShrink: 0,
              }}
            >
              {initialsOf(item.coupleNames)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: { xs: "normal", sm: "nowrap" },
                }}
              >
                {item.coupleNames || "—"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {item.cardNo}
                {item.eventTime ? ` · ${item.eventTime}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ rowGap: 1 }}
          >
            <Chip
              size="small"
              icon={isWedding ? <FavoriteIcon /> : <CakeIcon />}
              label={typeLabel}
              sx={{
                bgcolor: "rgba(255,255,255,0.22)",
                color: "#fff",
                fontWeight: 700,
                "& .MuiChip-icon": { color: "#fff" },
              }}
            />
            {item.currentStatusName && (
              <Chip
                size="small"
                label={item.currentStatusName}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", fontWeight: 600 }}
              />
            )}
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.18)",
                borderRadius: 2,
                "& .MuiIconButton-root": { color: "#fff" },
              }}
            >
              <ViewReservation item={item} />
            </Box>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: 2.25 }}>
        <Grid container spacing={1.25}>
          <Grid item xs={12} sm={6} md={4}>
            <MetaChip icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}>
              {item.eventTime || "Time not set"}
            </MetaChip>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetaChip icon={<GroupsIcon sx={{ fontSize: 16 }} />}>
              {item.assignedTeamName || "Team unassigned"}
            </MetaChip>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetaChip icon={<PlaceIcon sx={{ fontSize: 16 }} />}>
              {item.receptionLocation || "Location not set"}
            </MetaChip>
          </Grid>
          {ceremony && (
            <Grid item xs={12} sm={6} md={4}>
              <MetaChip icon={<EventIcon sx={{ fontSize: 16 }} />}>Ceremony: {ceremony}</MetaChip>
            </Grid>
          )}
          {item.noOfGuests != null && item.noOfGuests !== "" && (
            <Grid item xs={12} sm={6} md={4}>
              <MetaChip icon={<PeopleIcon sx={{ fontSize: 16 }} />}>
                {item.noOfGuests} guests
              </MetaChip>
            </Grid>
          )}
          {item.customerMobileNo && (
            <Grid item xs={12} sm={6} md={4}>
              <MetaChip icon={<PhoneIcon sx={{ fontSize: 16 }} />}>
                {item.customerMobileNo}
              </MetaChip>
            </Grid>
          )}
          {item.makeupArtist && (
            <Grid item xs={12} sm={6} md={4}>
              <MetaChip icon={<BrushIcon sx={{ fontSize: 16 }} />}>
                Makeup: {item.makeupArtist}
              </MetaChip>
            </Grid>
          )}
          {item.photographerNames.length > 0 && (
            <Grid item xs={12}>
              <MetaChip icon={<CameraAltIcon sx={{ fontSize: 16 }} />}>
                {item.photographerNames.join(", ")}
              </MetaChip>
            </Grid>
          )}
        </Grid>
        {item.remark && (
          <Typography
            variant="body2"
            sx={{ mt: 1.5, color: "#64748B", fontStyle: "italic", px: 0.5 }}
          >
            {item.remark}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

const TeamPill = ({ name, busy }) => (
  <Box
    sx={{
      px: 1.5,
      py: 1.1,
      borderRadius: 2,
      bgcolor: busy ? "#FEF2F2" : "#F0F9FF",
      border: `1px solid ${busy ? "#FECACA" : "#BAE6FD"}`,
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <Avatar
      sx={{
        width: 28,
        height: 28,
        fontSize: 12,
        fontWeight: 700,
        bgcolor: busy ? "#FECACA" : "#BAE6FD",
        color: busy ? "#B91C1C" : "#0369A1",
      }}
    >
      {initialsOf(name)}
    </Avatar>
    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
      {name}
    </Typography>
  </Box>
);

function dayCellMeta(day) {
  const full = day?.isFullyBooked ?? day?.IsFullyBooked;
  const total = day?.totalEvents ?? day?.TotalEvents ?? 0;
  if (full) {
    return {
      bgcolor: "#fff",
      border: "1px solid #FECACA",
      accent: "#EF4444",
      status: "Full",
      statusBg: "#FEE2E2",
      statusColor: "#B91C1C",
    };
  }
  if (total > 0) {
    return {
      bgcolor: "#fff",
      border: "1px solid #FDE68A",
      accent: "#F59E0B",
      status: "Booked",
      statusBg: "#FEF3C7",
      statusColor: "#92400E",
    };
  }
  return {
    bgcolor: "#fff",
    border: "1px solid #BBF7D0",
    accent: "#10B981",
    status: "Open",
    statusBg: "#DCFCE7",
    statusColor: "#166534",
  };
}

export default function PhotographyAvailability() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate } = IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);

  const [mode, setMode] = useState("day");
  const [date, setDate] = useState(toDateInput());
  const [month, setMonth] = useState(toMonthInput());
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [monthResult, setMonthResult] = useState(null);
  const [yearResult, setYearResult] = useState(null);
  const [eventFilter, setEventFilter] = useState("all");
  const [bookOpen, setBookOpen] = useState(false);
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];
  const eventTypeFilters = [
    { value: "all", label: "All" },
    ...eventTypes.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  const checkDay = useCallback(async (checkDate) => {
    const d = checkDate || date;
    if (!d) return;
    const normalized =
      typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)
        ? d.slice(0, 10)
        : toDateInput(d);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/PhotographyReservation/GetDayAvailability?date=${encodeURIComponent(normalized)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const payload = json.result ?? json.Result ?? null;
      if (!res.ok || !payload) {
        setResult({ error: true });
        return;
      }
      setResult(payload);
    } catch {
      setResult({ error: true });
    } finally {
      setLoading(false);
    }
  }, [date]);

  const checkMonth = useCallback(async (yyyyMm) => {
    const value = yyyyMm || month;
    if (!value || !/^\d{4}-\d{2}$/.test(value)) return;
    const [y, m] = value.split("-").map(Number);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/PhotographyReservation/GetMonthAvailability?year=${y}&month=${m}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const payload = json.result ?? json.Result ?? null;
      if (!res.ok || !payload) {
        setMonthResult({ error: true });
        return;
      }
      setMonthResult(payload);
    } catch {
      setMonthResult({ error: true });
    } finally {
      setLoading(false);
    }
  }, [month]);

  const checkYear = useCallback(async (y) => {
    const value = Number(y || year);
    if (!value || value < 2000 || value > 2100) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/PhotographyReservation/GetYearAvailability?year=${value}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const payload = json.result ?? json.Result ?? null;
      if (!res.ok || !payload) {
        setYearResult({ error: true });
        return;
      }
      setYearResult(payload);
    } catch {
      setYearResult({ error: true });
    } finally {
      setLoading(false);
    }
  }, [year]);

  const runCheck = useCallback(() => {
    if (mode === "month") return checkMonth(month);
    if (mode === "year") return checkYear(year);
    return checkDay(date);
  }, [mode, month, year, date, checkMonth, checkYear, checkDay]);

  useEffect(() => {
    checkDay(toDateInput());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "month") checkMonth(month);
    if (mode === "year") checkYear(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const openDay = (isoDate) => {
    setDate(isoDate);
    setMode("day");
    checkDay(isoDate);
  };

  const openMonth = (y, m) => {
    const value = `${y}-${pad2(m)}`;
    setMonth(value);
    setMode("month");
    checkMonth(value);
  };

  const monthDays = monthResult?.days || monthResult?.Days || [];
  const yearMonths = yearResult?.months || yearResult?.Months || [];

  const monthChartData = useMemo(
    () =>
      monthDays.map((day) => {
        const dayNum = day.day ?? day.Day;
        const weddings = day.weddingsBooked ?? day.WeddingsBooked ?? 0;
        const other = day.otherEventsCount ?? day.OtherEventsCount ?? 0;
        const remainingSlots = day.remaining ?? day.Remaining ?? 0;
        return {
          day: String(dayNum),
          dayNum,
          Weddings: weddings,
          Other: other,
          Remaining: remainingSlots,
          Total: weddings + other,
        };
      }),
    [monthDays]
  );

  const yearChartData = useMemo(
    () =>
      yearMonths.map((m) => ({
        month: m.monthName ?? m.MonthName,
        monthNum: m.month ?? m.Month,
        Weddings: m.weddingsBooked ?? m.WeddingsBooked ?? 0,
        Other: m.otherEventsCount ?? m.OtherEventsCount ?? 0,
        BusyDays: m.daysWithEvents ?? m.DaysWithEvents ?? 0,
        FullDays: m.fullyBookedDays ?? m.FullyBookedDays ?? 0,
        Total: m.totalEvents ?? m.TotalEvents ?? 0,
      })),
    [yearMonths]
  );

  if (!navigate) return <AccessDenied />;

  const canBook = result && !result.error && (result.canBookWedding ?? result.CanBookWedding);
  const rawDayReservations =
    result?.dayReservations ||
    result?.DayReservations ||
    result?.bookedWeddings ||
    result?.BookedWeddings ||
    [];
  const dayReservations = rawDayReservations.filter((row) =>
    matchesEventFilter(row, eventFilter)
  );
  const availableTeams = result?.availableTeams || result?.AvailableTeams || [];
  const busyTeams = result?.busyTeams || result?.BusyTeams || [];

  const weddingsBooked = result?.weddingsBooked ?? result?.WeddingsBooked ?? 0;
  const birthdayCount =
    result?.otherEventsCount ??
    result?.OtherEventsCount ??
    rawDayReservations.filter((r) => Number(pick(r, "eventType", "EventType")) === 2).length;
  const totalEvents =
    result?.totalEvents ?? result?.TotalEvents ?? rawDayReservations.length;
  const remaining = result?.remaining ?? result?.Remaining ?? 0;
  const activeTeams = result?.activeTeams ?? result?.ActiveTeams ?? 0;
  const maxEventsPerDay = result?.maxEventsPerDay ?? result?.MaxEventsPerDay ?? activeTeams;
  const teamsAssigned = result?.teamsAssigned ?? result?.TeamsAssigned ?? busyTeams.length;
  const capacityPct =
    maxEventsPerDay > 0 ? Math.min(100, Math.round((weddingsBooked / maxEventsPerDay) * 100)) : 0;

  const monthActive = monthResult?.activeTeams ?? monthResult?.ActiveTeams ?? 0;
  const monthMaxEvents = monthResult?.maxEventsPerDay ?? monthResult?.MaxEventsPerDay ?? monthActive;
  const monthTotal = monthResult?.totalEvents ?? monthResult?.TotalEvents ?? 0;
  const monthWeddings = monthResult?.weddingsBooked ?? monthResult?.WeddingsBooked ?? 0;
  const monthOther = monthResult?.otherEventsCount ?? monthResult?.OtherEventsCount ?? 0;
  const monthFull = monthResult?.fullyBookedDays ?? monthResult?.FullyBookedDays ?? 0;
  const monthAvailable = monthResult?.availableDays ?? monthResult?.AvailableDays ?? 0;
  const monthName = monthResult?.monthName ?? monthResult?.MonthName ?? "";
  const monthYear = monthResult?.year ?? monthResult?.Year;
  const firstWeekday =
    monthDays.length > 0
      ? new Date(
          `${monthYear}-${pad2(monthResult?.month ?? monthResult?.Month)}-01T00:00:00`
        ).getDay()
      : 0;

  const yearTotal = yearResult?.totalEvents ?? yearResult?.TotalEvents ?? 0;
  const yearWeddings = yearResult?.weddingsBooked ?? yearResult?.WeddingsBooked ?? 0;
  const yearOther = yearResult?.otherEventsCount ?? yearResult?.OtherEventsCount ?? 0;
  const yearFull = yearResult?.fullyBookedDays ?? yearResult?.FullyBookedDays ?? 0;
  const yearActive = yearResult?.activeTeams ?? yearResult?.ActiveTeams ?? 0;

  const modeTitle =
    mode === "month" ? "Plan your month" : mode === "year" ? "Plan your year" : "Plan your day";
  const modeHint =
    mode === "month"
      ? "See wedding capacity for every day in the month. Click a day for the full schedule."
      : mode === "year"
        ? "Compare booking load across all 12 months. Click a month for the calendar."
        : "Check wedding capacity, review the full schedule, and book in one place.";

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>📅 Event Availability</h1>
        <ul>
          <li>
            <Link href="/photography/dashboard/">Photography</Link>
          </li>
          <li>Availability</li>
        </ul>
      </div>

      <Grid container spacing={2.5}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              ...panelSx,
              background:
                "linear-gradient(135deg, #F8FAFF 0%, #FFFFFF 45%, #FDF4FF 100%)",
              border: "1px solid #E8ECF4",
            }}
          >
            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "flex-start" }}
                spacing={1.5}
                mb={1.5}
              >
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <EventAvailableIcon sx={{ color: "#6366F1" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      {modeTitle}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {modeHint}
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={mode}
                  onChange={(_e, next) => {
                    if (next != null) setMode(next);
                  }}
                  sx={{
                    alignSelf: { xs: "stretch", sm: "flex-start" },
                    bgcolor: "#F8FAFC",
                    borderRadius: 2,
                    p: 0.4,
                    "& .MuiToggleButton-root": {
                      border: 0,
                      borderRadius: "8px !important",
                      textTransform: "none",
                      px: 1.5,
                      fontWeight: 700,
                      color: "#64748B",
                      gap: 0.5,
                      "&.Mui-selected": {
                        bgcolor: "#fff",
                        color: "#4F46E5",
                        boxShadow: "0 1px 3px rgba(16,24,40,0.1)",
                      },
                    },
                  }}
                >
                  <ToggleButton value="day">
                    <CalendarTodayIcon sx={{ fontSize: 16 }} /> Day
                  </ToggleButton>
                  <ToggleButton value="month">
                    <CalendarMonthIcon sx={{ fontSize: 16 }} /> Month
                  </ToggleButton>
                  <ToggleButton value="year">
                    <DateRangeIcon sx={{ fontSize: 16 }} /> Year
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1.25,
                  alignItems: "stretch",
                }}
              >
                {mode === "day" && (
                  <TextField
                    type="date"
                    size="small"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      flex: "1 1 180px",
                      minWidth: { xs: "100%", sm: 180 },
                      maxWidth: { sm: 260 },
                      bgcolor: "#fff",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    }}
                  />
                )}
                {mode === "month" && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: "1 1 220px", maxWidth: 320 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const next = shiftMonth(month, -1);
                        setMonth(next);
                        checkMonth(next);
                      }}
                      sx={{ bgcolor: "#fff", border: "1px solid #E2E8F0" }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <TextField
                      type="month"
                      size="small"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        flex: 1,
                        bgcolor: "#fff",
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        const next = shiftMonth(month, 1);
                        setMonth(next);
                        checkMonth(next);
                      }}
                      sx={{ bgcolor: "#fff", border: "1px solid #E2E8F0" }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                )}
                {mode === "year" && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: "1 1 180px", maxWidth: 260 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const next = String(Number(year) - 1);
                        setYear(next);
                        checkYear(next);
                      }}
                      sx={{ bgcolor: "#fff", border: "1px solid #E2E8F0" }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <TextField
                      type="number"
                      size="small"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      inputProps={{ min: 2000, max: 2100 }}
                      sx={{
                        flex: 1,
                        bgcolor: "#fff",
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": { borderRadius: 2 },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        const next = String(Number(year) + 1);
                        setYear(next);
                        checkYear(next);
                      }}
                      sx={{ bgcolor: "#fff", border: "1px solid #E2E8F0" }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                )}
                <Button
                  variant="contained"
                  onClick={runCheck}
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <EventAvailableIcon />
                    )
                  }
                  sx={{
                    flex: { xs: "1 1 calc(50% - 6px)", sm: "0 0 auto" },
                    whiteSpace: "nowrap",
                    px: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    boxShadow: "0 8px 18px rgba(99,102,241,0.28)",
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  }}
                >
                  Check
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setBookOpen(true)}
                  startIcon={<AddIcon />}
                  sx={{
                    flex: { xs: "1 1 calc(50% - 6px)", sm: "0 0 auto" },
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                    bgcolor: "#fff",
                    fontWeight: 700,
                    px: { xs: 2, sm: 2.5 },
                  }}
                >
                  Book event
                </Button>
              </Box>
            </Box>

            <AddReservation
              hideTrigger
              externalOpen={bookOpen}
              defaultEventDate={date}
              onExternalClose={() => {
                setBookOpen(false);
                if (mode === "day") checkDay(date);
                else if (mode === "month") checkMonth(month);
                else checkYear(year);
              }}
              fetchItems={() => {
                if (mode === "day") checkDay(date);
                else if (mode === "month") checkMonth(month);
                else checkYear(year);
              }}
            />

            {loading && (
              <LinearProgress sx={{ mt: 2.5, borderRadius: 2, height: 4 }} />
            )}

            {mode === "day" && result && !result.error && (
              <Box
                sx={{
                  mt: 2.5,
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: canBook ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${canBook ? "#A7F3D0" : "#FECACA"}`,
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
                    {canBook ? (
                      <CheckCircleIcon sx={{ color: "#059669", mt: 0.25, flexShrink: 0 }} />
                    ) : (
                      <BlockIcon sx={{ color: "#DC2626", mt: 0.25, flexShrink: 0 }} />
                    )}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: canBook ? "#047857" : "#B91C1C",
                        }}
                      >
                        {canBook
                          ? "Wedding slots available"
                          : "Wedding capacity fully booked"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                        {weddingsBooked} of {maxEventsPerDay} wedding slot(s) used ·{" "}
                        <b>{remaining}</b> remaining
                        {birthdayCount > 0
                          ? ` · ${birthdayCount} other event${birthdayCount === 1 ? "" : "s"} same day`
                          : ""}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0 }}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748B" }}>
                        Capacity
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#0F172A" }}>
                        {capacityPct}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={capacityPct}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        bgcolor: "rgba(15,23,42,0.06)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          bgcolor: capacityPct >= 100 ? "#EF4444" : "#6366F1",
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            )}

            {((mode === "day" && result?.error) ||
              (mode === "month" && monthResult?.error) ||
              (mode === "year" && yearResult?.error)) && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Could not load availability. Please try again.
              </Typography>
            )}
          </Paper>
        </Grid>

        {mode === "day" && result && !result.error && (
          <>
            <Grid item xs={12}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                  {formatDisplayDate(date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Day overview across all event types
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<EventIcon />}
                label="Total events"
                value={totalEvents}
                gradient="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<FavoriteIcon />}
                label="Weddings"
                value={weddingsBooked}
                gradient="linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<CakeIcon />}
                label="Other events"
                value={birthdayCount}
                gradient="linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<GroupsIcon />}
                label="Teams busy"
                value={teamsAssigned}
                gradient="linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<CheckCircleIcon />}
                label="Slots left"
                value={remaining}
                gradient="linear-gradient(135deg, #10B981 0%, #14B8A6 100%)"
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper elevation={0} sx={panelSx}>
                <Stack spacing={1.5} mb={2.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 2,
                        bgcolor: "#EEF2FF",
                        color: "#4F46E5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <EventIcon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                        Day schedule
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayReservations.length} event
                        {dayReservations.length === 1 ? "" : "s"} in view
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ width: "100%", overflowX: "auto", pb: 0.25 }}>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={eventFilter}
                      onChange={(_e, next) => {
                        if (next != null) setEventFilter(next);
                      }}
                      sx={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        bgcolor: "#F8FAFC",
                        borderRadius: 2,
                        p: 0.4,
                        "& .MuiToggleButton-root": {
                          border: 0,
                          borderRadius: "8px !important",
                          textTransform: "none",
                          px: { xs: 1.25, sm: 1.75 },
                          fontWeight: 700,
                          color: "#64748B",
                          "&.Mui-selected": {
                            bgcolor: "#fff",
                            color: "#4F46E5",
                            boxShadow: "0 1px 3px rgba(16,24,40,0.1)",
                          },
                        },
                      }}
                    >
                      {eventTypeFilters.map((f) => (
                        <ToggleButton key={f.value} value={f.value}>
                          {f.label}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Box>
                </Stack>

                {dayReservations.length === 0 ? (
                  <Box
                    sx={{
                      py: 6,
                      textAlign: "center",
                      borderRadius: 3,
                      bgcolor: "#F8FAFC",
                      border: "1px dashed #E2E8F0",
                    }}
                  >
                    <EventIcon sx={{ fontSize: 40, color: "#CBD5E1", mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: "#334155" }}>
                      {eventFilter === "all"
                        ? "No reservations on this date"
                        : `No ${
                            eventTypeFilters.find((f) => f.value === eventFilter)?.label || "events"
                          } on this date`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                      Free day — you can book a new event now.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setBookOpen(true)}
                      sx={{
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                      }}
                    >
                      Book event
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {dayReservations.map((row) => (
                      <DayReservationCard
                        key={pick(row, "id", "Id")}
                        row={row}
                        eventTypes={eventTypes}
                      />
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={panelSx}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      bgcolor: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GroupsIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      Team status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Wedding capacity for this date
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={2.25}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#0369A1" }}>
                        Available
                      </Typography>
                      <Chip
                        size="small"
                        label={availableTeams.length}
                        sx={{ fontWeight: 700, bgcolor: "#E0F2FE", color: "#0369A1" }}
                      />
                    </Stack>
                    {availableTeams.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No free teams left for weddings.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {availableTeams.map((t) => (
                          <TeamPill
                            key={pick(t, "id", "Id")}
                            name={pick(t, "name", "Name")}
                            busy={false}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Divider />

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#B91C1C" }}>
                        Busy
                      </Typography>
                      <Chip
                        size="small"
                        label={busyTeams.length}
                        sx={{ fontWeight: 700, bgcolor: "#FEE2E2", color: "#B91C1C" }}
                      />
                    </Stack>
                    {busyTeams.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No teams assigned to weddings.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {busyTeams.map((t) => (
                          <TeamPill
                            key={pick(t, "id", "Id")}
                            name={pick(t, "name", "Name")}
                            busy
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                      Wedding capacity uses active teams. Other events appear in the schedule but
                      do not consume wedding slots unless marked on the event type.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </>
        )}

        {mode === "month" && monthResult && !monthResult.error && (
          <>
            <Grid item xs={12}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                  {monthName} {monthYear}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {monthActive} active team{monthActive === 1 ? "" : "s"} · click a day for details
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<EventIcon />}
                label="Total events"
                value={monthTotal}
                gradient="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<FavoriteIcon />}
                label="Weddings"
                value={monthWeddings}
                gradient="linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<CakeIcon />}
                label="Other events"
                value={monthOther}
                gradient="linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<BlockIcon />}
                label="Fully booked days"
                value={monthFull}
                gradient="linear-gradient(135deg, #EF4444 0%, #F97316 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={4} md>
              <SummaryStat
                icon={<CheckCircleIcon />}
                label="Open days"
                value={monthAvailable}
                gradient="linear-gradient(135deg, #10B981 0%, #14B8A6 100%)"
              />
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={panelSx}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  mb={1}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      Daily booking graph
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weddings vs other events each day · slots left as a line
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ width: "100%", height: { xs: 260, md: 300 }, mt: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                      <Tooltip {...chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      <Bar dataKey="Weddings" stackId="a" fill="#EC4899" radius={[0, 0, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="Other" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Line
                        type="monotone"
                        dataKey="Remaining"
                        stroke="#6366F1"
                        strokeWidth={2.5}
                        dot={false}
                        name="Slots left"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={panelSx}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  mb={2}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      Month calendar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click a day to open the full schedule
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label="Open" sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 700 }} />
                    <Chip size="small" label="Booked" sx={{ bgcolor: "#FEF3C7", color: "#92400E", fontWeight: 700 }} />
                    <Chip size="small" label="Full" sx={{ bgcolor: "#FEE2E2", color: "#B91C1C", fontWeight: 700 }} />
                  </Stack>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: 1,
                  }}
                >
                  {WEEKDAYS.map((d) => (
                    <Box key={d} sx={{ textAlign: "center", py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#94A3B8" }}>
                        {d}
                      </Typography>
                    </Box>
                  ))}
                  {Array.from({ length: firstWeekday }).map((_, i) => (
                    <Box key={`pad-${i}`} />
                  ))}
                  {monthDays.map((day) => {
                    const dayNum = day.day ?? day.Day;
                    const total = day.totalEvents ?? day.TotalEvents ?? 0;
                    const weddings = day.weddingsBooked ?? day.WeddingsBooked ?? 0;
                    const other = day.otherEventsCount ?? day.OtherEventsCount ?? 0;
                    const rem = day.remaining ?? day.Remaining ?? 0;
                    const iso = `${monthYear}-${pad2(monthResult.month ?? monthResult.Month)}-${pad2(dayNum)}`;
                    const meta = dayCellMeta(day);
                    return (
                      <Box
                        key={dayNum}
                        component="button"
                        type="button"
                        onClick={() => openDay(iso)}
                        sx={{
                          p: 0,
                          borderRadius: 2,
                          cursor: "pointer",
                          textAlign: "left",
                          bgcolor: meta.bgcolor,
                          border: meta.border,
                          overflow: "hidden",
                          minHeight: { xs: 88, sm: 110 },
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(16,24,40,0.08)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", height: "100%" }}>
                          <Box sx={{ width: 4, flexShrink: 0, bgcolor: meta.accent }} />
                          <Box sx={{ p: { xs: 0.75, sm: 1.1 }, flex: 1, minWidth: 0 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Typography sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 16 }, color: "#0F172A" }}>
                                {dayNum}
                              </Typography>
                              <Chip
                                size="small"
                                label={meta.status}
                                sx={{
                                  height: 20,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  bgcolor: meta.statusBg,
                                  color: meta.statusColor,
                                  display: { xs: "none", sm: "inline-flex" },
                                }}
                              />
                            </Stack>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: { xs: 13, sm: 15 },
                                color: "#0F172A",
                                lineHeight: 1.2,
                              }}
                            >
                              {total > 0 ? `${total} event${total === 1 ? "" : "s"}` : "Free"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mt: 0.4,
                                fontWeight: 700,
                                color: "#BE185D",
                                fontSize: { xs: 10, sm: 12 },
                              }}
                            >
                              {weddings} wed
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: { xs: "none", sm: "block" },
                                fontWeight: 700,
                                color: "#B45309",
                                fontSize: 12,
                              }}
                            >
                              {other} other · {rem} left
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          </>
        )}

        {mode === "year" && yearResult && !yearResult.error && (
          <>
            <Grid item xs={12}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A" }}>
                  Year {yearResult.year ?? yearResult.Year ?? year}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {yearActive} active team{yearActive === 1 ? "" : "s"} · click a month for the calendar
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryStat
                icon={<EventIcon />}
                label="Total events"
                value={yearTotal}
                gradient="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryStat
                icon={<FavoriteIcon />}
                label="Weddings"
                value={yearWeddings}
                gradient="linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryStat
                icon={<CakeIcon />}
                label="Other events"
                value={yearOther}
                gradient="linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryStat
                icon={<BlockIcon />}
                label="Fully booked days"
                value={yearFull}
                gradient="linear-gradient(135deg, #EF4444 0%, #F97316 100%)"
              />
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={panelSx}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  mb={1}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      Monthly booking graph
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compare weddings and other events across the year
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ width: "100%", height: { xs: 280, md: 320 }, mt: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={yearChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis
                        yAxisId="left"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: "#64748B" }}
                      />
                      <Tooltip {...chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                      <Bar
                        yAxisId="left"
                        dataKey="Weddings"
                        stackId="a"
                        fill="#EC4899"
                        maxBarSize={36}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="Other"
                        stackId="a"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="BusyDays"
                        stroke="#6366F1"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#6366F1" }}
                        name="Busy days"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={panelSx}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1}
                  mb={2.25}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                      Months overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tap a month to open its calendar
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label="Open" sx={{ fontWeight: 700, bgcolor: "#DCFCE7", color: "#166534" }} />
                    <Chip size="small" label="Has bookings" sx={{ fontWeight: 700, bgcolor: "#FEF3C7", color: "#92400E" }} />
                    <Chip size="small" label="Has full days" sx={{ fontWeight: 700, bgcolor: "#FEE2E2", color: "#B91C1C" }} />
                  </Stack>
                </Stack>
                <Grid container spacing={2}>
                  {yearMonths.map((m) => {
                    const mNum = m.month ?? m.Month;
                    const mName = m.monthName ?? m.MonthName;
                    const total = m.totalEvents ?? m.TotalEvents ?? 0;
                    const weddings = m.weddingsBooked ?? m.WeddingsBooked ?? 0;
                    const other = m.otherEventsCount ?? m.OtherEventsCount ?? 0;
                    const fullDays = m.fullyBookedDays ?? m.FullyBookedDays ?? 0;
                    const daysWith = m.daysWithEvents ?? m.DaysWithEvents ?? 0;
                    const y = yearResult.year ?? yearResult.Year ?? Number(year);
                    const hot = fullDays > 0;
                    const hasBookings = total > 0;
                    const accent = hot ? "#EF4444" : hasBookings ? "#F59E0B" : "#10B981";
                    const statusLabel = hot ? "Full days" : hasBookings ? "Booked" : "Open";
                    const statusBg = hot ? "#FEE2E2" : hasBookings ? "#FEF3C7" : "#DCFCE7";
                    const statusColor = hot ? "#B91C1C" : hasBookings ? "#92400E" : "#166534";
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={mNum}>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => openMonth(y, mNum)}
                          sx={{
                            width: "100%",
                            textAlign: "left",
                            p: 0,
                            borderRadius: 2.5,
                            cursor: "pointer",
                            bgcolor: "#fff",
                            border: "1px solid #E2E8F0",
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 20px rgba(16,24,40,0.1)",
                              borderColor: "#CBD5E1",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", minHeight: 168 }}>
                            <Box sx={{ width: 6, flexShrink: 0, bgcolor: accent }} />
                            <Box sx={{ p: 2, flex: 1, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                spacing={1}
                                mb={1.25}
                              >
                                <Box>
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}
                                  >
                                    {mName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 700, color: "#64748B", letterSpacing: 0.3 }}
                                  >
                                    {y}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={statusLabel}
                                  sx={{
                                    fontWeight: 800,
                                    bgcolor: statusBg,
                                    color: statusColor,
                                    height: 24,
                                  }}
                                />
                              </Stack>

                              <Stack direction="row" alignItems="baseline" spacing={0.75} mb={1.5}>
                                <Typography
                                  sx={{
                                    fontSize: 32,
                                    fontWeight: 800,
                                    lineHeight: 1,
                                    color: "#0F172A",
                                  }}
                                >
                                  {total}
                                </Typography>
                                <Typography sx={{ fontWeight: 700, color: "#475569" }}>
                                  event{total === 1 ? "" : "s"}
                                </Typography>
                              </Stack>

                              <Stack spacing={0.85}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  sx={{
                                    px: 1.1,
                                    py: 0.7,
                                    borderRadius: 1.5,
                                    bgcolor: "#FDF2F8",
                                    border: "1px solid #FBCFE8",
                                  }}
                                >
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    <FavoriteIcon sx={{ fontSize: 16, color: "#DB2777" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#9D174D" }}>
                                      Weddings
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#9D174D" }}>
                                    {weddings}
                                  </Typography>
                                </Stack>

                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  sx={{
                                    px: 1.1,
                                    py: 0.7,
                                    borderRadius: 1.5,
                                    bgcolor: "#FFFBEB",
                                    border: "1px solid #FDE68A",
                                  }}
                                >
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    <CakeIcon sx={{ fontSize: 16, color: "#D97706" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#92400E" }}>
                                      Other
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#92400E" }}>
                                    {other}
                                  </Typography>
                                </Stack>

                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  sx={{
                                    px: 1.1,
                                    py: 0.7,
                                    borderRadius: 1.5,
                                    bgcolor: "#EFF6FF",
                                    border: "1px solid #BFDBFE",
                                  }}
                                >
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    <EventIcon sx={{ fontSize: 16, color: "#2563EB" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#1D4ED8" }}>
                                      Busy days
                                    </Typography>
                                  </Stack>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: "#1D4ED8" }}>
                                    {daysWith}
                                    {fullDays > 0 ? ` · ${fullDays} full` : ""}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
}
