import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  Grid,
  Chip,
  Divider,
  Skeleton,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import LogoutIcon from "@mui/icons-material/Logout";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import GroupsIcon from "@mui/icons-material/Groups";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

const BRAND = {
  primary: "#6a11cb",
  accent: "#2575fc",
  ink: "#241b3a",
  inkSoft: "#6b6483",
  cream: "#f7f5fb",
  border: "#e7e2f3",
  bgGradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
};

const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" });
const fmtDateTime = (d) =>
  !d ? "—" : new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function InfoRow({ icon, label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Box sx={{ color: BRAND.primary, mt: 0.2 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: BRAND.inkSoft }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ color: BRAND.ink }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function PhotographyPortal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("photoPortalMobile");
    router.push("/photography-portal/login");
  };

  const loadList = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/photography-portal/login");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/PhotographyPortal/GetMyReservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const json = await res.json();
      const list = json.result ?? json.Result ?? [];
      setReservations(list);
      if (list.length === 1) {
        setSelectedId(list[0].id ?? list[0].Id);
      }
    } catch (e) {
      toast.error(e.message || "Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id) => {
    const token = localStorage.getItem("token");
    setDetailLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/PhotographyPortal/GetMyReservationDetail?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      const json = await res.json();
      const result = json.result ?? json.Result ?? {};
      setDetail(result.reservation ?? result.Reservation ?? null);
      setHistory(result.statusHistory ?? result.StatusHistory ?? []);
    } catch (e) {
      toast.error(e.message || "Failed to load reservation.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId != null) loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const showPicker = !selectedId && reservations.length > 1;

  return (
    <Box sx={{ minHeight: "100vh", background: BRAND.cream }}>
      <ToastContainer />
      <AppBar position="sticky" elevation={0} sx={{ background: BRAND.bgGradient }}>
        <Toolbar>
          {selectedId && reservations.length > 1 && (
            <IconButton color="inherit" onClick={() => setSelectedId(null)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <PhotoCameraIcon sx={{ mr: 1.2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Photography Portal
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout} sx={{ textTransform: "none" }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 4 } }}>
        {loading ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        ) : reservations.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: BRAND.ink }}>
              No reservations found
            </Typography>
            <Typography variant="body2" sx={{ color: BRAND.inkSoft }}>
              Please contact us if you believe this is a mistake.
            </Typography>
          </Paper>
        ) : showPicker ? (
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: BRAND.ink, mb: 1 }}>
              Select a reservation
            </Typography>
            <Typography variant="body2" sx={{ color: BRAND.inkSoft, mb: 2 }}>
              You have {reservations.length} reservations linked to this number.
            </Typography>
            <List>
              {reservations.map((r) => (
                <ListItemButton
                  key={r.id ?? r.Id}
                  onClick={() => setSelectedId(r.id ?? r.Id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: `1px solid ${BRAND.border}`,
                    "&:hover": { background: BRAND.cream },
                  }}
                >
                  <Avatar sx={{ background: BRAND.bgGradient, mr: 2 }}>
                    <EventIcon />
                  </Avatar>
                  <ListItemText
                    primary={
                      <Typography fontWeight={700} sx={{ color: BRAND.ink }}>
                        {r.coupleNames || r.cardNo}
                      </Typography>
                    }
                    secondary={`${r.cardNo} · ${fmtDate(r.eventDate)}${
                      r.currentStatusName ? " · " + r.currentStatusName : ""
                    }`}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        ) : detailLoading || !detail ? (
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        ) : (
          <Stack spacing={3}>
            <Paper sx={{ borderRadius: 3, overflow: "hidden" }} elevation={2}>
              <Box sx={{ background: BRAND.bgGradient, color: "#fff", p: 3 }}>
                <Typography variant="overline" sx={{ opacity: 0.85 }}>
                  {detail.cardNo}
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {detail.coupleNames}
                </Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    size="small"
                    label={detail.eventTypeName}
                    sx={{ background: "rgba(255,255,255,0.22)", color: "#fff", fontWeight: 600 }}
                  />
                  {detail.currentStatusName && (
                    <Chip
                      size="small"
                      icon={<CheckCircleIcon sx={{ color: "#fff !important" }} />}
                      label={detail.currentStatusName}
                      sx={{ background: "rgba(255,255,255,0.22)", color: "#fff", fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<EventIcon fontSize="small" />} label="Event Date" value={fmtDate(detail.eventDate)} />
                    <InfoRow icon={<EventIcon fontSize="small" />} label="Event Time" value={detail.eventTime} />
                    <InfoRow icon={<PlaceIcon fontSize="small" />} label="Reception Location" value={detail.receptionLocation} />
                    <InfoRow
                      icon={<PhotoCameraIcon fontSize="small" />}
                      label="Ceremony Type"
                      value={detail.ceremonyTypeName === "Other" ? detail.ceremonyTypeOther || "Other" : detail.ceremonyTypeName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoRow icon={<GroupsIcon fontSize="small" />} label="No. of Guests" value={detail.noOfGuests} />
                    <InfoRow icon={<FaceRetouchingNaturalIcon fontSize="small" />} label="Makeup Artist" value={detail.makeupArtist} />
                    <InfoRow icon={<GroupsIcon fontSize="small" />} label="Assigned Team" value={detail.assignedTeamName} />
                    <InfoRow
                      icon={<CameraAltIcon fontSize="small" />}
                      label="Photographers"
                      value={(detail.photographers || []).map((p) => p.photographerName).join(", ") || null}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            <Paper sx={{ borderRadius: 3, p: 3 }} elevation={2}>
              <Typography variant="h6" fontWeight={700} sx={{ color: BRAND.ink, mb: 2 }}>
                Status Timeline
              </Typography>
              {history.length === 0 ? (
                <Typography variant="body2" sx={{ color: BRAND.inkSoft }}>
                  No status updates yet.
                </Typography>
              ) : (
                <Box sx={{ position: "relative", pl: 1 }}>
                  {history.map((h, idx) => {
                    const isLast = idx === history.length - 1;
                    return (
                      <Stack key={h.id ?? idx} direction="row" spacing={2} sx={{ position: "relative" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: isLast ? BRAND.bgGradient : BRAND.border,
                              border: isLast ? "none" : `2px solid ${BRAND.border}`,
                              zIndex: 1,
                            }}
                          />
                          {idx !== history.length - 1 && (
                            <Box sx={{ width: 2, flex: 1, minHeight: 32, background: BRAND.border }} />
                          )}
                        </Box>
                        <Box sx={{ pb: 3 }}>
                          <Typography fontWeight={700} sx={{ color: isLast ? BRAND.primary : BRAND.ink }}>
                            {h.toStatusName || "Status updated"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: BRAND.inkSoft, display: "block" }}>
                            {fmtDateTime(h.changedOn)}
                          </Typography>
                          {h.remark && (
                            <Typography variant="body2" sx={{ color: BRAND.inkSoft, mt: 0.5 }}>
                              {h.remark}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    );
                  })}
                </Box>
              )}
            </Paper>

            {detail.remark && (
              <Paper sx={{ borderRadius: 3, p: 3 }} elevation={1}>
                <Typography variant="subtitle2" sx={{ color: BRAND.inkSoft, mb: 0.5 }}>
                  Note
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND.ink }}>
                  {detail.remark}
                </Typography>
              </Paper>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

PhotographyPortal.disableLayout = true;
