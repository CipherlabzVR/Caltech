import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  List,
  ListItem,
  ListItemText,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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

// Frontend-only categorization for Summary Reports.
// Backend currently returns: { id, reportName, title, documentName, isPermissionEnabled } with no module field.
// Per requirement, we show module groups: Inventory, Sales, Finance, Reservation.
const REPORT_MODULE_MAP = {
  // Sales
  SalesSummaryReport: "Sales",
  DoctorWiseSalesSummaryReport: "Sales",
  OutstandingReport: "Sales",
  ShipmentSummaryReport: "Sales",
  CustomerPaymentSummaryReport: "Sales",

  // Inventory (includes purchasing-related summaries)
  GoodsReceivedNotesSummaryReport: "Inventory",
  PurchaseOrderNotesSummaryReport: "Inventory",
  StockBalance: "Inventory",
  StockMovementReport: "Inventory",

  // Finance
  CashBookSummaryReport: "Finance",
  CashFlowSummaryReport: "Finance",
  BankHistoryReport: "Finance",
  DailyDepositSummary: "Finance",
  CompanyWiseProfit: "Finance",
  ProfitabilityReport: "Finance",
  FiscalPeriodReport: "Finance",
  ShiftSummaryReport: "Finance",

  // Reservation
  ReservationAppointmentTypeReport: "Reservation",
  ReservationTypeReport: "Reservation",
  ReservationSalesReport: "Reservation",
};

const getReportModuleName = (report) => {
  const explicit =
    report?.moduleName ||
    report?.module ||
    report?.mainModuleName ||
    report?.categoryName;

  if (explicit && String(explicit).trim().length > 0) {
    const raw = String(explicit).trim();
    const norm = raw.toLowerCase();
    // Force all incoming categories/modules into the 3 requested groups.
    if (norm.includes("invent") || norm.includes("stock") || norm.includes("purchase")) return "Inventory";
    if (norm.includes("reservation")) return "Reservation";
    if (norm.includes("sale") || norm.includes("customer")) return "Sales";
    if (norm.includes("finan") || norm.includes("cash") || norm.includes("bank") || norm.includes("profit") || norm.includes("fiscal") || norm.includes("shift")) return "Finance";
    // Unknown explicit module -> keep visible under Sales by default.
    return "Sales";
  }

  const fromMap = REPORT_MODULE_MAP?.[report?.reportName];
  if (fromMap) return fromMap;

  // If a new report shows up that isn't mapped yet, keep it visible by defaulting to Sales.
  return "Sales";
};

const SummeryReports = () => {
  const [reports, setReports] = useState([]);
  const [role, setRole] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async (role) => {
    try {
      setLoading(true);
      setError(null);
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
      if (!response.ok) throw new Error("Failed to fetch summary reports");
      const data = await response.json();

      const rawResult = Array.isArray(data?.result) ? data.result : [];

      // Normalize casing differences just in case backend serialization changes.
      const normalized = rawResult.map((r) => {
        const reportName = r?.reportName ?? r?.ReportName ?? r?.report_name ?? "";
        const title = r?.title ?? r?.Title ?? r?.name ?? r?.Name ?? "";
        const documentName = r?.documentName ?? r?.DocumentName ?? "";
        const id = r?.id ?? r?.Id;
        const isPermissionEnabled =
          r?.isPermissionEnabled ?? r?.IsPermissionEnabled ?? true;

        return {
          ...r,
          id,
          reportName,
          title,
          documentName,
          isPermissionEnabled,
        };
      });

      // Only show enabled reports.
      const enabledOnly = normalized.filter((r) => r.isPermissionEnabled === true);

      const reportsWithComponents = enabledOnly.map((report) => {
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
      setReports([]);
      setError(error?.message || "Failed to load summary reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Avoid SSR crashes (localStorage is client-only).
    if (typeof window === "undefined") return;
    setRole(localStorage.getItem("role"));
  }, []);

  useEffect(() => {
    if (role) fetchReports(role);
  }, [role]);

  const groupedReports = useMemo(() => {
    const groups = reports.reduce((acc, report) => {
      const moduleName = getReportModuleName(report);
      if (!acc[moduleName]) acc[moduleName] = [];
      acc[moduleName].push(report);
      return acc;
    }, {});

    // Keep a consistent module ordering (as requested).
    const preferredOrder = ["Inventory", "Sales", "Finance", "Reservation"];
    
    // Only include modules that have at least 1 report
    const modulesWithReports = Object.keys(groups).filter(
      (moduleName) => groups[moduleName] && groups[moduleName].length > 0
    );
    
    const sortedModuleNames = modulesWithReports.sort((a, b) => {
      const ai = preferredOrder.indexOf(a);
      const bi = preferredOrder.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return a.localeCompare(b);
    });

    return sortedModuleNames.map((moduleName) => ({
      moduleName,
      reports: groups[moduleName] || [],
    }));
  }, [reports]);

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
          {loading ? (
            <Paper sx={{ p: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemText primary="Loading reports..." />
                </ListItem>
              </List>
            </Paper>
          ) : error ? (
            <Paper sx={{ p: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemText primary={error} />
                </ListItem>
              </List>
            </Paper>
          ) : (
            <>
              {reports.length === 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="No enabled Summary Reports available for your role." />
                    </ListItem>
                  </List>
                </Paper>
              )}

              {groupedReports.map(({ moduleName, reports: moduleReports }) => (
                <Accordion
                  key={moduleName}
                  expanded={expandedModule === moduleName}
                  onChange={() =>
                    setExpandedModule((prev) => (prev === moduleName ? null : moduleName))
                  }
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {moduleName}
                      <span style={{ fontWeight: 400, opacity: 0.75 }}>
                        ({moduleReports.length})
                      </span>
                    </strong>
                  </AccordionSummary>

                  <AccordionDetails>
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
                          {moduleReports.map((report, index) => (
                            <TableRow key={report.id || `${moduleName}-${index}`}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{report.title || report.name}</TableCell>
                              <TableCell align="right">{report.component}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default SummeryReports;
