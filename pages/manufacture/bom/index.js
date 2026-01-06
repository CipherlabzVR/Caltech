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
import { Pagination, FormControl, InputLabel, MenuItem, Select, Button, Box, Tooltip, Typography, IconButton } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

export default function BillOfMaterials() {
  const router = useRouter();
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
    data: bomList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchBOMList,
  } = usePaginatedFetch("BillOfMaterial/GetAllBillOfMaterials");

  const controller = "BillOfMaterial/DeleteBillOfMaterial";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchBOMList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchBOMList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchBOMList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const navigateToCreate = () => {
    router.push({
      pathname: "/manufacture/bom/create",
    });
  };

  const navigateToEdit = (id) => {
    router.push({
      pathname: `/manufacture/bom/edit`,
      query: { id: id },
    });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Bill Of Material</h1>
        <ul>
          <li>
            <Link href="/manufacture/bom/">Bill Of Material</Link>
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
                  <TableCell>Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Cost of Materials</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Selling Price</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!bomList || bomList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="error">
                        No Bill Of Material Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bomList.map((item, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{formatDate(item.bomDate)}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.projectCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{formatCurrency(item.totalCost)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            {update ? <Tooltip title="Edit" placement="top">
                              <IconButton onClick={() => navigateToEdit(item.id)} aria-label="edit" size="small">
                                <BorderColorIcon color="primary" fontSize="inherit" />
                              </IconButton>
                            </Tooltip> : ""}
                            {remove ? <DeleteConfirmationById
                              id={item.id}
                              controller={controller}
                              fetchItems={fetchBOMList}
                            /> : ""}
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

