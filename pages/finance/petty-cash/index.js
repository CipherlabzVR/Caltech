import React, { useEffect, useState } from "react";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";
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
import {
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";
import FundSetup from "./FundSetup";
import ReplenishFund from "./ReplenishFund";

export default function PettyCash() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create } = IsPermissionEnabled(cId);
  const router = useRouter();

  const [vouchers, setVouchers] = useState([]);
  const [funds, setFunds] = useState([]);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [balance, setBalance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFunds = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PettyCash/GetAllFunds`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch funds");
      const data = await response.json();
      const list = data.result || [];
      setFunds(list);
      if (list.length > 0 && !selectedFundId) {
        setSelectedFundId(String(list[0].id));
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
    }
  };

  const fetchBalance = async (fundId) => {
    if (!fundId) {
      setBalance(null);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PettyCash/GetFundBalance/${fundId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      setBalance(data.result || null);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
    }
  };

  const fetchVouchers = async (pageNum = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pageNum - 1) * size;
      let query = `${BASE_URL}/PettyCash/GetAllVouchers?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;
      if (selectedFundId) {
        query += `&FundId=${selectedFundId}`;
      }

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch vouchers");

      const data = await response.json();
      setVouchers(data.result.items || []);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const refreshAll = () => {
    fetchFunds();
    if (selectedFundId) {
      fetchBalance(selectedFundId);
    }
    fetchVouchers(page, searchTerm, pageSize);
  };

  const {
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
  } = usePaginationHandlers({
    page,
    pageSize,
    totalCount,
    search: searchTerm,
    setPage,
    setPageSize,
    onSearchValueChange: setSearchTerm,
    onFetch: fetchVouchers,
  });

  useEffect(() => {
    fetchFunds();
  }, []);

  useEffect(() => {
    if (selectedFundId) {
      fetchBalance(selectedFundId);
      setPage(1);
      fetchVouchers(1, searchTerm, pageSize);
    }
  }, [selectedFundId]);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const navigateToCreate = () => {
    router.push({
      pathname: "/finance/petty-cash/create",
      query: selectedFundId ? { fundId: selectedFundId } : {},
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const selectedFund = funds.find((f) => String(f.id) === String(selectedFundId));

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Petty Cash</h1>
        <ul>
          <li>
            <Link href="/finance/petty-cash/">Petty Cash</Link>
          </li>
        </ul>
      </div>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Petty Cash Fund</InputLabel>
            <Select
              value={selectedFundId}
              label="Petty Cash Fund"
              onChange={(e) => setSelectedFundId(e.target.value)}
            >
              {funds.length === 0 ? (
                <MenuItem value="" disabled>
                  No funds configured
                </MenuItem>
              ) : (
                funds.map((fund) => (
                  <MenuItem key={fund.id} value={String(fund.id)}>
                    {fund.fundName} {fund.isActive ? "" : "(Inactive)"}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={8} display="flex" justifyContent="flex-end" gap={1} flexWrap="wrap">
          {create ? <FundSetup fetchItems={refreshAll} fund={null} /> : ""}
          {create && selectedFund ? (
            <FundSetup fetchItems={refreshAll} fund={selectedFund} />
          ) : (
            ""
          )}
          {create && selectedFundId ? (
            <ReplenishFund fundId={selectedFundId} fetchItems={refreshAll} />
          ) : (
            ""
          )}
        </Grid>
      </Grid>

      {balance && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Fund
                </Typography>
                <Typography variant="subtitle1">{balance.fundName}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Float Amount
                </Typography>
                <Typography variant="subtitle1">{formatCurrency(balance.floatAmount)}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Replenishments
                </Typography>
                <Typography variant="subtitle1">
                  {formatCurrency(balance.totalReplenishments)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">
                  Vouchers
                </Typography>
                <Typography variant="subtitle1">{formatCurrency(balance.totalVouchers)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Current Balance
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(balance.currentBalance)}
                </Typography>
              </Grid>
            </Grid>
            {selectedFund && (
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Custodian: {selectedFund.custodianName}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? (
            <Button variant="outlined" onClick={navigateToCreate} disabled={!selectedFundId}>
              + Add Voucher
            </Button>
          ) : (
            ""
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="petty cash vouchers" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Document No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Paid To</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Expense Account</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Receipt No</TableCell>
                  <TableCell>GL Entry</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vouchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No Vouchers Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vouchers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{formatDate(item.voucherDate)}</TableCell>
                      <TableCell>{item.paidTo}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.expenseAccountCode || "-"} - {item.expenseAccountDescription || "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.receiptNo || "-"}</TableCell>
                      <TableCell>{item.doubleEntryDocumentNo || "-"}</TableCell>
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
