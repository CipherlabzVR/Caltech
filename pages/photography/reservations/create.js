import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Radio,
  Select,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { getEventTimeSelectOptions, normalizeEventTime } from "@/components/Photography/eventTimeOptions";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "96vw", md: "94vw" },
  maxWidth: 1100,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 1.5, md: 2 },
  maxHeight: "92vh",
  overflowY: "auto",
};

const CEREMONY_TYPES = [
  { value: 1, label: "Poruwa" },
  { value: 2, label: "Church" },
  { value: 3, label: "Other" },
];

const EVENT_SESSIONS = ["Morning", "Evening"];

const validationSchema = Yup.object().shape({
  CoupleNames: Yup.string().required("Couple / client name is required"),
  Events: Yup.array()
    .min(1, "At least one event is required")
    .of(
      Yup.object({
        EventDate: Yup.string().required("Date is required"),
        EventSession: Yup.string()
          .oneOf(EVENT_SESSIONS, "Session is required")
          .required("Session is required"),
      })
    ),
});

const normalizeDateQuery = (value) => {
  if (!value) return "";
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const createEmptyEvent = (eventTypes, isMain = false) => ({
  id: Date.now() + Math.random(),
  EventType: eventTypes[0]?.id ?? 1,
  EventDate: "",
  EventTime: "",
  EventSession: "",
  Location: "",
  IsMainEvent: isMain,
});

function EventRow({ event, index, eventTypes, usedTypes, onUpdate, onRemove, onSetMain, canRemove }) {
  const availableTypes = (eventTypes || []).filter(
    (t) => t.id === event.EventType || !usedTypes.includes(t.id)
  );

  return (
    <Box sx={{ border: "1px solid", borderColor: event.IsMainEvent ? "primary.main" : "divider", borderRadius: 1, p: { xs: 1, md: 1.25 }, mb: 1, bgcolor: event.IsMainEvent ? "action.selected" : "transparent" }}>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          alignItems: "end",
          gridTemplateColumns: {
            xs: "auto 1fr auto",
            sm: "auto 1fr 1fr 1fr",
            md: "auto minmax(0,1.4fr) minmax(132px,1fr) minmax(110px,0.9fr) minmax(128px,0.95fr) auto",
          },
          gridTemplateAreas: {
            xs: `"radio type del" "date date date" "time time session" "loc loc loc"`,
            sm: `"radio type type type" "date time session del" "loc loc loc loc"`,
            md: `"radio type date time session del" "loc loc loc loc loc loc"`,
          },
        }}
      >
        <Box sx={{ gridArea: "radio" }}>
          <Radio
            checked={event.IsMainEvent}
            onChange={() => onSetMain(event.id)}
            size="small"
            title="Set as main event"
          />
        </Box>
        <Box sx={{ gridArea: "type", minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            Event Type {event.IsMainEvent && <span style={{ color: "#1976d2" }}>(Main)</span>}
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={event.EventType}
            onChange={(e) => onUpdate(event.id, "EventType", Number(e.target.value))}
          >
            {availableTypes.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ gridArea: "date", minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Date *</Typography>
          <TextField
            fullWidth
            type="date"
            size="small"
            value={event.EventDate}
            onChange={(e) => onUpdate(event.id, "EventDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!event.EventDate}
          />
        </Box>
        <Box sx={{ gridArea: "time", minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Time</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={normalizeEventTime(event.EventTime) || ""}
            onChange={(e) => onUpdate(event.id, "EventTime", e.target.value)}
            SelectProps={{ displayEmpty: true }}
          >
            <MenuItem value="">
              <em>Select time</em>
            </MenuItem>
            {getEventTimeSelectOptions(event.EventTime).map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ gridArea: "session", minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Session *</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={event.EventSession || ""}
            onChange={(e) => onUpdate(event.id, "EventSession", e.target.value)}
            error={!event.EventSession}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => v || "Select session",
            }}
          >
            <MenuItem value="">
              <em>Select session</em>
            </MenuItem>
            {EVENT_SESSIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ gridArea: "loc", minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Location</Typography>
          <TextField
            fullWidth
            size="small"
            value={event.Location}
            onChange={(e) => onUpdate(event.id, "Location", e.target.value)}
          />
        </Box>
        <Box sx={{ gridArea: "del", display: "flex", justifyContent: "flex-end" }}>
          {canRemove && (
            <IconButton size="small" color="error" onClick={() => onRemove(event.id)} title="Remove event">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function ReservationFormFields({
  errors,
  touched,
  values,
  setFieldValue,
  inputRef,
  teams,
  photographers,
  videographers,
  teamDefaultIds,
  eventTypes,
  availabilityMsg,
  availabilitySeverity,
}) {
  const usedTypes = values.Events.map((e) => e.EventType);
  const canAddMore = (eventTypes || []).length > usedTypes.length;

  const handleEventUpdate = (id, field, value) => {
    setFieldValue(
      "Events",
      values.Events.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleEventRemove = (id) => {
    const filtered = values.Events.filter((e) => e.id !== id);
    if (filtered.length > 0 && !filtered.some((e) => e.IsMainEvent)) {
      filtered[0].IsMainEvent = true;
    }
    setFieldValue("Events", filtered);
  };

  const handleSetMain = (id) => {
    setFieldValue(
      "Events",
      values.Events.map((e) => ({ ...e, IsMainEvent: e.id === id }))
    );
  };

  const handleAddEvent = () => {
    const unusedTypes = (eventTypes || []).filter((t) => !usedTypes.includes(t.id));
    if (unusedTypes.length === 0) return;
    setFieldValue("Events", [
      ...values.Events,
      { ...createEmptyEvent(unusedTypes, false), EventType: unusedTypes[0].id },
    ]);
  };

  return (
    <Form>
      <Grid spacing={1} container>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
            Add Reservation
          </Typography>
        </Grid>

        <Grid item xs={12} md={6} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Couple / Client Names *
          </Typography>
          <Field
            as={TextField}
            fullWidth
            name="CoupleNames"
            size="small"
            inputRef={inputRef}
            error={touched.CoupleNames && Boolean(errors.CoupleNames)}
            helperText={touched.CoupleNames && errors.CoupleNames}
          />
        </Grid>

        <Grid item xs={12} md={6} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Customer Mobile / WhatsApp No
          </Typography>
          <Field
            as={TextField}
            fullWidth
            name="CustomerMobileNo"
            size="small"
            placeholder="e.g. 0771234567"
          />
        </Grid>

        <Grid item xs={12} md={6} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Local Contact Name (if can't reach main)
          </Typography>
          <Field
            as={TextField}
            fullWidth
            name="LocalContactName"
            size="small"
            placeholder="Alternative contact person"
          />
        </Grid>

        <Grid item xs={12} md={6} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Local Contact No
          </Typography>
          <Field
            as={TextField}
            fullWidth
            name="LocalContactNo"
            size="small"
            placeholder="e.g. 0771234567"
          />
        </Grid>

        <Grid item xs={12} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Client Local Address
          </Typography>
          <Field
            as={TextField}
            fullWidth
            name="ClientLocalAddress"
            size="small"
            multiline
            rows={2}
            placeholder="Optional local address"
          />
        </Grid>

        <Grid item xs={12} mt={2}>
          <Divider />
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1} mb={1}>
            <Typography sx={{ fontWeight: "500", fontSize: "14px" }}>
              Events (select one as main)
            </Typography>
            <Button
              size="small"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddEvent}
              disabled={!canAddMore}
            >
              Add Event
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {values.Events.map((event, idx) => (
            <EventRow
              key={event.id}
              event={event}
              index={idx}
              eventTypes={eventTypes}
              usedTypes={usedTypes}
              onUpdate={handleEventUpdate}
              onRemove={handleEventRemove}
              onSetMain={handleSetMain}
              canRemove={values.Events.length > 1}
            />
          ))}
        </Grid>

        {availabilityMsg && (
          <Grid item xs={12} mt={1}>
            <Alert severity={availabilitySeverity} sx={{ py: 0 }}>
              {availabilityMsg}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} mt={2}>
          <Divider />
        </Grid>

        <Grid item xs={12} md={4} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Ceremony Type
          </Typography>
          <Field as={TextField} select fullWidth name="CeremonyType" size="small">
            <MenuItem value="">Not specified</MenuItem>
            {CEREMONY_TYPES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Field>
        </Grid>

        {Number(values.CeremonyType) === 3 && (
          <Grid item xs={12} md={4} mt={1}>
            <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
              Ceremony (Other)
            </Typography>
            <Field as={TextField} fullWidth name="CeremonyTypeOther" size="small" />
          </Grid>
        )}

        <Grid item xs={12} md={4} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            No. of Guests
          </Typography>
          <Field
            as={TextField}
            fullWidth
            type="number"
            name="NoOfGuests"
            size="small"
            inputProps={{ min: 0 }}
          />
        </Grid>

        <Grid item xs={12} md={4} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Makeup Artist
          </Typography>
          <Field as={TextField} fullWidth name="MakeupArtist" size="small" />
        </Grid>

        <Grid item xs={12} md={4} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Assigned Team
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={values.AssignedTeamId}
            onChange={(e) => {
              const newTeamId = e.target.value;
              const oldDefaults = teamDefaultIds(values.AssignedTeamId);
              const newDefaults = teamDefaultIds(newTeamId);
              const kept = (values.PhotographerIds || []).filter(
                (id) => !oldDefaults.includes(id)
              );
              setFieldValue("AssignedTeamId", newTeamId);
              setFieldValue(
                "PhotographerIds",
                Array.from(new Set([...newDefaults, ...kept]))
              );
            }}
          >
            <MenuItem value="">Unassigned</MenuItem>
            {(teams || []).map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Photographers
          </Typography>
          {(() => {
            const lockedIds = teamDefaultIds(values.AssignedTeamId);
            const selected = Array.from(
              new Set([...lockedIds, ...(values.PhotographerIds || [])])
            );
            return (
              <Select
                multiple
                fullWidth
                size="small"
                value={selected}
                onChange={(e) => {
                  const next = e.target.value;
                  const unlocked = next.filter((id) => !lockedIds.includes(id));
                  setFieldValue(
                    "PhotographerIds",
                    Array.from(new Set([...lockedIds, ...unlocked]))
                  );
                }}
                input={<OutlinedInput />}
                renderValue={(selectedIds) =>
                  (photographers || [])
                    .filter((p) => selectedIds.includes(p.id))
                    .map((p) => p.name)
                    .join(", ")
                }
              >
                {(photographers || []).map((p) => {
                  const locked = lockedIds.includes(p.id);
                  return (
                    <MenuItem key={p.id} value={p.id} disabled={locked}>
                      <Checkbox checked={selected.includes(p.id)} />
                      <ListItemText
                        primary={p.name}
                        secondary={
                          locked ? "Team default" : p.defaultTeam?.name || ""
                        }
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            );
          })()}
        </Grid>

        <Grid item xs={12} mt={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!values.HasVideography}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFieldValue("HasVideography", checked);
                  if (!checked) {
                    setFieldValue("VideographerIds", []);
                  }
                }}
              />
            }
            label="Videography"
          />
        </Grid>

        {values.HasVideography && (
          <Grid item xs={12} md={6} mt={1}>
            <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
              Videographers
            </Typography>
            <Select
              multiple
              fullWidth
              size="small"
              value={values.VideographerIds || []}
              onChange={(e) => setFieldValue("VideographerIds", e.target.value)}
              input={<OutlinedInput />}
              renderValue={(selectedIds) =>
                (videographers || [])
                  .filter((p) => selectedIds.includes(p.id))
                  .map((p) => p.name)
                  .join(", ")
              }
            >
              {(videographers || []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Checkbox checked={(values.VideographerIds || []).includes(p.id)} />
                  <ListItemText primary={p.name} />
                </MenuItem>
              ))}
            </Select>
          </Grid>
        )}

        <Grid item xs={12} mt={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!values.MobileContentCreatorRequired}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFieldValue("MobileContentCreatorRequired", checked);
                  if (!checked) {
                    setFieldValue("MobileContentCreatorId", "");
                  }
                }}
              />
            }
            label="Mobile Content Creator Required"
          />
        </Grid>

        {values.MobileContentCreatorRequired && (
          <Grid item xs={12} md={4} mt={1}>
            <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
              Mobile Content Creator
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={values.MobileContentCreatorId}
              onChange={(e) => setFieldValue("MobileContentCreatorId", e.target.value)}
            >
              <MenuItem value="">Select...</MenuItem>
              {(photographers || [])
                .filter((p) => p.isContentCreator)
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
        )}

        <Grid item xs={12} mt={1}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Remark
          </Typography>
          <Field
            as={TextField}
            fullWidth
            multiline
            minRows={2}
            name="Remark"
            size="small"
          />
        </Grid>
      </Grid>
    </Form>
  );
}

export default function AddReservation({
  fetchItems,
  defaultEventDate,
  externalOpen,
  onExternalClose,
  hideTrigger = false,
}) {
  const router = useRouter();
  const queryDate = normalizeDateQuery(router.query?.eventDate);
  const returnUrl = Array.isArray(router.query?.returnUrl)
    ? router.query.returnUrl[0]
    : router.query?.returnUrl;
  const initialDate = defaultEventDate || queryDate || "";

  const isControlled = typeof externalOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;

  const [availabilityMsg, setAvailabilityMsg] = useState(null);
  const [availabilitySeverity, setAvailabilitySeverity] = useState("info");
  const inputRef = useRef(null);
  const autoOpenedRef = useRef(false);

  const { data: teams } = useApi("/PhotographyTeam/GetActiveTeams");
  const { data: photographers } = useApi("/Photographer/GetActivePhotographers");
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];

  const teamDefaultIds = (teamId) => {
    if (!teamId) return [];
    return (photographers || [])
      .filter((p) => Number(p.defaultTeamId) === Number(teamId))
      .map((p) => p.id);
  };

  const videographers = (photographers || []).filter((p) => p.isVideography);

  const isPageRoute =
    router.pathname === "/photography/reservations/create" ||
    router.pathname === "/photography/reservations/create/";

  const leaveCreatePage = () => {
    if (!isPageRoute) return;
    if (typeof returnUrl === "string" && returnUrl.startsWith("/")) {
      router.replace(returnUrl);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/photography/reservations/");
  };

  const handleOpen = () => {
    if (!isControlled) setInternalOpen(true);
  };

  const handleClose = () => {
    setAvailabilityMsg(null);
    if (isControlled) {
      onExternalClose?.();
      return;
    }
    setInternalOpen(false);
    if (isPageRoute) leaveCreatePage();
  };

  useEffect(() => {
    if (isControlled || !router.isReady || autoOpenedRef.current) return;
    if (queryDate || (isPageRoute && router.asPath?.includes("eventDate="))) {
      autoOpenedRef.current = true;
      setInternalOpen(true);
    }
  }, [isControlled, router.isReady, queryDate, isPageRoute, router.asPath]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (values) => {
    if (!values.Events || values.Events.length === 0) {
      toast.error("At least one event is required");
      return;
    }
    const mainEvents = values.Events.filter((e) => e.IsMainEvent);
    if (mainEvents.length === 0) {
      toast.error("One event must be marked as the main event");
      return;
    }
    for (const evt of values.Events) {
      if (!evt.EventDate) {
        toast.error("Date is required for each event");
        return;
      }
      if (!evt.EventSession || !EVENT_SESSIONS.includes(evt.EventSession)) {
        toast.error("Session (Morning or Evening) is required for each event");
        return;
      }
    }

    const token = localStorage.getItem("token");
    const photographerIds = Array.from(
      new Set([...teamDefaultIds(values.AssignedTeamId), ...(values.PhotographerIds || [])])
    );
    const videographerIds = values.HasVideography ? values.VideographerIds || [] : [];

    const payload = {
      CoupleNames: values.CoupleNames,
      Events: values.Events.map((e) => ({
        EventType: Number(e.EventType),
        EventDate: e.EventDate || null,
        EventTime: e.EventTime || null,
        EventSession: e.EventSession || null,
        Location: e.Location || null,
        IsMainEvent: e.IsMainEvent,
      })),
      CeremonyType: values.CeremonyType ? Number(values.CeremonyType) : null,
      CeremonyTypeOther: values.CeremonyTypeOther,
      NoOfGuests: values.NoOfGuests ? Number(values.NoOfGuests) : null,
      MakeupArtist: values.MakeupArtist,
      CustomerMobileNo: values.CustomerMobileNo,
      LocalContactName: values.LocalContactName || null,
      LocalContactNo: values.LocalContactNo || null,
      ClientLocalAddress: values.ClientLocalAddress || null,
      AssignedTeamId: values.AssignedTeamId ? Number(values.AssignedTeamId) : null,
      HasVideography: !!values.HasVideography,
      MobileContentCreatorRequired: !!values.MobileContentCreatorRequired,
      MobileContentCreatorId:
        values.MobileContentCreatorRequired && values.MobileContentCreatorId
          ? Number(values.MobileContentCreatorId)
          : null,
      Remark: values.Remark,
      Photographers: photographerIds.map((id) => ({
        PhotographerId: Number(id),
        RoleInEvent: null,
      })),
      Videographers: videographerIds.map((id) => ({
        PhotographerId: Number(id),
        RoleInEvent: null,
      })),
    };

    fetch(`${BASE_URL}/PhotographyReservation/CreateReservation`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200 || sc === "SUCCESS") {
          toast.success(msg || "Reservation created");
          setAvailabilityMsg(null);
          if (isControlled) {
            onExternalClose?.();
          } else {
            setInternalOpen(false);
          }
          fetchItems?.();
          if (isPageRoute) leaveCreatePage();
        } else {
          toast.error(msg || "Failed to create reservation");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  const getInitialEvents = () => {
    const defaultEvent = {
      id: Date.now(),
      EventType: eventTypes[0]?.id ?? 1,
      EventDate: initialDate,
      EventTime: "",
      EventSession: "",
      Location: "",
      IsMainEvent: true,
    };
    return [defaultEvent];
  };

  return (
    <>
      {!hideTrigger && !isControlled && !isPageRoute && (
        <Button variant="outlined" onClick={handleOpen}>
          + add new
        </Button>
      )}
      {!hideTrigger && !isControlled && isPageRoute && !open && (
        <Box sx={{ p: 3 }}>
          <Button variant="contained" onClick={handleOpen}>
            + Add Reservation
          </Button>
        </Box>
      )}
      <Modal open={!!open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            key={`${String(open)}-${initialDate}-${eventTypes.length}`}
            initialValues={{
              CoupleNames: "",
              CustomerMobileNo: "",
              LocalContactName: "",
              LocalContactNo: "",
              ClientLocalAddress: "",
              Events: getInitialEvents(),
              CeremonyType: "",
              CeremonyTypeOther: "",
              NoOfGuests: "",
              MakeupArtist: "",
              AssignedTeamId: "",
              PhotographerIds: [],
              HasVideography: false,
              VideographerIds: [],
              MobileContentCreatorRequired: false,
              MobileContentCreatorId: "",
              Remark: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {(formik) => (
              <>
                <ReservationFormFields
                  {...formik}
                  inputRef={inputRef}
                  teams={teams}
                  photographers={photographers}
                  videographers={videographers}
                  teamDefaultIds={teamDefaultIds}
                  eventTypes={eventTypes}
                  availabilityMsg={availabilityMsg}
                  availabilitySeverity={availabilitySeverity}
                />
                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button variant="contained" color="error" onClick={handleClose} size="small">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    onClick={formik.handleSubmit}
                  >
                    Save
                  </Button>
                </Box>
              </>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}