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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, TextField, Button, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import useApi from "@/components/utils/useApi";
import useFiscalCalendarFilter from "@/components/utils/useFiscalCalendarFilter";

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

export default function GeneralLedger() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const [entries, setEntries] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const {
    fiscalYears,
    fiscalYearId,
    setFiscalYearId,
    periods,
    fiscalPeriodId,
    setFiscalPeriodId,
  } = useFiscalCalendarFilter();

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchLedger(value);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchLedger(1, newSize);
  };

  const fetchLedger = async (pg = page, size = pageSize) => {
    if (!selectedAccount) return;
    try {
      const token = localStorage.getItem("token");
      const skip = (pg - 1) * size;
      let query = `${BASE_URL}/GeneralLedger/GetByAccount?SkipCount=${skip}&MaxResultCount=${size}&ChartOfAccountId=${selectedAccount}`;
      if (fromDate) query += `&FromDate=${fromDate}`;
      if (toDate) query += `&ToDate=${toDate}`;
      if (fiscalPeriodId) query += `&FiscalPeriodId=${fiscalPeriodId}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch ledger");
      const data = await response.json();
      setEntries(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLedger(1);
  };

  useEffect(() => {
    if (selectedAccount) {
      setPage(1);
      fetchLedger(1);
    }
  }, [selectedAccount]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>General Ledger</h1>
        <ul>
          <li><Link href="/finance/general-ledger/">General Ledger</Link></li>
        </ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="end">
              <Grid item xs={12} md={3}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Account</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">-- Select Account --</MenuItem>
                    {accountList?.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Fiscal Year</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={fiscalYearId}
                    onChange={(e) => {
                      setFiscalYearId(e.target.value);
                      setFiscalPeriodId("");
                    }}
                    displayEmpty
                  >
                    <MenuItem value="">All</MenuItem>
                    {fiscalYears.map((year) => (
                      <MenuItem key={year.id} value={year.id}>
                        {year.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Period</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={fiscalPeriodId}
                    onChange={(e) => setFiscalPeriodId(e.target.value)}
                    displayEmpty
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
              <Grid item xs={6} md={1.5}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>From Date</Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={1.5}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>To Date</Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button variant="contained" size="medium" onClick={handleSearch} fullWidth disabled={!selectedAccount}>
                  Load Ledger
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="general ledger table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" align="center">
                        {selectedAccount ? "No ledger entries found for this account." : "Select an account to view the ledger."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.transactionDate)}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>{getSourceModule(item.sourceModule)}{item.sourceDocumentNo ? ` - ${item.sourceDocumentNo}` : ""}</TableCell>
                      <TableCell align="right">{item.debitAmount > 0 ? formatCurrency(item.debitAmount) : "-"}</TableCell>
                      <TableCell align="right">{item.creditAmount > 0 ? formatCurrency(item.creditAmount) : "-"}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color={item.runningBalance >= 0 ? "success.main" : "error.main"}>
                          {formatCurrency(item.runningBalance)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {entries.length > 0 && (
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
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
