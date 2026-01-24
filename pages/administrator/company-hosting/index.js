import React, { useState } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  TextField,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageIcon from "@mui/icons-material/Image";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatCurrency } from "@/components/utils/formatHelper";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";

export default function CompanyHosting() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const {
    data: hostingFees,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchHostingFees,
  } = usePaginatedFetch("Company/GetAllCompanyHostingFees", "", 10, false);

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceUrl, setSelectedInvoiceUrl] = useState("");

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchHostingFees(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchHostingFees(1, search, size);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchHostingFees(1, value, pageSize);
  };

  const getStatusName = (status) => {
    switch (Number(status)) {
      case 1:
        return "Pending";
      case 2:
        return "Approved";
      case 3:
        return "Rejected";
      default:
        return "-";
    }
  };

  console.log(hostingFees);

  const getMonthName = (month) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthNum = Number(month);
    if (monthNum >= 1 && monthNum <= 12) {
      return months[monthNum - 1];
    }
    return "";
  };

  const formatBillingPeriod = (month, year) => {
    const monthName = getMonthName(month);
    return monthName && year ? `${monthName} ${year}` : "-";
  };

  const handleOpenApproveDialog = (id) => {
    setSelectedId(id);
    setApproveDialogOpen(true);
  };

  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setSelectedId(null);
  };

  const handleOpenRejectDialog = (id) => {
    setSelectedId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedId(null);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Company/ApproveCompanyHostingFee`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedId,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Hosting fee approved successfully");
        handleCloseApproveDialog();
        fetchHostingFees(page, search, pageSize);
      } else {
        toast.error(data.message || "Failed to approve hosting fee");
      }
    } catch (error) {
      console.error("Error approving hosting fee:", error);
      toast.error("An error occurred while approving hosting fee");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/Company/RejectCompanyHostingFee`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: selectedId,
            reason: rejectionReason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Hosting fee rejected successfully");
        handleCloseRejectDialog();
        fetchHostingFees(page, search, pageSize);
      } else {
        toast.error(data.message || "Failed to reject hosting fee");
      }
    } catch (error) {
      console.error("Error rejecting hosting fee:", error);
      toast.error("An error occurred while rejecting hosting fee");
    }
  };

  const handleOpenInvoiceDialog = (invoiceUrl) => {
    setSelectedInvoiceUrl(invoiceUrl);
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedInvoiceUrl("");
  };


  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Company Hosting Fees</h1>
        <ul>
          <li>
            <Link href="/administrator">Administrator</Link>
          </li>
          <li>Company Hosting Fees</li>
        </ul>
      </div>
      <ToastContainer />
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="hosting fees table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Document No</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Hosting Fee</TableCell>
                  <TableCell>Billing Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Rejection Reason</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hostingFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No hosting fees available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  hostingFees.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{item.documentNo || "-"}</TableCell>
                      <TableCell>{item.company?.name || "-"}</TableCell>
                      <TableCell>{formatCurrency(item.hostingFee)}</TableCell>
                      <TableCell>{formatBillingPeriod(item.month, item.year)}</TableCell>
                      <TableCell>
                        <Typography
                          color={
                            item.status === 1
                              ? "warning.main"
                              : item.status === 2
                              ? "success.main"
                              : "error.main"
                          }
                          variant="body2"
                          fontWeight={500}
                        >
                          {getStatusName(item.status)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.invoiceUrl ? (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenInvoiceDialog(item.invoiceUrl)}
                          >
                            <ImageIcon fontSize="inherit" />
                          </IconButton>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.rejectionReason ? (
                          <Typography variant="body2" color="error">
                            {item.rejectionReason}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.status === 1 && (
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleOpenApproveDialog(item.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleOpenRejectDialog(item.id)}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleCloseApproveDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Approve Hosting Fee</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to approve this hosting fee payment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog} color="inherit">
            No
          </Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Yes, Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Hosting Fee</DialogTitle>
        <DialogContent dividers>
          <DialogContentText mb={2}>
            Are you sure you want to reject this hosting fee payment? Please enter a reason for rejection.
          </DialogContentText>
          <TextField
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please enter reason"
            fullWidth
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Yes, Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onClose={handleCloseInvoiceDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Payment Invoice</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              minHeight: "400px",
            }}
          >
            {selectedInvoiceUrl && (
              <img
                src={selectedInvoiceUrl}
                alt="Payment Invoice"
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
