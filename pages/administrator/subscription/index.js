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
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import CreateSubscriptionModal from "./create";
import EditSubscriptionModal from "./edit";
import { ToastContainer } from "react-toastify";
import Chip from "@mui/material/Chip";
import { format } from "date-fns";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { getModule } from "@/components/types/module";
import { formatCurrency } from "@/components/utils/formatHelper";

export default function SubscriptionsList() {
  const {
    data: subscriptions,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSubscriptions,
  } = usePaginatedFetch("Subscription/GetAllSubscriptions", "", 10, false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedSubscription, setSelectedSubscription] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleDeleteClick = (subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedSubscription(null);
  };

  const handleDeleteSubscription = async () => {
    if (!selectedSubscription?.id) {
      toast.error("Unable to determine subscription to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/Subscription/DeleteSubscription?id=${selectedSubscription.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete subscription");
      }

      const data = await response.json();
      toast.success(data?.message || "Subscription deleted successfully.");
      handleCloseDialog();
      fetchSubscriptions(page, search, pageSize, false);
    } catch (error) {
      toast.error(error.message || "Unable to delete subscription");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchSubscriptions(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSubscriptions(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSubscriptions(1, search, size, false);
  };

  const handleSubscriptionCreated = () => {
    setPage(1);
    fetchSubscriptions(1, search, pageSize, false);
  };

  const renderStatusChip = (isActive) => {
    return (
      <Chip
        label={isActive ? "Active" : "Inactive"}
        color={isActive ? "success" : "default"}
        variant={isActive ? "filled" : "outlined"}
        size="small"
      />
    );
  };

  const getBillingTypeName = (billingType) => {
    if (billingType === null || billingType === undefined) return "-";
    const type = Number(billingType);
    switch (type) {
      case 1:
        return "Monthly";
      case 2:
        return "Yearly";
      default:
        return billingType;
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Subscriptions</h1>
        <ul>
          <li>
            <Link href="/administrator/subscription/">Subscriptions</Link>
          </li>
        </ul>
      </div>
      <ToastContainer />
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search subscriptions..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <CreateSubscriptionModal onSubscriptionCreated={handleSubscriptionCreated} />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="subscriptions table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Billing Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="error">No subscriptions available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.moduleName || getModule(subscription.moduleId) || "-"}</TableCell>
                      <TableCell>{formatCurrency(subscription.price)}</TableCell>
                      <TableCell>{subscription.billingTypeName || getBillingTypeName(subscription.billingType) || "-"}</TableCell>
                      <TableCell>{renderStatusChip(subscription.isActive)}</TableCell>
                      <TableCell align="right">
                        <EditSubscriptionModal subscription={subscription} onSubscriptionUpdated={handleSubscriptionCreated} />
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="delete subscription"
                            onClick={() => handleDeleteClick(subscription)}
                          >
                            <DeleteOutlineIcon fontSize="inherit" />
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
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
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

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Subscription</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete this subscription? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSubscription} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

