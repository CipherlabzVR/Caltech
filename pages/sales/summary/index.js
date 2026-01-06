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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDateWithTime } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import BASE_URL from "Base/api";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";
import CreateSummary from "./create";

export default function ShiftSummary() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create } = IsPermissionEnabled(cId);
  const [warehouse, setWarehouse] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [summaryList, setSummaryList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const { data: warehouseList } = GetAllWarehouse();

  const fetchList = async (page = 1, search = "", size = pageSize, warehouse) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Shift/GetCashSummaryByDateWarehouseType?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&warehouseId=${warehouse}`;
      const response = await fetch(query, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setSummaryList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (warehouseList && warehouseList.length > 0) {
      setWarehouses(warehouseList);
      setWarehouse(warehouseList[0].id);
    }
  }, [warehouseList]);

  useEffect(() => {
    if (warehouse) fetchList(1, searchTerm, pageSize, warehouse);
  }, [warehouse]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchList(1, value, pageSize, warehouse);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchList(value, searchTerm, pageSize, warehouse);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchList(1, searchTerm, newSize, warehouse);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shift Summary</h1>
        <ul>
          <li>
            <Link href="/sales/summary/">Shift Summary</Link>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" gap={2} order={{ xs: 1, lg: 2 }}>
          <Select sx={{minWidth: '150px'}} size="small" value={warehouse || ""} onChange={(e) => setWarehouse(e.target.value)}>
            {warehouses.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name}
              </MenuItem>
            ))}
          </Select>
          {create ? <CreateSummary fetchItems={fetchList} search={searchTerm} pageSize={pageSize} warehouseId={warehouse}/> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Created By</TableCell>
                  <TableCell>Shift</TableCell>
                  <TableCell>Terminal</TableCell>                  
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Start Amount</TableCell>
                  <TableCell align="right">End Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="error">No Data Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  summaryList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.createdBy}</TableCell>
                      <TableCell>{item.shiftCode}</TableCell>
                      <TableCell>{item.terminalCode}</TableCell>                      
                      <TableCell>{formatDateWithTime(item.startDate)}</TableCell>
                      <TableCell>{formatCurrency(item.startAmount)}</TableCell>
                      <TableCell>{formatDateWithTime(item.endDate)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.endAmount)}</TableCell>
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
