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
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import CreateDayEnd from "./create";
import { formatCurrency, formatDate, formatDateWithTime } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

export default function DayEnd() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [dayEndList, setDayEndList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { data: showCashInvoiceTotalsInShiftAndDayend } = IsAppSettingEnabled("ShowCashInvoiceTotalsInShiftAndDayend");

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchDayEndList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchDayEndList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchDayEndList(1, searchTerm, newSize);
  };

  const fetchDayEndList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const searchParam = search ? encodeURIComponent(search) : "null";
      const query = `${BASE_URL}/DayEnd/GetAllDayEnd?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setDayEndList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchDayEndList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Day End</h1>
        <ul>
          <li>
            <Link href="/sales/day-end/">Day End</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by Code, Warehouse or User.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <CreateDayEnd fetchItems={fetchDayEndList} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Total Invoice</TableCell>
                  <TableCell>Total Return</TableCell>
                  {showCashInvoiceTotalsInShiftAndDayend && <TableCell>Cash Inv. Total</TableCell>}
                  {showCashInvoiceTotalsInShiftAndDayend && <TableCell>Cash Return Inv. Total</TableCell>}
                  <TableCell>Canceled Inv.</TableCell>
                  <TableCell>Total Outstanding</TableCell>
                  <TableCell>Total Receipt</TableCell>
                  <TableCell>Cash Variance</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Remark</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dayEndList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="error">No Data Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  dayEndList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.endDate)}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{formatCurrency(item.totalInvoice)}</TableCell>
                      <TableCell>{formatCurrency(item.totalSalesReturnAmount)}</TableCell>
                      {showCashInvoiceTotalsInShiftAndDayend && <TableCell>{formatCurrency(item.totalCashInvoice)}</TableCell>}
                      {showCashInvoiceTotalsInShiftAndDayend && <TableCell>{formatCurrency(item.totalCashReturnInvoice)}</TableCell>}
                      <TableCell>{formatCurrency(item.canceledInvoice)}</TableCell>
                      <TableCell>{formatCurrency(item.totalOutstanding)}</TableCell>
                      <TableCell>{formatCurrency(item.totalReceipt)}</TableCell>
                      <TableCell>{item.cashVariance < 0 ? (
                        <span className="dangerBadge">Short /{formatCurrency(item.cashVariance)} </span>
                      ) : item.cashVariance > 0 ? (
                        <span className="successBadge">Excess /{formatCurrency(item.cashVariance)}</span>
                      ) : (
                        ""
                      )}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.userName}</TableCell>
                      <TableCell>{item.remark}</TableCell>
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
