import React, { useEffect, useState } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Chip, IconButton, Tooltip, Box, TextField } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";
import VisibilityIcon from "@mui/icons-material/Visibility";
import useFiscalCalendarFilter from "@/components/utils/useFiscalCalendarFilter";

const getStatusChip = (status) => {
  switch (status) {
    case 1: return <Chip label="Draft" size="small" color="warning" variant="outlined" />;
    case 2: return <Chip label="Posted" size="small" color="success" variant="outlined" />;
    case 3: return <Chip label="Reversed" size="small" color="error" variant="outlined" />;
    default: return <Chip label="Unknown" size="small" />;
  }
};

const getEntryType = (type) => {
  switch (type) {
    case 1: return "Manual";
    case 2: return "Auto-Posted";
    case 3: return "Reversing";
    case 4: return "Opening";
    case 5: return "Closing";
    default: return "-";
  }
};

const getSourceModule = (module) => {
  switch (module) {
    case 0: return "Manual";
    case 1: return "Sales Invoice";
    case 2: return "Sales Return";
    case 3: return "Receipt";
    case 4: return "Credit Note";
    case 5: return "Supplier Payment";
    case 6: return "GRN";
    case 7: return "Bank Transaction";
    case 8: return "Cash In/Out";
    case 9: return "Payroll";
    case 10: return "Expense";
    case 11: return "Depreciation";
    case 12: return "Reservation";
    default: return "-";
  }
};

export default function DoubleEntries() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create } = IsPermissionEnabled(cId);
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const {
    fiscalYears,
    fiscalYearId,
    setFiscalYearId,
    periods,
    fiscalPeriodId,
    setFiscalPeriodId,
  } = useFiscalCalendarFilter();
  const router = useRouter();

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchEntries(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchEntries(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchEntries(1, searchTerm, newSize);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
    fetchEntries(1, searchTerm, pageSize, event.target.value, fiscalPeriodId);
  };

  const handleFiscalYearChange = (event) => {
    setFiscalYearId(event.target.value);
    setFiscalPeriodId("");
    setPage(1);
    fetchEntries(1, searchTerm, pageSize, statusFilter, "");
  };

  const handleFiscalPeriodChange = (event) => {
    const value = event.target.value;
    setFiscalPeriodId(value);
    setPage(1);
    fetchEntries(1, searchTerm, pageSize, statusFilter, value);
  };

  const fetchEntries = async (pg = 1, search = "", size = pageSize, status = statusFilter, periodId = fiscalPeriodId) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pg - 1) * size;
      let query = `${BASE_URL}/DoubleEntry/GetAll?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;
      if (status) query += `&Status=${status}`;
      if (fromDate) query += `&FromDate=${fromDate}`;
      if (toDate) query += `&ToDate=${toDate}`;
      if (periodId) query += `&FiscalPeriodId=${periodId}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch double entries");

      const data = await response.json();
      setEntries(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Double Entries</h1>
        <ul>
          <li><Link href="/finance/double-entry/">Double Entries</Link></li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 1 }}>
          {create ? (
            <Button variant="outlined" onClick={() => router.push("/finance/double-entry/create")}>
              + New Double Entry
            </Button>
          ) : null}
        </Grid>
        <Grid item xs={12} lg={3} order={{ xs: 2, lg: 2 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by doc no, description..."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={6} lg={1.5} order={{ xs: 3, lg: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={handleStatusFilterChange}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value={1}>Draft</MenuItem>
              <MenuItem value={2}>Posted</MenuItem>
              <MenuItem value={3}>Reversed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} lg={1.5} order={{ xs: 4, lg: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Fiscal Year</InputLabel>
            <Select value={fiscalYearId} label="Fiscal Year" onChange={handleFiscalYearChange}>
              <MenuItem value="">All</MenuItem>
              {fiscalYears.map((year) => (
                <MenuItem key={year.id} value={year.id}>
                  {year.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} lg={1.5} order={{ xs: 5, lg: 5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Period</InputLabel>
            <Select
              value={fiscalPeriodId}
              label="Period"
              onChange={handleFiscalPeriodChange}
              disabled={!fiscalYearId}
            >
              <MenuItem value="">All</MenuItem>
              {periods.map((period) => (
                <MenuItem key={period.id} value={period.id}>
                  {period.periodNumber} ({formatDate(period.startDate)} – {formatDate(period.endDate)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} lg={1.5} order={{ xs: 6, lg: 6 }}>
          <TextField
            type="date"
            fullWidth
            size="small"
            label="From"
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); setTimeout(() => fetchEntries(1, searchTerm, pageSize), 100); }}
          />
        </Grid>
        <Grid item xs={6} lg={1.5} order={{ xs: 7, lg: 7 }}>
          <TextField
            type="date"
            fullWidth
            size="small"
            label="To"
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); setTimeout(() => fetchEntries(1, searchTerm, pageSize), 100); }}
          />
        </Grid>
        <Grid item xs={6} lg={1.5} order={{ xs: 8, lg: 8 }} display="flex" alignItems="center">
          {(fromDate || toDate) && (
            <Button variant="text" size="small" color="error" onClick={() => { setFromDate(""); setToDate(""); setPage(1); setTimeout(() => fetchEntries(1, searchTerm, pageSize, statusFilter), 100); }}>
              Clear Dates
            </Button>
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 9, lg: 9 }}>
          <TableContainer component={Paper}>
            <Table aria-label="double entries table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Document No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No Double Entries Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{formatDate(item.journalDate)}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>{getEntryType(item.entryType)}</TableCell>
                      <TableCell>{getSourceModule(item.sourceModule)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalDebit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalCredit)}</TableCell>
                      <TableCell align="center">{getStatusChip(item.status)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details" placement="top">
                          <IconButton size="small" onClick={() => router.push(`/finance/double-entry/${item.id}`)}>
                            <VisibilityIcon color="primary" fontSize="small" />
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
    </>
  );
}
