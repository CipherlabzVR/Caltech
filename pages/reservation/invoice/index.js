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
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { getPaymentMethods } from "@/components/types/types";
import ReservationInvoiceView from "@/components/UIElements/Modal/ReservationInvoiceView";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";

export default function ReservationInvoice() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [invoiceList, setInvoiceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { data: ReportName } = GetReportSettingValueByName("ReservationReceipt");
  const name = localStorage.getItem("name");

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchInvoiceList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchInvoiceList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchInvoiceList(1, searchTerm, newSize);
  };

  const fetchInvoiceList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/ReservationPaymentHistory/GetAllPaymentHistorySkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setInvoiceList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchInvoiceList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Reservation Invoice</h1>
        <ul>
          <li>
            <Link href="/reservation/invoice/">Reservation Invoice</Link>
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
                  <TableCell>Doc. No</TableCell>
                  <TableCell>Payment&nbsp;Code</TableCell>                  
                  <TableCell>Payment&nbsp;Date</TableCell>
                  <TableCell>Payment&nbsp;Type</TableCell>
                  <TableCell>Wedding&nbsp;Date</TableCell>
                  <TableCell>Customer&nbsp;Details</TableCell>
                  <TableCell>Phone&nbsp;Number</TableCell>
                  <TableCell>Description</TableCell>
                  
                  <TableCell>Cash&nbsp;Amount</TableCell>
                  <TableCell>Card&nbsp;Amount</TableCell>
                  <TableCell>Bank&nbsp;Amount</TableCell>
                  <TableCell>Paid&nbsp;Amount</TableCell>
                  <TableCell>Pay&nbsp;Slip</TableCell>
                  <TableCell>Total&nbsp;Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography color="error">No Invoices Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoiceList.map((invoice, index) => (
                    <TableRow key={index}>
                      <TableCell>{invoice.documentNo}</TableCell>
                      <TableCell>{invoice.paymentCode}</TableCell>                      
                      <TableCell>{formatDate(invoice.paymentDate)}</TableCell>
                      <TableCell>{getPaymentMethods(invoice.paymentType)}</TableCell>
                      <TableCell>{formatDate(invoice.weddingDate)}</TableCell>
                      <TableCell>
                        <span>{invoice.customerName}</span><br />
                        <Typography color="primary" sx={{ fontSize: '12px' }}>{invoice.nic}</Typography>
                      </TableCell>
                      <TableCell>{invoice.phoneNumber}</TableCell>
                      <TableCell>
                        {invoice.paymentDescription}
                      </TableCell>
                      
                      <TableCell>{formatCurrency(invoice.cashAmount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.cardAmount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.bankAmount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                      <TableCell>
                        {invoice.paySlip ?
                          <a href={invoice.paySlip} target="_blank">
                            View
                          </a> : "-"}
                      </TableCell>
                      <TableCell>{invoice.totalPayble}</TableCell>
                      <TableCell align="right">
                        {/* <ReservationInvoiceView invoice={invoice} /> */}
                        {print && (
                          <Tooltip title="Print" placement="top">
                            <a
                              href={`${Report}/PrintReservationReceiptLocal?InitialCatalog=${Catelogue}&paymentId=${invoice.id}&reportName=${ReportName}&warehouseId=${invoice.warehouseId}&currentUser=${name}`}
                              target="_blank"
                            >
                              <IconButton aria-label="print" size="small">
                                <LocalPrintshopIcon color="primary" fontSize="inherit" />
                              </IconButton>
                            </a>
                          </Tooltip>
                        )}
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
