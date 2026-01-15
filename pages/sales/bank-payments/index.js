import React, { useState } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

export default function BankPayments() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const {
    data: bankPayments,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchBankPayments,
  } = usePaginatedFetch("BankHistory/GetAllBankPaymentsResult");

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchBankPayments(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchBankPayments(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchBankPayments(1, search, size);
  };

  const handleOpenApprove = (item) => {
    setSelectedRecord(item);
    setApproveModalOpen(true);
  };

  const handleOpenReject = (item) => {
    setSelectedRecord(item);
    setRejectReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  const handleCloseApprove = () => {
    setApproveModalOpen(false);
    setSelectedRecord(null);
  };

  const handleCloseReject = () => {
    setRejectModalOpen(false);
    setSelectedRecord(null);
    setRejectReason("");
    setRejectError("");
  };

  const handleConfirmApprove = async () => {
    if (!selectedRecord) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/BankHistory/ApproveBankPaymentStatusAsync?id=${selectedRecord.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await response.text();
      let payload = text;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (error) {
        // keep text as fallback
      }

      if (!response.ok) {
        throw new Error("Failed to approve bank payments");
      }

      fetchBankPayments(page, search, pageSize);
    } catch (error) {
      console.error("Approve error:", error);
    } finally {
      handleCloseApprove();
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRecord) return;
    if (!rejectReason.trim()) {
      setRejectError("Reason is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/BankHistory/RejectBankPaymentStatusAsync?id=${selectedRecord.id}&reason=${encodeURIComponent(rejectReason.trim())}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const text = await response.text();
      let payload = text;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (error) {
        // keep text fallback
      }

      if (!response.ok) {
        throw new Error("Failed to reject bank payments");
      }

      fetchBankPayments(page, search, pageSize);
    } catch (error) {
      console.error("Reject error:", error);
    } finally {
      handleCloseReject();
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Bank Payments</h1>
        <ul>
          <li>
            <Link href="/sales/bank-payments/">Bank Payments</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by Shift or Bank.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Shift</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Bank</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No Data Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bankPayments.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.shiftCode}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.bankName || "-"}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.createdUser}</TableCell>
                      <TableCell>
                        {item.status === 2 ? <span className="successBadge">Approved</span> : (item.status === 3 ? <span className="dangerBadge">Rejected</span> : "Pending")}
                      </TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell align="right">
                        {item.status === 3 ? item.rejectedReason : ""}
                        {update && item.status !== 2 && item.status !== 3 && (
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="contained" color="success" size="small" onClick={() => handleOpenApprove(item)}>
                              Approve
                            </Button>
                            <Button variant="outlined" color="error" size="small" onClick={() => handleOpenReject(item)}>
                              Reject
                            </Button>
                          </Stack>
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
      <Dialog open={approveModalOpen} onClose={handleCloseApprove} maxWidth="xs" fullWidth>
        <DialogTitle>Approve Bank Payment</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to approve {selectedRecord?.description ? `"${selectedRecord.description}"` : "this record"}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApprove} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmApprove} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={rejectModalOpen} onClose={handleCloseReject} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Bank Payment</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Please provide a reason for rejecting {selectedRecord?.description ? `"${selectedRecord.description}"` : "this record"}.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Reason"
            multiline
            minRows={2}
            value={rejectReason}
            onChange={(event) => {
              setRejectReason(event.target.value);
              if (rejectError) setRejectError("");
            }}
            error={Boolean(rejectError)}
            helperText={rejectError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReject} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error">
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}