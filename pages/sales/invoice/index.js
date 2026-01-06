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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Tooltip, IconButton, Box, FormControlLabel, Checkbox, Chip } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import useShiftCheck from "@/components/utils/useShiftCheck";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import ReceiptIcon from '@mui/icons-material/Receipt';
import { CheckBox } from "@mui/icons-material";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import CancelConfirmationById from "./CancelConfirmationById";
import { Catelogue } from "Base/catelogue";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { getPaymentMethods } from "@/components/types/types";

export default function Invoice() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const router = useRouter();
  const name = localStorage.getItem("name");
  const { data: InvoiceReportName } = GetReportSettingValueByName("Invoice");
  const { data: POSInvoiceReportName } = GetReportSettingValueByName("POSInvoice");
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const { data: isBookingSystem } = IsAppSettingEnabled(
    "IsBookingSystem"
  );
  const { data: isPaymentTypeEnableToInvoice } = IsAppSettingEnabled(
    "IsPaymentTypeEnableToInvoice"
  );
  const { data: isDoctorInvolved } = IsAppSettingEnabled(
    "IsDoctorInvolved"
  );
  const {
    data: invoiceList,
    totalCount,
    page,
    pageSize,
    search,
    isCurrentDate,
    setPage,
    setPageSize,
    setSearch,
    setIsCurrentDate,
    fetchData: fetchInvoiceList,
  } = usePaginatedFetch("SalesInvoice/GetAll");

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchInvoiceList(1, search, pageSize, isCurrentDate);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchInvoiceList(value, search, pageSize, isCurrentDate);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchInvoiceList(1, search, size, isCurrentDate);
  };

  const handleToggleCurrentDate = () => {
    const checked = event.target.checked;
    setIsCurrentDate(checked);
    fetchInvoiceList(1, search, pageSize, checked);
  };

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({
      pathname: "/sales/invoice/create-invoice",
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Invoice</h1>
        <ul>
          <li>
            <Link href="/sales/invoice/">Invoice</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="space-between" order={{ xs: 1, lg: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isCurrentDate}
                onChange={handleToggleCurrentDate}
                color="primary"
              />
            }
            label="Today Invoices"
          />
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + Add New
          </Button> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  <TableCell>Invoice No</TableCell>
                  {!isBookingSystem && (<TableCell>Warehouse</TableCell>)}
                  <TableCell>Net Total (Rs)</TableCell>
                  <TableCell>Customer</TableCell>
                  {isPaymentTypeEnableToInvoice && (<TableCell>Payment Type</TableCell>)}
                  {isDoctorInvolved && (
                    <>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Patient Reg. No</TableCell>
                    </>
                  )}
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">
                        No Invoices Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoiceList.map((item, index) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${InvoiceReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const invoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${InvoiceReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const POSInvoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${POSInvoiceReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (

                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(item.documentDate)}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        {!isBookingSystem && (<TableCell>{item.warehouseName}</TableCell>)}
                        <TableCell>{formatCurrency(item.netTotal)}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        {isPaymentTypeEnableToInvoice && (<TableCell>{getPaymentMethods(item.paymentType)}</TableCell>)}
                        {isDoctorInvolved && (
                          <>
                            <TableCell>{item.doctorName}</TableCell>
                            <TableCell>{item.regNo}</TableCell>
                          </>
                        )}
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            <ShareReports url={whatsapp} mobile={item.customerContactNo} />
                            {print ? <>
                              <Tooltip title="Print" placement="top">
                                <a href={`${Report}` + invoiceReportLink} target="_blank">
                                  <IconButton aria-label="print" size="small">
                                    <LocalPrintshopIcon color="primary" fontSize="medium" />
                                  </IconButton>
                                </a>
                              </Tooltip>
                              <Tooltip title="Print" placement="top">
                                <a href={`${Report}` + POSInvoiceReportLink} target="_blank">
                                  <IconButton aria-label="print" size="small">
                                    <ReceiptIcon color="primary" fontSize="medium" />
                                  </IconButton>
                                </a>
                              </Tooltip></> : ""}
                            {remove ? <CancelConfirmationById invId={item.id} fetchItems={fetchInvoiceList} /> : ""}
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