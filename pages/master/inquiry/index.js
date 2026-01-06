import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  FormControl,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import AddInquiryModal from "@/components/UIElements/Modal/AddInquiryCategory";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import EditInquiryModal from "@/components/UIElements/Modal/EditInquiryCategory";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { InputLabel, MenuItem, Select } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";

const InquiryCategory = () => {
  const [inquiryCategory, setInquiryCategory] = useState([]);
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const controller = "InquiryCategory/DeleteInquiryCategory";

  const {
    data: InquiryCategory,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchInquiryList,
  } = usePaginatedFetch("InquiryCategory/GetAllInquiryCategoryPage");

  // const fetchInquiryCategory = async () => {
  //   try {
  //     const response = await fetch(
  //       `${BASE_URL}/InquiryCategory/GetAllInquiryCategory`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch Inquiry Category");
  //     }

  //     const data = await response.json();
  //     setInquiryCategory(data.result);
  //   } catch (error) {
  //     console.error("Error fetching Inquiry Category:", error);
  //   }
  // };

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchInquiryList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchInquiryList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchInquiryList(1, search, size);
  };

  useEffect(() => {
    fetchInquiryList();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString("en-US", options);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Inquiry Category</h1>
        <ul>
          <li>
            <Link href="/">Master</Link>
          </li>
          <li>Inquiry Category</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        {/* Search + Add button row directly above the table */}
        <Grid item xs={12}>
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Grid item xs={12} md={6} lg={5} order={{ xs: 2, lg: 1 }}>
              <Search className="search-form" style={{ width: "100%" }}>
                <StyledInputBase
                  placeholder="Search here.."
                  inputProps={{ "aria-label": "search" }}
                  value={search}
                  onChange={handleSearchChange}
                />
              </Search>
            </Grid>
            <Grid item sx={{ mt: { xs: 2, md: 0 } }} order={{ xs: 1, lg: 2 }}>
              {create ? (
                <AddInquiryModal fetchItems={fetchInquiryList} />
              ) : null}
            </Grid>
          </Grid>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Inquiry Category</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {InquiryCategory.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={4}>
                      <Typography color="error" align="center">
                        No Inquiry Categories Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  InquiryCategory.map((inquiry, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {inquiry.name}
                      </TableCell>
                      <TableCell>{formatDate(inquiry.createdOn)}</TableCell>
                      <TableCell>
                        {inquiry.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditInquiryModal
                            fetchItems={fetchInquiryList}
                            item={inquiry}
                          />
                        ) : (
                          ""
                        )}

                        {/* <DeleteConfirmationById id={inquiry.id} controller={controller} fetchItems={fetchInquiryCategory}/> */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination + Page size */}
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(
                  1,
                  Math.ceil((totalCount || 0) / (pageSize || 10))
                )}
                page={page || 1}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "120px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize || 10}
                  label="Page Size"
                  onChange={handlePageSizeChange}
                >
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
};

export default InquiryCategory;
