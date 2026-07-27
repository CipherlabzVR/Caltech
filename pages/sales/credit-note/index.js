import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import CreditNoteReport from "@/components/UIElements/Modal/Reports/CreditNote";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DescriptionIcon from "@mui/icons-material/Description";
import useShiftCheck from "@/components/utils/useShiftCheck";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import BASE_URL from "Base/api";

const CNN = () => {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print, customPrint } = IsPermissionEnabled(cId);
  const router = useRouter();
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const name = typeof window !== 'undefined' ? localStorage.getItem("name") : "";
  const { data: ReportName } = GetReportSettingValueByName("CustomerCreditDebitNote");

  const [activeTab, setActiveTab] = useState(0);

  // Apply overpayment dialog state
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedOverpayment, setSelectedOverpayment] = useState(null);
  const [applyInvoices, setApplyInvoices] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySubmitting, setApplySubmitting] = useState(false);

  const {
    data: invoice,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchCCNList,
  } = usePaginatedFetch("CreditNote/GetAllCreditNotePage", "", 10, false, false);

  const {
    data: overpayments,
    totalCount: overpayTotalCount,
    page: overpayPage,
    pageSize: overpayPageSize,
    search: overpaySearch,
    setPage: setOverpayPage,
    setPageSize: setOverpayPageSize,
    setSearch: setOverpaySearch,
    fetchData: fetchOverpayList,
  } = usePaginatedFetch("CreditNote/GetPendingOverpayments", "", 10, false, false);

  const openNotePrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.documentNo ?? "",
    });

    window.open(
      `/sales/credit-note/print?${query.toString()}`,
      `credit-note-print-${item.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({
      pathname: "/sales/credit-note/create-credit-note",
    });
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchCCNList(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchCCNList(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchCCNList(1, search, size);
  };

  const handleOverpaySearchChange = (event) => {
    setOverpaySearch(event.target.value);
    fetchOverpayList(1, event.target.value, overpayPageSize);
    setOverpayPage(1);
  };

  const handleOverpayChangePage = (event, value) => {
    setOverpayPage(value);
    fetchOverpayList(value, overpaySearch, overpayPageSize);
  };

  const handleOverpayChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setOverpayPageSize(size);
    setOverpayPage(1);
    fetchOverpayList(1, overpaySearch, size);
  };

  const openApplyDialog = async (overpayment) => {
    setSelectedOverpayment(overpayment);
    setAllocations({});
    setApplyInvoices([]);
    setApplyOpen(true);
    setApplyLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetAllCustomerwiseOustandingsByIsSettled?customerId=${overpayment.customerId}&isSettled=false`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const json = await response.json();
        const list = (json.result || []).filter((x) => !x.isSalesOrder);
        setApplyInvoices(list);
      } else {
        toast.error("Failed to load outstanding invoices.");
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast.error("Error loading outstanding invoices.");
    } finally {
      setApplyLoading(false);
    }
  };

  const closeApplyDialog = () => {
    setApplyOpen(false);
    setSelectedOverpayment(null);
    setApplyInvoices([]);
    setAllocations({});
  };

  const handleAllocationChange = (invoiceId, value) => {
    setAllocations((prev) => ({ ...prev, [invoiceId]: value }));
  };

  const totalAllocated = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );

  const remainingBalance = selectedOverpayment
    ? parseFloat(selectedOverpayment.remainingAmount || 0)
    : 0;

  const handleApplySubmit = async () => {
    if (!selectedOverpayment) return;

    const lines = applyInvoices
      .map((inv) => ({
        InvoiceId: inv.invoiceId,
        InvoiceNumber: inv.invoiceNumber,
        Amount: parseFloat(allocations[inv.invoiceId] || 0),
      }))
      .filter((l) => l.Amount > 0);

    if (lines.length === 0) {
      toast.error("Enter an amount for at least one invoice.");
      return;
    }

    // Validate each allocation against its invoice outstanding.
    for (const inv of applyInvoices) {
      const amount = parseFloat(allocations[inv.invoiceId] || 0);
      if (amount > parseFloat(inv.outstandingAmount || 0)) {
        toast.error(`Amount for ${inv.invoiceNumber} exceeds its outstanding.`);
        return;
      }
    }

    if (totalAllocated > remainingBalance) {
      toast.error("Total allocated amount exceeds the available balance.");
      return;
    }

    const payload = {
      OverpaymentId: selectedOverpayment.id,
      Date: new Date().toISOString(),
      Remark: "",
      Allocations: lines,
    };

    try {
      setApplySubmitting(true);
      const response = await fetch(`${BASE_URL}/CreditNote/ApplyOverpayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok) {
        toast.success("Overpayment applied successfully.");
        closeApplyDialog();
        fetchOverpayList(overpayPage, overpaySearch, overpayPageSize);
      } else {
        toast.error(json?.message || "Failed to apply overpayment.");
      }
    } catch (error) {
      console.error("Error applying overpayment:", error);
      toast.error("An error occurred while applying the overpayment.");
    } finally {
      setApplySubmitting(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Customer Notes</h1>
        <ul>
          <li>
            <Link href="/sales/credit-note">Customer Notes</Link>
          </li>
        </ul>
      </div>

      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label="Customer Notes" />
        <Tab label="Pending Overpayments" />
      </Tabs>

      {activeTab === 0 && (
        <Grid
          container
          rowSpacing={1}
          columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
        >
          <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
            <Search className="search-form">
              <StyledInputBase
                placeholder="Search here.."
                inputProps={{ "aria-label": "search" }}
                value={search}
                onChange={handleSearchChange}
              />
            </Search>
          </Grid>
          <Grid
            item
            xs={12}
            lg={8}
            mb={1}
            display="flex"
            justifyContent="end"
            order={{ xs: 1, lg: 2 }}
          >
            {create ? <Button variant="outlined" onClick={navigateToCreate}>
              + Add New
            </Button> : ""}
          </Grid>

          <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
            <TableContainer component={Paper}>
              <Table aria-label="simple table" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Document Number</TableCell>
                    <TableCell>Credit/Debit</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Sales Person Name</TableCell>
                    <TableCell>Remark</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!invoice || invoice.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography color="error">
                          No Customer Notes Available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoice.map((item, index) => {
                      const sign = item.noteType === "Credit" ? "+" : "-";
                      const formattedAmount = formatCurrency(item.amount);
                      return (
                      <TableRow key={item.id}>
                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{item.noteType}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{sign}{formattedAmount}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{item.salesPersonName}</TableCell>
                        <TableCell>{item.remark || "-"}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            {customPrint ? (
                              <Tooltip title="Print (Custom)" placement="top">
                                <a
                                  href={`${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <IconButton aria-label="print custom" size="small">
                                    <DescriptionIcon color="action" fontSize="medium" />
                                  </IconButton>
                                </a>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {print ? (
                              <Tooltip title="Print (Default)" placement="top">
                                <IconButton
                                  aria-label="print default"
                                  size="small"
                                  onClick={() => openNotePrintPopup(item)}
                                >
                                  <LocalPrintshopIcon color="primary" fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <Grid container justifyContent="space-between" mt={2} mb={2}>
                <Pagination
                  count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                  page={page}
                  onChange={handleChangePage}
                  color="primary"
                  shape="rounded"
                />
                <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                  <InputLabel>Page Size</InputLabel>
                  <Select
                    value={pageSize}
                    label="Page Size"
                    onChange={handleChangeRowsPerPage}
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
      )}

      {activeTab === 1 && (
        <Grid
          container
          rowSpacing={1}
          columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
        >
          <Grid item xs={12} lg={4} mb={1}>
            <Search className="search-form">
              <StyledInputBase
                placeholder="Search here.."
                inputProps={{ "aria-label": "search" }}
                value={overpaySearch}
                onChange={handleOverpaySearchChange}
              />
            </Search>
          </Grid>

          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table aria-label="overpayment table" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Receipt No</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Original Amount</TableCell>
                    <TableCell>Remaining Amount</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!overpayments || overpayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="error">
                          No Pending Overpayments Available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    overpayments.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {(overpayPage - 1) * overpayPageSize + index + 1}
                        </TableCell>
                        <TableCell>{item.receiptNumber || "-"}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{formatCurrency(item.originalAmount)}</TableCell>
                        <TableCell>{formatCurrency(item.remainingAmount)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openApplyDialog(item)}
                          >
                            Apply
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Grid container justifyContent="space-between" mt={2} mb={2}>
                <Pagination
                  count={overpayTotalCount ? Math.ceil(overpayTotalCount / overpayPageSize) : 1}
                  page={overpayPage}
                  onChange={handleOverpayChangePage}
                  color="primary"
                  shape="rounded"
                />
                <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                  <InputLabel>Page Size</InputLabel>
                  <Select
                    value={overpayPageSize}
                    label="Page Size"
                    onChange={handleOverpayChangeRowsPerPage}
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
      )}

      <Dialog open={applyOpen} onClose={closeApplyDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Apply Overpayment
          {selectedOverpayment ? ` - ${selectedOverpayment.customerName}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography>
              Available Balance: <strong>{formatCurrency(remainingBalance)}</strong>
            </Typography>
            <Typography>
              Total Allocated: <strong>{formatCurrency(totalAllocated)}</strong>
            </Typography>
            <Typography>
              Remaining After: <strong>{formatCurrency(remainingBalance - totalAllocated)}</strong>
            </Typography>
          </Box>
          {applyLoading ? (
            <Typography align="center">Loading invoices...</Typography>
          ) : applyInvoices.length === 0 ? (
            <Typography align="center" color="error">
              No outstanding invoices available for this customer.
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#757fef" }}>
                    <TableCell sx={{ color: "#fff" }}>Invoice No</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Outstanding</TableCell>
                    <TableCell sx={{ color: "#fff" }} align="right">Apply Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applyInvoices.map((inv) => {
                    const amount = parseFloat(allocations[inv.invoiceId] || 0);
                    const exceeds = amount > parseFloat(inv.outstandingAmount || 0);
                    return (
                      <TableRow key={inv.invoiceId}>
                        <TableCell>{inv.invoiceNumber}</TableCell>
                        <TableCell>{formatCurrency(inv.outstandingAmount)}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0 }}
                            value={allocations[inv.invoiceId] || ""}
                            onChange={(e) =>
                              handleAllocationChange(inv.invoiceId, e.target.value)
                            }
                            error={exceeds}
                            helperText={exceeds ? "Exceeds outstanding" : ""}
                            sx={{ width: "150px" }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeApplyDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleApplySubmit}
            variant="contained"
            disabled={applySubmitting || applyLoading || applyInvoices.length === 0}
          >
            {applySubmitting ? "Applying..." : "Apply"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CNN;
