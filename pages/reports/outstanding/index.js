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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton, Box, Button } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import ViewOutstanding from "./ViewOutstanding";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import { Report } from "Base/report";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { Catelogue } from "Base/catelogue";

export default function Outstanding() {
  const cId = sessionStorage.getItem("category");
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const { data: OutstandingReport } = GetReportSettingValueByName("OutstandingReport");
  const [outstandingList, setOutstandingList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchOutstandingList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchOutstandingList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchOutstandingList(1, searchTerm, newSize);
  };

  const fetchOutstandingList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Outstanding/GetAllOutstandingGroupedByCustomer?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setOutstandingList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchOutstandingList();
  }, []);
  
  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Outstanding</h1>
        <ul>
          <li>
            <Link href="/report/outstanding/">Outstanding</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Total Outstanding Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outstandingList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography color="error">No Outstanding Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  outstandingList.map((item, index) => {
                    const reportLink = `/PrintDocumentsByCustomerIdLocal?InitialCatalog=${Catelogue}&reportName=${OutstandingReport}&customerId=${item.customerId}&warehouseId=${warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{formatCurrency(item.outstandingAmount)}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            <ViewOutstanding item={item} />
                            <ShareReports url={`/PrintDocumentsByCustomerIdUpload?InitialCatalog=${Catelogue}&reportName=${OutstandingReport}&customerId=${item.customerId}&warehouseId=${warehouseId}&currentUser=${name}`} mobile={item.customerContactNo} />
                            {print ? <Tooltip title="Print" placement="top">
                              <a href={`${Report}` + reportLink} target="_blank">
                                <IconButton aria-label="print" size="small">
                                  <LocalPrintshopIcon color="primary" fontSize="medium" />
                                </IconButton>
                              </a>
                            </Tooltip> : ""}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
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
