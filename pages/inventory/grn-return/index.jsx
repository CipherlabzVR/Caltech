import React from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";
import IsFiscalPeriodAvailable from "@/components/utils/IsFiscalPeriodAvailable";
import { Report } from "Base/report";

const GrnReturn = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, print } = IsPermissionEnabled(cId);
  const name = localStorage.getItem("name");
  const { data: IsSupplierSalesRef } =
    IsAppSettingEnabled("IsSupplierSalesRef");
  const { data: ReportName } = GetReportSettingValueByName("GoodsReturnNote");
  const router = useRouter();
  const { data: isFiscalPeriodAvailable } = IsFiscalPeriodAvailable();

  const navigateToCreate = () => {
    if (!isFiscalPeriodAvailable) {
      toast.warning("Please Start Fiscal Period First");
      return;
    }
    router.push({
      pathname: "/inventory/grn-return/create",
    });
  };

  const {
    data: grnReturnList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchGrnReturnList,
  } = usePaginatedFetch("GoodReceivedNote/GetAllGoodsReturnNotes");


  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchGrnReturnList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchGrnReturnList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchGrnReturnList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Goods Return Notes</h1>
        <ul>
          <li>
            <Link href="/inventory/grn-return">Goods Return Notes</Link>
          </li>
        </ul>
      </div>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      ></Grid>
      <ToastContainer />
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
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
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? (
            <Button variant="outlined" onClick={() => navigateToCreate()}>
              + Add New
            </Button>
          ) : (
            ""
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Return Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>GRN No</TableCell>
                  <TableCell>Return Amount</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grnReturnList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={IsSupplierSalesRef ? 8 : 7}
                      align="center"
                    >
                      <Typography color="error">
                        No Return Notes Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  grnReturnList.map((item) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.grnDate
                            ? formatDate(item.grnDate)
                            : formatDate(item.createdOn)}
                        </TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.grnDocumentNo ? item.grnDocumentNo : "Non-GRN"}</TableCell>
                        <TableCell>
                          {formatCurrency(item.totalAmount)}
                        </TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            <ShareReports
                              url={whatsapp}
                              mobile={item.supplierMobileNo}
                            />
                            {print ? (
                              <Tooltip title="Print" placement="top">
                                <a
                                  href={`${Report}` + reportLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <IconButton aria-label="print" size="small">
                                    <LocalPrintshopIcon
                                      color="primary"
                                      fontSize="medium"
                                    />
                                  </IconButton>
                                </a>
                              </Tooltip>
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
};

export default GrnReturn;
