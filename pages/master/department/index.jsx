import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
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
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddDepartment from "./create";
import EditDepartment from "./edit";
import { createAuthHeaders, parsePagedResponse } from "@/components/utils/apiHelpers";

const Index = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    sessionStorage.setItem("category", "84"); // Use same category as Job Title for now
  }, []);

  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const fetchDepartments = async (currentPage = page, currentSearch = searchTerm, currentPageSize = pageSize) => {
    try {
      setLoading(true);
      const headers = createAuthHeaders();
      const skip = (currentPage - 1) * currentPageSize;
      
      const response = await fetch(
        `${BASE_URL}/Department/GetAllDepartment?SkipCount=${skip}&MaxResultCount=${currentPageSize}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch departments");
      }

      const jsonResponse = await response.json();
      const payload = parsePagedResponse(jsonResponse);
      
      let filteredData = payload.items || [];
      
      // Client-side search filtering
      if (currentSearch && currentSearch.trim()) {
        filteredData = filteredData.filter(
          (dept) =>
            dept.name?.toLowerCase().includes(currentSearch.toLowerCase()) ||
            dept.description?.toLowerCase().includes(currentSearch.toLowerCase())
        );
      }

      setDepartments(filteredData);
      setTotalCount(payload.totalCount || filteredData.length);
      setPage(currentPage);
      setPageSize(currentPageSize);
      setSearchTerm(currentSearch);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchDepartments(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchDepartments(1, searchTerm, size);
  };

  const handleSearchChange = (event) => {
    const newSearch = event.target.value;
    setSearchTerm(newSearch);
    setPage(1);
    fetchDepartments(1, newSearch, pageSize);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Department</h1>
        <ul>
          <li>
            <Link href="/master/department/">Department</Link>
          </li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
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

        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? (
            <AddDepartment fetchItems={fetchDepartments} />
          ) : (
            ""
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Department Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Is Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : departments && departments.length > 0 ? (
                  departments.map((department) => (
                    <TableRow
                      key={department.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.description || "-"}</TableCell>
                      <TableCell>{department.isActive ? "Yes" : "No"}</TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditDepartment
                            item={department}
                            fetchItems={fetchDepartments}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={department.id}
                            controller="Department/DeleteDepartment"
                            fetchItems={fetchDepartments}
                          />
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={4} component="th" scope="row">
                      <Typography color="error">
                        No Department Available
                      </Typography>
                    </TableCell>
                  </TableRow>
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
                <Select
                  value={pageSize}
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

export default Index;

