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
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function UserManualSettings() {
  useEffect(() => {
    sessionStorage.setItem("category", "149");
  }, []);

  const cId = sessionStorage.getItem("category") ?? "149";
  const { navigate, update } = IsPermissionEnabled(cId);
  const [manualList, setManualList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchManualList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchManualList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchManualList(1, searchTerm, newSize);
  };

  const fetchManualList = async (pageNumber = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pageNumber - 1) * size;
      const query = `${BASE_URL}/UserManualSetting/GetAll?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch manuals");

      const data = await response.json();
      setManualList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to load user manuals");
    }
  };

  useEffect(() => {
    fetchManualList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>User Manuals</h1>
        <ul>
          <li>
            <Link href="/administrator/user-manual/">User Manuals</Link>
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
            <Table aria-label="user manual table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Module Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Document Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manualList.length === 0 ? (
                  <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell component="th" scope="row" colSpan={4}>
                      <Typography color="error">No Manuals Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  manualList.map((manual, index) => (
                    <TableRow key={manual.id ?? index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>{manual.moduleName}</TableCell>
                      <TableCell>{manual.description}</TableCell>
                      <TableCell>
                        {manual.documentLink ? (
                          <Link href={manual.documentLink} target="_blank">
                            {manual.documentLink}
                          </Link>
                        ) : (
                          "-"
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

