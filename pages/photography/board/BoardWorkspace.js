import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PaymentIcon from "@mui/icons-material/Payment";
import PhotoAlbumIcon from "@mui/icons-material/PhotoAlbum";
import { useTheme } from "@mui/material/styles";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import SearchIcon from "@mui/icons-material/Search";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import TvIcon from "@mui/icons-material/Tv";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import useApi from "@/components/utils/useApi";
import { getAgentTypes, isApiSuccess } from "@/Services/photographyAgentService";
import BoardColumn from "./BoardColumn";
import BoardSettingsDrawer from "./BoardSettingsDrawer";
import { resolveStatusColor } from "../../../utils/photography/boardTheme";

const BOARD_CATEGORY = 307;
const RESERVATION_CATEGORY = 225;
const STORAGE_KEY = "photoKanbanDisplay";

const ALL_AGENTS_OPTION = { value: 0, label: "All", icon: null };

/** Used until the agent types load, and if that request fails. */
const FALLBACK_AGENT_TYPES = [
  { value: 1, label: "Coordinator" },
  { value: 2, label: "Payment" },
  { value: 3, label: "After Wedding" },
];

const agentIconFor = (id) => {
  if (id === 2) return <PaymentIcon sx={{ fontSize: 16 }} />;
  if (id === 3) return <PhotoAlbumIcon sx={{ fontSize: 16 }} />;
  return <PersonIcon sx={{ fontSize: 16 }} />;
};

const SCALES = {
  normal: {
    name: 17,
    meta: 13,
    column: 16,
    cardPad: 1.5,
    colWidth: 300,
    icon: 16,
    metaIconBox: 28,
    chipH: 24,
    actionBtn: 34,
    actionIcon: 18,
  },
  large: {
    name: 22,
    meta: 15,
    column: 20,
    cardPad: 1.75,
    colWidth: 340,
    icon: 18,
    metaIconBox: 32,
    chipH: 28,
    actionBtn: 40,
    actionIcon: 22,
  },
  xl: {
    name: 28,
    meta: 18,
    column: 24,
    cardPad: 2.25,
    colWidth: 400,
    icon: 22,
    metaIconBox: 38,
    chipH: 32,
    actionBtn: 46,
    actionIcon: 26,
  },
};

const DEFAULT_SETTINGS = {
  scale: "large",
  refreshSec: 30,
  visibleStatusIds: null,
  hideEmpty: false,
  dateWindow: 90,
  eventTypeId: "",
  teamId: "",
  search: "",
  displayMode: false,
};

const toDateInput = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const loadSettings = () => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/**
 * @param {'manage' | 'display'} mode
 * manage = in-app board with ERP chrome
 * display = separate full-bleed TV wallboard (no sidebar layout)
 */
export default function BoardWorkspace({ mode = "manage" }) {
  const isDisplay = mode === "display";
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const boardCat = sessionCategory ? parseInt(sessionCategory, 10) : BOARD_CATEGORY;
  const { navigate } = IsPermissionEnabled(
    Number.isFinite(boardCat) ? boardCat : BOARD_CATEGORY
  );
  const { update, photoChangeStatus } = IsPermissionEnabled(RESERVATION_CATEGORY);

  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [agentFilter, setAgentFilter] = useState(0); // 0 = All, otherwise an agent type id
  const [userAgentType, setUserAgentType] = useState(null);
  const [agentTypeReady, setAgentTypeReady] = useState(false);
  const [agentTypeOptions, setAgentTypeOptions] = useState(FALLBACK_AGENT_TYPES);

  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const { data: teamsRaw } = useApi("/PhotographyTeam/GetActiveTeams");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];
  const teams = Array.isArray(teamsRaw) ? teamsRaw : [];

  useEffect(() => {
    const loaded = loadSettings();
    // Display view defaults to XL + display mode for wallboards
    const next = isDisplay
      ? { ...loaded, displayMode: true, scale: loaded.scale === "normal" ? "large" : loaded.scale }
      : loaded;
    setSettingsState(next);
    setSearchDraft(next.search || "");
    setSettingsReady(true);
  }, [isDisplay]);

  const setSettings = useCallback((next) => {
    setSettingsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const fetchBoard = useCallback(async () => {
    const from = toDateInput(new Date());
    const params = new URLSearchParams();
    params.set("fromDate", from);

    const windowDays = Number(settings.dateWindow);
    if (windowDays > 0) {
      const to = new Date();
      to.setDate(to.getDate() + windowDays);
      params.set("toDate", toDateInput(to));
    }

    if (settings.eventTypeId) params.set("eventTypeId", settings.eventTypeId);
    if (settings.teamId) params.set("teamId", settings.teamId);
    if (settings.search?.trim()) params.set("search", settings.search.trim());
    if (agentFilter) params.set("agentType", String(agentFilter));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/PhotographyReservation/GetKanbanBoard?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const payload = json.result ?? json.Result ?? null;
      if (!res.ok || !payload) {
        setError("Could not load board");
        return;
      }
      setStatuses(payload.statuses || payload.Statuses || []);
      setReservations(payload.reservations || payload.Reservations || []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Could not load board");
    } finally {
      setLoading(false);
    }
  }, [settings.dateWindow, settings.eventTypeId, settings.teamId, settings.search, agentFilter]);

  useEffect(() => {
    getAgentTypes()
      .then((data) => {
        if (!isApiSuccess(data)) return;
        const rows = data.result || data.Result || [];
        const mapped = rows
          .map((t) => ({
            value: Number(t.id ?? t.Id),
            label: t.name ?? t.Name ?? "",
          }))
          .filter((t) => Number.isFinite(t.value) && t.value > 0);
        if (mapped.length) setAgentTypeOptions(mapped);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAgentTypeReady(true);
      return;
    }
    fetch(`${BASE_URL}/PhotographyReservationNote/GetCurrentUserAgentType`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const type = data?.result?.agentType ?? data?.result?.AgentType ?? null;
        const parsed = Number(type);
        if (Number.isFinite(parsed) && parsed > 0) {
          setUserAgentType(parsed);
          setAgentFilter(parsed);
        } else {
          setUserAgentType(null);
          setAgentFilter(0);
        }
      })
      .catch(() => {
        setUserAgentType(null);
        setAgentFilter(0);
      })
      .finally(() => setAgentTypeReady(true));
  }, []);

  // An agent type that was renumbered or removed would filter the board down to
  // nothing, so fall back to showing every stage.
  useEffect(() => {
    if (!agentFilter) return;
    if (agentTypeOptions.some((t) => t.value === agentFilter)) return;
    setAgentFilter(0);
  }, [agentFilter, agentTypeOptions]);

  useEffect(() => {
    if (!settingsReady || !agentTypeReady) return;
    setLoading(true);
    fetchBoard();
  }, [settingsReady, agentTypeReady, fetchBoard]);

  useEffect(() => {
    if (!settingsReady || !agentTypeReady || !settings.refreshSec) return undefined;
    const id = setInterval(() => fetchBoard(), settings.refreshSec * 1000);
    return () => clearInterval(id);
  }, [settingsReady, agentTypeReady, settings.refreshSec, fetchBoard]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!isDisplay || typeof window === "undefined") return;
    sessionStorage.setItem("category", String(BOARD_CATEGORY));
  }, [isDisplay]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* blocked */
    }
  };

  const applySearch = () => setSettings({ ...settings, search: searchDraft });

  const scaleKey = !isMdUp && settings.scale === "xl" ? "large" : settings.scale;
  const scale = SCALES[scaleKey] || SCALES.large;

  const columns = useMemo(() => {
    const visibleIds = Array.isArray(settings.visibleStatusIds)
      ? new Set(settings.visibleStatusIds)
      : null;

    const filteredReservations = reservations;

    const byStatus = new Map();
    filteredReservations.forEach((r) => {
      const sid = r.currentStatusId ?? r.CurrentStatusId;
      if (sid == null) return;
      if (!byStatus.has(sid)) byStatus.set(sid, []);
      byStatus.get(sid).push(r);
    });

    const agentTypesOf = (s) => s.agentTypes ?? s.AgentTypes ?? [];
    // Statuses are only filtered by agent once at least one of them is mapped,
    // otherwise an unmapped setup would leave the board empty.
    const hasAnyMapping = statuses.some((s) => agentTypesOf(s).length > 0);

    let cols = statuses
      .filter((s) => {
        const id = s.id ?? s.Id;
        if (visibleIds && !visibleIds.has(id)) return false;
        if (!hasAnyMapping) return true;
        const mapped = agentTypesOf(s);
        if (!mapped.length) return false;
        if (!agentFilter) return true;
        return mapped.includes(agentFilter);
      })
      .map((s, index) => {
        const id = s.id ?? s.Id;
        return {
          status: s,
          accent: resolveStatusColor(s, index),
          cards: byStatus.get(id) || [],
        };
      });

    if (settings.hideEmpty) cols = cols.filter((c) => c.cards.length > 0);
    return cols;
  }, [statuses, reservations, settings.visibleStatusIds, settings.hideEmpty, agentFilter]);

  const filteredCount = columns.reduce((sum, col) => sum + col.cards.length, 0);
  const totalCards = reservations.length;
  const fillWidth = isLgUp && columns.length > 0 && columns.length <= 6;

  if (!navigate) return <AccessDenied />;

  return (
    <Box
      sx={{
        minHeight: isDisplay ? "100vh" : "auto",
        px: isDisplay ? { xs: 1.25, md: 2 } : { xs: 0, md: 0 },
        py: isDisplay ? { xs: 1.25, md: 1.75 } : 0,
        background: isDisplay
          ? "linear-gradient(160deg, #F1F5F9 0%, #E2E8F0 45%, #F8FAFC 100%)"
          : "transparent",
      }}
    >
      <Box
        sx={{
          p: { xs: 1.5, md: 2.25 },
          mb: 2,
          borderRadius: 2.5,
          bgcolor: "#fff",
          border: "1px solid #E2E8F0",
          boxShadow: isDisplay
            ? "0 8px 24px rgba(15,23,42,0.08)"
            : "0 2px 8px rgba(15,23,42,0.04)",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.75}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {isDisplay && (
              <Tooltip title="Back to board">
                <IconButton
                  component={Link}
                  href="/photography/board/"
                  sx={{ bgcolor: "#EEF2FF", borderRadius: 2 }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            )}
            <Box
              sx={{
                width: { xs: 44, md: 52 },
                height: { xs: 44, md: 52 },
                borderRadius: 2,
                bgcolor: "#0F172A",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isDisplay ? (
                <TvIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
              ) : (
                <DashboardCustomizeIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 20, md: isDisplay ? 28 : 22 },
                  color: "#0F172A",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                {isDisplay ? "Live Status Display" : "Photography Status Board"}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                mt={0.75}
              >
                <Chip
                  size="small"
                  label={agentFilter === 0 
                    ? `${totalCards} booking${totalCards === 1 ? "" : "s"}`
                    : `${filteredCount} of ${totalCards} bookings`
                  }
                  sx={{ fontWeight: 800, bgcolor: "#F1F5F9", color: "#334155" }}
                />
                <Chip
                  size="small"
                  icon={
                    <FiberManualRecordIcon
                      sx={{
                        fontSize: "10px !important",
                        color: settings.refreshSec ? "#0F766E !important" : "#94A3B8 !important",
                      }}
                    />
                  }
                  label={
                    settings.refreshSec ? `Live · ${settings.refreshSec}s` : "Auto-refresh off"
                  }
                  sx={{ fontWeight: 700, bgcolor: "#F0FDFA", color: "#0F766E" }}
                />
                {lastUpdated && (
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748B" }}>
                    Updated {lastUpdated.toLocaleTimeString()}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            justifyContent={{ xs: "stretch", lg: "flex-end" }}
          >
            {!isDisplay && (
              <Button
                component={Link}
                href="/photography/board/display"
                variant="outlined"
                startIcon={<TvIcon />}
                size="small"
                sx={{
                  borderRadius: 2,
                  fontWeight: 800,
                  px: 2,
                  borderColor: "#CBD5E1",
                  color: "#0F172A",
                  bgcolor: "#F8FAFC",
                }}
              >
                Open display view
              </Button>
            )}
            {/* Agent Type Toggle */}
            <ToggleButtonGroup
              value={agentFilter}
              exclusive
              onChange={(e, val) => val !== null && setAgentFilter(val)}
              size="small"
              sx={{
                bgcolor: "#F8FAFC",
                "& .MuiToggleButton-root": {
                  border: "1px solid #E2E8F0",
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: "none",
                  "&.Mui-selected": {
                    bgcolor: "#4F46E5",
                    color: "#fff",
                    "&:hover": { bgcolor: "#4338CA" },
                  },
                },
              }}
            >
              {[ALL_AGENTS_OPTION, ...agentTypeOptions].map((agent) => (
                <ToggleButton key={agent.value} value={agent.value}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {agent.value === 0 ? null : agentIconFor(agent.value)}
                    <span>{agent.label}</span>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              size="small"
              placeholder="Search name, card no, location…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 220px" },
                minWidth: { xs: "100%", sm: 200 },
                maxWidth: { lg: 300 },
                bgcolor: "#F8FAFC",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={applySearch}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                px: 2,
                bgcolor: "#0F172A",
                "&:hover": { bgcolor: "#1E293B" },
              }}
            >
              Search
            </Button>
            <Tooltip title="Refresh now">
              <span>
                <IconButton
                  onClick={() => fetchBoard()}
                  disabled={loading}
                  sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Display settings">
              <IconButton
                onClick={() => setSettingsOpen(true)}
                sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2 }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <IconButton
                onClick={toggleFullscreen}
                sx={{ bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 2 }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "#FEF2F2",
            border: "1px solid #FECACA",
          }}
        >
          <Typography color="error" sx={{ fontWeight: 700 }}>
            {error}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          height: isDisplay
            ? { xs: "calc(100vh - 150px)", md: "calc(100vh - 130px)" }
            : { xs: "calc(100vh - 280px)", md: "calc(100vh - 240px)" },
          minHeight: { xs: 360, md: 460 },
          overflowX: "auto",
          overflowY: "hidden",
          pb: 0.5,
          scrollSnapType: { xs: "x mandatory", lg: "none" },
          WebkitOverflowScrolling: "touch",
        }}
      >
        {loading && statuses.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.85)",
            }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 2, color: "#64748B", fontWeight: 700 }}>
              Loading board…
            </Typography>
          </Box>
        ) : columns.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.9)",
              px: 3,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#334155" }}>
              No status columns to show
            </Typography>
            <Button
              variant="contained"
              onClick={() => setSettingsOpen(true)}
              sx={{ mt: 2, borderRadius: 2, fontWeight: 800 }}
            >
              Open settings
            </Button>
          </Box>
        ) : (
          <Stack
            direction="row"
            spacing={{ xs: 1.5, md: 2 }}
            alignItems="stretch"
            sx={{
              height: "100%",
              minWidth: fillWidth ? "100%" : "min-content",
              width: fillWidth ? "100%" : "auto",
            }}
          >
            {columns.map(({ status, accent, cards }) => {
              const statusId = status.id ?? status.Id;
              const stepIndex = statuses.findIndex((s) => (s.id ?? s.Id) === statusId) + 1;
              const totalSteps = statuses.length;
              return (
                <Box
                  key={statusId}
                  sx={{
                    height: "100%",
                    scrollSnapAlign: "start",
                    display: "flex",
                    flex: fillWidth ? "1 1 0" : "0 0 auto",
                    minWidth: scale.colWidth,
                  }}
                >
                  <BoardColumn
                    status={status}
                    accent={accent}
                    cards={cards}
                    scale={scale}
                    canEdit={!!update}
                    canChangeStatus={!!photoChangeStatus}
                    onRefresh={fetchBoard}
                    fillWidth={fillWidth}
                    stepIndex={stepIndex}
                    totalSteps={totalSteps}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <BoardSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        statuses={statuses}
        eventTypes={eventTypes}
        teams={teams}
      />
    </Box>
  );
}
