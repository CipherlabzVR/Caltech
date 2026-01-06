import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import CreateBankHistory from "./create";
import EditBankHistory from "./edit";
import { FormControl, InputLabel, MenuItem, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import useApi from "@/components/utils/useApi";

export default function BankHistory() {
  const cId = sessionStorage.getItem("category");
  const { navigate, print, create, update } = IsPermissionEnabled(cId);
  const [bankHistory, setBankHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [bankId, setBankId] = useState(null);
  const { data: bankList } = useApi("/Bank/GetAllBanks");
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    if (bankList) {
      setBanks(bankList);
    }
  }, [bankList]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchBankHistory(1, value, pageSize, bankId);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchBankHistory(value, searchTerm, pageSize, bankId);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchBankHistory(1, searchTerm, newSize, bankId);
  };

  const fetchBankHistory = async (page = 1, search = "", size = pageSize, bankId) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/BankHistory/GetAllBankRecords?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&bankId=${bankId}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setBankHistory(data.result.items);
      setTotalCount(data.result.totalCount || 0);

    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    //fetchBankHistory();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  const handleSelectBank = (id) => {
    setBankId(id);
    fetchBankHistory(1, searchTerm, pageSize, id)
  }
  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Bank History</h1>
        <ul>
          <li>
            <Link href="/finance/bank-history/">Bank History</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={8} display="flex" gap={1} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
          <Select value={bankId} onChange={(e) => handleSelectBank(e.target.value)} fullWidth size="small">
            {banks.length === 0 ? <MenuItem value="">No Data Available</MenuItem> :
              (banks.map((bank, i) => (
                <MenuItem key={i} value={bank.id}>{bank.name} - {bank.accountNo}</MenuItem>
              )))}
          </Select>
        </Grid>
        <Grid item xs={12} lg={4} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <CreateBankHistory banks={banks} fetchItems={fetchBankHistory} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Cheque Payment</TableCell>
                  <TableCell>Deposit</TableCell>
                  <TableCell>Withdrawal</TableCell>
                  <TableCell>Remaining Balance</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No Records Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bankHistory.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.documentNo}
                      </TableCell>
                      <TableCell>{formatDate(item.createdOn)}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.cashFlowTypeName || "-"}</TableCell>
                      <TableCell >
                        {item.isCheque ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(item.transactionType === 1 ? item.amount : "")}</TableCell>
                      <TableCell>{formatCurrency(item.transactionType === 2 ? item.amount : "")}</TableCell>
                      <TableCell>{formatCurrency(item.remainingBalance)}</TableCell>
                      <TableCell align="right">
                        {update ? <EditBankHistory item={item} fetchItems={() => fetchBankHistory(page, searchTerm, pageSize, bankId)} /> : ""}
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
