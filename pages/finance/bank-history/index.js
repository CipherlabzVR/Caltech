import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import CreateBankHistory from "./create";
import EditBankHistory from "./edit";
import { FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, Modal, Box, TextField, CircularProgress, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { formatCurrency, formatDate, formatDateWithTime } from "@/components/utils/formatHelper";
import useApi from "@/components/utils/useApi";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";

export default function BankHistory() {
  const cId = sessionStorage.getItem("category");
  const { navigate, print, create, update, remove } = IsPermissionEnabled(cId);
  const [bankHistory, setBankHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [bankId, setBankId] = useState(null);
  const { data: bankList } = useApi("/Bank/GetAllBanks");
  const [banks, setBanks] = useState([]);
  const [openRecalculateModal, setOpenRecalculateModal] = useState(false);
  const [recalculateDate, setRecalculateDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (bankList) {
      setBanks(bankList);
    }
  }, [bankList]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchBankHistory(1, value, pageSize, bankId);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchBankHistory(value, searchTerm, pageSize, bankId);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchBankHistory(1, searchTerm, newSize, bankId);
  };

  const fetchBankHistory = async (page = 1, search = "", size = pageSize, bankId) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/BankHistory/GetAllBankRecords?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&bankId=${bankId}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setBankHistory(data.result.items);
      setTotalCount(data.result.totalCount || 0);

    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    //fetchBankHistory();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  const handleSelectBank = (id) => {
    setBankId(id);
    fetchBankHistory(1, searchTerm, pageSize, id)
  }

  const handleOpenRecalculateModal = () => {
    setRecalculateDate(new Date().toISOString().split('T')[0]);
    setOpenRecalculateModal(true);
  }

  const handleCloseRecalculateModal = () => {
    if (!isRecalculating) {
      setOpenRecalculateModal(false);
    }
  }

  const handleRecalculateBalance = async () => {
    if (!bankId) {
      toast.error("Please select a bank");
      return;
    }
    if (!recalculateDate) {
      toast.error("Please select a date");
      return;
    }

    setIsRecalculating(true);
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/BankHistory/RecalculateRemainingBalanceFromDate?fromDate=${recalculateDate}&bankId=${bankId}`;
      const response = await fetch(query, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Remaining balance recalculated successfully");
        setOpenRecalculateModal(false);
        // Refresh the bank history
        fetchBankHistory(page, searchTerm, pageSize, bankId);
      } else {
        toast.error(data.message || "Failed to recalculate balance");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred while recalculating balance");
    } finally {
      setIsRecalculating(false);
    }
  }

  const handleOpenDeleteDialog = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }

  const handleCloseDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  const handleDeleteBankHistory = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/BankHistory/DeleteBankHistory/${itemToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Bank history deleted successfully");
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        fetchBankHistory(page, searchTerm, pageSize, bankId);
      } else {
        toast.error(data.message || "Failed to delete bank history");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Bank History</h1>
        <ul>
          <li>
            <Link href="/finance/bank-history/">Bank History</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={8} display="flex" gap={1} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
          <Select value={bankId} onChange={(e) => handleSelectBank(e.target.value)} fullWidth size="small">
            {banks.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
              (banks.map((bank, i) => (
                <MenuItem key={i} value={bank.id}>{bank.name} - {bank.accountNo}</MenuItem>
              )))}
          </Select>
        </Grid>
        <Grid item xs={12} lg={4} mb={1} display="flex" justifyContent="end" gap={1} order={{ xs: 1, lg: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleOpenRecalculateModal}
            disabled={!bankId}
          >
            Generate Remaining Balance
          </Button>
          {create ? <CreateBankHistory banks={banks} fetchItems={() => fetchBankHistory(page, searchTerm, pageSize, bankId)} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Cheque Payment</TableCell>
                  <TableCell>Deposit</TableCell>
                  <TableCell>Withdrawal</TableCell>
                  <TableCell>Remaining Balance</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No Records Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bankHistory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.documentNo}
                      </TableCell>
                      <TableCell>{formatDateWithTime(item.createdOn)}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.cashFlowTypeName || "-"}</TableCell>
                      <TableCell >
                        {item.isCheque ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(item.transactionType === 1 ? item.amount : "")}</TableCell>
                      <TableCell>{formatCurrency(item.transactionType === 2 ? item.amount : "")}</TableCell>
                      <TableCell>{formatCurrency(item.remainingBalance)}</TableCell>
                      <TableCell align="right">
                        {update ? <EditBankHistory item={item} banks={banks} fetchItems={() => fetchBankHistory(page, searchTerm, pageSize, bankId)} /> : ""}
                        {remove ? (
                          <Tooltip title="Delete" placement="top">
                            <IconButton
                              onClick={() => handleOpenDeleteDialog(item)}
                              aria-label="delete"
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        ) : ""}
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

      {/* Recalculate Remaining Balance Modal */}
      <Modal
        open={openRecalculateModal}
        onClose={handleCloseRecalculateModal}
        aria-labelledby="recalculate-modal-title"
        aria-describedby="recalculate-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { lg: 400, xs: 350 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: 1,
          }}
          className="bg-black"
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "500",
              mb: 3,
            }}
          >
            Generate Remaining Balance
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography
                sx={{
                  fontWeight: "500",
                  mb: "5px",
                }}
              >
                From Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={recalculateDate}
                onChange={(e) => setRecalculateDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                disabled={isRecalculating}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseRecalculateModal}
              size="small"
              disabled={isRecalculating}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleRecalculateBalance}
              size="small"
              disabled={isRecalculating || !recalculateDate}
              startIcon={isRecalculating ? <CircularProgress size={16} /> : null}
            >
              {isRecalculating ? "Generating..." : "Generate"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this bank history record?
            {itemToDelete && (
              <>
                <br /><br />
                <strong>Document No:</strong> {itemToDelete.documentNo}<br />
                <strong>Description:</strong> {itemToDelete.description}<br />
                <strong>Amount:</strong> {formatCurrency(itemToDelete.amount)}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteBankHistory}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
