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
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DescriptionIcon from "@mui/icons-material/Description";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import CancelSalesQuotationById from "./CancelSalesQuotationById";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";

const getQuotationDiscountDetails = (item) => {
  const gross = Number(item?.grossTotal ?? item?.GrossTotal ?? 0);
  const net = Number(item?.netTotal ?? item?.NetTotal ?? 0);
  const discount = Math.max(0, Number((gross - net).toFixed(2)));
  const discountPercentOfGross =
    gross > 0.000001 ? Math.round((discount / gross) * 10000) / 100 : 0;
  return { gross, net, discount, discountPercentOfGross };
};

export default function SalesQuotation() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const name = typeof window !== "undefined" ? localStorage.getItem("name") : "";
  const { navigate, create, update, remove, print, customPrint, whatsAppShare, permissionsLoading } =
    IsPermissionEnabled(cId);
  const { data: reportName } = GetReportSettingValueByName("SalesQuotation");
  const router = useRouter();

  const {
    data: quotationList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchQuotationList,
  } = usePaginatedFetch("SalesQuotation/GetAll", "", 10, false);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchQuotationList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchQuotationList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchQuotationList(1, search, size);
  };

  const navigateToCreate = () => {
    router.push({
      pathname: "/sales/sales-quotation/create-sales-quotation",
    });
  };

  const buildQuotationShareText = (item) => {
    const { gross, net, discount, discountPercentOfGross } =
      getQuotationDiscountDetails(item);
    const parts = [
      `Sales Quotation: ${item.documentNo || ""}`,
      `Customer: ${item.customerName || ""}`,
      `Date: ${formatDate(item.documentDate)}`,
      `Gross total: ${formatCurrency(gross)}`,
    ];
    if (discount >= 0.01) {
      parts.push(
        `Discount: ${formatCurrency(discount)} (${discountPercentOfGross}% of gross)`
      );
    }
    parts.push(`Net total: ${formatCurrency(net)}`);
    if (item.remark) parts.push(`Remark: ${item.remark}`);
    return parts.join("\n");
  };

  const openWhatsAppForQuotation = (item) => {
    const text = encodeURIComponent(buildQuotationShareText(item));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const openSalesQuotationPrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.documentNo ?? "",
    });

    window.open(
      `/sales/sales-quotation/print?${query.toString()}`,
      `sales-quotation-print-${item.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  if (permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sales Quotation</h1>
        <ul>
          <li>
            <Link href="/sales/sales-quotation/">Sales Quotation</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by Quotation No, Customer"
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
          justifyContent="flex-end"
          order={{ xs: 1, lg: 2 }}
        >
          {create && (
            <Button variant="outlined" onClick={navigateToCreate}>
              + Add New
            </Button>
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="sales quotation table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Quotation Date</TableCell>
                  <TableCell>Quotation No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Salesperson</TableCell>
                  <TableCell align="right">Gross Total (Rs)</TableCell>
                  {/* <TableCell align="right">Discount (Rs)</TableCell>
                  <TableCell align="right">Disc. %</TableCell> */}
                  <TableCell align="right">Net Total (Rs)</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotationList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography color="error">
                        No Sales Quotations Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotationList.map((item, index) => {
                    const { gross, net, discount, discountPercentOfGross } =
                      getQuotationDiscountDetails(item);
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${reportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{formatDate(item.documentDate)}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.salesPersonName || "-"}</TableCell>
                      <TableCell align="right">{formatCurrency(gross)}</TableCell>
                      {/* <TableCell align="right">{formatCurrency(discount)}</TableCell>
                      <TableCell align="right">
                        {discount >= 0.01
                          ? `${discountPercentOfGross}%`
                          : "—"}
                      </TableCell> */}
                      <TableCell align="right">{formatCurrency(net)}</TableCell>
                      <TableCell>{item.remark}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="end" gap={0.5} flexWrap="wrap">
                          {whatsAppShare ? (
                            <Tooltip title="Share via WhatsApp" placement="top">
                              <IconButton
                                size="small"
                                aria-label="share quotation on WhatsApp"
                                onClick={() => openWhatsAppForQuotation(item)}
                                sx={{ color: "#7b68ee" }}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : ""}
                          {customPrint ? (
                            <Tooltip title="Print (Custom)" placement="top">
                              <a href={`${Report}${reportLink}`} target="_blank" rel="noopener noreferrer">
                                <IconButton size="small" aria-label="print quotation custom">
                                  <DescriptionIcon color="action" fontSize="small" />
                                </IconButton>
                              </a>
                            </Tooltip>
                          ) : ""}
                          {print ? (
                            <Tooltip title="Print (Default)" placement="top">
                              <IconButton
                                size="small"
                                aria-label="print quotation default"
                                onClick={() => openSalesQuotationPrintPopup(item)}
                                sx={{ color: "#7b68ee" }}
                              >
                                <LocalPrintshopIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : ""}
                          {update && (
                            <IconButton
                              size="small"
                              aria-label="edit quotation"
                              onClick={() =>
                                router.push(
                                  `/sales/sales-quotation/create-sales-quotation?id=${item.id}`
                                )
                              }
                            >
                              <EditIcon color="primary" fontSize="small" />
                            </IconButton>
                          )}
                          {remove && (
                            <CancelSalesQuotationById
                              quotationId={item.id}
                              fetchItems={fetchQuotationList}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )})
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
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handlePageSizeChange}
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
    </>
  );
}
