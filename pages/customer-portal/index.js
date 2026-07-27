import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Stack,
  MenuItem,
  Switch,
  FormControlLabel,
  Skeleton,
  AppBar,
  Toolbar,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import {
  Save,
  Logout,
  Favorite,
  Checkroom,
  Person,
  LocationOn,
  ContactPhone,
  Spa,
  PhotoCamera,
  Groups,
  Diamond,
  Cake,
  Notes,
  Home,
  Celebration,
  Accessibility,
  AutoAwesome,
  AccessTime,
  EventNote,
  Menu as MenuIcon,
  Schedule,
  CheckCircleOutline,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import BASE_URL from "Base/api";
import ReservationPhotosPanel, {
  MAX_CLIENT_BRIDE_PHOTOS,
} from "@/components/reservation/ReservationPhotosPanel";

// Must match backend ReservationFunctionType enum used in AddReservation / UpdateReservation.
const PREFERRED_TIME = [
  { value: 1, label: "Morning" },
  { value: 2, label: "Evening" },
];
// Matches backend BridleType enum and staff UI (UpdateReservation / getBridal).
const BRIDAL_TYPES = [
  { value: 1, label: "Kandyan" },
  { value: 2, label: "Indian" },
  { value: 3, label: "Western" },
  { value: 4, label: "Hindu" },
];
// Matches backend Location enum and staff UI (UpdateReservation / getLocation).
const LOCATIONS = [
  { value: 1, label: "Studio" },
  { value: 2, label: "Away" },
  { value: 3, label: "Overseas" },
];
const FUNCTION_TYPES = [
  { value: 1, label: "Wedding" },
  { value: 2, label: "Home Coming" },
  { value: 3, label: "Wedding & Home Coming" },
  { value: 4, label: "Normal Dressing" },
  { value: 5, label: "Photo Shoot" },
  { value: 6, label: "Outfit Only" },
  { value: 7, label: "Engagement" },
];
const DRESSING_TYPE_LABEL = {
  1: "Bride",
  2: "Maids",
  3: "Touch Up",
  4: "Touch Up 2",
  5: "Going Away",
  6: "Home Coming",
};
const APPOINTMENT_TYPE_LABEL = {
  1: "First",
  2: "Show Saree",
  3: "Fabric & Design",
  4: "Measurement",
  5: "Fiton",
  6: "Trial",
};

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};
const fmtDateTime = (d) =>
  !d ? "—" : new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });

/** Empty for highlight / validation (0 is not empty). */
const isEmptyVal = (v) => v === "" || v === null || v === undefined;

/** Safe numeric for MUI Select (invalid → ""). */
const toSelectNum = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

const toNullableInt = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Studio brand palette — premium gold (headers, CTAs, nav) with warm neutrals.
const BRAND = {
  gold: "#C5A028",
  goldDark: "#9E7E1A",
  goldLight: "#DCBF4F",
  goldSoft: "#F2E8C9",
  /** Selected sidebar item — subtle light gold wash */
  navActiveFill: "#F3E6BE",
  /** Sidebar column (nav + logout) — slight warm gold vs main content cream */
  sidebarBg: "#FAF4E6",
  cream: "#FAF7F0",
  creamWarm: "#F7F1E4",
  ink: "#2B2618",
  inkSoft: "#5C5340",
  border: "#E8DFC8",
  borderSoft: "#F3ECD8",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    background: BRAND.cream,
    transition: "all .2s",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.goldLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.gold, borderWidth: "2px" },
    "&.Mui-focused": { background: "#fff" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: BRAND.gold },
};

/** Merge base input styles with optional “please fill this” highlight without losing focus rings. */
const mergeHighlightedInputSx = (highlight, extra = {}) => {
  const merged = { ...inputSx, ...extra };
  const inputRoot = {
    ...inputSx["& .MuiOutlinedInput-root"],
    ...(extra["& .MuiOutlinedInput-root"] || {}),
  };
  if (!highlight) {
    return {
      ...merged,
      "& .MuiOutlinedInput-root": inputRoot,
    };
  }
  return {
    ...merged,
    "& .MuiOutlinedInput-root": {
      ...inputRoot,
      background: "rgba(255, 248, 225, 0.75)",
      "& fieldset": { borderColor: BRAND.goldLight, borderWidth: "2px" },
      "&:hover fieldset": { borderColor: BRAND.gold },
    },
  };
};

// Module-scope helpers — defining inside the page would remount inputs on every keystroke.
const TF = ({ highlight, sx, ...props }) => (
  <TextField fullWidth size="small" sx={mergeHighlightedInputSx(highlight, sx)} {...props} />
);
const SF = ({ label, value, onChange, options, highlight }) => {
  const allowed = new Set(options.map((o) => o.value));
  const n = toSelectNum(value);
  const selectValue = n !== "" && allowed.has(n) ? n : "";
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={selectValue}
      onChange={(e) => {
        const v = e.target.value;
        onChange({ target: { value: v === "" ? "" : Number(v) } });
      }}
      sx={mergeHighlightedInputSx(highlight)}
      InputLabelProps={{ shrink: true }}
      SelectProps={{
        displayEmpty: true,
        renderValue: (selected) => {
          if (selected === "" || selected === undefined) {
            return (
              <Typography component="span" variant="body2" sx={{ color: BRAND.inkSoft }}>
                Select…
              </Typography>
            );
          }
          return options.find((o) => o.value === selected)?.label ?? "";
        },
      }}
    >
      <MenuItem value="">
        <em>—</em>
      </MenuItem>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

// Flat pastel fills for section icons — harmonized with premium gold.
const SECTION_GRADIENTS = {
  pink:    "#E8D4A8",
  purple:  "#E5D4A0",
  teal:    "#D4DCC0",
  amber:   "#EDD9A0",
  rose:    "#E8CFC4",
  emerald: "#C8D4B0",
};

function SectionCard({ icon, title, subtitle, color = "purple", children }) {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${BRAND.border}`,
        boxShadow: "0 2px 12px rgba(197,160,40,0.12)",
        overflow: "hidden",
        transition: "transform .15s, box-shadow .15s",
        "&:hover": { boxShadow: "0 6px 24px rgba(197,160,40,0.2)" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2.5,
          background: BRAND.cream,
          borderBottom: `1px solid ${BRAND.borderSoft}`,
        }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            background: SECTION_GRADIENTS[color],
            color: BRAND.ink,
            boxShadow: "none",
          }}
        >
          {icon}
        </Avatar>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
      </Box>
      <CardContent sx={{ p: 3 }}>{children}</CardContent>
    </Card>
  );
}

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { id: "general", label: "My Details", icon: <Person />, color: BRAND.gold },
  { id: "outfit", label: "Outfit & Retinue", icon: <Checkroom />, color: BRAND.goldDark },
  { id: "photos", label: "Bride Photo", icon: <PhotoCamera />, color: BRAND.gold },
  { id: "dressing", label: "Dressing Schedule", icon: <AccessTime />, color: BRAND.gold },
  { id: "appointments", label: "Appointments", icon: <EventNote />, color: BRAND.goldDark },
];

export default function CustomerPortal() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width:900px)");
  const [activeView, setActiveView] = useState("general");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [r, setR] = useState({});
  const [det, setDet] = useState({});
  const [dressing, setDressing] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reservationId, setReservationId] = useState(null);
  const [media, setMedia] = useState([]);
  const mainScrollRef = useRef(null);

  const scrollMainToTop = () => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/ReservedCustomer/MyReservation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.statusCode != null && Number(json.statusCode) !== 200) {
        throw new Error(json.message || "Failed to load reservation");
      }
      const data = json?.result;
      if (!data?.reservation) throw new Error("No reservation found");
      setReservationId(data.reservation.id ?? data.reservation.Id ?? null);
      setMedia(data.media || data.Media || []);
      setR({
        customerName: data.reservation.customerName ?? "",
        groomName: data.reservation.groomName ?? "",
        nic: data.reservation.nic ?? "",
        mobileNo: data.reservation.mobileNo ?? "",
        emergencyContactNo: data.reservation.emergencyContactNo ?? "",
        reservationDate: toDateInput(data.reservation.reservationDate),
        preferdTime: toSelectNum(data.reservation.preferdTime),
        bridleType: toSelectNum(data.reservation.bridleType),
        location: toSelectNum(data.reservation.location),
        reservationFunctionType: toSelectNum(data.reservation.reservationFunctionType),
        homeComingDate: toDateInput(data.reservation.homeComingDate ?? data.details?.homeComingDate),
        homeComingPreferredTime: toSelectNum(data.reservation.homeComingPreferredTime),
        homeComingBridleType: toSelectNum(data.reservation.homeComingBridleType),
        homeComingLocation: toSelectNum(data.reservation.homeComingLocation),
      });
      setDet({
        weddingVenue: data.details?.weddingVenue || "",
        dressingVenue: data.details?.dressingVenue || "",
        addressLine1: data.details?.addressLine1 || "",
        addressLine2: data.details?.addressLine2 || "",
        addressLine3: data.details?.addressLine3 || "",
        weddingDayContactPerson: data.details?.weddingDayContactPerson || "",
        weddingDayContactPersonNo: data.details?.weddingDayContactPersonNo || "",
        isGoingAway: !!data.details?.isGoingAway,
        isHomeComing: !!data.details?.isHomeComing,
        homeComingVenue: data.details?.homeComingVenue || "",
        homeComingOutfit: data.details?.homeComingOutfit || "",
        homeComingOutfitBy: data.details?.homeComingOutfitBy || "",
        goingAwayDressingVenue: data.details?.goingAwayDressingVenue || "",
        goingAwayOutfit: data.details?.goingAwayOutfit || "",
        goingAwayOutfitBy: data.details?.goingAwayOutfitBy || "",
        remark: data.details?.remark || "",
        groomsOutfit: data.details?.groomsOutfit || "",
        groomsOutfitBy: data.details?.groomsOutfitBy || "",
        wedOutfit: data.details?.wedOutfit || "",
        wedOutfitBy: data.details?.wedOutfitBy || "",
        fgOutfit: data.details?.fgOutfit || "",
        fgOutfitBy: data.details?.fgOutfitBy || "",
        maidsOutfitBy: data.details?.maidsOutfitBy || "",
        gaOutfitBy: data.details?.gaOutfitBy || "",
        hcOutfitBy: data.details?.hcOutfitBy || "",
        bouquetsBy: data.details?.bouquetsBy || "",
        photographer: data.details?.photographer || "",
        maids: data.details?.maids ?? "",
        flowerGirls: data.details?.flowerGirls ?? "",
        littleMaids: data.details?.littleMaids ?? "",
        pupilMaids: data.details?.pupilMaids ?? "",
      });
      setDressing(
        (data.dressingTimes || []).slice().sort((a, b) =>
          new Date(a.startTime || 0) - new Date(b.startTime || 0)
        )
      );
      setAppointments(
        (data.appointments || []).slice().sort((a, b) =>
          new Date(a.startDate || 0) - new Date(b.startDate || 0)
        )
      );
    } catch (e) {
      toast.error(e.message || "Failed to load reservation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    scrollMainToTop();
  }, [activeView]);

  const handleR = (k) => (e) =>
    setR((prev) => ({ ...prev, [k]: e?.target ? e.target.value : e }));
  const handleD = (k) => (e) =>
    setDet((prev) => ({ ...prev, [k]: e?.target ? e.target.value : e }));

  const progress = useMemo(() => {
    const general = [
      r.customerName, r.groomName, r.nic, r.mobileNo, r.emergencyContactNo,
      r.reservationDate, r.preferdTime, r.bridleType, r.location, r.reservationFunctionType,
      det.weddingVenue, det.dressingVenue, det.addressLine1,
      det.weddingDayContactPerson, det.weddingDayContactPersonNo,
    ];
    const outfit = [
      det.wedOutfit, det.wedOutfitBy, det.groomsOutfit, det.groomsOutfitBy,
      det.fgOutfit, det.fgOutfitBy, det.maidsOutfitBy, det.bouquetsBy, det.photographer,
      det.maids, det.flowerGirls,
    ];
    const all = [...general, ...outfit];
    const filled = all.filter((v) => v !== "" && v !== null && v !== undefined).length;
    return Math.round((filled / all.length) * 100);
  }, [r, det]);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...r,
        ...det,
        reservationDate: r.reservationDate ? new Date(r.reservationDate).toISOString() : null,
        homeComingDate: r.homeComingDate ? new Date(r.homeComingDate).toISOString() : null,
        preferdTime: toNullableInt(r.preferdTime),
        bridleType: toNullableInt(r.bridleType),
        location: toNullableInt(r.location),
        reservationFunctionType: toNullableInt(r.reservationFunctionType),
        homeComingPreferredTime: toNullableInt(r.homeComingPreferredTime),
        homeComingBridleType: toNullableInt(r.homeComingBridleType),
        homeComingLocation: toNullableInt(r.homeComingLocation),
        maids: det.maids === "" ? null : Number(det.maids),
        flowerGirls: det.flowerGirls === "" ? null : Number(det.flowerGirls),
        littleMaids: det.littleMaids === "" ? null : Number(det.littleMaids),
        pupilMaids: det.pupilMaids === "" ? null : Number(det.pupilMaids),
      };
      const res = await fetch(`${BASE_URL}/ReservedCustomer/SelfUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Save failed");
      if (j.statusCode != null && Number(j.statusCode) !== 200) {
        throw new Error(j?.message || "Save failed");
      }
      toast.success(j?.message || "Saved! Your details are now visible to the studio team.");
      // Re-pull to surface any server-side normalization + refresh schedule data.
      await loadData();
      scrollMainToTop();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push("/authentication/sign-in");
  };

  const initials = (r.customerName || "C")
    .split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  const navigateTo = (id) => {
    setActiveView(id);
    if (!isDesktop) setMobileOpen(false);
    requestAnimationFrame(scrollMainToTop);
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        background: BRAND.sidebarBg,
        borderRight: `1px solid ${BRAND.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 3,
          background: BRAND.gold,
          color: "white",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{ width: 52, height: 52, bgcolor: "white", color: BRAND.ink, fontWeight: 700 }}
          >
            {initials}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography fontWeight={700} noWrap>
              {r.customerName || "Customer"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }} noWrap>
              {r.mobileNo || "—"}
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Profile completion</Typography>
            <Typography variant="caption" fontWeight={700}>{progress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 5,
              backgroundColor: "rgba(255,255,255,0.25)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: BRAND.ink,
                borderRadius: 5,
              },
            }}
          />
        </Box>
      </Box>

      <List sx={{ p: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => navigateTo(item.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 1.5,
                py: 1.2,
                transition: "all .15s",
                background: active ? BRAND.navActiveFill : "transparent",
                borderLeft: active ? `4px solid ${item.color}` : "4px solid transparent",
                "&:hover": {
                  background: active ? BRAND.navActiveFill : "rgba(197, 160, 40, 0.08)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: active ? item.color : BRAND.inkSoft }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  color: active ? BRAND.ink : BRAND.inkSoft,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          startIcon={<Logout />}
          onClick={logout}
          sx={{
            justifyContent: "flex-start",
            color: BRAND.inkSoft,
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { background: "rgba(197, 160, 40, 0.1)" },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: BRAND.cream }}>
      <ToastContainer />

      {/* Sidebar */}
      {isDesktop ? (
        <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: DRAWER_WIDTH,
              height: "100vh",
            }}
          >
            {drawerContent}
          </Box>
        </Box>
      ) : (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            zIndex: 1100,
            flexShrink: 0,
            background: "white",
            color: BRAND.ink,
            borderBottom: `1px solid ${BRAND.border}`,
          }}
        >
          <Toolbar>
            {!isDesktop && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Favorite sx={{ mr: 1.2, color: BRAND.gold }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              {NAV_ITEMS.find((n) => n.id === activeView)?.label || "My Reservation"}
            </Typography>
            {(activeView === "general" || activeView === "outfit") && (
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={save}
                disabled={saving || loading}
                sx={{
                  background: BRAND.gold,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  boxShadow: "none",
                  "&:hover": { background: BRAND.goldDark },
                }}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box
          ref={mainScrollRef}
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
            {loading ? (
              <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
            ) : (
              <>
              {activeView === "general" && (
                <>
                  <Typography variant="caption" sx={{ display: "block", mb: 2, color: BRAND.inkSoft }}>
                    A warm highlight means that field is still empty — please add your details. Values from the studio (pencil note) show here and stay editable.
                  </Typography>
                  <SectionCard icon={<Person />} color="purple" title="Personal Details" subtitle="Names and contact information">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TF label="Bride / Customer Name" value={r.customerName} onChange={handleR("customerName")} highlight={isEmptyVal(r.customerName)} /></Grid>
                      <Grid item xs={12} md={6}><TF label="Groom Name" value={r.groomName} onChange={handleR("groomName")} highlight={isEmptyVal(r.groomName)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="NIC / Passport" value={r.nic} onChange={handleR("nic")} highlight={isEmptyVal(r.nic)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Mobile No" value={r.mobileNo} onChange={handleR("mobileNo")} highlight={isEmptyVal(r.mobileNo)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Emergency Contact" value={r.emergencyContactNo} onChange={handleR("emergencyContactNo")} highlight={isEmptyVal(r.emergencyContactNo)} /></Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard icon={<Cake />} color="pink" title="Wedding Details" subtitle="Tell us about the big day">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}><TF label="Wedding Date" type="date" value={r.reservationDate} onChange={handleR("reservationDate")} InputLabelProps={{ shrink: true }} highlight={isEmptyVal(r.reservationDate)} /></Grid>
                      <Grid item xs={12} md={4}><SF label="Event Type" value={r.reservationFunctionType} onChange={handleR("reservationFunctionType")} options={FUNCTION_TYPES} highlight={isEmptyVal(r.reservationFunctionType)} /></Grid>
                      <Grid item xs={12} md={4}><SF label="Preferred Time" value={r.preferdTime} onChange={handleR("preferdTime")} options={PREFERRED_TIME} highlight={isEmptyVal(r.preferdTime)} /></Grid>
                      <Grid item xs={12} md={6}><SF label="Bridal Type" value={r.bridleType} onChange={handleR("bridleType")} options={BRIDAL_TYPES} highlight={isEmptyVal(r.bridleType)} /></Grid>
                      <Grid item xs={12} md={6}><SF label="Location" value={r.location} onChange={handleR("location")} options={LOCATIONS} highlight={isEmptyVal(r.location)} /></Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard icon={<LocationOn />} color="teal" title="Venues & Address" subtitle="Where the celebrations will take place">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TF label="Wedding Venue" value={det.weddingVenue} onChange={handleD("weddingVenue")} highlight={isEmptyVal(det.weddingVenue)} /></Grid>
                      <Grid item xs={12} md={6}><TF label="Dressing Venue" value={det.dressingVenue} onChange={handleD("dressingVenue")} highlight={isEmptyVal(det.dressingVenue)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Address Line 1" value={det.addressLine1} onChange={handleD("addressLine1")} highlight={isEmptyVal(det.addressLine1)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Address Line 2" value={det.addressLine2} onChange={handleD("addressLine2")} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Address Line 3" value={det.addressLine3} onChange={handleD("addressLine3")} /></Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard icon={<ContactPhone />} color="amber" title="Wedding-Day Contact" subtitle="Who should the studio call on the day?">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TF label="Contact Person" value={det.weddingDayContactPerson} onChange={handleD("weddingDayContactPerson")} highlight={isEmptyVal(det.weddingDayContactPerson)} /></Grid>
                      <Grid item xs={12} md={6}><TF label="Contact Person No" value={det.weddingDayContactPersonNo} onChange={handleD("weddingDayContactPersonNo")} highlight={isEmptyVal(det.weddingDayContactPersonNo)} /></Grid>
                    </Grid>
                  </SectionCard>

                  <SectionCard icon={<Celebration />} color="rose" title="Going Away & Home Coming" subtitle="Both events live here — toggle whichever apply.">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, background: det.isGoingAway ? BRAND.goldSoft : BRAND.cream, border: "1px solid", borderColor: det.isGoingAway ? BRAND.gold : BRAND.border, transition: "all .2s" }}>
                          <FormControlLabel control={<Switch checked={det.isGoingAway} onChange={(e) => handleD("isGoingAway")(e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: BRAND.gold }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: BRAND.goldDark } }} />} label={<Stack direction="row" alignItems="center" spacing={1}><Celebration fontSize="small" sx={{ color: BRAND.goldDark }} /><Typography fontWeight={600} sx={{ color: BRAND.ink }}>Going Away</Typography></Stack>} />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, background: det.isHomeComing ? BRAND.goldSoft : BRAND.cream, border: "1px solid", borderColor: det.isHomeComing ? BRAND.goldDark : BRAND.border, transition: "all .2s" }}>
                          <FormControlLabel control={<Switch checked={det.isHomeComing} onChange={(e) => handleD("isHomeComing")(e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: BRAND.goldDark }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: BRAND.ink } }} />} label={<Stack direction="row" alignItems="center" spacing={1}><Home fontSize="small" sx={{ color: BRAND.goldDark }} /><Typography fontWeight={600} sx={{ color: BRAND.ink }}>Home Coming</Typography></Stack>} />
                        </Paper>
                      </Grid>

                      {det.isGoingAway && (
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${BRAND.border}`, background: BRAND.cream }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                              <Celebration fontSize="small" sx={{ color: BRAND.goldDark }} />
                              <Typography fontWeight={700} sx={{ color: BRAND.ink }}>Going Away details</Typography>
                            </Stack>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}><TF label="Going Away Dressing Venue" value={det.goingAwayDressingVenue} onChange={handleD("goingAwayDressingVenue")} highlight={isEmptyVal(det.goingAwayDressingVenue)} /></Grid>
                              <Grid item xs={12} md={4}><TF label="Going Away Outfit" value={det.goingAwayOutfit} onChange={handleD("goingAwayOutfit")} highlight={isEmptyVal(det.goingAwayOutfit)} /></Grid>
                              <Grid item xs={12} md={4}><TF label="Going Away Outfit By" value={det.goingAwayOutfitBy} onChange={handleD("goingAwayOutfitBy")} highlight={isEmptyVal(det.goingAwayOutfitBy)} /></Grid>
                              <Grid item xs={12} md={6}><TF label="G/A Outfit By (studio)" value={det.gaOutfitBy} onChange={handleD("gaOutfitBy")} highlight={isEmptyVal(det.gaOutfitBy)} /></Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      )}

                      {det.isHomeComing && (
                        <Grid item xs={12}>
                          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${BRAND.border}`, background: BRAND.cream }}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                              <Home fontSize="small" sx={{ color: BRAND.goldDark }} />
                              <Typography fontWeight={700} sx={{ color: BRAND.ink }}>Home Coming details</Typography>
                            </Stack>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}><TF label="Home Coming Date" type="date" value={r.homeComingDate} onChange={handleR("homeComingDate")} InputLabelProps={{ shrink: true }} highlight={isEmptyVal(r.homeComingDate)} /></Grid>
                              <Grid item xs={12} md={4}><TF label="Home Coming Venue" value={det.homeComingVenue} onChange={handleD("homeComingVenue")} highlight={isEmptyVal(det.homeComingVenue)} /></Grid>
                              <Grid item xs={12} md={4}><TF label="Home Coming Outfit" value={det.homeComingOutfit} onChange={handleD("homeComingOutfit")} highlight={isEmptyVal(det.homeComingOutfit)} /></Grid>
                              <Grid item xs={12} md={4}><TF label="Home Coming Outfit By" value={det.homeComingOutfitBy} onChange={handleD("homeComingOutfitBy")} highlight={isEmptyVal(det.homeComingOutfitBy)} /></Grid>
                              <Grid item xs={12} md={4}><TF label="H/C Outfit By (studio)" value={det.hcOutfitBy} onChange={handleD("hcOutfitBy")} highlight={isEmptyVal(det.hcOutfitBy)} /></Grid>
                              <Grid item xs={12} md={4}><SF label="HC Preferred Time" value={r.homeComingPreferredTime} onChange={handleR("homeComingPreferredTime")} options={PREFERRED_TIME} highlight={isEmptyVal(r.homeComingPreferredTime)} /></Grid>
                              <Grid item xs={12} md={4}><SF label="HC Bridal Type" value={r.homeComingBridleType} onChange={handleR("homeComingBridleType")} options={BRIDAL_TYPES} highlight={isEmptyVal(r.homeComingBridleType)} /></Grid>
                              <Grid item xs={12} md={4}><SF label="HC Location" value={r.homeComingLocation} onChange={handleR("homeComingLocation")} options={LOCATIONS} highlight={isEmptyVal(r.homeComingLocation)} /></Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </SectionCard>

                  <SectionCard icon={<Notes />} color="emerald" title="Anything else we should know?" subtitle="Optional notes for the studio team">
                    <TF label="Remark" value={det.remark} onChange={handleD("remark")} multiline minRows={3} />
                  </SectionCard>
                </>
              )}

              {activeView === "outfit" && (
                <>
                  <Typography variant="caption" sx={{ display: "block", mb: 2, color: BRAND.inkSoft }}>
                    Highlighted fields are still empty — share outfit and retinue details when you have them.
                  </Typography>
                  <SectionCard icon={<Diamond />} color="purple" title="Bride Outfit" subtitle="The dress, designer, and details">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TF label="Bride Outfit" value={det.wedOutfit} onChange={handleD("wedOutfit")} highlight={isEmptyVal(det.wedOutfit)} /></Grid>
                      <Grid item xs={12} md={6}><TF label="Bride Outfit By" value={det.wedOutfitBy} onChange={handleD("wedOutfitBy")} highlight={isEmptyVal(det.wedOutfitBy)} /></Grid>
                    </Grid>
                  </SectionCard>
                  <SectionCard icon={<Spa />} color="pink" title="Groom Outfit" subtitle="The groom's attire details">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TF label="Groom Outfit" value={det.groomsOutfit} onChange={handleD("groomsOutfit")} highlight={isEmptyVal(det.groomsOutfit)} /></Grid>
                      <Grid item xs={12} md={6}><TF label="Groom Outfit By" value={det.groomsOutfitBy} onChange={handleD("groomsOutfitBy")} highlight={isEmptyVal(det.groomsOutfitBy)} /></Grid>
                    </Grid>
                  </SectionCard>
                  <SectionCard icon={<Accessibility />} color="teal" title="Retinue Outfits" subtitle="Flower girls and maids">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}><TF label="Flower Girl Outfit" value={det.fgOutfit} onChange={handleD("fgOutfit")} highlight={isEmptyVal(det.fgOutfit)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Flower Girl Outfit By" value={det.fgOutfitBy} onChange={handleD("fgOutfitBy")} highlight={isEmptyVal(det.fgOutfitBy)} /></Grid>
                      <Grid item xs={12} md={4}><TF label="Maids Outfit By" value={det.maidsOutfitBy} onChange={handleD("maidsOutfitBy")} highlight={isEmptyVal(det.maidsOutfitBy)} /></Grid>
                    </Grid>
                  </SectionCard>
                  <SectionCard icon={<PhotoCamera />} color="amber" title="Décor & Photography">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}><TF label="Bouquets By" value={det.bouquetsBy} onChange={handleD("bouquetsBy")} highlight={isEmptyVal(det.bouquetsBy)} /></Grid>
                      <Grid item xs={12} md={6}><TF label="Photographer" value={det.photographer} onChange={handleD("photographer")} highlight={isEmptyVal(det.photographer)} /></Grid>
                    </Grid>
                  </SectionCard>
                  <SectionCard icon={<Groups />} color="rose" title="Retinue Counts" subtitle="How many people in the bridal party?">
                    <Grid container spacing={2}>
                      {[
                        { key: "maids", label: "Maids" },
                        { key: "flowerGirls", label: "Flower Girls" },
                        { key: "littleMaids", label: "Little Maids" },
                        { key: "pupilMaids", label: "Pupil Maids" },
                      ].map((f) => (
                        <Grid key={f.key} item xs={6} md={3}>
                          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${BRAND.border}`, background: BRAND.creamWarm, textAlign: "center" }}>
                            <Typography variant="caption" sx={{ display: "block", mb: 1, color: BRAND.inkSoft }}>{f.label}</Typography>
                            <TF
                              type="number"
                              value={det[f.key]}
                              onChange={handleD(f.key)}
                              inputProps={{ min: 0, style: { textAlign: "center", fontSize: 20, fontWeight: 700, color: BRAND.gold } }}
                              highlight={isEmptyVal(det[f.key])}
                              sx={{ width: 90, "& .MuiOutlinedInput-root": { ...inputSx["& .MuiOutlinedInput-root"], background: "white" } }}
                            />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </SectionCard>
                </>
              )}

              {activeView === "photos" && (
                <SectionCard
                  icon={<PhotoCamera />}
                  color="amber"
                  title="Bride Photo"
                  subtitle="Upload a photo of the bride for the studio team"
                >
                  <ReservationPhotosPanel
                    reservationId={reservationId}
                    initialMedia={media}
                    maxPhotos={MAX_CLIENT_BRIDE_PHOTOS}
                    onMediaChange={setMedia}
                    emptyMessage="No bride photo uploaded yet."
                  />
                </SectionCard>
              )}

              {activeView === "dressing" && (
                <SectionCard icon={<AccessTime />} color="teal" title="Your Dressing Schedule" subtitle="Times set by the studio team. Read-only.">
                  {dressing.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4, color: BRAND.inkSoft }}>
                      <Schedule sx={{ fontSize: 56, color: BRAND.goldLight, mb: 1 }} />
                      <Typography>The studio hasn't published your dressing schedule yet.</Typography>
                      <Typography variant="caption">You'll see it here once the team adds it.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {dressing.map((d) => (
                        <Paper
                          key={d.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${BRAND.border}`,
                            background: BRAND.creamWarm,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Avatar sx={{ background: SECTION_GRADIENTS.teal, width: 44, height: 44 }}>
                            <AccessTime />
                          </Avatar>
                          <Box flex={1}>
                            <Typography fontWeight={700} sx={{ color: BRAND.ink }}>
                              {DRESSING_TYPE_LABEL[d.dressingType] || `Type ${d.dressingType}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND.inkSoft }}>
                              {fmtDateTime(d.startTime)} → {fmtDateTime(d.endTime)}
                            </Typography>
                          </Box>
                          <Chip size="small" variant="outlined" label="Scheduled" sx={{ borderColor: BRAND.gold, color: BRAND.goldDark }} />
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </SectionCard>
              )}

              {activeView === "appointments" && (
                <SectionCard icon={<EventNote />} color="amber" title="Your Appointments" subtitle="Visits to the studio. Read-only.">
                  {appointments.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4, color: BRAND.inkSoft }}>
                      <EventNote sx={{ fontSize: 56, color: BRAND.goldLight, mb: 1 }} />
                      <Typography>No appointments scheduled yet.</Typography>
                      <Typography variant="caption">The studio will publish them here.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {appointments.map((a) => {
                        const done = !a.isAppointmentTypeChecked;
                        return (
                          <Paper
                            key={a.id}
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: done ? BRAND.borderSoft : BRAND.gold,
                              background: done
                                ? BRAND.cream
                                : BRAND.goldSoft,
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              opacity: done ? 0.7 : 1,
                            }}
                          >
                            <Avatar sx={{ background: SECTION_GRADIENTS.amber, width: 44, height: 44 }}>
                              <EventNote />
                            </Avatar>
                            <Box flex={1}>
                              <Typography fontWeight={700} sx={{ color: BRAND.ink }}>
                                {APPOINTMENT_TYPE_LABEL[a.appointmentType] || `Type ${a.appointmentType}`}
                              </Typography>
                              <Typography variant="body2" sx={{ color: BRAND.inkSoft }}>
                                {fmtDate(a.startDate)}
                              </Typography>
                              {a.remark && (
                                <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: BRAND.inkSoft }}>
                                  {a.remark}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              size="small"
                              icon={done ? <CheckCircleOutline /> : <RadioButtonUnchecked />}
                              label={done ? "Past" : "Upcoming"}
                              variant={done ? "outlined" : "filled"}
                              sx={done
                                ? { borderColor: BRAND.border, color: BRAND.inkSoft }
                                : { background: BRAND.gold, color: "white", "& .MuiChip-icon": { color: "white" } }
                              }
                            />
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </SectionCard>
              )}
            </>
          )}
          </Box>
        </Box>

        {!loading && (
          <Paper
            component="footer"
            elevation={6}
            square
            sx={{
              flexShrink: 0,
              py: 2,
              px: { xs: 2, md: 3 },
              borderTop: `1px solid ${BRAND.border}`,
              background: "#fff",
            }}
          >
            <Box
              sx={{
                maxWidth: 1100,
                mx: "auto",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="body2" sx={{ color: BRAND.inkSoft, maxWidth: 560 }}>
                You can open Dressing Schedule or Appointments before saving — your answers stay on this device until you save.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Save />}
                onClick={save}
                disabled={saving}
                sx={{
                  background: BRAND.gold,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  boxShadow: "none",
                  flexShrink: 0,
                  "&:hover": { background: BRAND.goldDark },
                }}
              >
                {saving ? "Saving…" : "Save my details"}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

CustomerPortal.disableLayout = true;
