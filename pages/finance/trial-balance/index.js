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
import { Typography, Button, FormControl, MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { ChartOfAccountType } from "@/components/types/types";
import useFiscalCalendarFilter from "@/components/utils/useFiscalCalendarFilter";

const balanceColor = (value) => (value >= 0 ? "inherit" : "error.main");

export default function TrialBalance() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const {
    fiscalYears,
    fiscalYearId,
    setFiscalYearId,
    periods,
    fiscalPeriodId,
    setFiscalPeriodId,
  } = useFiscalCalendarFilter();

  const fetchTrialBalance = async () => {
    if (!fiscalPeriodId) return;
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/GeneralLedger/TrialBalance?FiscalPeriodId=${fiscalPeriodId}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch trial balance");
      const data = await response.json();
      setRows(data.result || []);
      setLoaded(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const grandTotalDebit = rows.reduce((sum, r) => sum + (r.totalDebit || 0), 0);
  const grandTotalCredit = rows.reduce((sum, r) => sum + (r.totalCredit || 0), 0);
  const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Trial Balance</h1>
        <ul>
          <li>
            <Link href="/finance/trial-balance/">Trial Balance</Link>
          </li>
        </ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="end">
              <Grid item xs={6} md={2}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Fiscal Year</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={fiscalYearId}
                    onChange={(e) => {
                      setFiscalYearId(e.target.value);
                      setFiscalPeriodId("");
                      setLoaded(false);
                      setRows([]);
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
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={fetchTrialBalance}
                  fullWidth
                  disabled={!fiscalPeriodId}
                >
                  Generate
                </Button>
              </Grid>
              {loaded && (
                <Grid item xs={12} md={6} display="flex" justifyContent="end" alignItems="center">
                  <Typography variant="body2" color={isBalanced ? "success.main" : "error.main"} fontWeight="bold">
                    {isBalanced
                      ? "Trial Balance is balanced"
                      : `Out of balance by ${formatCurrency(Math.abs(grandTotalDebit - grandTotalCredit))}`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="trial balance table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Account Code</TableCell>
                  <TableCell>Account Description</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell align="right">Opening Balance</TableCell>
                  <TableCell align="right">Total Debit</TableCell>
                  <TableCell align="right">Total Credit</TableCell>
                  <TableCell align="right">Closing Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" align="center">
                        {loaded
                          ? "No transactions found for the selected period."
                          : "Select a fiscal period and click Generate to load the trial balance."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.accountCode}</TableCell>
                      <TableCell>{row.accountDescription}</TableCell>
                      <TableCell>{ChartOfAccountType(row.accountType)}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color={balanceColor(row.openingBalance)}>
                          {formatCurrency(row.openingBalance)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{row.totalDebit > 0 ? formatCurrency(row.totalDebit) : "-"}</TableCell>
                      <TableCell align="right">{row.totalCredit > 0 ? formatCurrency(row.totalCredit) : "-"}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color={balanceColor(row.closingBalance)}>
                          {formatCurrency(row.closingBalance)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {rows.length > 0 && (
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell colSpan={3} align="right">
                      <Typography fontWeight="bold">Grand Totals</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">-</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{formatCurrency(grandTotalDebit)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{formatCurrency(grandTotalCredit)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color={isBalanced ? "success.main" : "error.main"}>
                        {formatCurrency(grandTotalDebit - grandTotalCredit)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
