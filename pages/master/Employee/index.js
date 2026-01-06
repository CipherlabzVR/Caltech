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

import EditCustomerDialog from "./edit";
import AddCustomerDialog from "../Employee/create";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function Employees() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
     data: employeeList,
  totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchEmployeeList,
  } =  usePaginatedFetch("Employee/GetAllEmployeesByPagedResult");
  const rows = employeeList?.result || [];


  const controller = "Employee/DeleteEmployees";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchEmployeeList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchEmployeeList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchEmployeeList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Employees</h1>
        <ul>
          <li>
            {/* <Link href="/master/Employee/">Employees</Link> */}
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
          {create ? <AddCustomerDialog fetchItems={fetchEmployeeList} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="employee table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Titl</TableCell>
                  <TableCell> Name</TableCell>
                  <TableCell>NIC</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Contract Type</TableCell>
                  <TableCell>Join Date</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employeeList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography color="error">No Employees Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                   employeeList.map((emp, index) => (
      <TableRow key={index}>
        <TableCell>{emp.titleName || "-"}</TableCell>
                      <TableCell>{emp.firstName +" "+ emp. lastName|| "-"}</TableCell>
                      <TableCell>{emp.nic || "-"}</TableCell>
                      <TableCell>{emp.email || "-"}</TableCell>
                      <TableCell>{emp.gender === 1 ? "Male" : emp.gender === 2 ? "Female" : "-"}</TableCell>
                      <TableCell>{emp.departmentName || "-"}</TableCell>
                      <TableCell>{emp.contractTypeName || "-"}</TableCell>
                      <TableCell>{formatDateTime(emp.joinDate)}</TableCell>
                      <TableCell>{emp.supervisorName || "-"}</TableCell>
                      <TableCell align="right">
                        {update ? <EditCustomerDialog fetchItems={fetchEmployeeList} item={emp} /> : ""}
                        {remove ? <DeleteConfirmationById id={emp.id} controller={controller} fetchItems={fetchEmployeeList} /> : ""}
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
