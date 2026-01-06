import React from "react";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SendIcon from "@mui/icons-material/Send";
import Button from "@mui/material/Button";
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select } from "@mui/material";
import Chip from "@mui/material/Chip";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddAccountModal from "./create";
import EditAccountModal from "./edit";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import useAccountTypes from "../../../hooks/useAccountTypes";
import BASE_URL from "Base/api";

export default function AccountsList() {
  const {
    data: accounts,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchAccounts,
  } = usePaginatedFetch("CRMAccounts/GetAllCRMAccounts", "", 10, false, false);
  const { accountTypes } = useAccountTypes();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = React.useState(false);
  const [selectedAccountForVerification, setSelectedAccountForVerification] = React.useState(null);
  const [verificationLoading, setVerificationLoading] = React.useState(false);

  const accountTypeMap = React.useMemo(() => {
    const map = {};
    accountTypes.forEach((type) => {
      map[String(type.id)] = type.label;
    });
    return map;
  }, [accountTypes]);

  const refreshAccounts = React.useCallback(
    (targetPage = page) => {
      fetchAccounts(targetPage, search, pageSize, false);
    },
    [fetchAccounts, page, pageSize, search]
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchAccounts(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchAccounts(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchAccounts(1, search, size, false);
  };

  const handleDeleteClick = (account) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAccount?.id) {
      toast.error("Unable to determine account to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/CRMAccounts/DeleteCRMAccount?id=${selectedAccount.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete account");
      }

      toast.success(data?.message || "Account deleted successfully.");
      handleCloseDialog();
      refreshAccounts(page);
    } catch (error) {
      toast.error(error.message || "Unable to delete account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendVerificationClick = (account) => {
    setSelectedAccountForVerification(account);
    setIsVerificationDialogOpen(true);
  };

  const handleCloseVerificationDialog = () => {
    setIsVerificationDialogOpen(false);
    setSelectedAccountForVerification(null);
  };

  const handleConfirmSendVerification = async () => {
    if (!selectedAccountForVerification?.email) {
      toast.error("Unable to determine account email for verification.");
      return;
    }

    try {
      setVerificationLoading(true);

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const verificationLink = `${baseUrl}/verified?accountId=${selectedAccountForVerification.id}`;
      const email = selectedAccountForVerification.email;
      const accountName = selectedAccountForVerification.accountName || "";

      const apiUrl = `${BASE_URL}/Email/SendAccountVerificationEmail?email=${encodeURIComponent(email)}&accountName=${encodeURIComponent(accountName)}&verificationLink=${encodeURIComponent(verificationLink)}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send verification email");
      }

      toast.success(data?.message || "Verification email sent successfully.");
      handleCloseVerificationDialog();
      refreshAccounts(page);
    } catch (error) {
      toast.error(error.message || "Unable to send verification email");
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Accounts</h1>
        <ul>
          <li>
            <Link href="/crm/accounts/">Accounts</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search accounts..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <AddAccountModal
            onAccountCreated={() => {
              setPage(1);
              refreshAccounts(1);
            }}
          />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="accounts table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Contact Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Note</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No accounts available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => {
                    return (
                      <TableRow key={account.id}>
                        <TableCell>{account.accountName || "-"}</TableCell>
                        <TableCell>{account.industry}</TableCell>
                        <TableCell>{account.firstName || "-"}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{account.email || "-"}</Typography>
                            {account.emailVerified === true ? (
                              <Chip
                                label="Verified"
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                }}
                              />
                            ) : null}
                          </Box>
                        </TableCell>
                        <TableCell>{account.mobileNo || "-"}</TableCell>
                        <TableCell>
                          {[account.addressLine1, account.addressLine2, account.addressLine3, account.state, account.country]
                            .filter(Boolean)
                            .join(", ")}
                        </TableCell>
                        <TableCell>{account.description}</TableCell>
                        <TableCell>
                          <Chip
                            label={account.isActive ? "Active" : "Inactive"}
                            color={account.isActive ? "success" : "default"}
                            variant={account.isActive ? "filled" : "outlined"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <EditAccountModal
                            account={account}
                            onAccountUpdated={() => refreshAccounts(page)}
                          />
                          {account.emailVerified ? "" :
                            <Tooltip title="Send Verification">
                              <IconButton
                                size="small"
                                color="primary"
                                aria-label="send verification"
                                onClick={() => handleSendVerificationClick(account)}
                              >
                                <SendIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          }
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="delete account"
                              onClick={() => handleDeleteClick(account)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedAccount ? selectedAccount.accountName || selectedAccount.name : "this account"}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isVerificationDialogOpen} onClose={handleCloseVerificationDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Send Verification Email</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to send a verification email to{" "}
            <strong>{selectedAccountForVerification ? selectedAccountForVerification.email || selectedAccountForVerification.accountName : "this account"}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerificationDialog} color="inherit" disabled={verificationLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSendVerification} color="primary" variant="contained" disabled={verificationLoading}>
            {verificationLoading ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}

