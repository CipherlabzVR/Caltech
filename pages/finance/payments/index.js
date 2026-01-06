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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Tooltip, IconButton, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { ChartOfAccountType, getPaymentMethods } from "@/components/types/types";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import useApi from "@/components/utils/useApi";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Catelogue } from "Base/catelogue";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import { Report } from "Base/report";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { useRouter } from "next/router";

export default function Payments() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [accountInfo, setAccountInfo] = useState([]);
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const { data: PaymentReportName } = GetReportSettingValueByName("Payment");
  const name = localStorage.getItem("name");
  const router = useRouter();

  useEffect(() => {
    if (accountList) {
      const accInf = accountList.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {});
      setAccountInfo(accInf);
    }

  }, [accountList]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchPayments(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchPayments(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchPayments(1, searchTerm, newSize);
  };

  const fetchPayments = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Payments/GetAllPayments?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setPayments(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const navigateToCreate = () => {
    router.push({
      pathname: "/finance/payments/create",
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Payments</h1>
        <ul>
          <li>
            <Link href="/finance/payments/">Payments</Link>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + Add New
          </Button> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Document No</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Payment Type</TableCell>
                  <TableCell>Chart of Account</TableCell>
                  <TableCell>Paid Amount</TableCell>
                  <TableCell>Ref. No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No Payments Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((item, index) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${PaymentReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const PaymentReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${PaymentReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{formatDate(item.paymentDate)}</TableCell>
                        <TableCell>{getPaymentMethods(item.paymentType)}</TableCell>
                        <TableCell>{accountInfo[item.chartOfAccountId]?.code || "-"} - {accountInfo[item.chartOfAccountId]?.description || "-"}</TableCell>
                        <TableCell>{formatCurrency(item.netAmount)}</TableCell>
                        <TableCell>{item.refferanceNo}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            <ShareReports url={whatsapp} mobile={item.supplierContactNo} />
                            {print ? <>
                              <Tooltip title="Print" placement="top">
                                <a href={`${Report}` + PaymentReportLink} target="_blank">
                                  <IconButton aria-label="print" size="small">
                                    <LocalPrintshopIcon color="primary" fontSize="medium" />
                                  </IconButton>
                                </a>
                              </Tooltip></> : ""}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
