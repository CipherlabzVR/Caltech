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
import {
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import ApprovePayment from "./ApprovePayment";
import RejectPayment from "./RejectPayment";
import PrintReceipt from "./PrintReceipt";

const CATEGORY_ID = 305;
const STATUS_BY_TAB = [1, 2, 3]; // Pending, Approved, Rejected

export default function PhotographyPaymentApproval() {
  const sessionCategory = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, approve1, remove } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );

  const [list, setList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);

  const fetchList = async (pageNum = 1, search = "", size = pageSize, tab = tabIndex) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pageNum - 1) * size;
      const status = STATUS_BY_TAB[tab];
      const searchParam = search ? encodeURIComponent(search) : "null";
      const filterParam = encodeURIComponent(`Status:${status}`);
      const query = `${BASE_URL}/PhotographyPayment/GetAllPaymentPaged?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}&Filter=${filterParam}`;
      const response = await fetch(query, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setList(data?.result?.items || []);
      setTotalCount(data?.result?.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
      setList([]);
      setTotalCount(0);
    }
  };

  useEffect(() => {
    fetchList(1, searchTerm, pageSize, tabIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setPage(1);
    fetchList(1, searchTerm, pageSize, newValue);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchList(1, value, pageSize, tabIndex);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchList(value, searchTerm, pageSize, tabIndex);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchList(1, searchTerm, size, tabIndex);
  };

  const refresh = () => fetchList(page, searchTerm, pageSize, tabIndex);

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>✅ Payment Approval</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Payment Approval</li>
        </ul>
      </div>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Pending" />
        <Tab label="Approved" />
        <Tab label="Rejected" />
      </Tabs>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by payment / quotation / customer…"
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Payment No</TableCell>
                  <TableCell>Quotation</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Pay Slip</TableCell>
                  {tabIndex === 2 ? <TableCell>Rejected Reason</TableCell> : ""}
                  {(tabIndex === 0 || tabIndex === 1) ? <TableCell align="right">Action</TableCell> : ""}
                </TableRow>
              </TableHead>
              <TableBody>
                {!list || list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">No payments available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.paymentNo}</TableCell>
                      <TableCell>{item.quotationNo}</TableCell>
                      <TableCell>
                        {item.customerName}
                        <br />
                        <Typography variant="caption" color="text.secondary">{item.customerMobileNo}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(item.eventDate)}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.paymentMethodName}</TableCell>
                      <TableCell>
                        {item.paySlipUrl ? (
                          <a href={item.paySlipUrl} target="_blank" rel="noreferrer">View</a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {tabIndex === 2 ? <TableCell>{item.rejectRemark}</TableCell> : ""}
                      {tabIndex === 0 && (
                        <TableCell align="right">
                          <Box display="flex" gap={0.5} justifyContent="end">
                            {approve1 ? <ApprovePayment item={item} fetchItems={refresh} /> : ""}
                            {remove ? <RejectPayment id={item.id} fetchItems={refresh} /> : ""}
                          </Box>
                        </TableCell>
                      )}
                      {tabIndex === 1 && (
                        <TableCell align="right">
                          <Box display="flex" gap={0.5} justifyContent="end">
                            <PrintReceipt payment={item} />
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
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
