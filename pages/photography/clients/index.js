import React, { useCallback, useState } from "react";
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
  Box,
  TextField,
  InputAdornment,
  Avatar,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import { ToastContainer } from "react-toastify";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import useApi from "@/components/utils/useApi";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const CATEGORY_ID = 232;

const initialsOf = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const statusColor = (name) => {
  const s = String(name || "").toLowerCase();
  if (s.includes("confirm") || s.includes("complete") || s.includes("approv")) return "success";
  if (s.includes("cancel") || s.includes("reject")) return "error";
  if (s.includes("pending") || s.includes("tentative")) return "warning";
  return "default";
};

export default function ClientsList() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate } = IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: statusData } = useApi("/PhotographyEventStatus/GetActiveStatuses");
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const statuses = Array.isArray(statusData) ? statusData : [];
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];

  const buildFilter = useCallback(
    (type = typeFilter, status = statusFilter) => {
      const parts = [];
      if (type) parts.push(`EventType:${type}`);
      if (status) parts.push(`Status:${status}`);
      return parts.join("|");
    },
    [typeFilter, statusFilter]
  );

  const {
    data: items,
    totalCount,
    loading,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData,
  } = usePaginatedFetch(
    "PhotographyReservation/GetAllReservationPaged",
    "",
    10,
    false,
    false,
    ""
  );

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (pageSize || 10)));

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchData(1, value, pageSize, false, buildFilter());
  };

  const handleTypeFilterChange = (event) => {
    const value = event.target.value;
    setTypeFilter(value);
    setPage(1);
    fetchData(1, search, pageSize, false, buildFilter(value, statusFilter));
  };

  const handleStatusFilterChange = (event) => {
    const value = event.target.value;
    setStatusFilter(value);
    setPage(1);
    fetchData(1, search, pageSize, false, buildFilter(typeFilter, value));
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    fetchData(value, search, pageSize, false, buildFilter());
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchData(1, search, size, false, buildFilter());
  };

  if (navigate === false) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Clients</h1>
        <ul>
          <li>
            <Link href="/">Photography</Link>
          </li>
          <li>Clients</li>
        </ul>
      </div>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, phone, location..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Event Type</InputLabel>
            <Select
              value={typeFilter}
              label="Event Type"
              onChange={handleTypeFilterChange}
            >
              <MenuItem value="">All Types</MenuItem>
              {eventTypes.map((t) => (
                <MenuItem key={t.id || t.Id} value={t.id || t.Id}>
                  {t.name || t.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map((s) => (
                <MenuItem key={s.id || s.Id} value={s.id || s.Id}>
                  {s.name || s.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Paper sx={{ boxShadow: "none", borderRadius: "10px", mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ background: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : !items || items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No clients found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id || item.Id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "#4F46E5", width: 36, height: 36, fontSize: 14 }}>
                          {initialsOf(item.coupleNames || item.CoupleNames)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {item.coupleNames || item.CoupleNames || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{item.cardNo || item.CardNo || item.id || item.Id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {item.customerMobileNo || item.CustomerMobileNo || "-"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.eventTypeName || item.EventTypeName || "-"}
                        sx={{ fontSize: 12 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <EventIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {formatDate(item.eventDate || item.EventDate)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.receptionLocation ||
                            item.ReceptionLocation ||
                            item.clientLocalAddress ||
                            item.ClientLocalAddress ||
                            "-"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.currentStatusName || item.CurrentStatusName || "-"}
                        color={statusColor(item.currentStatusName || item.CurrentStatusName)}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            shape="rounded"
            color="primary"
          />
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel>Page Size</InputLabel>
            <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>
    </>
  );
}
