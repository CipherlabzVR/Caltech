import React, { } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { Report } from "Base/report";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { toast } from "react-toastify";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";
import IsFiscalPeriodAvailable from "@/components/utils/IsFiscalPeriodAvailable";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function PurchaseOrder() {
  const name = localStorage.getItem("name");
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const router = useRouter();
  const { data: ReportName } = GetReportSettingValueByName("PurchaseOrder");
  const { data: isFiscalPeriodAvailable } = IsFiscalPeriodAvailable();

  const navigateToCreate = () => {
    if (!isFiscalPeriodAvailable) {
      toast.warning("Please Start Fiscal Period First");
      return;
    }
    router.push({
      pathname: "/inventory/purchase-order/create-po",
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const navigateToEdit = (id) => {
    router.push(`/inventory/purchase-order/edit-po?id=${id}`);
  };

  const {
    data: poList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchPOList,
  } = usePaginatedFetch("GoodReceivedNote/GetAllPO");

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchPOList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchPOList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchReceiptList(1, search, size);
  };

  console.log(poList);

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Purchase Order</h1>
        <ul>
          <li>
            <Link href="/inventory/purchase-order">Purchase Order</Link>
          </li>
        </ul>
      </div>
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
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + Add New
          </Button> : ""}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>PO Date</TableCell>
                  <TableCell>PO No</TableCell>                  
                  <TableCell>GRN No</TableCell>                  
                  <TableCell>Supplier</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {poList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="error">
                        No Purchase Orders Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  poList.map((item, index) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.purchaseOrderNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.purchaseOrderNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{formatDate(item.poDate)}</TableCell>
                        <TableCell>{item.purchaseOrderNo}</TableCell>                        
                        <TableCell>{item.documentNo}</TableCell>                        
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.referanceNo}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            
                            {update && !item.isPurchasingOrderComplete ? <Tooltip title="Edit" placement="top">
                              <IconButton
                                onClick={() => navigateToEdit(item.id)}
                                aria-label="edit"
                                size="small"
                              >
                                <BorderColorIcon
                                  color="primary"
                                  fontSize="medium"
                                />
                              </IconButton>
                            </Tooltip> : ""}
                            <ShareReports url={whatsapp} mobile={item.supplierMobileNo} />
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
