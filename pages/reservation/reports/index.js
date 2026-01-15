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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { getEventType, getPaymentMethods } from "@/components/types/types";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export default function Items() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [resList, setResList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const name = localStorage.getItem("name");
  const { data: ReportName1 } = GetReportSettingValueByName("ReservationForm");
  const { data: ReportName2 } = GetReportSettingValueByName("BridalDressingTimeReport");

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchResList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchResList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchResList(1, searchTerm, newSize);
  };

  const fetchResList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Reservation/GetAllReservationSkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&reservationType=5&appointmentType=0&bridalType=0`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setResList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchResList();
  }, []);

  const handleExcelDownload = async (reservation) => {
    const address = [
      reservation?.reservationDetails?.addressLine1,
      reservation?.reservationDetails?.addressLine2,
      reservation?.reservationDetails?.addressLine3
    ].filter(line => !!line).join(', ');

    // Create a new workbook and worksheet using ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reservation');

    // Set column widths
    worksheet.columns = [
      { width: 30 }, // First column (Field labels)
      { width: 50 }  // Second column (Values)
    ];

    // Add title row
    const titleRow = worksheet.addRow(['RESERVATION REPORT', '']);
    titleRow.height = 25;

    // Merge cells for title (A1 to B1)
    worksheet.mergeCells('A1:B1');

    // Style the title cell - bold and center aligned
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add empty row for spacing
    worksheet.addRow(['', '']);

    // Add data rows
    const dataRows = [
      ["RESERVATION CODE", reservation?.paymentCode ?? "-"],
      ["ADVANCE PAID DATE", formatDate(reservation?.reservationDetails?.advancePaymentDate) || "-"],
      ["ADVANCE (LKR)", formatCurrency(reservation?.paidAmount ?? 0)],
      ["ADVANCE RECEIVED METHOD", getPaymentMethods(reservation?.reservationDetails?.initialPaymentType) || "-"],
      ["", ""],
      ["WEDDING DATE", formatDate(reservation?.reservationDate) || "-"],
      ["HOME COMING DATE", formatDate(reservation?.reservationDetails?.homeComingDate) || "-"],
      ["EVENT DATE", "-"],
      ["", ""],
      ["NAME OF BRIDE (CLIENT)", reservation?.customerName ?? "-"],
      ["NIC/PASSPORT NO", reservation?.nic ?? "-"],
      ["ADDRESS", address || "-"],
      ["CONTACT NUMBER", reservation?.mobileNo ?? "-"],
      ["WEDDING VENUE", reservation?.reservationDetails?.weddingVenue ?? "-"],
      ["HOME COMING VENUE", reservation?.reservationDetails?.homeComingVenue ?? "-"],
      ["EVENT VENUE", "-"],
    ];

    // Add data rows with styling
    dataRows.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      row.height = 20;

      // Style the first column (field labels) - bold
      const labelCell = row.getCell(1);
      labelCell.font = { bold: true };
      labelCell.alignment = { vertical: 'middle' };

      // Style the second column (values)
      const valueCell = row.getCell(2);
      valueCell.alignment = { vertical: 'middle' };
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reservation-${reservation.documentNo || reservation.customerName}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!navigate) {
    return <AccessDenied />;
  }
  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Reservation Reports</h1>
        <ul>
          <li>
            <Link href="/reservation/reports/">Reservations</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Document No</TableCell>
                  <TableCell>Wedding&nbsp;Date</TableCell>
                  <TableCell>Event&nbsp;Type</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>NIC</TableCell>
                  <TableCell>Phone&nbsp;Number</TableCell>
                  <TableCell>Reports</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">
                        No Reservations Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  resList.map((reservation, index) => (
                    <TableRow key={index}>
                      <TableCell>{reservation.documentNo}</TableCell>
                      <TableCell>
                        {formatDate(reservation.reservationDate)}
                      </TableCell>
                      <TableCell>
                        {getEventType(reservation.reservationFunctionType)}
                      </TableCell>
                      <TableCell>{reservation.customerName}</TableCell>
                      <TableCell>{reservation.nic}</TableCell>
                      <TableCell>{reservation.mobileNo}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1}>
                          <Tooltip sx={{ width: '30px', height: '30px' }} title="Excel Download" placement="top">
                            <IconButton onClick={() => handleExcelDownload(reservation)}>
                              <DownloadIcon sx={{ color: 'green' }} />
                            </IconButton>
                          </Tooltip>
                          {print ? <><Tooltip title="Dressing Time" placement="top">
                            <a href={`${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${reservation.documentNo}&reportName=${ReportName2}&warehouseId=${reservation.warehouseId}&currentUser=${name}`} target="_blank">
                              <IconButton aria-label="print" size="small">
                                <PendingActionsIcon color="primary" fontSize="inherit" />
                              </IconButton>
                            </a>
                          </Tooltip>
                            <Tooltip title="Reservation Form" placement="top">
                              <a href={`${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${reservation.documentNo}&reportName=${ReportName1}&warehouseId=${reservation.warehouseId}&currentUser=${name}`} target="_blank">
                                <IconButton aria-label="print" size="small">
                                  <InsertDriveFileIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </a>
                            </Tooltip></> : ""}
                        </Box>
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
