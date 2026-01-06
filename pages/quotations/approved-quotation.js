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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useRouter } from "next/router";
import { getWindowType } from "@/components/types/types";
import { formatDate } from "@/components/utils/formatHelper";
import QuotationConfirmationById from "@/components/UIElements/Modal/QuotationConfirmationById";
import PrintQuotation from "@/components/UIElements/Modal/PrintQuotation";

export default function ApprovedQuotation() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print, approve1 } = IsPermissionEnabled(cId);
  const [quotationList, setQuotationList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchQuotationList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchQuotationList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchQuotationList(1, searchTerm, newSize);
  };

  const fetchQuotationList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Inquiry/GetAllInquirySummeryHeaders?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&approvedstatus=1`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setQuotationList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchQuotationList();
  }, []);

  const navigateToEdit = (quotation) => {
    router.push({
      pathname: "/quotations/edit",
      query: { id: quotation ? quotation.inquiryID : "", status: 1, option: quotation ? quotation.optionId : "" },
    });
  };

  const navigateToComparison = (quotation) => {
    router.push({
      pathname: "/quotations/comparison",
      query: { status: 1, id: quotation ? quotation.inquiryID : "", option: quotation ? quotation.optionId : "" },
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Approved Quotation</h1>
        <ul>
          <li>
            <Link href="/quotaions/approved-quotation/">Approved Quotation</Link>
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
                  <TableCell>Inquiry Code</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Style Name</TableCell>
                  <TableCell>Option</TableCell>
                  <TableCell>Window Type</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotationList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="error">No Matching Quotations Found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (quotationList.map((quotation, index) => (
                  <TableRow
                    key={index}
                    style={{
                      display: quotationList.includes(quotation)
                        ? "table-row"
                        : "none",
                    }}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{quotation.inqCode}</TableCell>
                    <TableCell>
                      {quotation.customerDetails ? (
                        <>
                          {quotation.customerDetails.firstName}{" "}
                          {quotation.customerDetails.lastName}
                        </>
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell>{quotation.styleName}</TableCell>
                    <TableCell>{quotation.inqOptionName}</TableCell>
                    <TableCell>{getWindowType(quotation.windowType)}</TableCell>
                    <TableCell>{formatDate(quotation.createdOn)}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ display: "flex", justifyContent: "end" }}
                    >
                      <Box display="flex" sx={{ gap: "10px" }}>
                        {update ? <Button
                          onClick={() => navigateToEdit(quotation)}
                          variant="outlined"
                          size="small"
                        >
                          Edit
                        </Button> : ""}
                        {print ? <PrintQuotation quotationDet={quotation} fetchItems={fetchQuotationList}/> : ""}
                        <Button
                          onClick={() => navigateToComparison(quotation)}
                          variant="outlined"
                        >
                          Comparison
                        </Button>
                        {/* {approve1 ? <QuotationConfirmationById
                          id={quotation.id}
                          fetchItems={fetchQuotationList}
                        /> : ""} */}
                      </Box>
                    </TableCell>
                  </TableRow>
                )))}
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
