import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  Avatar,
  Stack,
  Box,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TextField,
  IconButton,
  Alert,
  Button,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import PlaceIcon from "@mui/icons-material/Place";
import EventIcon from "@mui/icons-material/Event";
import GroupsIcon from "@mui/icons-material/Groups";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import useApi from "@/components/utils/useApi";
import AddReservation from "./create";
import EditReservation from "./edit";
import AssignTeam from "./assign-team";
import ChangeStatus from "./change-status";
import SendPortalLink from "./send-portal-link";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";
import { getAgentTypes, isApiSuccess } from "@/Services/photographyAgentService";
import { resolveStatusColor, hexToRgba } from "@/utils/photography/boardTheme";
import { resolveEventTypeIcon } from "@/utils/photography/eventTypeIcons";

const CATEGORY_ID = 225;

const initialsOf = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const statusIdOf = (s) => s?.id ?? s?.Id;
const statusNameOf = (s) => s?.name ?? s?.Name ?? "";
const statusColorOf = (s, index = 0) => resolveStatusColor(s, index);

const isGoogleCalendarSynced = (item) =>
  Boolean(item?.isGoogleCalendarSynced ?? item?.IsGoogleCalendarSynced) ||
  /\[GCal:/i.test(item?.remark || item?.Remark || "");

export default function ReservationList() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, update, remove, photoAssignTeam, photoChangeStatus } =
    IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);
  const controller = "PhotographyReservation/DeleteReservation";

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [agentTypeFilter, setAgentTypeFilter] = useState("");
  const [agentTypeOptions, setAgentTypeOptions] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [firstMeetingFilter, setFirstMeetingFilter] = useState("");
  const [view, setView] = useState("card");
  const [selectedItem, setSelectedItem] = useState(null);
  const [allOverride, setAllOverride] = useState(false);
  const [userAgentType, setUserAgentType] = useState(null);
  const [agentTypeLoaded, setAgentTypeLoaded] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Restore the user's preferred view (card / table).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("photoResvView");
    if (saved === "card" || saved === "table") setView(saved);
    // UserType: SuperAdmin = 0, ADMIN = 1
    const t = Number(localStorage.getItem("type"));
    setIsAdminUser(t === 0 || t === 1);
  }, []);

  const handleViewChange = (_e, next) => {
    if (!next) return;
    setView(next);
    if (typeof window !== "undefined") localStorage.setItem("photoResvView", next);
  };

  // Ordered workflow statuses used to draw the per-card progress bar.
  const { data: statusData } = useApi("/PhotographyEventStatus/GetActiveStatuses");
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];
  const orderedStatuses = Array.isArray(statusData) ? statusData : [];
  const totalSteps = orderedStatuses.length;
  const stepOf = (statusId) => {
    const idx = orderedStatuses.findIndex((s) => Number(statusIdOf(s)) === Number(statusId));
    return idx >= 0 ? idx + 1 : 0;
  };
  const findStatus = (item) => {
    const byId = orderedStatuses.find((s) => Number(statusIdOf(s)) === Number(item.currentStatusId));
    if (byId) return byId;
    const name = String(item.currentStatusName || "").trim().toLowerCase();
    if (!name) return null;
    return orderedStatuses.find((s) => String(statusNameOf(s)).trim().toLowerCase() === name) || null;
  };
  const colorForItem = (item) => {
    const status = findStatus(item);
    const idx = Math.max(0, stepOf(item.currentStatusId) - 1);
    return statusColorOf(status || { name: item.currentStatusName }, idx);
  };

  const fetchUserAgentType = useCallback(async () => {
    try {
      const response = await photographyReservationNoteService.getCurrentUserAgentType();
      const type = response?.result?.agentType ?? response?.result?.AgentType ?? null;
      const n = type === null || type === undefined || type === "" ? NaN : Number(type);
      // Photography agents are 1=Coordinator, 2=Payment Handler, 3=After Wedding
      if (n === 1 || n === 2 || n === 3) {
        setUserAgentType(n);
        setAgentTypeFilter(n);
      } else {
        setUserAgentType(null);
      }
    } catch (err) {
      console.error("Failed to fetch user agent type", err);
      setUserAgentType(null);
    } finally {
      setAgentTypeLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchUserAgentType();
  }, [fetchUserAgentType]);

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
          .filter((t) => Number.isFinite(t.value) && t.value > 0 && t.label);
        if (mapped.length) setAgentTypeOptions(mapped);
      })
      .catch(() => {});
  }, []);

  // Agent users: only their stage. Non-agent Admin/SuperAdmin (and other non-agents): all.
  const isPhotographyAgent = userAgentType === 1 || userAgentType === 2 || userAgentType === 3;

  const buildFilter = useCallback((type = typeFilter, status = statusFilter, date = dateFilter, firstMeeting = firstMeetingFilter, includeAgent = !allOverride, agent = agentTypeFilter) => {
    const parts = [];
    if (includeAgent && agent) parts.push(`AgentType:${agent}`);
    if (type) parts.push(`EventType:${type}`);
    if (status) parts.push(`Status:${status}`);
    if (date) parts.push(`Date:${date}`);
    if (firstMeeting !== "") parts.push(`FirstMeetingComplete:${firstMeeting}`);
    return parts.join("|");
  }, [allOverride, agentTypeFilter, typeFilter, statusFilter, dateFilter, firstMeetingFilter]);

  const agentFilter = isPhotographyAgent ? `AgentType:${userAgentType}` : "";
  const listEndpoint = agentTypeLoaded
    ? "PhotographyReservation/GetAllReservationPaged"
    : "";

  const {
    data: list,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    fetchData: fetchList,
  } = usePaginatedFetch(
    listEndpoint,
    "",
    10,
    false,
    false,
    agentFilter
  );

  useEffect(() => {
    if (!agentTypeLoaded || !listEndpoint) return;
    const filter = buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter);
    setFilter(filter);
    fetchList(1, search, pageSize, false, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentTypeLoaded, userAgentType, isPhotographyAgent, listEndpoint]);

  const selectedAgentLabel =
    agentTypeOptions.find((t) => Number(t.value) === Number(agentTypeFilter))?.label
    || (Number(agentTypeFilter) === 1
      ? "Customer Coordinator"
      : Number(agentTypeFilter) === 2
        ? "Payment Handler"
        : Number(agentTypeFilter) === 3
          ? "After Wedding Manager"
          : null);

  const handleSearchChange = (event) => {
    setAllOverride(false);
    setSearch(event.target.value);
    fetchList(1, event.target.value, pageSize, false, buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter, true));
    setPage(1);
  };

  const handleAgentTypeFilterChange = (event) => {
    const value = event.target.value;
    setAllOverride(false);
    setAgentTypeFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter, Boolean(value), value));
  };

  const handleTypeFilterChange = (event) => {
    const value = event.target.value;
    setAllOverride(false);
    setTypeFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(value, statusFilter, dateFilter, firstMeetingFilter, true));
  };

  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setAllOverride(false);
    setStatusFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, value, dateFilter, firstMeetingFilter, true));
  };

  const handleDateFilterChange = (event) => {
    const value = event.target.value || "";
    setAllOverride(false);
    setDateFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, value, firstMeetingFilter, true));
  };

  const clearDateFilter = () => {
    setAllOverride(false);
    setDateFilter("");
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, "", firstMeetingFilter, true));
  };

  const handleFirstMeetingFilterChange = (event) => {
    const value = event.target.value;
    setAllOverride(false);
    setFirstMeetingFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, dateFilter, value, true));
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchList(value, search, pageSize, false, buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter, !allOverride));
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchList(1, search, size, false, buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter, !allOverride));
  };

  const handleAllClick = () => {
  if (allOverride) {
    setAllOverride(false);
    const agent = isPhotographyAgent ? userAgentType : agentTypeFilter;
    setAgentTypeFilter(agent || "");
    setPage(1);
    const filter = buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter, Boolean(agent), agent || "");
    setFilter(filter);
    fetchList(1, search, pageSize, false, filter);
  } else {
    // first click: show everything, ignore agent filter
    setAllOverride(true);
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setAgentTypeFilter("");
    setDateFilter("");
    setFirstMeetingFilter("");
    setPage(1);
    setFilter("");
    fetchList(1, "", pageSize, false, "");
  }
};

  const refresh = () =>
    fetchList(
      page,
      search,
      pageSize,
      false,
      buildFilter(typeFilter, statusFilter, dateFilter, firstMeetingFilter, !allOverride),
    );

  if (!navigate) return <AccessDenied />;

  if (!agentTypeLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const actionButtons = (item) => (
    <>
      <SendPortalLink item={item} />
      {photoAssignTeam ? <AssignTeam item={item} fetchItems={refresh} /> : ""}
      {photoChangeStatus ? <ChangeStatus item={item} fetchItems={refresh} /> : ""}
      {update ? <EditReservation item={item} fetchItems={refresh} /> : ""}
      {remove ? (
        <DeleteConfirmationById id={item.id} controller={controller} fetchItems={refresh} />
      ) : (
        ""
      )}
    </>
  );

  const StatusProgress = ({ item }) => {
    const step = stepOf(item.currentStatusId);
    const pct = totalSteps ? Math.round((step / totalSteps) * 100) : 0;
    const barColor = colorForItem(item);
    const isDone = step > 0 && step === totalSteps;
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {isDone && <CheckCircleIcon sx={{ fontSize: 15, color: barColor }} />}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: barColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {item.currentStatusName || "No status"}
            </Typography>
          </Stack>
          {totalSteps > 0 && (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Step {step} / {totalSteps}
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 8,
            borderRadius: 5,
            backgroundColor: hexToRgba(barColor, 0.15),
            "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 5 },
          }}
        />
      </Box>
    );
  };

  const StatusChip = ({ item, size = "small" }) => {
    if (!item.currentStatusName) return "-";
    const color = colorForItem(item);
    return (
      <Chip
        size={size}
        label={item.currentStatusName}
        sx={{
          bgcolor: color,
          color: "#fff",
          fontWeight: 700,
          "& .MuiChip-label": { px: 1 },
        }}
      />
    );
  };

  const renderCards = () => {
    if (!list || list.length === 0) {
      return (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <Typography color="error">No reservations available</Typography>
          </Paper>
        </Grid>
      );
    }
    return list.map((item) => {
      const statusHex = colorForItem(item);
      const headerBg = `linear-gradient(135deg, ${statusHex} 0%, ${hexToRgba(statusHex, 0.82)} 100%)`;
      return (
        // Was xs=12 sm=6 md=3 (4-up starting at 900px). That made cards only
        // ~220-270px wide on iPad / MacBook browser widths (900-1280px),
        // which is exactly what squeezed the header and cropped the
        // "Preshoot" chip icon. md=4 (3-up) gives that range breathing room;
        // lg=3 keeps the denser 4-up layout for real desktop widths (1200px+).
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
          <Paper
            elevation={0}
            onClick={() => update && setSelectedItem(item)}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${hexToRgba(statusHex, 0.35)}`,
              borderLeft: `5px solid ${statusHex}`,
              transition: "transform .15s, box-shadow .15s",
              cursor: update ? "pointer" : "default",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: `0 10px 26px ${hexToRgba(statusHex, 0.28)}`,
              },
            }}
          >
            <Box sx={{ p: 2, color: "#fff", background: headerBg }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: "rgba(255,255,255,0.3)",
                    fontWeight: 700,
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                  }}
                >
                  {initialsOf(item.coupleNames)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.15,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.coupleNames}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {item.cardNo}
                  </Typography>
                </Box>
                {isGoogleCalendarSynced(item) && (
                  <Tooltip title="Synced to Google Calendar">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.22)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <EventAvailableIcon sx={{ fontSize: 18, color: "#fff" }} />
                    </Box>
                  </Tooltip>
                )}
              </Stack>
            </Box>

            <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventIcon sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />
                <Typography variant="body2">
                  {formatDate(item.eventDate)}
                  {item.eventTime ? ` · ${item.eventTime}` : ""}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceIcon sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  color={item.receptionLocation ? "text.primary" : "text.disabled"}
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {item.receptionLocation || "No location"}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <GroupsIcon sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />
                {item.assignedTeamName ? (
                  <Chip size="small" label={item.assignedTeamName} color="info" variant="outlined" />
                ) : (
                  <Chip size="small" label="Unassigned" color="error" variant="outlined" />
                )}
              </Stack>

              <Box sx={{ mt: "auto", pt: 1.5 }}>
                <StatusProgress item={item} />
              </Box>
            </Box>

            <Divider />
            <Box
              sx={{
                px: 1,
                py: 0.5,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexWrap: "wrap",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {actionButtons(item)}
            </Box>
          </Paper>
        </Grid>
      );
    });
  };

  const renderTable = () => (
    <Grid item xs={12}>
      <TableContainer component={Paper}>
        <Table aria-label="reservations" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell>Card No</TableCell>
              <TableCell>Couple / Client</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Event Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!list || list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="error">No reservations available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((item) => {
                const typeMeta = eventTypes.find((t) => Number(t.id) === Number(item.eventType));
                const usesWeddingCapacity =
                  typeMeta?.consumesWeddingCapacity || typeMeta?.ConsumesWeddingCapacity;
                return (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => update && setSelectedItem(item)}
                    sx={{ cursor: update ? "pointer" : "default" }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#4F46E5" }}>
                          {item.cardNo}
                        </Typography>
                        {isGoogleCalendarSynced(item) && (
                          <Tooltip title="Synced to Google Calendar">
                            <Chip
                              size="small"
                              icon={<EventAvailableIcon />}
                              label="Calendar"
                              color="success"
                              variant="outlined"
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: 13,
                            fontWeight: 700,
                            background: usesWeddingCapacity
                              ? "linear-gradient(135deg, #312E81 0%, #4F46E5 100%)"
                              : "linear-gradient(135deg, #0F766E 0%, #0891B2 100%)",
                          }}
                        >
                          {initialsOf(item.coupleNames)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.coupleNames}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(item.events || []).length > 0 ? (
                          item.events.map((evt, idx) => (
                            <Chip
                              key={evt.id || idx}
                              size="small"
                              icon={
                                (() => {
                                  const eventType = eventTypes.find(
                                    (type) => Number(type.id) === Number(evt.eventType)
                                  );
                                  const EventTypeIcon = resolveEventTypeIcon(
                                    eventType?.iconName ?? eventType?.IconName ?? evt.iconName ?? evt.IconName
                                  );
                                  return <EventTypeIcon />;
                                })()
                              }
                              label={`${evt.eventTypeName}${evt.isMainEvent ? " ★" : ""}`}
                              color={evt.isMainEvent ? "primary" : "secondary"}
                              variant={evt.isMainEvent ? "filled" : "outlined"}
                            />
                          ))
                        ) : (
                          <Chip
                            size="small"
                            icon={
                              (() => {
                                const EventTypeIcon = resolveEventTypeIcon(
                                  typeMeta?.iconName ?? typeMeta?.IconName ?? item.iconName ?? item.IconName
                                );
                                return <EventTypeIcon />;
                              })()
                            }
                            label={item.eventTypeName}
                            color={usesWeddingCapacity ? "primary" : "info"}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{formatDate(item.eventDate)}</TableCell>
                    <TableCell>
                      {item.receptionLocation ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <PlaceIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                          <Typography variant="body2">{item.receptionLocation}</Typography>
                        </Stack>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.assignedTeamName ? (
                        <Chip size="small" label={item.assignedTeamName} color="info" variant="outlined" />
                      ) : (
                        <Chip size="small" label="Unassigned" color="error" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip item={item} />
                    </TableCell>
                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>{actionButtons(item)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Grid>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>📝 Reservations</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Reservations</li>
        </ul>
      </div>
      {selectedAgentLabel && !allOverride && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing reservations for: <strong>{selectedAgentLabel}</strong>
        </Alert>
      )}
      {!isPhotographyAgent && isAdminUser && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing <strong>all</strong> reservations (Admin)
        </Alert>
      )}
      <Box sx={{ mb: 2, width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
        <Box
          sx={{
            display: "grid",
            width: "100%",
            gap: 1,
            alignItems: "center",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr) auto",
              sm: "minmax(0, 1fr) auto auto auto",
            },
          }}
        >
          <Search
            className="search-form"
            sx={{
              width: "100% !important",
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
              sx={{
                width: "100%",
                "& .MuiInputBase-input": {
                  width: "100% !important",
                },
              }}
            />
          </Search>
          <Button
            variant={allOverride ? "contained" : "outlined"}
            size="small"
            onClick={handleAllClick}
            sx={{
              minWidth: 56,
              height: 40,
              textTransform: "none",
              gridColumn: { xs: "1", sm: "auto" },
              gridRow: { xs: "2", sm: "auto" },
            }}
          >
            All
          </Button>
          <ToggleButtonGroup
            size="small"
            value={view}
            exclusive
            onChange={handleViewChange}
            sx={{
              height: 40,
              gridColumn: { xs: "2", sm: "auto" },
              gridRow: { xs: "2", sm: "auto" },
              justifySelf: { xs: "end", sm: "start" },
            }}
          >
            <ToggleButton value="card" aria-label="card view">
              <Tooltip title="Card view">
                <ViewModuleIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <Tooltip title="Row view">
                <ViewListIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          {create ? (
            <Box
              sx={{
                justifySelf: "end",
                gridColumn: { xs: "2", sm: "auto" },
                gridRow: { xs: "1", sm: "auto" },
                "& > button": { height: 40, whiteSpace: "nowrap" },
              }}
            >
              <AddReservation fetchItems={() => refresh()} />
            </Box>
          ) : null}
        </Box>
        <Box
          sx={{
            mt: 1,
            display: "grid",
            width: "100%",
            gap: 1,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
          }}
        >
          <TextField
            type="date"
            size="small"
            fullWidth
            label="Event date"
            value={dateFilter}
            onChange={handleDateFilterChange}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: dateFilter ? (
                <Tooltip title="Clear date">
                  <IconButton size="small" onClick={clearDateFilter} edge="end" aria-label="clear date">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null,
            }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Agent Type</InputLabel>
            <Select value={agentTypeFilter} label="Agent Type" onChange={handleAgentTypeFilterChange}>
              <MenuItem value="">All agents</MenuItem>
              {agentTypeOptions.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Event Type</InputLabel>
            <Select value={typeFilter} label="Event Type" onChange={handleTypeFilterChange}>
              <MenuItem value="">All</MenuItem>
              {eventTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value="">All</MenuItem>
              {orderedStatuses.map((s, idx) => {
                const color = statusColorOf(s, idx);
                return (
                  <MenuItem key={statusIdOf(s)} value={statusIdOf(s)}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: color,
                          border: "1px solid rgba(0,0,0,0.12)",
                          flexShrink: 0,
                        }}
                      />
                      <span>{statusNameOf(s)}</span>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>First Meeting</InputLabel>
            <Select value={firstMeetingFilter} label="First Meeting" onChange={handleFirstMeetingFilterChange}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Complete</MenuItem>
              <MenuItem value="false">Pending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
        <Grid item xs={12} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
            {view === "card" ? renderCards() : renderTable()}
          </Grid>

          <Grid container justifyContent="space-between" alignItems="center" mt={2} mb={2}>
            <Pagination
              count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
              page={page}
              onChange={handleChangePage}
              color="primary"
              shape="rounded"
            />
            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
              <InputLabel>Page Size</InputLabel>
              <Select value={pageSize} label="Page Size" onChange={handleChangeRowsPerPage}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>

      {selectedItem && update && (
        <EditReservation
          item={selectedItem}
          fetchItems={refresh}
          isOpen
          hideButton
          onClose={() => setSelectedItem(null)}
        />
      )}
    </Box>
  );
}