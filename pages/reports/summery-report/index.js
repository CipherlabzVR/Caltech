import React, { useEffect, useState } from "react";
import {
  Grid,
  TableContainer,
  Paper,
  TableHead,
  Table,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BASE_URL from "Base/api";

import UnifiedSummaryReportModal from "@/components/UIElements/Modal/Reports/Summery/UnifiedSummaryReportModal";
import CompanyWiseProfit from "@/components/UIElements/Modal/Reports/Summery/CompanyWiseProfit";
import ProfitabilityReport from "@/components/UIElements/Modal/Reports/Summery/ProfitabilityReport";
import OutstandingReport from "@/components/UIElements/Modal/Reports/Summery/OutstandingReport";
import StockBalance from "@/components/UIElements/Modal/Reports/Summery/StockBalance";
import ReservationSalesReport from "@/components/UIElements/Modal/Reports/Summery/ReservationSalesReport";

const componentMap = {
  CompanyWiseProfit,
  StockBalance,
  ProfitabilityReport,
  OutstandingReport,
  SalesSummaryReport: UnifiedSummaryReportModal,
  ReservationAppointmentTypeReport: UnifiedSummaryReportModal,
  ReservationTypeReport: UnifiedSummaryReportModal,
  ReservationSalesReport,
  FiscalPeriodReport: UnifiedSummaryReportModal,
  CashFlowSummaryReport: UnifiedSummaryReportModal,
  CustomerPaymentSummaryReport: UnifiedSummaryReportModal,
  DoctorWiseSalesSummaryReport: UnifiedSummaryReportModal,
  CashBookSummaryReport: UnifiedSummaryReportModal,
  ShipmentSummaryReport: UnifiedSummaryReportModal,
  GoodsReceivedNotesSummaryReport: UnifiedSummaryReportModal,
  PurchaseOrderNotesSummaryReport: UnifiedSummaryReportModal,
  DailyDepositSummary: UnifiedSummaryReportModal,
  BankHistoryReport: UnifiedSummaryReportModal,
  ShiftSummaryReport: UnifiedSummaryReportModal,
  StockMovementReport: UnifiedSummaryReportModal,
};

const SummeryReports = () => {
  const [reports, setReports] = useState([]);
  const role = localStorage.getItem("role");

  const fetchReports = async (role) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/ReportSetting/GetAllEnabledSummaryReportsByRoleId?roleId=${role}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();

      const reportsWithComponents = data.result.map((report) => {
        const ReportComponent = componentMap[report.reportName];
        return {
          ...report,
          component: ReportComponent
            ? React.createElement(ReportComponent, {
                docName: report.documentName,
                reportName: report.reportName,
              })
            : null,
        };
      });

      setReports(reportsWithComponents);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (role) fetchReports(role);
  }, [role]);


  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Reports</h1>
        <ul>
          <li>
            <Link href="/reports/summery-report">Reports</Link>
          </li>
        </ul>
      </div>

      <Grid container my={2} spacing={2}>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Report Name</TableCell>
                  <TableCell align="right">View Report</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No Reports Available</TableCell>
                  </TableRow>
                ) : (
                  reports.map((report, index) => (
                    <TableRow key={report.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{report.title || report.name}</TableCell>
                      <TableCell align="right">{report.component}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
};

export default SummeryReports;
