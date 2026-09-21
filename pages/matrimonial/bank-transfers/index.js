import React, { useEffect, useState } from "react";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Pagination,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import UndoIcon from "@mui/icons-material/Undo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Tooltip from "@mui/material/Tooltip";
import { formatDate } from "@/components/utils/formatHelper";

const BANK_TRANSFER_UNDO_WINDOW_HOURS = 24;

const getStatusChip = (status) => {
  const code = Number(status);
  switch (code) {
    case 1:
      return <Chip label="Pending" size="small" color="warning" variant="outlined" />;
    case 2:
      return <Chip label="Approved" size="small" color="success" variant="outlined" />;
    case 3:
      return <Chip label="Rejected" size="small" color="error" variant="outlined" />;
    default:
      return <Chip label="Unknown" size="small" />;
  }
};

const getTransferStatus = (item) => Number(item?.status ?? item?.Status ?? 0);

/** Action timestamp used for the 24h undo window (approval → ApprovedOn; rejection → UpdatedOn). */
const getTransferActionedOn = (item) => {
  if (!item) return null;
  const status = getTransferStatus(item);
  if (status === 2) {
    return item.approvedOn ?? item.ApprovedOn ?? null;
  }
  if (status === 3) {
    return item.updatedOn ?? item.UpdatedOn ?? item.createdOn ?? item.CreatedOn ?? null;
  }
  return null;
};

const canUndoBankTransfer = (item) => {
  const status = getTransferStatus(item);
  if (status !== 2 && status !== 3) return false;
  const raw = getTransferActionedOn(item);
  if (!raw) return false;
  const actioned = new Date(raw);
  if (Number.isNaN(actioned.getTime())) return false;
  const elapsedMs = Date.now() - actioned.getTime();
  return elapsedMs >= 0 && elapsedMs <= BANK_TRANSFER_UNDO_WINDOW_HOURS * 60 * 60 * 1000;
};

const getUndoDisabledReason = (item) => {
  const status = getTransferStatus(item);
  if (status !== 2 && status !== 3) return "Only approved or rejected requests can be undone.";
  const raw = getTransferActionedOn(item);
  if (!raw) {
    return status === 2
      ? "Approval time is missing — undo is not available."
      : "Rejection time is missing — undo is not available.";
  }
  if (canUndoBankTransfer(item)) return "";
  return `Undo is only allowed within ${BANK_TRANSFER_UNDO_WINDOW_HOURS} hours of ${
    status === 2 ? "approval" : "rejection"
  }.`;
};

const isPdfSlipUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const path = url.split("?")[0].toLowerCase();
  return path.endsWith(".pdf");
};

/** Must match SidebarData Matrimonial → Bank Transfer Approvals categoryId. */
const MATRIMONIAL_CATEGORY_BANK_TRANSFERS = 173;

export default function BankTransferApprovals() {
  const { navigate, update, permissionsLoading } = IsPermissionEnabled(
    MATRIMONIAL_CATEGORY_BANK_TRANSFERS
  );
  const [transfers, setTransfers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(1);
  const [purposeFilter, setPurposeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionRemark, setActionRemark] = useState("");
  const [actionItem, setActionItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const showRejectedReasonColumn = Number(statusFilter) === 3;
  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const buildDateFilter = (from, to) => {
    const parts = [];
    if (from) parts.push(`dateFrom:${from}`);
    if (to) parts.push(`dateTo:${to}`);
    return parts.length ? parts.join(";") : "";
  };

  const getDateFilterHint = () => {
    if (Number(statusFilter) === 2) return "Filters by approval date";
    if (Number(statusFilter) === 3) return "Filters by rejection date";
    return "Filters by submitted date";
  };

  const fetchTransfers = async (
    currentPage = page,
    currentRowsPerPage = rowsPerPage,
    currentSearch = searchTerm,
    currentStatus = statusFilter,
    currentPurpose = purposeFilter,
    currentDateFrom = dateFrom,
    currentDateTo = dateTo
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const skipCount = currentPage * currentRowsPerPage;
      const searchValue = currentSearch?.trim() ? encodeURIComponent(currentSearch.trim()) : "null";
      let url = `${BASE_URL}/Matrimonial/GetAllBankTransfersPaged?SkipCount=${skipCount}&MaxResultCount=${currentRowsPerPage}&Search=${searchValue}`;
      if (currentStatus) url += `&status=${currentStatus}`;
      if (currentPurpose !== "" && currentPurpose != null) url += `&paymentPurpose=${currentPurpose}`;
      const filterValue = buildDateFilter(currentDateFrom, currentDateTo);
      if (filterValue) url += `&Filter=${encodeURIComponent(filterValue)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      const wrap = data?.result ?? data?.Result ?? {};
      const items = wrap.items ?? wrap.Items ?? [];
      setTransfers(Array.isArray(items) ? items : []);
      setTotalCount(Number(wrap.totalCount ?? wrap.TotalCount ?? 0) || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch bank transfer requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("category", String(MATRIMONIAL_CATEGORY_BANK_TRANSFERS));
  }, []);

  useEffect(() => {
    if (permissionsLoading || !navigate) return;
    fetchTransfers(page, rowsPerPage, searchTerm, statusFilter, purposeFilter, dateFrom, dateTo);
  }, [permissionsLoading, navigate, page, rowsPerPage, searchTerm, statusFilter, purposeFilter, dateFrom, dateTo]);




  const {
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleChangePage,
    handleChangeRowsPerPage,
  } = usePaginationHandlers({
    page,
    pageSize: rowsPerPage,
    totalCount,
    search: searchTerm,
    setPage,
    setPageSize: setRowsPerPage,
    onSearchValueChange: setSearchTerm,
    zeroBasedPage: true,
    onFetch: () => {},
  });
  const handleView = (transfer) => {
    setSelectedTransfer(transfer);
    setViewDialogOpen(true);
  };

  const openActionDialog = (type, item) => {
    setActionType(type);
    setActionItem(item);
    setActionRemark("");
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!actionItem) return;
    if (actionType === "undo") {
      if (!actionRemark.trim()) {
        toast.error("Undo reason is required.");
        return;
      }
      if (!canUndoBankTransfer(actionItem)) {
        toast.error(getUndoDisabledReason(actionItem) || "Undo is no longer available for this request.");
        return;
      }
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        actionType === "approve"
          ? "ApproveBankTransfer"
          : actionType === "reject"
            ? "RejectBankTransfer"
            : "UndoBankTransfer";
      const response = await fetch(`${BASE_URL}/Matrimonial/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: actionItem.id ?? actionItem.Id,
          remark: actionRemark,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === 1) {
        const base =
          data.message ||
          (actionType === "undo"
            ? "Bank transfer action undone successfully."
            : `Bank transfer ${actionType}d successfully.`);
        const purposeText =
          actionItem?.paymentPurposeText ??
          actionItem?.PaymentPurposeText ??
          (Number(actionItem?.paymentPurpose ?? actionItem?.PaymentPurpose) === 1
            ? "Sub-account"
            : Number(actionItem?.paymentPurpose ?? actionItem?.PaymentPurpose) === 2
              ? "Matchmaker"
              : "Premium");
        const memberNote =
          actionType === "approve"
            ? purposeText === "Sub-account"
              ? " A sub-account slot has been added to the parent account."
              : purposeText === "Matchmaker"
                ? " The matchmaker subscription is now active."
                : " The member now has premium access and receives a confirmation by email."
            : "";
        toast.success(`${base}${memberNote}`);
        setActionDialogOpen(false);
        fetchTransfers();
      } else {
        toast.error(
          data.message ||
            (actionType === "undo"
              ? "Failed to undo bank transfer action."
              : `Failed to ${actionType} bank transfer.`)
        );
      }
    } catch (error) {
      toast.error(
        actionType === "undo"
          ? "Failed to undo bank transfer action."
          : `Failed to ${actionType} bank transfer.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (permissionsLoading) {
    return null;
  }

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Bank Transfer Approvals</h1>
        <ul>
          <li>
            <Link href="/matrimonial/bank-transfers/">Bank Transfer Approvals</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <ToastContainer />
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by name, email, phone..."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={6} lg={2} order={{ xs: 3, lg: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={1}>Pending</MenuItem>
              <MenuItem value={2}>Approved</MenuItem>
              <MenuItem value={3}>Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} lg={2} order={{ xs: 4, lg: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Payment type</InputLabel>
            <Select
              value={purposeFilter}
              label="Payment type"
              onChange={(e) => { setPurposeFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={0}>Premium</MenuItem>
              <MenuItem value={1}>Sub-account</MenuItem>
              <MenuItem value={2}>Matchmaker</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} lg={2} order={{ xs: 5, lg: 4 }}>
          <TextField
            fullWidth
            label="From date"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: today }}
          />
        </Grid>
        <Grid item xs={6} lg={2} order={{ xs: 6, lg: 5 }}>
          <TextField
            fullWidth
            label="To date"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: today }}
          />
        </Grid>
        <Grid item xs={12} lg={2} order={{ xs: 7, lg: 6 }} display="flex" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {getDateFilterHint()}
          </Typography>
        </Grid>
        <Grid item xs={12} lg={2} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 7 }}>
        </Grid>

        <Grid item xs={12} order={{ xs: 8, lg: 8 }}>
          <TableContainer component={Paper}>
            <Table aria-label="bank transfers table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  {showRejectedReasonColumn && <TableCell>Rejected Reason</TableCell>}
                  <TableCell align="center">View slip</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showRejectedReasonColumn ? 11 : 10}>
                      <Typography color="error">
                        {loading ? "Loading..." : "No Bank Transfer Requests"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((item, index) => (
                    <TableRow key={item.id ?? item.Id ?? index}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{item.userName}</TableCell>
                      <TableCell>{item.userEmail || "-"}</TableCell>
                      <TableCell>{item.userPhone || "-"}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={
                            item.paymentPurposeText ??
                            item.PaymentPurposeText ??
                            (Number(item.paymentPurpose ?? item.PaymentPurpose) === 1
                              ? "Sub-account"
                              : Number(item.paymentPurpose ?? item.PaymentPurpose) === 2
                                ? "Matchmaker"
                                : "Premium")
                          }
                          color={
                            Number(item.paymentPurpose ?? item.PaymentPurpose) === 1
                              ? "secondary"
                              : Number(item.paymentPurpose ?? item.PaymentPurpose) === 2
                                ? "info"
                                : "primary"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        LKR {parseFloat(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">{getStatusChip(getTransferStatus(item))}</TableCell>
                      <TableCell>{item.createdOn ? formatDate(item.createdOn) : "-"}</TableCell>
                      {showRejectedReasonColumn && (
                        <TableCell>{item.rejectReason || "-"}</TableCell>
                      )}
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleView(item)}
                          aria-label="View slip"
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            px: 1.75,
                            py: 0.6,
                            boxShadow: 2,
                            "&:hover": { boxShadow: 4 },
                          }}
                        >
                          View slip
                        </Button>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={0.5} alignItems="center" flexWrap="wrap">
                          {getTransferStatus(item) === 1 && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => openActionDialog("approve", item)}
                                sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.3, px: 1 }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => openActionDialog("reject", item)}
                                sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.3, px: 1 }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {getTransferStatus(item) !== 1 && update && (
                            <Tooltip title={canUndoBankTransfer(item) ? "Undo within 24 hours" : getUndoDisabledReason(item)}>
                              <span>
                                <Button
                                  variant="outlined"
                                  color="warning"
                                  size="small"
                                  startIcon={<UndoIcon />}
                                  disabled={!canUndoBankTransfer(item)}
                                  onClick={() => openActionDialog("undo", item)}
                                  sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.3, px: 1 }}
                                >
                                  Undo
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                          {getTransferStatus(item) !== 1 && !update && (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / rowsPerPage))}
                page={page + 1}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Page Size"
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth aria-labelledby="view-slip-dialog-title">
        <DialogTitle id="view-slip-dialog-title">
          <Typography variant="h6" component="div" fontWeight={700}>
            View slip
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            Bank transfer request details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedTransfer && (
            <Box>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={2} mt={1}>
                <Typography variant="body2" color="text.secondary">Name:</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedTransfer.userName}</Typography>
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body2">{selectedTransfer.userEmail || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">Phone:</Typography>
                <Typography variant="body2">{selectedTransfer.userPhone || "-"}</Typography>
                <Typography variant="body2" color="text.secondary">Amount:</Typography>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  LKR {parseFloat(selectedTransfer.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Box>{getStatusChip(selectedTransfer.status)}</Box>
                <Typography variant="body2" color="text.secondary">Submitted:</Typography>
                <Typography variant="body2">{selectedTransfer.createdOn ? formatDate(selectedTransfer.createdOn) : "-"}</Typography>
                {selectedTransfer.remarks && (
                  <>
                    <Typography variant="body2" color="text.secondary">Remarks:</Typography>
                    <Typography variant="body2">{selectedTransfer.remarks}</Typography>
                  </>
                )}
                {selectedTransfer.approvedByName && (
                  <>
                    <Typography variant="body2" color="text.secondary">Actioned By:</Typography>
                    <Typography variant="body2">{selectedTransfer.approvedByName}</Typography>
                  </>
                )}
                {selectedTransfer.approvedOn && (
                  <>
                    <Typography variant="body2" color="text.secondary">Actioned On:</Typography>
                    <Typography variant="body2">{formatDate(selectedTransfer.approvedOn)}</Typography>
                  </>
                )}
                {selectedTransfer.approvalRemark && (
                  <>
                    <Typography variant="body2" color="text.secondary">Approval Remark:</Typography>
                    <Typography variant="body2">{selectedTransfer.approvalRemark}</Typography>
                  </>
                )}
                {selectedTransfer.rejectReason && (
                  <>
                    <Typography variant="body2" color="text.secondary">Reject Reason:</Typography>
                    <Typography variant="body2" color="error">{selectedTransfer.rejectReason}</Typography>
                  </>
                )}
              </Box>
              {selectedTransfer.paySlipUrl && (
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight={600} color="primary" mb={1}>
                    View slip
                  </Typography>
                  <Box
                    sx={{
                      border: "1px solid #ddd",
                      borderRadius: 2,
                      overflow: "hidden",
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      p: 1,
                    }}
                  >
                    {isPdfSlipUrl(selectedTransfer.paySlipUrl) ? (
                      <Box>
                        <iframe
                          src={selectedTransfer.paySlipUrl}
                          title="Bank Transfer Slip PDF"
                          style={{ width: "100%", height: 480, border: "none", background: "#fff" }}
                        />
                        <Typography variant="body2" mt={1}>
                          PDF slip —{" "}
                          <a href={selectedTransfer.paySlipUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2" }}>
                            Open PDF in New Tab
                          </a>
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <img
                          src={selectedTransfer.paySlipUrl}
                          alt="Bank Transfer Slip"
                          style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                          }}
                        />
                        <Box sx={{ display: "none" }}>
                          <Typography variant="body2" mt={1}>
                            <a href={selectedTransfer.paySlipUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2" }}>
                              Open Slip in New Tab
                            </a>
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                  <Box textAlign="center" mt={1}>
                    <a href={selectedTransfer.paySlipUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", fontSize: "0.85rem" }}>
                      {isPdfSlipUrl(selectedTransfer.paySlipUrl) ? "Open PDF in full size" : "Open in full size"}
                    </a>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedTransfer?.status === 1 && update && (
            <>
              <Button color="success" variant="contained" size="small" onClick={() => { setViewDialogOpen(false); openActionDialog("approve", selectedTransfer); }}>
                Approve
              </Button>
              <Button color="error" variant="contained" size="small" onClick={() => { setViewDialogOpen(false); openActionDialog("reject", selectedTransfer); }}>
                Reject
              </Button>
            </>
          )}
          {selectedTransfer?.status !== 1 && update && (
            <Tooltip
              title={
                canUndoBankTransfer(selectedTransfer)
                  ? "Undo within 24 hours"
                  : getUndoDisabledReason(selectedTransfer)
              }
            >
              <span>
                <Button
                  color="warning"
                  variant="outlined"
                  size="small"
                  startIcon={<UndoIcon />}
                  disabled={!canUndoBankTransfer(selectedTransfer)}
                  onClick={() => {
                    setViewDialogOpen(false);
                    openActionDialog("undo", selectedTransfer);
                  }}
                >
                  Undo
                </Button>
              </span>
            </Tooltip>
          )}
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {actionType === "approve"
            ? "Approve Bank Transfer"
            : actionType === "reject"
              ? "Reject Bank Transfer"
              : "Undo Bank Transfer Action"}
        </DialogTitle>
        <DialogContent>
          {actionItem && (
            <Box mt={1}>
              <Typography variant="body2" mb={2}>
                {actionType === "approve"
                  ? `Are you sure you want to approve the bank transfer from ${actionItem.userName} for LKR ${parseFloat(actionItem.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}? This will activate their premium subscription.`
                  : actionType === "reject"
                    ? `Are you sure you want to reject the bank transfer from ${actionItem.userName}?`
                    : actionItem.status === 2
                      ? `Undo approval for ${actionItem.userName}? The request will return to Pending. If this was their only approved payment, their subscription will be deactivated. The member will be notified with your undo reason.`
                      : `Undo rejection for ${actionItem.userName}? The request will return to Pending so it can be reviewed again. The member will be notified with your undo reason.`
                }
              </Typography>
              {actionType === "undo" && (
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  Undo is only available within {BANK_TRANSFER_UNDO_WINDOW_HOURS} hours of approval/rejection.
                </Typography>
              )}
              {(actionType === "approve" || actionType === "reject" || actionType === "undo") && (
                <TextField
                  fullWidth
                  size="small"
                  label={
                    actionType === "approve"
                      ? "Approval Remark (Optional)"
                      : actionType === "reject"
                        ? "Rejection Reason"
                        : "Undo Reason"
                  }
                  value={actionRemark}
                  onChange={(e) => setActionRemark(e.target.value)}
                  multiline
                  rows={2}
                  required={actionType === "reject" || actionType === "undo"}
                  helperText={
                    actionType === "undo"
                      ? "This reason is shown to the member in their VivahaBandhu notifications."
                      : undefined
                  }
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === "approve" ? "success" : actionType === "reject" ? "error" : "warning"}
            onClick={handleAction}
            disabled={
              actionLoading
              || (actionType === "reject" && !actionRemark.trim())
              || (actionType === "undo" && (!actionRemark.trim() || !canUndoBankTransfer(actionItem)))
            }
          >
            {actionLoading
              ? "Processing..."
              : actionType === "approve"
                ? "Approve"
                : actionType === "reject"
                  ? "Reject"
                  : "Undo"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
