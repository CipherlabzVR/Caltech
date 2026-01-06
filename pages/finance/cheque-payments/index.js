import React, { } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Box, Chip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import CreateBankHistory from "./create";
import ApproveCheque from "./approve";
import RejectCheque from "./reject";
import CreateCheque from "./create";

export default function ChequePayments() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update,remove } = IsPermissionEnabled(cId);
  const {
    data: chequePayments,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchChequePayments,
  } = usePaginatedFetch("BankHistory/GetAllChequeRecordsAsync");

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchChequePayments(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchChequePayments(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchChequePayments(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Cheque Payments</h1>
        <ul>
          <li>
            <Link href="/finance/cheque-payments/">Cheque Payment</Link>
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
          {create ? <CreateCheque fetchItems={fetchChequePayments} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Cheque No</TableCell>
                  <TableCell>Cheque Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Shift Code</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chequePayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No Records Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  chequePayments.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.chequeNo}</TableCell>
                      <TableCell>{formatDate(item.chequeDate)}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.shiftCode}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.createdUser}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell align="right">
                        {item.chequeStatus === 1 && (
                          <Box display="flex" gap={1}>
                            <ApproveCheque id={item.id} fetchItems={fetchChequePayments} />
                            <RejectCheque id={item.id} fetchItems={fetchChequePayments}/>
                          </Box>
                        )}
                        {item.chequeStatus === 2 && (
                          <span className="successBadge">Approved</span>
                        )}
                        {item.chequeStatus === 3 && (
                          <>
                          <span className="dangerBadge">Rejected</span>
                          <Typography sx={{mt:1}}>{item.rejectedReason}</Typography>
                          </>
                        )}
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