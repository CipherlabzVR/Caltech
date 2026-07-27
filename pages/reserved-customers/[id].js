import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
} from "@mui/material";
import {
  Save,
  ArrowBack,
  AddCircleOutline,
  DeleteOutline,
  EventNote,
  AccessTime,
  CreditCard,
  Person,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import BASE_URL from "Base/api";
import ReservationPhotosPanel from "@/components/reservation/ReservationPhotosPanel";

// Mirrors the DressingType / ReservationAppointmentType enums on the backend.
const DRESSING_TYPES = [
  { value: 1, label: "Bride" },
  { value: 2, label: "Maids" },
  { value: 3, label: "Touch Up" },
  { value: 4, label: "Touch Up 2" },
  { value: 5, label: "Going Away" },
  { value: 6, label: "Home Coming" },
];

const APPOINTMENT_TYPES = [
  { value: 1, label: "First" },
  { value: 2, label: "Show Saree" },
  { value: 3, label: "Fabric & Design" },
  { value: 4, label: "Measurement" },
  { value: 5, label: "Fiton" },
  { value: 6, label: "Trial" },
];

const toLocalInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
    dt.getHours()
  )}:${pad(dt.getMinutes())}`;
};

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

/**
 * Admin edit page for the Reserved Customers module.
 *
 * Per spec, only the four user-controlled fields are editable here:
 *   - General tab : Payment Code, Payment Date
 *   - Dressing Time tab
 *   - Appointments tab
 *
 * Everything else (general info + outfit window) is read-only here and is
 * filled by the customer through the customer portal.
 */
export default function ReservedCustomerEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);

  const [paymentCode, setPaymentCode] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [dressing, setDressing] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${BASE_URL}/ReservedCustomer/GetById?reservationId=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        const r = json?.result;
        if (!r?.reservation) throw new Error("Not found");
        setData(r);
        setPaymentCode(r.reservation.paymentCode || "");
        setPaymentDate(toDateInput(r.reservation.initialPaymentDate));
        setDressing(
          (r.dressingTimes || []).map((d) => ({
            id: d.id,
            dressingType: d.dressingType,
            startTime: toLocalInput(d.startTime),
            endTime: toLocalInput(d.endTime),
          }))
        );
        setAppointments(
          (r.appointments || []).map((a) => ({
            id: a.id,
            isAppointmentTypeChecked: !!a.isAppointmentTypeChecked,
            appointmentType: a.appointmentType,
            startDate: toLocalInput(a.startDate),
            remark: a.remark || "",
          }))
        );
      } catch (e) {
        toast.error(e.message || "Failed to load reservation");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/ReservedCustomer/AdminUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId: Number(id),
          paymentCode: paymentCode || null,
          paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
          dressingTimes: dressing.map((d) => ({
            id: d.id || null,
            dressingType: Number(d.dressingType) || null,
            startTime: d.startTime ? new Date(d.startTime).toISOString() : null,
            endTime: d.endTime ? new Date(d.endTime).toISOString() : null,
          })),
          appointments: appointments.map((a) => ({
            id: a.id || null,
            isAppointmentTypeChecked: !!a.isAppointmentTypeChecked,
            appointmentType: Number(a.appointmentType) || null,
            startDate: a.startDate ? new Date(a.startDate).toISOString() : null,
            remark: a.remark || null,
          })),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Save failed");
      toast.success("Saved");
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!data) return null;
  const r = data.reservation;
  const det = data.details || {};
  const media = data.media || data.Media || [];
  const customerName = r.customerName || "Reserved Customer";
  const initials = customerName.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  const ReadOnlyField = ({ label, value }) => (
    <TextField
      label={label}
      value={value ?? ""}
      fullWidth
      size="small"
      InputProps={{ readOnly: true }}
      sx={{ "& .MuiInputBase-input": { color: "text.secondary" } }}
    />
  );

  return (
    <>
      <ToastContainer />
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "white",
          boxShadow: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <IconButton onClick={() => router.back()} sx={{ color: "white" }}>
          <ArrowBack />
        </IconButton>
        <Avatar sx={{ bgcolor: "white", color: "#6366f1", fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Box flex={1}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {customerName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Reservation #{r.id} · {r.mobileNo || "—"} · Wedding: {r.reservationDate ? new Date(r.reservationDate).toDateString() : "—"}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Save />}
          onClick={save}
          disabled={saving}
          sx={{ color: "#6366f1", fontWeight: 600 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab icon={<CreditCard />} iconPosition="start" label="General (Payment)" />
          <Tab icon={<AccessTime />} iconPosition="start" label="Dressing Time" />
          <Tab icon={<EventNote />} iconPosition="start" label="Appointments" />
          <Tab icon={<Person />} iconPosition="start" label="Customer Info (read-only)" />
        </Tabs>

        {tab === 0 && (
          <Box p={3}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Only Payment Code and Payment Date are editable on this tab. The
              rest of the General window is filled by the customer.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Payment Code"
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Payment Date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Reference (read-only)</Divider>
              </Grid>
              <Grid item xs={12} md={4}>
                <ReadOnlyField label="Customer" value={r.customerName} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ReadOnlyField label="Mobile" value={r.mobileNo} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ReadOnlyField label="NIC" value={r.nic} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ReadOnlyField label="Total Amount" value={Number(r.totalAmount || 0).toLocaleString()} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ReadOnlyField label="Paid Amount" value={Number(r.paidAmount || 0).toLocaleString()} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ReadOnlyField label="Balance" value={Number(r.balanceAmount || 0).toLocaleString()} />
              </Grid>
            </Grid>
          </Box>
        )}

        {tab === 1 && (
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Dressing Time Slots
              </Typography>
              <Button
                size="small"
                startIcon={<AddCircleOutline />}
                onClick={() =>
                  setDressing((rows) => [
                    ...rows,
                    { id: null, dressingType: 1, startTime: "", endTime: "" },
                  ])
                }
              >
                Add Slot
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dressing.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" py={2}>
                        No dressing slots yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {dressing.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ minWidth: 180 }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={row.dressingType || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDressing((rows) =>
                              rows.map((r2, j) =>
                                j === i ? { ...r2, dressingType: v } : r2
                              )
                            );
                          }}
                        >
                          {DRESSING_TYPES.map((d) => (
                            <MenuItem key={d.value} value={d.value}>
                              {d.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="datetime-local"
                        value={row.startTime}
                        size="small"
                        onChange={(e) =>
                          setDressing((rows) =>
                            rows.map((r2, j) =>
                              j === i ? { ...r2, startTime: e.target.value } : r2
                            )
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="datetime-local"
                        value={row.endTime}
                        size="small"
                        onChange={(e) =>
                          setDressing((rows) =>
                            rows.map((r2, j) =>
                              j === i ? { ...r2, endTime: e.target.value } : r2
                            )
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove (will be deleted on save if it exists on server)">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setDressing((rows) => rows.filter((_, j) => j !== i))
                          }
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {tab === 2 && (
          <Box p={3}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Appointments
              </Typography>
              <Button
                size="small"
                startIcon={<AddCircleOutline />}
                onClick={() =>
                  setAppointments((rows) => [
                    ...rows,
                    {
                      id: null,
                      isAppointmentTypeChecked: true,
                      appointmentType: 1,
                      startDate: "",
                      remark: "",
                    },
                  ])
                }
              >
                Add Appointment
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Active</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" py={2}>
                        No appointments yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {appointments.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={row.isAppointmentTypeChecked}
                        onChange={(e) =>
                          setAppointments((rows) =>
                            rows.map((r2, j) =>
                              j === i
                                ? {
                                    ...r2,
                                    isAppointmentTypeChecked: e.target.checked,
                                  }
                                : r2
                            )
                          )
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={row.appointmentType || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAppointments((rows) =>
                              rows.map((r2, j) =>
                                j === i ? { ...r2, appointmentType: v } : r2
                              )
                            );
                          }}
                        >
                          {APPOINTMENT_TYPES.map((d) => (
                            <MenuItem key={d.value} value={d.value}>
                              {d.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="datetime-local"
                        value={row.startDate}
                        size="small"
                        onChange={(e) =>
                          setAppointments((rows) =>
                            rows.map((r2, j) =>
                              j === i ? { ...r2, startDate: e.target.value } : r2
                            )
                          )
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={row.remark}
                        onChange={(e) =>
                          setAppointments((rows) =>
                            rows.map((r2, j) =>
                              j === i ? { ...r2, remark: e.target.value } : r2
                            )
                          )
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setAppointments((rows) =>
                              rows.filter((_, j) => j !== i)
                            )
                          }
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {tab === 3 && (
          <Box p={3}>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              These fields are filled by the customer through the portal — shown
              here for reference only.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Groom Name" value={r.groomName} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Wedding Venue" value={det.weddingVenue} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Dressing Venue" value={det.dressingVenue} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Wedding Day Contact" value={det.weddingDayContactPerson} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Bride Outfit" value={det.wedOutfit} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Bride Outfit By" value={det.wedOutfitBy} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Groom Outfit" value={det.groomsOutfit} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Groom Outfit By" value={det.groomsOutfitBy} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Photographer" value={det.photographer} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ReadOnlyField label="Maids Count" value={det.maids} />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>Bride Photo (read-only)</Divider>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Photo uploaded by the bride through the customer portal.
                </Typography>
                <ReservationPhotosPanel
                  reservationId={Number(id)}
                  initialMedia={media}
                  readOnly
                  emptyMessage="The bride has not uploaded a photo yet."
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </>
  );
}
