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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Chip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import ViewChargeSheet from "./view-charge-sheet";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function ChargeSheets() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print, approve1 } = IsPermissionEnabled(cId);
  const [sheetList, setSheetList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchChargeSheetList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchChargeSheetList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchChargeSheetList(1, searchTerm, newSize);
  };

  const fetchChargeSheetList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Reservation/GetAllChargeSheet?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setSheetList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchChargeSheetList();
  }, []);

  if(!navigate){
    return <AccessDenied/>;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Charge Sheet Approval</h1>
        <ul>
          <li>
            <Link href="/reservation/">Reservation</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Wedding Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Net Amount</TableCell>
                  <TableCell>Refund Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sheetList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">No Charge Sheets Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sheetList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.reservationDate)}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{formatCurrency(item.netAmount)}</TableCell>
                      <TableCell>{formatCurrency(item.refundTotal)}</TableCell>
                      <TableCell>
                        {item.status === 1 ? <Chip
                          size="small"
                          label="Pending"
                          color="primary"
                        /> : (item.status === 2 ? <Chip
                          size="small"
                          label="Approved"
                          color="success"
                        /> : <Chip
                          size="small"
                          label="Rejected"
                          color="error"
                        />)}
                      </TableCell>
                      <TableCell>{item.rejectReason}</TableCell>
                      <TableCell align="right">
                        {item.isEditEnabled && (approve1 || remove) ? <ViewChargeSheet reservation={item} fetchItems={fetchChargeSheetList} approve={approve1} remove={remove}/> : ""}
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
