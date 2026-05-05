import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { toast, ToastContainer } from "react-toastify";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";

export default function Version() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: versions,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchVersions,
  } = usePaginatedFetch("Version/GetAllVersionsPage", "", 10, false, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchVersions(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchVersions(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchVersions(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Versions</h1>
        <ul>
          <li>
            <Link href="/version/version/">Versions</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4}>
          <ToastContainer />
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Version Number</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Version Document Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!versions || versions.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={4}>
                      <Typography color="error">No Versions Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((version, index) => (
                    <TableRow
                      key={version.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>{version.versionNumber}</TableCell>
                      <TableCell>{version.description || "-"}</TableCell>
                      <TableCell>
                        {version.versionDocumentLink ? (
                          <a
                            href={version.versionDocumentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#1976d2",
                              textDecoration: "underline",
                            }}
                          >
                            View Document
                          </a>
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
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handleChangeRowsPerPage}
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
}

