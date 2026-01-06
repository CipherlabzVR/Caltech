import React, { useEffect } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddSalesPerson from "./create";
import EditSalesPerson from "./edit";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch"; 
import { formatCurrency } from "@/components/utils/formatHelper";

export default function SalesPerson() { 
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);

  const {
    data: salesPersonList, 
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSalesPersonList,
  } = usePaginatedFetch("SalesPerson/GetAllCRMSalesPerson");


  useEffect(() => {
    fetchSalesPersonList(page, search, pageSize);
  }, []); 


  const controller = "SalesPerson/DeleteSalesPerson";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchSalesPersonList(1, event.target.value, pageSize); 
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSalesPersonList(value, search, pageSize); 
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSalesPersonList(1, search, size); 
  };


  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sales Person</h1>
        <ul>
          <li>
            <Link href="/crm/sales-person/">Sales Person</Link>
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
          {create ? <AddSalesPerson fetchItems={fetchSalesPersonList} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Target Time Period</TableCell>
                  <TableCell>Sales Target</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesPersonList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No Sales Person Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  salesPersonList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item?.code}
                      </TableCell>
                      <TableCell>  {item?.name}</TableCell>
                      <TableCell>  {item?.mobileNumber}</TableCell>
                      <TableCell>  {item?.email}</TableCell>
                      <TableCell>  {item?.rangeName}</TableCell>
                      <TableCell>  {formatCurrency(item?.salesTarget)}</TableCell>
                      <TableCell>  {item?.remark}</TableCell>
                      <TableCell align="right">
                        {update ? <EditSalesPerson fetchItems={fetchSalesPersonList} item={item} /> : ""}
                        {remove ? <DeleteConfirmationById id={item.id} controller={controller} fetchItems={fetchSalesPersonList} /> : ""} 
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
