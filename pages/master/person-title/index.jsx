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
import AddPersonTitle from "../person-title/create";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import { Typography } from "@mui/material";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import EditPersonTitle from "../person-title/edit";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { InputLabel, MenuItem, Select } from "@mui/material";
import { FormControl, Pagination } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";

export default function PersonTitle() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [personTitleList, setPersonTitleList] = useState([]);
  const controller = "PersonTitle/DeletePersonTitle";

  const {
    data: PersonTitle,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchPersonTitleList,
  } = usePaginatedFetch("PersonTitle/GetAllPersonTitle");

  // const fetchCompositionList = async () => {
  //   try {
  //     const response = await fetch(
  //       `${BASE_URL}/Composition/GetAllComposition`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch Composition List");
  //     }

  //     const data = await response.json();
  //     setCompositionList(data.result);
  //   } catch (error) {
  //     console.error("Error fetching Composition List:", error);
  //   }
  // };

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchPersonTitleList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchPersonTitleList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchPersonTitleList(1, search, size);
  };

  useEffect(() => {
    fetchPersonTitleList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Person Title</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Person Title</li>
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
          {create ? <AddPersonTitle fetchItems={fetchPersonTitleList} /> : ""}
        </Grid>
        </Grid>
        
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Person Title</TableCell>
                  {/* <TableCell>Created On</TableCell> */}
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PersonTitle.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={3} component="th" scope="row">
                      <Typography color="error">
                        No Person Title Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  PersonTitle.map((PersonTitle, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {PersonTitle.title}
                      </TableCell>
                      {/* <TableCell component="th" scope="row">
                        {formatDate(PersonTitle.createdOn)}
                      </TableCell> */}
                      <TableCell align="right">
                        {PersonTitle.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditPersonTitle
                            fetchItems={fetchPersonTitleList}
                            item={PersonTitle}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={PersonTitle.id}
                            controller={controller}
                            fetchItems={fetchPersonTitleList}
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
