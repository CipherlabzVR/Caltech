import React from "react";
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
import {
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Tooltip,
  IconButton,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { getPaymentMethods } from "@/components/types/types";
import useShiftCheck from "@/components/utils/useShiftCheck";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import ReceiptIcon from "@mui/icons-material/Receipt";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import { Catelogue } from "Base/catelogue";
import CancelConfirmationById from "./CancelConfirmationById";

const CATEGORY_ID = 196;

export default function PurchaseInvoiceList() {
  const sessionCategory = sessionStorage.getItem("category");
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, remove, print, customPrint, whatsAppShare } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );
  const router = useRouter();
  const name = localStorage.getItem("name");
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const { data: isPaymentTypeEnableToInvoice } = IsAppSettingEnabled("IsPaymentTypeEnableToInvoice");
  const { data: InvoiceReportName } = GetReportSettingValueByName("Invoice");
  const { data: POSInvoiceReportName } = GetReportSettingValueByName("POSInvoice");

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
  } = usePaginatedFetch("PurchaseInvoice/GetAll");

  const handleSearchChange = (event) => {
    const searchValue = event.target.value;
    setSearch(searchValue);
    setPage(1);
    fetchInvoiceList(1, searchValue, pageSize, isCurrentDate);
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

  const handleToggleCurrentDate = (event) => {
    const checked = event.target.checked;
    setIsCurrentDate(checked);
    fetchInvoiceList(1, search, pageSize, checked);
  };

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({ pathname: "/service/purchase-invoice/create-purchase-invoice" });
  };

  const openPurchaseInvoicePrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.documentNo ?? "",
    });

    window.open(
      `/service/purchase-invoice/print?${query.toString()}`,
      `purchase-invoice-print-${item.id}`,
      "popup=yes,width=900,height=900,scrollbars=yes,resizable=yes"
    );
  };

  const tableColSpan =
    7 + (isPaymentTypeEnableToInvoice ? 1 : 0) + 1;

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Purchase Invoice</h1>
        <ul>
          <li>
            <Link href="/service/purchase-invoice/">Purchase Invoice</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by document no, warehouse or customer…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="space-between" order={{ xs: 1, lg: 2 }}>
          <FormControlLabel
            control={<Checkbox checked={isCurrentDate} onChange={handleToggleCurrentDate} color="primary" />}
            label="Today only"
          />
          {create ? (
            <Button variant="outlined" onClick={() => navigateToCreate()}>
              + New purchase invoice
            </Button>
          ) : (
            ""
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="purchase invoices" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Net Total</TableCell>
                  <TableCell>Customer</TableCell>
                  {isPaymentTypeEnableToInvoice && <TableCell>Payment</TableCell>}
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!invoiceList || invoiceList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan} align="center">
                      <Typography color="error">No purchase invoices</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoiceList.map((item, index) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${InvoiceReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const POSInvoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${POSInvoiceReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>{formatDate(item.documentDate)}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>{formatCurrency(item.netTotal)}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        {isPaymentTypeEnableToInvoice && (
                          <TableCell>{getPaymentMethods(item.paymentType)}</TableCell>
                        )}
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            {whatsAppShare ? (
                              <ShareReports url={whatsapp} mobile={item.customerContactNo} />
                            ) : ""}
                            {print ? (
                              <Tooltip title="Print (Default)" placement="top">
                                <IconButton
                                  aria-label="print default"
                                  size="small"
                                  onClick={() => openPurchaseInvoicePrintPopup(item)}
                                >
                                  <LocalPrintshopIcon color="primary" fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {customPrint ? (
                              <Tooltip title="Print (Custom)" placement="top">
                                <a href={`${Report}` + POSInvoiceReportLink} target="_blank" rel="noreferrer">
                                  <IconButton aria-label="print custom" size="small">
                                    <ReceiptIcon color="primary" fontSize="medium" />
                                  </IconButton>
                                </a>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {remove ? (
                              <CancelConfirmationById invId={item.id} fetchItems={fetchInvoiceList} />
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
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
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
