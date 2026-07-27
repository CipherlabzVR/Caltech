import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { masterCategoryContainedButtonSx } from "@/styles/masterCategoryButtons";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import PublicIcon from "@mui/icons-material/Public";
import GroupsIcon from "@mui/icons-material/Groups";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import CardTravelIcon from "@mui/icons-material/CardTravel";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LinkIcon from "@mui/icons-material/Link";
import DevicesIcon from "@mui/icons-material/Devices";
import NotesIcon from "@mui/icons-material/Notes";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import ReplyIcon from "@mui/icons-material/Reply";
import Avatar from "@mui/material/Avatar";
import LuggageIcon from "@mui/icons-material/Luggage";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StyleIcon from "@mui/icons-material/Style";
import PlaceIcon from "@mui/icons-material/Place";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import HotelIcon from "@mui/icons-material/Hotel";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RouteIcon from "@mui/icons-material/Route";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import FlightLandIcon from "@mui/icons-material/FlightLand";
import PaidIcon from "@mui/icons-material/Paid";
import ConstructionIcon from "@mui/icons-material/Construction";

const STATUSES = ["New", "Read", "Replied", "Archived"];

const statusColor = (s) => {
  switch (s) {
    case "New":
      return "warning";
    case "Read":
      return "info";
    case "Replied":
      return "success";
    case "Archived":
      return "default";
    default:
      return "default";
  }
};

const isOk = (res) => res?.statusCode === 200 || res?.statusCode === 1;

const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const avatarColor = (name) => {
  const palette = [
    "#1976d2", "#7b1fa2", "#0097a7", "#2e7d32",
    "#ef6c00", "#c2185b", "#5d4037", "#455a64",
  ];
  if (!name) return palette[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const STATUS_THEME = {
  New:      { bg: "#fff7e6", border: "#ffb74d", text: "#e65100" },
  Read:     { bg: "#e3f2fd", border: "#64b5f6", text: "#0d47a1" },
  Replied:  { bg: "#e8f5e9", border: "#81c784", text: "#1b5e20" },
  Archived: { bg: "#eceff1", border: "#b0bec5", text: "#37474f" },
};

/** Sri Lanka (Asia/Colombo) — same wall-clock time for all back-office users */
const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("en-LK", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
};

function InfoStat({ icon, label, value, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.75,
        borderRadius: 2,
        height: "100%",
        background: "#fff",
        border: "1px solid #e8eaf0",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        transition: "transform .15s ease, box-shadow .15s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${color}15`,
          color: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography
          variant="caption"
          sx={{ color: "#888", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontWeight: 600,
            color: "#1a1a2e",
            fontSize: 15,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={String(value)}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

function splitCsv(value) {
  if (!value) return [];
  return String(value)
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PlannerStat({ icon, color, label, value }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: "#fff",
        border: "1px solid #e1d5b8",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: 38, height: 38, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: `${color}20`, color, flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography variant="caption" sx={{ color: "#8a7252", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography sx={{ color: "#3e2723", fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
          {value || "—"}
        </Typography>
      </Box>
    </Paper>
  );
}

function PlannerTagRow({ icon, color, label, items }) {
  return (
    <Box
      sx={{
        p: 2, borderRadius: 2, background: "#fff",
        border: "1px solid #e1d5b8",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1.25}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="caption" sx={{ color, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
          {label} ({items.length})
        </Typography>
      </Box>
      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#8a7252", fontStyle: "italic" }}>
          None selected
        </Typography>
      ) : (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {items.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              sx={{
                bgcolor: "#fdf6e1",
                color: "#5b4a35",
                border: "1px solid #d8c898",
                fontWeight: 500,
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function PlannerSummaryCard({ inquiry }) {
  const months = splitCsv(inquiry.plannerMonths);
  const destinations = splitCsv(inquiry.plannerDestinations);
  const experiences = splitCsv(inquiry.plannerExperiences);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        background: "linear-gradient(135deg,#fbf6e9 0%,#f5ecd2 100%)",
        border: "1px solid #d8c898",
        borderLeft: "4px solid #C9A84C",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <LuggageIcon sx={{ color: "#8a7252" }} />
        <Typography variant="subtitle2" sx={{ color: "#5b4a35", letterSpacing: 0.5, fontWeight: 700 }}>
          PACKAGE PLANNER SELECTIONS
        </Typography>
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<CalendarMonthIcon />}
            color="#1976d2"
            label="Duration"
            value={inquiry.plannerDays ? `${inquiry.plannerDays} days` : "—"}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<EventIcon />}
            color="#0097a7"
            label="Best months"
            value={months.length ? months.join(", ") : "Flexible"}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<PeopleAltIcon />}
            color="#2e7d32"
            label="Travellers"
            value={inquiry.plannerTravelerType}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<StyleIcon />}
            color="#7b1fa2"
            label="Travel style"
            value={inquiry.plannerTravelStyle}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PlannerTagRow
            icon={<PlaceIcon />}
            color="#c62828"
            label="Destinations"
            items={destinations}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlannerTagRow
            icon={<LocalActivityIcon />}
            color="#ef6c00"
            label="Experiences"
            items={experiences}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Custom Plan summary card                                                */
/* ──────────────────────────────────────────────────────────────────────── */

const fmtMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

function safeParseCustomPlan(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Map snapshot (Google Static Maps)                                       */
/* ──────────────────────────────────────────────────────────────────────── */

const MAP_KEY =
  (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_MAP_API_KEY) || "";

/** Convert a stop/location into the Static Maps marker/path token. */
function pointToken(p) {
  if (!p) return null;
  if (
    p.lat != null &&
    p.lng != null &&
    Number.isFinite(Number(p.lat)) &&
    Number.isFinite(Number(p.lng))
  ) {
    return `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`;
  }
  const label = (p.label || p.destinationName || "").trim();
  if (!label) return null;
  // Bias to Sri Lanka for stop names like "Ella" / "Kandy".
  return encodeURIComponent(`${label}, Sri Lanka`);
}

function buildStaticMapUrl(plan) {
  if (!MAP_KEY || !plan) return null;
  const route = plan.route || null;
  const orderedPlaces = Array.isArray(route?.orderedPlaces) ? route.orderedPlaces : null;

  // Markers — prefer the optimized order Google returned.
  let startMarker = null;
  let endMarker = null;
  let stopMarkers = [];

  if (orderedPlaces && orderedPlaces.length >= 2) {
    startMarker = pointToken(orderedPlaces[0]);
    endMarker = pointToken(orderedPlaces[orderedPlaces.length - 1]);
    stopMarkers = orderedPlaces
      .slice(1, -1)
      .map((p) => pointToken(p))
      .filter(Boolean);
  } else {
    const stops = Array.isArray(plan.stops) ? plan.stops : [];
    startMarker = pointToken(plan.startLocation);
    endMarker = pointToken(plan.endLocation);
    stopMarkers = stops
      .map((s) => pointToken({ label: s.destinationName, lat: s.lat, lng: s.lng }))
      .filter(Boolean);
  }

  const haveAnyMarker = !!startMarker || !!endMarker || stopMarkers.length > 0;
  if (!haveAnyMarker) return null;

  const params = new URLSearchParams();
  params.set("size", "640x340");
  params.set("scale", "2");
  params.set("maptype", "roadmap");
  params.set("key", MAP_KEY);

  const parts = [
    `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`,
  ];

  if (startMarker) parts.push(`markers=color:0x2e7d32%7Clabel:A%7C${startMarker}`);
  if (endMarker) parts.push(`markers=color:0xc62828%7Clabel:B%7C${endMarker}`);
  stopMarkers.forEach((t, i) => {
    parts.push(`markers=color:0x1976d2%7Clabel:${i + 1}%7C${t}`);
  });

  // Path: prefer the encoded polyline of the route the user actually selected.
  if (route?.overviewPolyline) {
    parts.push(
      `path=color:0xC9A84Cff%7Cweight:5%7Cenc:${encodeURIComponent(route.overviewPolyline)}`
    );
  } else {
    const orderedTokens = [startMarker, ...stopMarkers, endMarker].filter(Boolean);
    if (orderedTokens.length >= 2) {
      parts.push(`path=color:0xC9A84Cff%7Cweight:4%7C${orderedTokens.join("%7C")}`);
    }
  }

  return parts.join("&");
}

function buildDirectionsUrl(plan) {
  if (!plan) return null;
  const route = plan.route || null;
  const orderedPlaces = Array.isArray(route?.orderedPlaces) ? route.orderedPlaces : null;

  const labelOf = (p) => {
    if (!p) return "";
    if (
      p.lat != null &&
      p.lng != null &&
      Number.isFinite(Number(p.lat)) &&
      Number.isFinite(Number(p.lng))
    ) {
      return `${p.lat},${p.lng}`;
    }
    const l = (p.label || p.destinationName || "").trim();
    return l ? `${l}, Sri Lanka` : "";
  };

  let origin = "";
  let destination = "";
  let waypoints = "";

  if (orderedPlaces && orderedPlaces.length >= 2) {
    origin = labelOf(orderedPlaces[0]);
    destination = labelOf(orderedPlaces[orderedPlaces.length - 1]);
    waypoints = orderedPlaces.slice(1, -1).map(labelOf).filter(Boolean).join("|");
  } else {
    const stops = Array.isArray(plan.stops) ? plan.stops : [];
    origin = labelOf(plan.startLocation);
    destination = labelOf(plan.endLocation);
    waypoints = stops
      .map((s) => labelOf({ label: s.destinationName, lat: s.lat, lng: s.lng }))
      .filter(Boolean)
      .join("|");
  }
  if (!origin || !destination) return null;

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  if (waypoints) url.searchParams.set("waypoints", waypoints);
  url.searchParams.set("travelmode", "driving");

  // Translate the picked variant into Google Maps avoid flags. The classic
  // `dirflg` param (h = highways, t = tolls, f = ferries) still works alongside
  // api=1, and `avoid` is also honored on desktop.
  const flags = [];
  const avoid = [];
  if (route?.avoidHighways) {
    flags.push("h");
    avoid.push("highways");
  }
  if (route?.avoidTolls) {
    flags.push("t");
    avoid.push("tolls");
  }
  if (route?.avoidFerries) {
    flags.push("f");
    avoid.push("ferries");
  }
  if (flags.length > 0) {
    url.searchParams.set("dirflg", flags.join(""));
    url.searchParams.set("avoid", avoid.join("|"));
  }
  return url.toString();
}

function MapSnapshot({ inquiry }) {
  const plan = safeParseCustomPlan(inquiry?.customPlanJson);
  const url = buildStaticMapUrl(plan);
  const directionsUrl = buildDirectionsUrl(plan);
  const [imgFailed, setImgFailed] = React.useState(false);
  React.useEffect(() => {
    setImgFailed(false);
  }, [url]);
  const variantLabel = plan?.route?.variantLabel;

  if (!MAP_KEY) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          background: "#fff",
          border: "1px dashed #c5cae9",
          color: "#3949ab",
          fontSize: 13,
        }}
      >
        Map preview unavailable — set <code>NEXT_PUBLIC_MAP_API_KEY</code> in the back-office environment.
      </Box>
    );
  }

  if (!url) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          background: "#fff",
          border: "1px dashed #c5cae9",
          color: "#666",
          fontSize: 13,
          fontStyle: "italic",
        }}
      >
        Not enough route data to render a map preview.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: "#fff",
        border: "1px solid #c5cae9",
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={1.25} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={1}>
          <RouteIcon sx={{ color: "#3949ab" }} />
          <Typography
            variant="caption"
            sx={{
              color: "#1a237e",
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontWeight: 700,
            }}
          >
            Route map snapshot
          </Typography>
          {variantLabel && (
            <Chip
              size="small"
              label={variantLabel}
              sx={{ ml: 0.5, bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 600 }}
            />
          )}
        </Box>
        {directionsUrl && (
          <Button
            size="small"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<PlaceIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Open in Google Maps
          </Button>
        )}
      </Box>
      {imgFailed ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            background: "#fff5f5",
            border: "1px solid #ffcdd2",
            color: "#b71c1c",
            fontSize: 13,
          }}
        >
          Failed to load the map image. Open the URL below in a new tab to see Google&apos;s
          exact error (e.g. <i>RefererNotAllowedMapError</i>, <i>ApiNotActivatedMapError</i>,
          or <i>request URL too long</i>):
          <Box
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "block",
              mt: 1,
              p: 1,
              fontSize: 11,
              fontFamily: "monospace",
              wordBreak: "break-all",
              background: "#fff",
              border: "1px solid #ffcdd2",
              borderRadius: 1,
              color: "#b71c1c",
            }}
          >
            {url}
          </Box>
          <Box mt={1.25} component="ul" sx={{ pl: 2.5, m: 0 }}>
            <li>
              In Google Cloud → <b>Credentials</b> → your API key, the
              <b> &ldquo;API restrictions&rdquo;</b> list must include
              <b> Maps Static API</b> (enabling the API isn&apos;t enough on its own).
            </li>
            <li>
              If <b>Application restrictions</b> are set to <b>HTTP referrers</b>, add the
              back-office origin (e.g. <code>http://localhost:3000/*</code>,{" "}
              <code>{typeof window !== "undefined" ? window.location.origin : ""}/*</code>).
            </li>
            <li>Billing must be active on the project.</li>
          </Box>
          {directionsUrl && (
            <Box mt={1}>
              You can still open the route directly in{" "}
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                Google Maps
              </a>
              .
            </Box>
          )}
        </Box>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Route map preview"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: 8,
            border: "1px solid #e0e0e0",
          }}
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      )}
      <Box mt={1} display="flex" gap={2} flexWrap="wrap">
        <LegendDot color="#2e7d32" label="A · Start" />
        <LegendDot color="#1976d2" label="1..N · Stops" />
        <LegendDot color="#c62828" label="B · End" />
        <LegendDot color="#C9A84C" label="Driving path" />
      </Box>
    </Box>
  );
}

function LegendDot({ color, label }) {
  return (
    <Box display="flex" alignItems="center" gap={0.75}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: color,
          border: "1px solid rgba(0,0,0,0.15)",
        }}
      />
      <Typography variant="caption" sx={{ color: "#5b4a35", fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}

function PredefinedPackageSummaryCard({ inquiry }) {
  const snap = safeParseCustomPlan(inquiry.predefinedPackageJson) || {};
  const star = inquiry.predefinedPackageStarCategory ?? snap.starCategory;
  const room = inquiry.predefinedPackageRoomType || snap.roomType;
  const currency = snap.currency || "USD";
  const perPerson = Number(snap.computedPricePerPerson) || 0;
  const total = Number(snap.totalPrice ?? inquiry.estimatedTotalPrice) || 0;
  const slug = inquiry.predefinedPackageSlug || snap.slug || "";
  const date = inquiry.preferredTravelDate
    ? new Date(inquiry.preferredTravelDate).toLocaleDateString()
    : null;

  // Hotels — try snapshot first, then fall back to fetching the package by slug
  // and resolving the chosen star option from the back-office source of truth.
  const [resolvedHotels, setResolvedHotels] = useState(
    Array.isArray(snap.hotels) ? snap.hotels : []
  );
  const [hotelsLoading, setHotelsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (resolvedHotels.length > 0 || !slug) return;
    setHotelsLoading(true);
    (async () => {
      try {
        const r = await fetch(`${BASE_URL}/TravelPredefinedPackages/GetPublic`, {
          headers: authJsonHeaders(),
        });
        if (!r.ok) return;
        const data = await r.json();
        const list = Array.isArray(data?.result)
          ? data.result
          : Array.isArray(data)
          ? data
          : [];
        const pkg = list.find((p) => p.slug === slug);
        if (!pkg || cancelled) return;
        const opts = Array.isArray(pkg.starOptions) ? pkg.starOptions : [];
        const opt =
          opts.find((o) => Number(o.starCategory) === Number(star)) || opts[0];
        if (opt && Array.isArray(opt.hotels)) {
          setResolvedHotels(opt.hotels);
        }
      } catch (err) {
        // best-effort fallback only; ignore failures
        console.warn("[PredefinedPackageSummaryCard] hotel fallback failed", err);
      } finally {
        if (!cancelled) setHotelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, star]);

  const hotels = resolvedHotels;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: "rgba(197,160,89,0.08)",
        border: "1px solid rgba(197,160,89,0.32)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <CardTravelIcon sx={{ color: "#C5A059" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0A1325" }}>
          Predefined Package Selection
        </Typography>
        {star ? (
          <Chip
            size="small"
            label={`${star}-Star Option`}
            sx={{ bgcolor: "#C5A059", color: "#0A1325", fontWeight: 700, ml: 1 }}
          />
        ) : null}
      </Box>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6} md={4}>
          <KV k="Package" v={snap.title || inquiry.selectedPackage || "—"} />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV k="Slug" v={inquiry.predefinedPackageSlug || snap.slug || "—"} mono />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV k="Room Type" v={room || "—"} />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV
            k="Duration"
            v={snap.durationDays ? `${snap.durationDays} day(s)` : "—"}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV k="Preferred Travel Date" v={date || "—"} />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV
            k="Travelers"
            v={`${inquiry.adults || 0} adults / ${inquiry.children || 0} children`}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV
            k="Per-person price"
            v={perPerson ? `${currency} ${perPerson.toLocaleString()}` : "—"}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV
            k="Estimated total"
            v={total ? `${currency} ${total.toLocaleString()}` : "—"}
            highlight
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <KV
            k="Per-person Double (base)"
            v={
              snap.perPersonDouble
                ? `${currency} ${Number(snap.perPersonDouble).toLocaleString()}`
                : "—"
            }
          />
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "#8a7252",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Hotels for the chosen star option
        </Typography>
        {hotels.length > 0 ? (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {hotels.map((h, i) => (
              <Typography key={i} variant="body2" sx={{ color: "#0A1325" }}>
                <strong>{h.location}:</strong> {h.hotel}{" "}
                <span style={{ color: "rgba(10,19,37,0.55)" }}>({h.mealPlan})</span>
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "rgba(10,19,37,0.55)", mt: 1, fontStyle: "italic" }}>
            {hotelsLoading
              ? "Loading hotels…"
              : "Hotels could not be resolved for this selection."}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function KV({ k, v, mono = false, highlight = false }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "rgba(10,19,37,0.55)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        {k}
      </Typography>
      <Typography
        sx={{
          color: highlight ? "#8a6918" : "#0A1325",
          fontWeight: highlight ? 800 : 600,
          fontSize: "14px",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-word",
        }}
      >
        {v}
      </Typography>
    </Box>
  );
}

function CustomPlanSummaryCard({ inquiry }) {
  const plan = safeParseCustomPlan(inquiry.customPlanJson);
  const stops = Array.isArray(plan?.stops) ? plan.stops : [];
  const totals = plan?.totals || {};
  const vehicle = plan?.vehicle || null;
  const experienceTags = splitCsv(inquiry.plannerExperiences);
  const hasStopExperiences = stops.some((s) => Array.isArray(s.experiences) && s.experiences.length > 0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        background: "linear-gradient(135deg,#eef4ff 0%,#dde7ff 100%)",
        border: "1px solid #b9c8ff",
        borderLeft: "4px solid #3949ab",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ConstructionIcon sx={{ color: "#3949ab" }} />
        <Typography variant="subtitle2" sx={{ color: "#1a237e", letterSpacing: 0.5, fontWeight: 700 }}>
          CUSTOM PLAN BUILDER · ITEMISED ESTIMATE
        </Typography>
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<CalendarMonthIcon />}
            color="#1976d2"
            label="Trip Days"
            value={inquiry.tripDays || plan?.days || "—"}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<PeopleAltIcon />}
            color="#2e7d32"
            label="Travellers"
            value={`${inquiry.adults || 0} adults · ${inquiry.children || 0} children`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<RouteIcon />}
            color="#6d4c41"
            label="Distance (km)"
            value={inquiry.estimatedDistanceKm != null ? fmtMoney(inquiry.estimatedDistanceKm) : "—"}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <PlannerStat
            icon={<PaidIcon />}
            color="#1b5e20"
            label="Estimated Total"
            value={inquiry.estimatedTotalPrice != null ? fmtMoney(inquiry.estimatedTotalPrice) : "—"}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <PlannerStat
            icon={<FlightTakeoffIcon />}
            color="#0277bd"
            label="Start"
            value={inquiry.startLocationLabel
              ? `${inquiry.startLocationLabel}${inquiry.startLocationType ? ` (${inquiry.startLocationType})` : ""}`
              : "—"}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlannerStat
            icon={<FlightLandIcon />}
            color="#c62828"
            label="End"
            value={inquiry.endLocationLabel
              ? `${inquiry.endLocationLabel}${inquiry.endLocationType ? ` (${inquiry.endLocationType})` : ""}`
              : "—"}
          />
        </Grid>

        {!hasStopExperiences && experienceTags.length > 0 && (
          <Grid item xs={12}>
            <PlannerTagRow
              icon={<LocalActivityIcon />}
              color="#ef6c00"
              label="Experiences"
              items={experienceTags}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <MapSnapshot inquiry={inquiry} />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ p: 2, borderRadius: 2, background: "#fff", border: "1px solid #c5cae9" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <HotelIcon sx={{ color: "#3949ab" }} />
              <Typography variant="caption" sx={{ color: "#1a237e", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>
                Stops &amp; hotels
              </Typography>
            </Box>
            {stops.length === 0 ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No stops captured.
              </Typography>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {stops.map((s, i) => (
                  <Box key={i} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
                    <Box minWidth={0} flex={1}>
                      <Typography fontWeight={600} sx={{ color: "#1a237e" }}>
                        {s.destinationName || `Stop ${i + 1}`}{" "}
                        <Typography component="span" variant="caption" color="text.secondary">
                          · {s.nights || 0} night{(s.nights || 0) === 1 ? "" : "s"}
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.categoryLabel || "—"}
                        {Array.isArray(s.rooms) && s.rooms.length > 0
                          ? ` · ${s.rooms
                              .map((r) => `${r.quantity}× ${r.roomTypeLabel} @ ${fmtMoney(r.pricePerNight)}/night`)
                              .join(", ")}`
                          : s.roomTypeLabel
                          ? ` · ${s.roomTypeLabel}`
                          : ""}
                      </Typography>
                      {Array.isArray(s.experiences) && s.experiences.length > 0 && (
                        <Typography variant="caption" sx={{ display: "block", color: "#3949ab", mt: 0.75, fontWeight: 600 }}>
                          Experiences:{" "}
                          {s.experiences
                            .map((ex) =>
                              ex.name
                                ? `${ex.name}${
                                    Number(ex.price) > 0
                                      ? ` (${fmtMoney(ex.price)}/person est.)`
                                      : ""
                                  }`
                                : ""
                            )
                            .filter(Boolean)
                            .join(" · ")}
                        </Typography>
                      )}
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="body2">
                        Hotel:{" "}
                        <b>
                          {fmtMoney(
                            Number(s.hotelSubtotal) > 0
                              ? Number(s.hotelSubtotal)
                              : Array.isArray(s.rooms) && s.rooms.length > 0
                              ? s.rooms.reduce(
                                  (sum, r) =>
                                    sum + (Number(r.pricePerNight) || 0) * (Number(r.quantity) || 0) * (Number(s.nights) || 0),
                                  0
                                )
                              : (Number(s.pricePerNight) || 0) * (Number(s.nights) || 0)
                          )}
                        </b>
                      </Typography>
                      {Number(s.entryFee) > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Entry fee: {fmtMoney(s.entryFee)}/person
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Grid>

        {vehicle && (
          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: 2, background: "#fff", border: "1px solid #c5cae9", display: "flex", alignItems: "center", gap: 1.5 }}>
              <DirectionsCarIcon sx={{ color: "#3949ab" }} />
              <Box flex={1}>
                <Typography fontWeight={600} sx={{ color: "#1a237e" }}>
                  {vehicle.name || "Vehicle"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fmtMoney(vehicle.pricePerKm)} / km × {fmtMoney(inquiry.estimatedDistanceKm || 0)} km
                </Typography>
              </Box>
              <Typography fontWeight={600}>{fmtMoney(totals.vehicle)}</Typography>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Box sx={{ p: 2, borderRadius: 2, background: "#1a237e", color: "#fff" }}>
            <Grid container spacing={1}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>Hotels total</Typography>
                <Typography fontWeight={700}>{fmtMoney(totals.hotels)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>Entry fees</Typography>
                <Typography fontWeight={700}>{fmtMoney(totals.entryFees)}</Typography>
              </Grid>
              {Number(totals.experiences) > 0 && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>Experiences (est.)</Typography>
                  <Typography fontWeight={700}>{fmtMoney(totals.experiences)}</Typography>
                </Grid>
              )}
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>Vehicle</Typography>
                <Typography fontWeight={700}>{fmtMoney(totals.vehicle)}</Typography>
              </Grid>
              {Number(totals.convenienceFee) > 0 && (
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ opacity: 0.75 }}>
                    Convenience fee{totals.convenienceFeePercent ? ` (${totals.convenienceFeePercent}%)` : ""}
                  </Typography>
                  <Typography fontWeight={700}>{fmtMoney(totals.convenienceFee)}</Typography>
                </Grid>
              )}
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" sx={{ opacity: 0.75 }}>Grand total</Typography>
                <Typography fontWeight={700} fontSize={18}>{fmtMoney(totals.grand ?? inquiry.estimatedTotalPrice)}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

function MetaCard({ icon, color, title, primary, secondary }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        background: "#fff",
        border: "1px solid #e8eaf0",
        borderTop: `3px solid ${color}`,
        height: "100%",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Box sx={{ color, display: "flex" }}>{icon}</Box>
        <Typography
          variant="caption"
          sx={{ color, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: "#1a1a2e", wordBreak: "break-all" }}>
        {primary}
      </Typography>
      {secondary && (
        <Typography
          variant="caption"
          sx={{ color: "#888", display: "block", mt: 0.5, wordBreak: "break-all" }}
        >
          {secondary}
        </Typography>
      )}
    </Paper>
  );
}

export default function ContactInquiries() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, update, remove } = IsPermissionEnabled(cId);

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // View dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [viewStatus, setViewStatus] = useState("Read");
  const [viewNotes, setViewNotes] = useState("");
  const [savingView, setSavingView] = useState(false);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/TravelContactInquiries/GetAllInquiries`, {
        method: "GET",
        headers: authJsonHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch inquiries");
      const data = await response.json();
      setInquiries(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const siteOptions = useMemo(() => {
    const set = new Set();
    inquiries.forEach((i) => {
      if (i.siteKey) set.add(i.siteKey);
    });
    return Array.from(set).sort();
  }, [inquiries]);

  const filtered = useMemo(() => {
    return inquiries.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (siteFilter !== "all") {
        const key = i.siteKey || "";
        if (siteFilter === "__none__" ? key !== "" : key !== siteFilter) return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.trim().toLowerCase();
      return (
        (i.fullName || "").toLowerCase().includes(q) ||
        (i.email || "").toLowerCase().includes(q) ||
        (i.country || "").toLowerCase().includes(q) ||
        (i.selectedPackage || "").toLowerCase().includes(q) ||
        (i.description || "").toLowerCase().includes(q) ||
        (i.siteKey || "").toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, siteFilter, searchTerm]);

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const newCount = inquiries.filter((i) => i.status === "New").length;

  // ---------- View ----------

  const openView = async (row) => {
    setViewing(row);
    setViewStatus(row.status || "Read");
    setViewNotes(row.adminNotes || "");
    setViewOpen(true);
    // Auto-mark as Read on first open if it was New
    if (row.status === "New" && update) {
      try {
        const response = await fetch(`${BASE_URL}/TravelContactInquiries/UpdateStatus`, {
          method: "POST",
          headers: authJsonHeaders(),
          body: JSON.stringify({ id: row.id, status: "Read", adminNotes: row.adminNotes ?? null }),
        });
        const data = await response.json();
        if (isOk(data)) {
          setInquiries((list) => list.map((x) => (x.id === row.id ? { ...x, status: "Read" } : x)));
          setViewStatus("Read");
        }
      } catch (err) {
        // Silent: not critical
        console.error(err);
      }
    }
  };

  const handleSaveStatus = async () => {
    if (!viewing) return;
    setSavingView(true);
    try {
      const response = await fetch(`${BASE_URL}/TravelContactInquiries/UpdateStatus`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          id: viewing.id,
          status: viewStatus,
          adminNotes: viewNotes || null,
        }),
      });
      const data = await response.json();
      if (!isOk(data)) throw new Error(data?.message || "Failed to update");
      toast.success("Inquiry updated");
      setInquiries((list) =>
        list.map((x) =>
          x.id === viewing.id ? { ...x, status: viewStatus, adminNotes: viewNotes } : x
        )
      );
      setViewOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSavingView(false);
    }
  };

  // ---------- Delete ----------

  const openDelete = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `${BASE_URL}/TravelContactInquiries/DeleteInquiry?id=${toDelete.id}`,
        { method: "POST", headers: authJsonHeaders() }
      );
      const data = await response.json();
      if (!isOk(data)) throw new Error(data?.message || "Failed to delete");
      toast.success("Inquiry deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>
          Contact Inquiries{" "}
          {newCount > 0 && (
            <Chip
              label={`${newCount} New`}
              color="warning"
              size="small"
              sx={{ ml: 1, verticalAlign: "middle" }}
            />
          )}
        </h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Travel</li>
          <li>
            <Link href="/travel/contact-inquiries/">Contact Inquiries</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
            />
          </Search>
        </Grid>
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          alignItems="center"
          gap={1}
          order={{ xs: 1, lg: 2 }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Source Site</InputLabel>
            <Select
              value={siteFilter}
              label="Source Site"
              onChange={(e) => {
                setSiteFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All sites</MenuItem>
              {siteOptions.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
              <MenuItem value="__none__">(no source)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchAll} disabled={loading}>
            Refresh
          </Button>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>

          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Source Site</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Travelers</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="textSecondary">No inquiries found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={row.status === "New" ? { fontWeight: 600 } : undefined}
                    >
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{formatDate(row.createdOn)}</TableCell>
                      <TableCell>{row.fullName || "-"}</TableCell>
                      <TableCell>
                        <a href={`mailto:${row.email}`} style={{ color: "inherit" }}>
                          {row.email || "-"}
                        </a>
                      </TableCell>
                      <TableCell>
                        {row.siteKey ? (
                          <Chip label={row.siteKey} size="small" variant="outlined" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{row.country || "-"}</TableCell>
                      <TableCell>
                        {row.source === "customplan" ? (
                          <Chip
                            icon={<ConstructionIcon />}
                            label="Custom Plan"
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        ) : row.source === "planner" ? (
                          <Chip
                            icon={<LuggageIcon />}
                            label="Custom (Planner)"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ) : row.source === "predefined-package" ? (
                          <Chip
                            icon={<CardTravelIcon />}
                            label={`${row.predefinedPackageStarCategory || ""}★ ${row.selectedPackage || row.predefinedPackageSlug || "Package"}`.trim()}
                            size="small"
                            sx={{ bgcolor: "#C5A059", color: "#0A1325", fontWeight: 700 }}
                          />
                        ) : (
                          row.selectedPackage || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {row.adults || 0} adults / {row.children || 0} children
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status || "New"}
                          size="small"
                          color={statusColor(row.status)}
                          variant={row.status === "New" ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View full inquiry">
                          <IconButton size="small" onClick={() => openView(row)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDelete(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
              <Pagination
                count={Math.max(1, Math.ceil(filtered.length / rowsPerPage))}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Page Size"
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* ===== View Inquiry Dialog ===== */}
      <Dialog
        open={viewOpen}
        onClose={() => !savingView && setViewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            background: "#f5f7fb",
          },
        }}
      >
        {viewing && (
          <>
            {/* ---------- Colorful gradient header ---------- */}
            <Box
              sx={{
                position: "relative",
                px: { xs: 2.5, md: 4 },
                pt: 3,
                pb: 3.5,
                color: "#fff",
                background: "linear-gradient(135deg, #0A1325 0%, #1a2540 55%, #2a2f3f 100%)",
              }}
            >
              <IconButton
                onClick={() => !savingView && setViewOpen(false)}
                disabled={savingView}
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  color: "#EADDC3",
                  "&:hover": { background: "rgba(197,160,89,0.18)" },
                }}
              >
                <CloseIcon />
              </IconButton>

              <Box display="flex" alignItems="center" gap={2.5} flexWrap="wrap">
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    fontSize: 24,
                    fontWeight: 700,
                    bgcolor: "rgba(197,160,89,0.18)",
                    color: "#C5A059",
                    border: "2px solid rgba(197,160,89,0.55)",
                  }}
                >
                  {getInitials(viewing.fullName)}
                </Avatar>
                <Box flex={1} minWidth={220}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, lineHeight: 1.15, mb: 0.5, color: "#EADDC3", letterSpacing: 0.3 }}
                  >
                    {viewing.fullName || "Unknown"}
                  </Typography>
                  <Box
                    display="flex"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={1}
                    sx={{ color: "#EADDC3" }}
                  >
                    <EmailIcon fontSize="inherit" sx={{ fontSize: 16, color: "#C5A059" }} />
                    <Typography variant="body2">
                      <a
                        href={`mailto:${viewing.email}`}
                        style={{ color: "#EADDC3", textDecoration: "none", borderBottom: "1px dashed rgba(197,160,89,0.6)" }}
                      >
                        {viewing.email || "no-email"}
                      </a>
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#C5A059", opacity: 0.6 }}>
                      &middot;
                    </Typography>
                    <EventIcon fontSize="inherit" sx={{ fontSize: 16, color: "#C5A059" }} />
                    <Typography variant="body2">
                      {formatDate(viewing.createdOn)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#C5A059", opacity: 0.6 }}>
                      &middot;
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                      #{viewing.id}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={viewing.status || "New"}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: "#C5A059",
                      color: "#0A1325",
                    }}
                  />
                  {viewing.siteKey && (
                    <Chip
                      label={viewing.siteKey}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: "#EADDC3",
                        borderColor: "rgba(197,160,89,0.55)",
                      }}
                    />
                  )}
                  {viewing.source === "planner" && (
                    <Chip
                      icon={<LuggageIcon sx={{ color: "#0A1325 !important" }} />}
                      label="Package Planner"
                      size="small"
                      sx={{
                        bgcolor: "#C5A059",
                        color: "#0A1325",
                        fontWeight: 700,
                        border: "1px solid #C5A059",
                      }}
                    />
                  )}
                  {viewing.source === "customplan" && (
                    <Chip
                      icon={<ConstructionIcon sx={{ color: "#fff !important" }} />}
                      label="Custom Plan"
                      size="small"
                      sx={{
                        bgcolor: "#3949ab",
                        color: "#fff",
                        fontWeight: 700,
                        border: "1px solid #3949ab",
                      }}
                    />
                  )}
                  {viewing.source === "predefined-package" && (
                    <Chip
                      icon={<CardTravelIcon sx={{ color: "#0A1325 !important" }} />}
                      label={`Predefined Package${
                        viewing.predefinedPackageStarCategory
                          ? ` · ${viewing.predefinedPackageStarCategory}-Star`
                          : ""
                      }`}
                      size="small"
                      sx={{
                        bgcolor: "#C5A059",
                        color: "#0A1325",
                        fontWeight: 700,
                        border: "1px solid #C5A059",
                      }}
                    />
                  )}
                </Stack>
              </Box>

              <Box mt={2}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ReplyIcon />}
                  component="a"
                  href={`mailto:${viewing.email}?subject=Re: Your travel inquiry${
                    viewing.siteKey ? ` (${viewing.siteKey})` : ""
                  }`}
                  sx={masterCategoryContainedButtonSx}
                >
                  Reply via Email
                </Button>
              </Box>
            </Box>

            <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
              {/* ---------- Quick info chips ---------- */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <InfoStat
                    icon={<PublicIcon />}
                    label="Country"
                    value={viewing.country || "—"}
                    color="#1976d2"
                  />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <InfoStat
                    icon={<GroupsIcon />}
                    label="Adults"
                    value={viewing.adults ?? 0}
                    color="#2e7d32"
                  />
                </Grid>
                <Grid item xs={6} sm={6} md={3}>
                  <InfoStat
                    icon={<ChildCareIcon />}
                    label="Children"
                    value={viewing.children ?? 0}
                    color="#ef6c00"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <InfoStat
                    icon={<CardTravelIcon />}
                    label="Package"
                    value={viewing.selectedPackage || "—"}
                    color="#7b1fa2"
                  />
                </Grid>

                {/* ---------- Package Planner selections (only when present) ---------- */}
                {viewing.source === "planner" && (
                  <Grid item xs={12}>
                    <PlannerSummaryCard inquiry={viewing} />
                  </Grid>
                )}

                {/* ---------- Custom Plan Builder breakdown ---------- */}
                {viewing.source === "customplan" && (
                  <Grid item xs={12}>
                    <CustomPlanSummaryCard inquiry={viewing} />
                  </Grid>
                )}

                {/* ---------- Predefined Package selection ---------- */}
                {viewing.source === "predefined-package" && (
                  <Grid item xs={12}>
                    <PredefinedPackageSummaryCard inquiry={viewing} />
                  </Grid>
                )}

                {/* ---------- Inquiry message card ---------- */}
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: "linear-gradient(135deg,#fffdf5 0%,#fff8e1 100%)",
                      border: "1px solid #ffe082",
                      borderLeft: "4px solid #f9a825",
                      position: "relative",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ChatBubbleOutlineIcon sx={{ color: "#f9a825" }} />
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "#bf6f00", letterSpacing: 0.5, fontWeight: 700 }}
                      >
                        INQUIRY MESSAGE
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.75,
                        color: "#3e2723",
                        fontSize: 15,
                      }}
                    >
                      {viewing.description || "(No message provided)"}
                    </Typography>
                  </Paper>
                </Grid>

                {/* ---------- Meta cards ---------- */}
                <Grid item xs={12} md={6}>
                  <MetaCard
                    icon={<LinkIcon />}
                    color="#0097a7"
                    title="Submitted From"
                    primary={viewing.sourcePath || "/"}
                    secondary={viewing.siteKey ? `Site: ${viewing.siteKey}` : null}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <MetaCard
                    icon={<DevicesIcon />}
                    color="#5d4037"
                    title="Device / Network"
                    primary={viewing.ipAddress || "—"}
                    secondary={viewing.userAgent || ""}
                  />
                </Grid>

                {/* ---------- Status & notes ---------- */}
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      background: "#fff",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <NotesIcon sx={{ color: "#283593" }} />
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "#283593", letterSpacing: 0.5, fontWeight: 700 }}
                      >
                        ADMIN ACTIONS
                      </Typography>
                    </Box>
                    <Grid container spacing={2} alignItems="flex-start">
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" disabled={!update}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={viewStatus}
                            label="Status"
                            onChange={(e) => setViewStatus(e.target.value)}
                          >
                            {STATUSES.map((s) => (
                              <MenuItem key={s} value={s}>
                                <Chip
                                  label={s}
                                  size="small"
                                  sx={{
                                    mr: 1,
                                    bgcolor: STATUS_THEME[s]?.bg,
                                    color: STATUS_THEME[s]?.text,
                                    border: `1px solid ${STATUS_THEME[s]?.border}`,
                                    fontWeight: 600,
                                  }}
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <TextField
                          label="Internal admin notes"
                          value={viewNotes}
                          onChange={(e) => setViewNotes(e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          disabled={!update}
                          placeholder="Notes for your team (not sent to the customer)"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                background: "#fff",
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <Button
                onClick={() => setViewOpen(false)}
                disabled={savingView}
                variant="outlined"
              >
                Close
              </Button>
              {update && (
                <Button
                  variant="contained"
                  onClick={handleSaveStatus}
                  disabled={savingView}
                  sx={masterCategoryContainedButtonSx}
                >
                  {savingView ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ===== Delete Confirm ===== */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete Inquiry</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the inquiry from &quot;{toDelete?.fullName}&quot;?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}
