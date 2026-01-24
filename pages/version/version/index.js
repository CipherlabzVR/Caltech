import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";

export default function Version() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [versions, setVersions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVersions = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Version/GetAllVersions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }

      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast.error("Error fetching versions");
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = versions.filter(
    (item) =>
      item.versionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
                  <TableCell>#</TableCell>
                  <TableCell>Version Number</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Version Document Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={4}>
                      <Typography color="error">No Versions Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((version, index) => (
                    <TableRow
                      key={version.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {page * rowsPerPage + index + 1}
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
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}

