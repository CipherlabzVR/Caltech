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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Box, Tooltip, IconButton } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { useRouter } from "next/router";
import { formatDate, formatCurrency } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import useShiftCheck from "@/components/utils/useShiftCheck";
import { toast, ToastContainer } from "react-toastify";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";

export default function SalesOrder() {
  const cId = sessionStorage.getItem("category");
  const name = localStorage.getItem("name");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const { data: reportName } = GetReportSettingValueByName("SalesOrder");
  const { data: isCustomReportsEnabled } = IsAppSettingEnabled("IsCustomReportsEnabled");
  const [deleteSalesOrderId, setDeleteSalesOrderId] = React.useState(null);
  const router = useRouter();
  const {
    data: salesOrderList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSalesOrderList,
  } = usePaginatedFetch("SalesOrder/GetAll", "", 10, false);

  const handleSearchChange = (event) => {
    const searchValue = event.target.value;
    setSearch(searchValue);
    setPage(1);
    fetchSalesOrderList(1, searchValue, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSalesOrderList(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSalesOrderList(1, search, size, false);
  };

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({
      pathname: "/sales/sales-order/create-sales-order",
    });
  };

  const navigateToEdit = (id) => {
    router.push({
      pathname: "/sales/sales-order/edit-sales-order",
      query: { id },
    });
  };

  const openSalesOrderPrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.documentNo ?? "",
    });

    window.open(
      `/sales/sales-order/print?${query.toString()}`,
      `sales-order-print-${item.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sales Order</h1>
        <ul>
          <li>
            <Link href="/sales/sales-order/">Sales Order</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} mb={1} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <Box sx={{ width: { xs: "70%", lg: "32%" } }}>
            <Search className="search-form">
              <StyledInputBase
                placeholder="Search by Order No, Warehouse or Customer Name.."
                inputProps={{ "aria-label": "search" }}
                value={search}
                onChange={handleSearchChange}
              />
            </Search>
          </Box>
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
                  <TableCell>#</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Order No</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Net Total (Rs)</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesOrderList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">
                        No Sales Orders Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  salesOrderList.map((item, index) => {
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${reportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(item.documentDate)}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>{formatCurrency(item.netTotal)}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" alignItems="center" gap={0.5}>
                            {update ? (
                              item.receiptId == null ? (
                                <Tooltip title="Edit Sales Order" placement="top">
                                  <IconButton aria-label="edit" size="small" onClick={() => navigateToEdit(item.id)}>
                                    <EditIcon color="primary" fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Cannot edit after receipt created" placement="top">
                                  <span>
                                    <IconButton aria-label="edit-disabled" size="small" disabled>
                                      <EditIcon color="disabled" fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            ) : (
                              ""
                            )}
                            {remove ? (
                              item.receiptId == null ? (
                                <Tooltip title="Delete Sales Order" placement="top">
                                  <IconButton
                                    aria-label="delete"
                                    size="small"
                                    onClick={() => setDeleteSalesOrderId(item.id)}
                                  >
                                    <DeleteIcon color="error" fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Cannot delete after receipt created" placement="top">
                                  <span>
                                    <IconButton aria-label="delete-disabled" size="small" disabled>
                                      <DeleteIcon color="disabled" fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            ) : (
                              ""
                            )}
                            {print ? (
                              isCustomReportsEnabled ? (
                                <Tooltip title="Print" placement="top">
                                  <a href={`${Report}${reportLink}`} target="_blank" rel="noopener noreferrer">
                                    <IconButton aria-label="print" size="small">
                                      <LocalPrintshopIcon color="primary" fontSize="medium" />
                                    </IconButton>
                                  </a>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Print" placement="top">
                                  <IconButton
                                    aria-label="print"
                                    size="small"
                                    onClick={() => openSalesOrderPrintPopup(item)}
                                  >
                                    <LocalPrintshopIcon color="primary" fontSize="medium" />
                                  </IconButton>
                                </Tooltip>
                              )
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
      {remove && (
        <DeleteConfirmationById
          id={deleteSalesOrderId}
          controller="SalesOrder/DeleteSalesOrder"
          fetchItems={() => fetchSalesOrderList(page, search, pageSize, false)}
          open={Boolean(deleteSalesOrderId)}
          onClose={() => setDeleteSalesOrderId(null)}
        />
      )}
    </>
  );
}
