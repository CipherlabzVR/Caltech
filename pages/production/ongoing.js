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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddInquiry from "@/components/UIElements/Modal/AddInquiry";
import { useRouter } from "next/router";
import { getWindowType } from "@/components/types/types";
import BorderColorIcon from "@mui/icons-material/BorderColor";

export default function OngoingInquries() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [inquiryList, setInquiryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  const navToNext = (inquiryDetails) => {
    router.push({
      pathname: "/production/ongoing/select-inquiry/",
    });
    localStorage.setItem("InquiryDetails", JSON.stringify(inquiryDetails));
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchInquiryList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchInquiryList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchInquiryList(1, searchTerm, newSize);
  };

  const fetchInquiryList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Inquiry/GetAllInquiryByStatus?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&inquirystatus=1`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setInquiryList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchInquiryList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Ongoing Inquiries</h1>
        <ul>
          <li>
            <Link href="/production/ongoing/">Ongoing Inquiries</Link>
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
          {create ? <AddInquiry fetchItems={fetchInquiryList} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Inquiry Code</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Categories</TableCell>
                  <TableCell>Style Name</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inquiryList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="error">
                        No Inquiries Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  inquiryList.map((inquiry, index) => (
                    <TableRow key={index} onClick={() => navToNext(inquiry)}>
                      <TableCell>{inquiry.inqCode}</TableCell>
                      <TableCell>{inquiry.customerName}</TableCell>
                      <TableCell>
                        {inquiry.inquiryOptions.length > 0
                          ? inquiry.inquiryOptions.map((item, index) => (
                            <React.Fragment key={index}>
                              <span>
                                {getWindowType(item.windowType)}
                                {index !==
                                  inquiry.inquiryOptions.length - 1 && " ,"}
                              </span>
                              {(index + 1) % 5 === 0 && <br />}
                            </React.Fragment>
                          ))
                          : "-"}
                      </TableCell>
                      <TableCell>{inquiry.styleName}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit" placement="top">
                          <IconButton
                            onClick={(e) => {
                              navToNext(inquiry);
                            }}
                            aria-label="edit"
                            size="small"
                          >
                            <BorderColorIcon
                              color="primary"
                              fontSize="inherit"
                            />
                          </IconButton>
                        </Tooltip>
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
