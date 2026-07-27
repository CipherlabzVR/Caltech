import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import * as XLSX from "xlsx";
import { format } from "date-fns";
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
  Box,
  Button,
  Chip,
  TextField,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { ToastContainer, toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const PAGE_SIZE = 10;

const formatDisplayDate = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch (error) {
    return "-";
  }
};

const formatDisplayDateTime = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy hh:mm a");
  } catch (error) {
    return "-";
  }
};

const toSnapshotDateParam = (value) => {
  if (!value) return "";
  return encodeURIComponent(String(value));
};

export default function DailyOutstandings() {
  const router = useRouter();
  const cId =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, print } = IsPermissionEnabled(cId);

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().slice(0, 10);
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetDailyCustomerOutstandingSummaryRange?fromDate=2000-01-01&toDate=${today}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json().catch(() => null);
      const rows = Array.isArray(data?.result) ? data.result : [];
      // Show most recent day first.
      rows.sort((a, b) => new Date(b.snapshotDate) - new Date(a.snapshotDate));
      setSummaries(rows);
    } catch (error) {
      console.error("Error fetching daily outstanding summaries:", error);
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (snapshotDate) => {
    setSelectedDate(snapshotDate);
    setDialogOpen(true);
    setDetail(null);
    try {
      setDetailLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetDailyCustomerOutstandingBreakdown?snapshotDate=${toSnapshotDateParam(snapshotDate)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json().catch(() => null);
      setDetail(data?.result ?? null);
    } catch (error) {
      console.error("Error fetching breakdown:", error);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const exportBreakdownToExcel = (date, customers) => {
    if (!customers || customers.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    const rows = customers.map((c, index) => ({
      "#": index + 1,
      "Customer Name": c.customerName,
      "Outstanding Amount": Number(c.outstandingAmount ?? 0),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 6 }, { wch: 32 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, `Daily_Outstanding_${date}.xlsx`);
    toast.success(`Exported ${rows.length} customer(s)`);
  };

  const handleExportDetail = () =>
    exportBreakdownToExcel(selectedDate, detail?.customers ?? []);

  // Fetches a single day's breakdown then exports it to Excel (row-level action).
  const handleExportDay = async (snapshotDate) => {
    const dateLabel = (snapshotDate || "").slice(0, 10);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetDailyCustomerOutstandingBreakdown?snapshotDate=${toSnapshotDateParam(snapshotDate)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json().catch(() => null);
      exportBreakdownToExcel(dateLabel, data?.result?.customers ?? []);
    } catch (error) {
      console.error("Error exporting day:", error);
      toast.error("Failed to export.");
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const filteredSummaries = filterDate
    ? summaries.filter((s) => (s.snapshotDate || "").slice(0, 10) === filterDate)
    : summaries;
  const pageCount = Math.ceil(filteredSummaries.length / PAGE_SIZE) || 1;
  const pagedSummaries = filteredSummaries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const detailCustomers = detail?.customers ?? [];

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Daily Outstandings</h1>
        <ul>
          <li>
            <Link href="/sales/daily-outstandings/">Daily Outstandings</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 2 }}>
        <Grid item xs={12}>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={1}>
            <TextField
              label="Search by Date"
              type="date"
              size="small"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            {filterDate && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setFilterDate("");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="daily outstanding summary table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Snapshot Date</TableCell>
                  <TableCell align="right">Total Customers</TableCell>
                  <TableCell align="right">Total Outstanding</TableCell>
                  <TableCell align="center">Source</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={24} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : pagedSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">
                        No daily outstanding snapshots available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedSummaries.map((item, index) => (
                    <TableRow
                      key={`${item.snapshotDate}-${index}`}
                      hover
                      onDoubleClick={() => openDetail(item.snapshotDate)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell>{formatDisplayDateTime(item.snapshotDate)}</TableCell>
                      <TableCell align="right">{item.customerCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.totalOutstandingAmount)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.isFromSnapshot ? "Snapshot" : "Live"}
                          color={item.isFromSnapshot ? "primary" : "warning"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          <Tooltip title="Download Excel" placement="top">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportDay(item.snapshotDate);
                              }}
                            >
                              <DownloadIcon color="primary" fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {print && (
                            <Tooltip title="Report" placement="top">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/sales/daily-outstandings/print?date=${toSnapshotDateParam(
                                      item.snapshotDate
                                    )}`
                                  );
                                }}
                              >
                                <LocalPrintshopIcon color="primary" fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="flex-start" mt={2} mb={2} ml={1}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          Outstanding Breakdown - {formatDisplayDateTime(selectedDate)}
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box display="flex" gap={3} mb={2} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Customers
                  </Typography>
                  <Typography variant="h6">
                    {detail?.customerCount ?? 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Outstanding
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(detail?.totalOutstandingAmount ?? 0)}
                  </Typography>
                </Box>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Customer Name</TableCell>
                      <TableCell align="right">Outstanding Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="error">
                            No outstanding customers for this date
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailCustomers.map((c, index) => (
                        <TableRow key={c.id || `${c.customerId}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{c.customerName}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(c.outstandingAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleExportDetail}
            disabled={detailLoading || detailCustomers.length === 0}
          >
            Excel
          </Button>
          {print && (
            <Button
              startIcon={<LocalPrintshopIcon />}
              onClick={() =>
                router.push(
                  `/sales/daily-outstandings/print?date=${toSnapshotDateParam(selectedDate)}`
                )
              }
              disabled={detailLoading || detailCustomers.length === 0}
            >
              Print
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
