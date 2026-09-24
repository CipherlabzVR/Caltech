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
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CakeIcon from "@mui/icons-material/Cake";
import PlaceIcon from "@mui/icons-material/Place";
import EventIcon from "@mui/icons-material/Event";
import GroupsIcon from "@mui/icons-material/Groups";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
import { resolveStatusColor, hexToRgba } from "@/utils/photography/boardTheme";

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

export default function ReservationList() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, update, remove, photoAssignTeam, photoChangeStatus } =
    IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);
  const controller = "PhotographyReservation/DeleteReservation";

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [firstMeetingFilter, setFirstMeetingFilter] = useState("");
  const [view, setView] = useState("card");
  const [selectedItem, setSelectedItem] = useState(null);
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

  // Agent users: only their stage. Non-agent Admin/SuperAdmin (and other non-agents): all.
  const isPhotographyAgent = userAgentType === 1 || userAgentType === 2 || userAgentType === 3;

  const buildFilter = useCallback((type = typeFilter, status = statusFilter, date = dateFilter, firstMeeting = firstMeetingFilter) => {
    const parts = [];
    if (isPhotographyAgent) parts.push(`AgentType:${userAgentType}`);
    if (type) parts.push(`EventType:${type}`);
    if (status) parts.push(`Status:${status}`);
    if (date) parts.push(`Date:${date}`);
    if (firstMeeting !== "") parts.push(`FirstMeetingComplete:${firstMeeting}`);
    return parts.join("|");
  }, [isPhotographyAgent, userAgentType, typeFilter, statusFilter, dateFilter, firstMeetingFilter]);

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

  const agentTypeLabel =
    userAgentType === 1
      ? "Customer Coordinator"
      : userAgentType === 2
        ? "Payment Handler"
        : userAgentType === 3
          ? "After Wedding Manager"
          : null;

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchList(1, event.target.value, pageSize, false, buildFilter());
    setPage(1);
  };

  const handleTypeFilterChange = (event) => {
    const value = event.target.value;
    setTypeFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(value, statusFilter, dateFilter));
  };

  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, value, dateFilter));
  };

  const handleDateFilterChange = (event) => {
    const value = event.target.value || "";
    setDateFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, value));
  };

  const clearDateFilter = () => {
    setDateFilter("");
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, "", firstMeetingFilter));
  };

  const handleFirstMeetingFilterChange = (event) => {
    const value = event.target.value;
    setFirstMeetingFilter(value);
    setPage(1);
    fetchList(1, search, pageSize, false, buildFilter(typeFilter, statusFilter, dateFilter, value));
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchList(value, search, pageSize, false, buildFilter());
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchList(1, search, size, false, buildFilter());
  };

  const refresh = () => fetchList(page, search, pageSize, false, buildFilter());

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
            <Typography variant="caption" sx={{ fontWeight: 700, color: barColor }}>
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
      const typeMeta = eventTypes.find((t) => Number(t.id) === Number(item.eventType));
      const isWedding =
        typeMeta?.consumesWeddingCapacity ||
        typeMeta?.ConsumesWeddingCapacity ||
        item.eventType === 1 ||
        (item.eventTypeName || "").toLowerCase().includes("wedding");
      const statusHex = colorForItem(item);
      const headerBg = `linear-gradient(135deg, ${statusHex} 0%, ${hexToRgba(statusHex, 0.82)} 100%)`;
      return (
        <Grid item xs={12} sm={6} md={3} key={item.id}>
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
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,0.3)", fontWeight: 700, width: 44, height: 44 }}>
                    {initialsOf(item.coupleNames)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                      {item.coupleNames}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {item.cardNo}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  size="small"
                  icon={isWedding ? <FavoriteIcon /> : <CakeIcon />}
                  label={
                    (item.events || []).length > 0
                      ? item.events.map((e) => `${e.eventTypeName}${e.isMainEvent ? " ★" : ""}`).join(" + ")
                      : item.eventTypeName
                  }
                  sx={{
                    bgcolor: "rgba(255,255,255,0.25)",
                    color: "#fff",
                    fontWeight: 600,
                    "& .MuiChip-icon": { color: "#fff" },
                  }}
                />
              </Stack>
            </Box>

            <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EventIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                <Typography variant="body2">
                  {formatDate(item.eventDate)}
                  {item.eventTime ? ` · ${item.eventTime}` : ""}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                <Typography variant="body2" color={item.receptionLocation ? "text.primary" : "text.disabled"}>
                  {item.receptionLocation || "No location"}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <GroupsIcon sx={{ fontSize: 18, color: "text.disabled" }} />
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
              sx={{ px: 1, py: 0.5, display: "flex", justifyContent: "flex-end", alignItems: "center" }}
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
                const isWedding =
                  typeMeta?.consumesWeddingCapacity ||
                  typeMeta?.ConsumesWeddingCapacity ||
                  item.eventType === 1 ||
                  (item.eventTypeName || "").toLowerCase().includes("wedding");
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#4F46E5" }}>
                        {item.cardNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            width: 34,
                            height: 34,
                            fontSize: 13,
                            fontWeight: 700,
                            background: isWedding
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
                              icon={evt.isMainEvent ? <FavoriteIcon /> : <CakeIcon />}
                              label={`${evt.eventTypeName}${evt.isMainEvent ? " ★" : ""}`}
                              color={evt.isMainEvent ? "primary" : "secondary"}
                              variant={evt.isMainEvent ? "filled" : "outlined"}
                            />
                          ))
                        ) : (
                          <Chip
                            size="small"
                            icon={isWedding ? <FavoriteIcon /> : <CakeIcon />}
                            label={item.eventTypeName}
                            color={isWedding ? "primary" : "info"}
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
                    <TableCell align="right">{actionButtons(item)}</TableCell>
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
    <>
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
      {agentTypeLabel && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing reservations for your agent stage: <strong>{agentTypeLabel}</strong>
        </Alert>
      )}
      {!isPhotographyAgent && isAdminUser && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing <strong>all</strong> reservations (Admin)
        </Alert>
      )}
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by name, phone, card no, location…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
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
          flexWrap="wrap"
          order={{ xs: 1, lg: 2 }}
        >
          <ToggleButtonGroup size="small" value={view} exclusive onChange={handleViewChange}>
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
          <TextField
            type="date"
            size="small"
            label="Event date"
            value={dateFilter}
            onChange={handleDateFilterChange}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: "100%", sm: 180 } }}
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
          <FormControl size="small" sx={{ width: { xs: "100%", sm: 160 } }}>
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
          <FormControl size="small" sx={{ width: { xs: "100%", sm: 180 } }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value="">All</MenuItem>
              {orderedStatuses.map((s, idx) => {
                const color = statusColorOf(s, idx);
                return (
                  <MenuItem key={statusIdOf(s)} value={statusIdOf(s)}>
                    <Stack direction="row" spacing={1} alignItems="center">
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
          <FormControl size="small" sx={{ width: { xs: "100%", sm: 160 } }}>
            <InputLabel>First Meeting</InputLabel>
            <Select value={firstMeetingFilter} label="First Meeting" onChange={handleFirstMeetingFilterChange}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">✅ Complete</MenuItem>
              <MenuItem value="false">❌ Pending</MenuItem>
            </Select>
          </FormControl>
          {create ? <AddReservation fetchItems={() => refresh()} /> : ""}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <Grid container spacing={2}>
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

      {selectedItem && (
        <EditReservation
          item={selectedItem}
          fetchItems={refresh}
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          hideButton={true}
        />
      )}
    </>
  );
}
