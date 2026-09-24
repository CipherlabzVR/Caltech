import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Checkbox,
  Divider,
  Grid,
  IconButton,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Radio,
  Select,
  Tooltip,
  Typography,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { getEventTimeSelectOptions, normalizeEventTime } from "@/components/Photography/eventTimeOptions";
import ReservationNotes from "./ReservationNotes";
import ReservationHandover from "./ReservationHandover";
import ReservationDetailTabs from "./ReservationDetailTabs";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 1280, md: 1100, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  maxHeight: "90vh",
  overflowY: "auto",
};

const CEREMONY_TYPES = [
  { value: 1, label: "Poruwa" },
  { value: 2, label: "Church" },
  { value: 3, label: "Other" },
];

const validationSchema = Yup.object().shape({
  CoupleNames: Yup.string().required("Couple / client name is required"),
});

const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

function EventRow({ event, index, eventTypes, usedTypes, onUpdate, onRemove, onSetMain, canRemove }) {
  const availableTypes = (eventTypes || []).filter(
    (t) => t.id === event.EventType || !usedTypes.includes(t.id)
  );

  return (
    <Box sx={{ border: "1px solid", borderColor: event.IsMainEvent ? "primary.main" : "divider", borderRadius: 1, p: 1.5, mb: 1, bgcolor: event.IsMainEvent ? "action.selected" : "transparent" }}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={12} sm={1}>
          <Radio
            checked={event.IsMainEvent}
            onChange={() => onSetMain(event.id)}
            size="small"
            title="Set as main event"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
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
        </Grid>
        <Grid item xs={12} sm={3}>
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
        </Grid>
        <Grid item xs={12} sm={2}>
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
        </Grid>
        <Grid item xs={12} sm={2}>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>Location</Typography>
          <TextField
            fullWidth
            size="small"
            value={event.Location}
            onChange={(e) => onUpdate(event.id, "Location", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={1} sx={{ textAlign: "center" }}>
          {canRemove && (
            <IconButton size="small" color="error" onClick={() => onRemove(event.id)} title="Remove event">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default function EditReservation({ item, fetchItems, isOpen, onClose, hideButton }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [userAgentType, setUserAgentType] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [firstMeetingComplete, setFirstMeetingComplete] = useState(item.firstMeetingComplete || false);
  const [updatingMeeting, setUpdatingMeeting] = useState(false);
  
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpen = () => setInternalOpen(true);
  const handleClose = () => {
    setInternalOpen(false);
    onClose?.();
  };
  const inputRef = useRef(null);
  const { data: teams } = useApi("/PhotographyTeam/GetActiveTeams");
  const { data: photographers } = useApi("/Photographer/GetActivePhotographers");
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];

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
    // UserType: SuperAdmin = 0, Admin = 1
    if (typeof window !== "undefined") {
      const t = Number(localStorage.getItem("type"));
      setIsAdminUser(t === 0 || t === 1);
    }
  }, [fetchUserAgentType]);

  useEffect(() => {
    setFirstMeetingComplete(item.firstMeetingComplete || false);
  }, [item.firstMeetingComplete]);

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
        fetchItems?.();
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

  const teamDefaultIds = (teamId) => {
    if (!teamId) return [];
    return (photographers || [])
      .filter((p) => Number(p.defaultTeamId) === Number(teamId))
      .map((p) => p.id);
  };

  const videographers = (photographers || []).filter((p) => p.isVideography);

  const videoTeamDefaultIds = (teamId) => {
    if (!teamId) return [];
    return videographers
      .filter((p) => Number(p.defaultTeamId) === Number(teamId))
      .map((p) => p.id);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const getInitialEvents = () => {
    if (item.events && item.events.length > 0) {
      return item.events.map((e) => ({
        id: e.id || Date.now() + Math.random(),
        EventType: e.eventType,
        EventDate: toDateInput(e.eventDate),
        EventTime: normalizeEventTime(e.eventTime || ""),
        Location: e.location || "",
        IsMainEvent: e.isMainEvent,
      }));
    }
    return [{
      id: Date.now(),
      EventType: item.eventType || 1,
      EventDate: toDateInput(item.eventDate),
      EventTime: normalizeEventTime(item.eventTime || ""),
      Location: item.receptionLocation || "",
      IsMainEvent: true,
    }];
  };

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
        const typeName = eventTypes.find((t) => t.id === evt.EventType)?.name || "Event";
        toast.error(`${typeName} date is required`);
        return;
      }
    }

    const token = localStorage.getItem("token");
    const photographerIds = Array.from(
      new Set([...teamDefaultIds(values.AssignedTeamId), ...(values.PhotographerIds || [])])
    );
    const videographerIds = values.HasVideography
      ? Array.from(
          new Set([
            ...videoTeamDefaultIds(values.AssignedVideographyTeamId),
            ...(values.VideographerIds || []),
          ])
        )
      : [];

    const payload = {
      Id: values.Id,
      CoupleNames: values.CoupleNames,
      Events: values.Events.map((e) => ({
        Id: typeof e.id === "number" && e.id > 1000000 ? null : e.id,
        EventType: Number(e.EventType),
        EventDate: e.EventDate,
        EventTime: e.EventTime || null,
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
      AssignedVideographyTeamId:
        values.HasVideography && values.AssignedVideographyTeamId
          ? Number(values.AssignedVideographyTeamId)
          : null,
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

    fetch(`${BASE_URL}/PhotographyReservation/UpdateReservation`, {
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
          toast.success(msg || "Updated");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to update");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      {!hideButton && (
        <Tooltip title="Edit" placement="top">
          <IconButton onClick={handleOpen} aria-label="edit" size="small">
            <BorderColorIcon color="primary" fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Formik
                initialValues={{
                  Id: item.id,
                  CoupleNames: item.coupleNames || "",
                  CustomerMobileNo: item.customerMobileNo || "",
                  LocalContactName: item.localContactName || "",
                  LocalContactNo: item.localContactNo || "",
                  ClientLocalAddress: item.clientLocalAddress || "",
                  Events: getInitialEvents(),
                  CeremonyType: item.ceremonyType || "",
                  CeremonyTypeOther: item.ceremonyTypeOther || "",
                  NoOfGuests: item.noOfGuests ?? "",
                  MakeupArtist: item.makeupArtist || "",
                  AssignedTeamId: item.assignedTeamId || "",
                  PhotographerIds: (item.photographers || []).map((p) => p.photographerId),
                  HasVideography: !!item.hasVideography,
                  AssignedVideographyTeamId: item.assignedVideographyTeamId || "",
                  VideographerIds: (item.videographers || []).map((p) => p.photographerId),
                  MobileContentCreatorRequired: !!item.mobileContentCreatorRequired,
                  MobileContentCreatorId: item.mobileContentCreatorId || "",
                  Remark: item.remark || "",
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, values, setFieldValue }) => {
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
                      {
                        id: Date.now() + Math.random(),
                        EventType: unusedTypes[0].id,
                        EventDate: "",
                        EventTime: "",
                        Location: "",
                        IsMainEvent: false,
                      },
                    ]);
                  };

                  return (
                    <Form>
                      <Grid spacing={1} container>
                        <Grid item xs={12}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="h5" sx={{ fontWeight: "500" }}>
                              Edit Reservation
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={firstMeetingComplete}
                                    onChange={(e) => handleFirstMeetingChange(e.target.checked)}
                                    disabled={!isCustomerCoordinator || updatingMeeting}
                                    size="small"
                                  />
                                }
                                label={
                                  <Typography variant="body2">
                                    First Meeting {firstMeetingComplete ? "✅" : ""}
                                  </Typography>
                                }
                              />
                              {!isCustomerCoordinator && (
                                <Chip label="Only Customer Coordinator can edit" size="small" variant="outlined" />
                              )}
                            </Box>
                          </Box>
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
                            onChange={(e) =>
                              setFieldValue(
                                "PhotographerIds",
                                Array.from(new Set([...lockedIds, ...e.target.value]))
                              )
                            }
                            input={<OutlinedInput />}
                            renderValue={(sel) =>
                              (photographers || [])
                                .filter((p) => sel.includes(p.id))
                                .map((p) => p.name)
                                .join(", ")
                            }
                          >
                            {(photographers || []).map((p) => {
                              const locked = lockedIds.includes(p.id);
                              return (
                                <MenuItem key={p.id} value={p.id} disabled={locked}>
                                  <Checkbox checked={selected.indexOf(p.id) > -1} disabled={locked} />
                                  <ListItemText
                                    primary={p.name}
                                    secondary={locked ? "Team default" : p.defaultTeam?.name || ""}
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
                                setFieldValue("AssignedVideographyTeamId", "");
                                setFieldValue("VideographerIds", []);
                              }
                            }}
                          />
                        }
                        label="Videography"
                      />
                    </Grid>

                    {values.HasVideography && (
                      <>
                        <Grid item xs={12} md={4} mt={1}>
                          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                            Assigned Videography Team
                          </Typography>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={values.AssignedVideographyTeamId}
                            onChange={(e) => {
                              const newTeamId = e.target.value;
                              const oldDefaults = videoTeamDefaultIds(values.AssignedVideographyTeamId);
                              const newDefaults = videoTeamDefaultIds(newTeamId);
                              const kept = (values.VideographerIds || []).filter(
                                (id) => !oldDefaults.includes(id)
                              );
                              setFieldValue("AssignedVideographyTeamId", newTeamId);
                              setFieldValue(
                                "VideographerIds",
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
                            Videographer
                          </Typography>
                          {(() => {
                            const lockedIds = videoTeamDefaultIds(values.AssignedVideographyTeamId);
                            const selected = Array.from(
                              new Set([...lockedIds, ...(values.VideographerIds || [])])
                            );
                            return (
                              <Select
                                multiple
                                fullWidth
                                size="small"
                                value={selected}
                                onChange={(e) =>
                                  setFieldValue(
                                    "VideographerIds",
                                    Array.from(new Set([...lockedIds, ...e.target.value]))
                                  )
                                }
                                input={<OutlinedInput />}
                                renderValue={(sel) =>
                                  (videographers || [])
                                    .filter((p) => sel.includes(p.id))
                                    .map((p) => p.name)
                                    .join(", ")
                                }
                              >
                                {(videographers || []).map((p) => {
                                  const locked = lockedIds.includes(p.id);
                                  return (
                                    <MenuItem key={p.id} value={p.id} disabled={locked}>
                                      <Checkbox
                                        checked={selected.indexOf(p.id) > -1}
                                        disabled={locked}
                                      />
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
                      </>
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

                  <Box display="flex" mt={2} justifyContent="space-between">
                        <Button variant="contained" color="error" onClick={handleClose} size="small">
                          Cancel
                        </Button>
                        <Button type="submit" variant="contained" size="small">
                          Update
                        </Button>
                      </Box>
                    </Form>
                  );
                }}
              </Formik>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box sx={{ position: "sticky", top: 0, maxHeight: "80vh", overflowY: "auto" }}>
                <ReservationHandover
                  reservation={item}
                  onHandoverComplete={() => {
                    fetchItems?.();
                    handleClose();
                  }}
                  userAgentType={userAgentType}
                />
                <ReservationDetailTabs
                  reservationId={item.id}
                  currentAgentType={item.currentAgentType}
                  userAgentType={userAgentType}
                  isAdminUser={isAdminUser}
                />
                <ReservationNotes reservationId={item.id} hideQuotations />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
