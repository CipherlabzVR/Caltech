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
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SendIcon from "@mui/icons-material/Send";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import { ToastContainer, toast } from "react-toastify";
import { format } from "date-fns";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  return numberValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateValue = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "yyyy-MM-dd");
  } catch (error) {
    return value;
  }
};

const getPaymentStatusChipProps = (status) => {
  if (status === 1) {
    return { label: "Pending", color: "warning", variant: "outlined" };
  }
  if (status === 2) {
    return { label: "Paid", color: "success", variant: "filled" };
  }
  return { label: "Unknown", color: "default", variant: "outlined" };
};

const getPaymentPlanTypeLabel = (type) => {
  if (type === 1) return "Monthly";
  if (type === 2) return "Part Payments";
  if (type === 3) return "Full Payment";
  return "-";
};

export default function InvoiceList() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
    data: invoices,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchInvoices,
  } = usePaginatedFetch("CRMInvoice/GetAllCRMInvoices", "", 10, false, false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [sendLoading, setSendLoading] = React.useState(false);

  const refreshInvoices = React.useCallback(
    (targetPage = page) => {
      fetchInvoices(targetPage, search, pageSize, false);
    },
    [fetchInvoices, page, pageSize, search]
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchInvoices(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchInvoices(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchInvoices(1, search, size, false);
  };

  const handleDeleteClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInvoice?.id) {
      toast.error("Unable to determine plan to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/CRMInvoice/DeleteCRMInvoice?id=${selectedInvoice.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete");
      }

      toast.success(data?.message || "Payment Plan deleted successfully.");
      handleCloseDialog();
      refreshInvoices(page);
    } catch (error) {
      toast.error(error.message || "Unable to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendClick = (invoice) => {
    setSelectedInvoice(invoice);
    setIsSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setIsSendDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleConfirmSend = async () => {
    if (!selectedInvoice?.id) {
      toast.error("Unable to determine plan to send.");
      return;
    }

    try {
      setSendLoading(true);
      const token = localStorage.getItem("token");
      const invoiceNumber = selectedInvoice.invoiceNo || selectedInvoice.id;
      const reportLink = `${window.location.origin}/crm/customer/invoice?id=${selectedInvoice.id}&documentNumber=${invoiceNumber}`;
      
      const response = await fetch(
        `${BASE_URL}/CRMInvoice/SendInvoiceEmailToCustomer?invoiceId=${selectedInvoice.id}&link=${encodeURIComponent(reportLink)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send");
      }

      toast.success(data?.message || "Payment plan sent successfully.");
      handleCloseSendDialog();
    } catch (error) {
      toast.error(error.message || "Unable to send");
    } finally {
      setSendLoading(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Payment Plan</h1>
        <ul>
          <li>
            <Link href="/crm/payment-plan/">Payment Plan</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          {create && (
            <Link href="/crm/payment-plan/create" passHref legacyBehavior>
              <Button component="a" variant="contained">
                + Create Payment Plan
              </Button>
            </Link>
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="invoices table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Plan Number</TableCell>
                  <TableCell>Quote No</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Payment Plan Type</TableCell>
                  <TableCell>Initial Payment</TableCell>
                  <TableCell>Initial Payment Due Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No payment plans available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const statusChipProps = getPaymentStatusChipProps(invoice.status);

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoiceNo}</TableCell>
                        <TableCell>
                          {invoice.quoteNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusChipProps.label}
                            color={statusChipProps.color}
                            variant={statusChipProps.variant}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.discount)}</TableCell>
                        <TableCell>{getPaymentPlanTypeLabel(invoice.paymentPlanType)}</TableCell>
                        <TableCell>{formatCurrency(invoice.initialPayment)}</TableCell>
                        <TableCell>{formatDateValue(invoice.initialPaymentDueDate)}</TableCell>
                        <TableCell align="right">
                          {update && (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/crm/payment-plan/edit?id=${invoice.id}`}
                                aria-label="edit plan"
                              >
                                <EditOutlinedIcon color="primary" fontSize="medium" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Plan">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="view plan"
                              onClick={() => {
                                const invoiceNumber = invoice.invoiceNo || invoice.id;
                                window.open(`/crm/customer/invoice?id=${invoice.id}&documentNumber=${invoiceNumber}`, '_blank');
                              }}
                            >
                              <AssessmentIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Payment Plan">
                            <IconButton
                              size="small"
                              color="success"
                              aria-label="send payment plan"
                              onClick={() => handleSendClick(invoice)}
                            >
                              <SendIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                          {remove && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="delete plan"
                                onClick={() => handleDeleteClick(invoice)}
                              >
                                <DeleteOutlineIcon fontSize="medium" />
                              </IconButton>
                            </Tooltip>
                          )}
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
        <DialogTitle>Delete Plan</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedInvoice ? selectedInvoice.invoiceNo || `plan #${selectedInvoice.id}` : "this plan"}</strong>? This action cannot be undone.
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

      <Dialog open={isSendDialogOpen} onClose={handleCloseSendDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Send Payment Plan</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to send payment plan{" "}
            <strong>{selectedInvoice ? selectedInvoice.invoiceNo || `plan #${selectedInvoice.id}` : "this plan"}</strong> to the customer via email?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSendDialog} color="inherit" disabled={sendLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSend} color="success" variant="contained" disabled={sendLoading}>
            {sendLoading ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}

