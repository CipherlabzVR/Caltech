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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Tooltip, IconButton, Box } from "@mui/material";
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
import { getPaymentMethods } from "@/components/types/types";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";

export default function Receipt() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const router = useRouter();
  const name = localStorage.getItem("name");
  const { data: ReportName } = GetReportSettingValueByName("Receipt");
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const {
    data: receiptList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchReceiptList,
  } = usePaginatedFetch("Receipt/GetAll");

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchReceiptList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchReceiptList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchReceiptList(1, search, size);
  };

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({
      pathname: "/sales/receipt/create-receipt",
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Receipt</h1>
        <ul>
          <li>
            <Link href="/sales/receipt/">Receipt</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by Receipt No or Customer.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
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
                  <TableCell>Receipt Date</TableCell>
                  <TableCell>Receipt No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Net Total (Rs)</TableCell>
                  <TableCell>SalesPerson</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receiptList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">
                        No Receipts Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  receiptList.map((item, index) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.receiptNumber}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.receiptNumber}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={item.receiptNumber}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(item.receiptDate)}</TableCell>
                        <TableCell>{item.receiptNumber}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1} alignItems="center">
                            {getPaymentMethods(item.paymentType)}
                            {item.chequeRejected ?
                              <span className="dangerBadge">Rejected</span>
                              : ""}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.totalPaidAmount)}
                        </TableCell>
                        <TableCell>{item.salesPersonName}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            <ShareReports url={whatsapp} mobile={item.customerContactNo} />
                            {print ? <Tooltip title="Print" placement="top">
                              <a href={`${Report}` + reportLink} target="_blank">
                                <IconButton aria-label="print" size="small">
                                  <LocalPrintshopIcon color="primary" fontSize="medium" />
                                </IconButton>
                              </a>
                            </Tooltip> : ""}
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