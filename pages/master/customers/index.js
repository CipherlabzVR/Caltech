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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import ViewCustomerDialog from "./view";
import EditCustomerDialog from "./edit";
import AddCustomerDialog from "../customers/create";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import useApi from "@/components/utils/useApi";

export default function Customers() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [chartOfAccInfo, setChartOfAccInfo] = useState({});
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const {
    data: customerList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchCustomerList,
  } = usePaginatedFetch("Customer/GetAll");

  const controller = "Customer/DeleteCustomer";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchCustomerList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchCustomerList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchCustomerList(1, search, size);
  };

  useEffect(() => {
    if (accountList) {
      const accMap = accountList.reduce((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});
      setChartOfAccInfo(accMap);
      setChartOfAccounts(accountList);
    }
  }, [accountList]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Customers</h1>
        <ul>
          <li>
            <Link href="/master/customers/">Customers</Link>
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
          {create ? <AddCustomerDialog fetchItems={fetchCustomerList} chartOfAccounts={chartOfAccounts} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>NIC</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Contact No</TableCell>
                  <TableCell>Receivable Acc</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">No Customers Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customerList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {[item?.title, item?.firstName, item?.lastName].filter(Boolean).join(" ")}
                      </TableCell>
                      <TableCell>{item.displayName}</TableCell>
                      <TableCell>{item.customerContactDetails?.[0]?.emailAddress || ""}</TableCell>
                      <TableCell>{item.nic || ""}</TableCell>
                      <TableCell>
                        {[item?.addressLine1, item?.addressLine2, item?.addressLine3].filter(Boolean).join(", ")}
                      </TableCell>
                      <TableCell>{item.company || ""}</TableCell>
                      <TableCell>{item.customerContactDetails?.[0]?.contactNo || ""}</TableCell>
                      <TableCell>{chartOfAccInfo[item.receivableAccount]?.code || "-"} - {chartOfAccInfo[item.receivableAccount]?.description || "-"}</TableCell>
                      <TableCell>
                        <ViewCustomerDialog customerId={item.id} />
                      </TableCell>
                      <TableCell align="right">
                        {update ? <EditCustomerDialog fetchItems={fetchCustomerList} item={item} chartOfAccounts={chartOfAccounts} /> : ""}
                        {remove ? <DeleteConfirmationById id={item.id} controller={controller} fetchItems={fetchCustomerList} /> : ""}
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