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
import AddSize from "@/components/UIElements/Modal/AddSize";
import { Typography } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import EditSize from "@/components/UIElements/Modal/EditSize";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { FormControl, Pagination } from "@mui/material";
import { InputLabel, MenuItem, Select } from "@mui/material";

export default function Size() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [sizeList, setSizeList] = useState([]);
  const controller = "Size/DeleteSize";

  const {
    data: Size,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSizeList,
  } = usePaginatedFetch("Size/GetAllSizePage");

  // const fetchSizeList = async () => {
  //   try {
  //     const response = await fetch(`${BASE_URL}/Size/GetAllSize`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch Size List");
  //     }

  //     const data = await response.json();
  //     setSizeList(data.result);
  //   } catch (error) {
  //     console.error("Error fetching Size List:", error);
  //   }
  // };

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchSizeList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSizeList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSizeList(1, search, size);
  };

  useEffect(() => {
    fetchSizeList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Size</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Size</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12}>
          <Grid
  container
  alignItems="center"
  justifyContent="space-between"
  sx={{ mb: 2 }}
>
  {/* Search bar on the left */}
  <Grid item xs={12} md={6} lg={5}>
    <Search className="search-form" style={{ width: "100%" }}>
      <StyledInputBase
        placeholder="Search here.."
        inputProps={{ "aria-label": "search" }}
        value={search}
        onChange={handleSearchChange}
      />
    </Search>
  </Grid>

  {/* Add button on the right */}
  <Grid item>
    {create ? <AddSize fetchItems={fetchSizeList} /> : ""}
  </Grid>
</Grid>

        </Grid>
        <Grid item xs={12} display="flex" justifyContent="end">
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Size</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Size.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={3} component="th" scope="row">
                      <Typography color="error">No Sizes Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  Size.map((Size, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {Size.name}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {formatDate(Size.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {Size.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditSize fetchItems={fetchSizeList} item={Size} />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={Size.id}
                            controller={controller}
                            fetchItems={fetchSizeList}
                          />
                        ) : (
                          ""
                        )}
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
}
