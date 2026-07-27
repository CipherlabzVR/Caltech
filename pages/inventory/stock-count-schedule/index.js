import React, { useEffect, useMemo, useState } from "react";
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
  Typography,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Box,
  Modal,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import StockCountScheduleFields, {
  STOCK_COUNT_FREQUENCY,
  getDefaultStockCountSchedule,
  getStockCountFrequencyLabel,
  getStockCountScheduleLabel,
  validateStockCountSchedule,
} from "@/components/UIElements/StockCountScheduleFields";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

export default function StockCountSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSchedule, setEditSchedule] = useState(getDefaultStockCountSchedule());
  const [saving, setSaving] = useState(false);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/Items/GetAllStockCountSchedules`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stock count schedules");
      const data = await response.json();
      setSchedules(data.result || []);
    } catch (error) {
      console.error("Error fetching stock count schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return schedules;
    return schedules.filter(
      (s) =>
        (s.itemCode || "").toLowerCase().includes(keyword) ||
        (s.itemName || "").toLowerCase().includes(keyword)
    );
  }, [schedules, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleEditOpen = (row) => {
    setEditItem(row);
    setEditSchedule({
      frequency: row.frequency ?? STOCK_COUNT_FREQUENCY.DAILY,
      dayOfMonth: row.dayOfMonth ?? "",
      month: row.scheduleMonth ?? "",
      day: row.scheduleDay ?? "",
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditItem(null);
    setEditSchedule(getDefaultStockCountSchedule());
  };

  const handleSave = async () => {
    const scheduleError = validateStockCountSchedule(editSchedule);
    if (scheduleError) {
      toast.warning(scheduleError);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ItemId: editItem.itemId,
        Frequency: editSchedule.frequency,
        DayOfMonth:
          editSchedule.frequency === STOCK_COUNT_FREQUENCY.MONTHLY
            ? Number(editSchedule.dayOfMonth)
            : null,
        ScheduleMonth:
          editSchedule.frequency === STOCK_COUNT_FREQUENCY.YEARLY
            ? Number(editSchedule.month)
            : null,
        ScheduleDay:
          editSchedule.frequency === STOCK_COUNT_FREQUENCY.YEARLY
            ? Number(editSchedule.day)
            : null,
      };
      const response = await fetch(`${BASE_URL}/Items/UpdateStockCountSchedule`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success(data.message);
        handleEditClose();
        fetchSchedules();
      } else {
        toast.error(data.message || "Failed to update schedule");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Stock Count Schedule</h1>
        <ul>
          <li>
            <Link href="/inventory/stock-count-schedule/">Stock Count Schedule</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by item code or name.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="stock count schedule table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Schedule</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">
                        No items with stock count involvement found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row, index) => (
                    <TableRow key={row.itemId}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{row.itemCode || "–"}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>
                        {getStockCountFrequencyLabel(
                          row.frequency ?? STOCK_COUNT_FREQUENCY.DAILY
                        )}
                      </TableCell>
                      <TableCell>
                        {getStockCountScheduleLabel(
                          row.frequency ?? STOCK_COUNT_FREQUENCY.DAILY,
                          row.dayOfMonth,
                          row.scheduleMonth,
                          row.scheduleDay
                        )}
                      </TableCell>
                      <TableCell>
                        {row.isItemActive ? (
                          <Chip label="Active" color="success" size="small" />
                        ) : (
                          <Chip label="Inactive" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Schedule" placement="top">
                          <IconButton
                            onClick={() => handleEditOpen(row)}
                            aria-label="edit"
                            size="small"
                          >
                            <BorderColorIcon color="primary" fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <Modal open={editOpen} onClose={handleEditClose}>
        <Box sx={modalStyle} className="bg-black">
          <Typography variant="h5" sx={{ fontWeight: "500", mb: 1 }}>
            Edit Stock Count Schedule
          </Typography>
          {editItem && (
            <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary" }}>
              {[editItem.itemCode, editItem.itemName].filter(Boolean).join(" — ")}
            </Typography>
          )}
          <StockCountScheduleFields schedule={editSchedule} onChange={setEditSchedule} />
          <Box display="flex" mt={3} justifyContent="space-between">
            <Button variant="contained" color="error" size="small" onClick={handleEditClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
