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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
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
import useAccounts from "../../../hooks/useAccounts";
import useContacts from "../../../hooks/useContacts";
import useLeads from "../../../hooks/useLeads";
import BASE_URL from "Base/api";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";

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

const getStatusChipProps = (statusLabel) => {
  if (!statusLabel) {
    return { label: "-", color: "default", variant: "outlined" };
  }

  const normalized = statusLabel.toLowerCase();

  if (normalized.includes("accept") || normalized.includes("won")) {
    return { label: statusLabel, color: "success", variant: "filled" };
  }

  if (normalized.includes("reject") || normalized.includes("lost")) {
    return { label: statusLabel, color: "error", variant: "filled" };
  }

  if (normalized.includes("draft")) {
    return { label: statusLabel, color: "warning", variant: "outlined" };
  }

  if (normalized.includes("sent") || normalized.includes("open")) {
    return { label: statusLabel, color: "info", variant: "filled" };
  }

  if (normalized.includes("expired")) {
    return { label: statusLabel, color: "default", variant: "outlined" };
  }

  return { label: statusLabel, color: "default", variant: "outlined" };
};

export default function QuotesList() {
  const {
    data: quotes,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchQuotes,
  } = usePaginatedFetch("CRMQuotes/GetAllCRMQuotes", "", 10, false, false);

  const { accounts } = useAccounts();
  const { contacts } = useContacts();
  const { leads } = useLeads();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = React.useState(false);
  const [sendLoading, setSendLoading] = React.useState(false);

  const accountMap = React.useMemo(() => {
    const map = {};
    accounts.forEach((account) => {
      map[String(account.id)] = account.name;
    });
    return map;
  }, [accounts]);

  const contactMap = React.useMemo(() => {
    const map = {};
    contacts.forEach((contact) => {
      map[String(contact.id)] = contact.name;
    });
    return map;
  }, [contacts]);

  const leadMap = React.useMemo(() => {
    const map = {};
    leads.forEach((lead) => {
      map[String(lead.id)] = lead.name;
    });
    return map;
  }, [leads]);

  const refreshQuotes = React.useCallback(
    (targetPage = page) => {
      fetchQuotes(targetPage, search, pageSize, false);
    },
    [fetchQuotes, page, pageSize, search]
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchQuotes(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchQuotes(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchQuotes(1, search, size, false);
  };

  const handleDeleteClick = (quote) => {
    setSelectedQuote(quote);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedQuote(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuote?.id) {
      toast.error("Unable to determine quote to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/CRMQuotes/DeleteCRMQuote?id=${selectedQuote.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete quote");
      }

      toast.success(data?.message || "Quote deleted successfully.");
      handleCloseDialog();
      refreshQuotes(page);
    } catch (error) {
      toast.error(error.message || "Unable to delete quote");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendClick = (quote) => {
    setSelectedQuote(quote);
    setIsSendDialogOpen(true);
  };

  const handleCloseSendDialog = () => {
    setIsSendDialogOpen(false);
    setSelectedQuote(null);
  };

  const handleConfirmSend = async () => {
    if (!selectedQuote?.id) {
      toast.error("Unable to determine quote to send.");
      return;
    }

    try {
      setSendLoading(true);
      const token = localStorage.getItem("token");
      const quoteNumber = selectedQuote.quoteNumber || selectedQuote.id;
      const reportLink = `${window.location.origin}/crm/customer/quote?id=${selectedQuote.id}&documentNumber=${quoteNumber}`;
      
      const response = await fetch(
        `${BASE_URL}/CRMQuotes/SendQuoteEmailToCustomer?quoteId=${selectedQuote.id}&link=${encodeURIComponent(reportLink)}`,
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
        throw new Error(data?.message || "Failed to send quote");
      }

      toast.success(data?.message || "Quote sent successfully.");
      handleCloseSendDialog();
    } catch (error) {
      toast.error(error.message || "Unable to send quote");
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Quotes</h1>
        <ul>
          <li>
            <Link href="/crm/quotes/">Quotes</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search quotes..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <Link href="/crm/quotes/create" passHref legacyBehavior>
            <Button component="a" variant="contained">
              + Add Quote
            </Button>
          </Link>
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="quotes table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Quote Number</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Lead</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No quotes available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((quote) => {
                    const accountName = accountMap[String(quote.accountId)] || "-";
                    const contactName = contactMap[String(quote.contactId)] || "-";
                    const leadName = leadMap[String(quote.leadId || quote.opportunityId)] || "-";
                    const statusLabel = quote.statusName || quote.status || "-";
                    const statusChipProps = getStatusChipProps(statusLabel);
                    const quoteStatus = quote.status ?? quote.statusId;
                    const canEdit = quoteStatus === 0 || quoteStatus === 3 || quoteStatus === 4;
                    const canViewReport = quoteStatus === 2;
                    
                    const generateReportLink = (documentNumber) => {
                      const warehouseId = typeof window !== "undefined" ? localStorage.getItem("warehouse") || 1 : 1;
                      const currentUser = typeof window !== "undefined" ? localStorage.getItem("name") || "SuperAdmin" : "SuperAdmin";
                      const reportName = "CRMQuote.rpt";
                      const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${documentNumber}&reportName=${reportName}&warehouseId=${warehouseId}&currentUser=${currentUser}`;
                      return `${Report}${reportLink}`;
                    };

                    return (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.quoteNumber || `Quote #${quote.id}`}</TableCell>
                        <TableCell>{accountName}</TableCell>
                        <TableCell>{contactName}</TableCell>
                        <TableCell>{leadName}</TableCell>
                        <TableCell>{formatCurrency(quote.total ?? quote.subTotal)}</TableCell>
                        <TableCell>
                          <Chip
                            label={statusChipProps.label}
                            color={statusChipProps.color}
                            variant={statusChipProps.variant}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDateValue(quote.validUntil)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title={canEdit ? "Edit" : "Edit not available for this status"}>
                            <span>
                              <IconButton
                                size="small"
                                component={canEdit ? Link : "span"}
                                href={canEdit ? `/crm/quotes/edit?id=${quote.id}` : undefined}
                                aria-label="edit quote"
                                disabled={!canEdit}
                                sx={{
                                  opacity: canEdit ? 1 : 0.5,
                                  cursor: canEdit ? "pointer" : "not-allowed",
                                }}
                              >
                                <EditOutlinedIcon color={canEdit ? "primary" : "disabled"} fontSize="medium" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Report">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="view report"
                              onClick={() => {
                                const quoteNumber = quote.quoteNumber || quote.id;
                                window.open(`/crm/customer/quote?id=${quote.id}&documentNumber=${quoteNumber}`, '_blank');
                              }}
                            >
                              <AssessmentIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Quote">
                            <IconButton
                              size="small"
                              color="success"
                              aria-label="send quote"
                              onClick={() => handleSendClick(quote)}
                            >
                              <SendIcon fontSize="medium" />
                            </IconButton>
                          </Tooltip>
                          {/* {canViewReport && (
                            <Tooltip title="Open PDF Report">
                              <IconButton
                                size="small"
                                color="secondary"
                                aria-label="open pdf report"
                                onClick={() => {
                                  const quoteNumber = quote.quoteNumber || quote.id;
                                  const reportLink = generateReportLink(quoteNumber);
                                  window.open(reportLink, '_blank');
                                }}
                              >
                                <PictureAsPdfIcon fontSize="medium" />
                              </IconButton>
                            </Tooltip>
                          )} */}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="delete quote"
                              onClick={() => handleDeleteClick(quote)}
                            >
                              <DeleteOutlineIcon fontSize="medium" />
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
        <DialogTitle>Delete Quote</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedQuote ? selectedQuote.quoteNumber || `quote #${selectedQuote.id}` : "this quote"}</strong>? This action cannot be undone.
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
        <DialogTitle>Send Quote</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to send quote{" "}
            <strong>{selectedQuote ? selectedQuote.quoteNumber || `quote #${selectedQuote.id}` : "this quote"}</strong> to the customer via email?
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

