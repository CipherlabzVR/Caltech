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
import AddColor from "@/components/UIElements/Modal/AddColor";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import { Typography } from "@mui/material";
import EditColor from "@/components/UIElements/Modal/EditColor";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { InputLabel, MenuItem, Select } from "@mui/material";
import { FormControl, Pagination } from "@mui/material";

export default function ColorCode() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [colorCodeList, setColorCodeList] = useState([]);
  const controller = "ColorCode/DeleteColorCode";

  const {
    data: ColorCode,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchColorCodeList,
  } = usePaginatedFetch("ColorCode/GetAllColorCodePage");

  // const fetchColorCodeList = async () => {
  //   try {
  //     const response = await fetch(`${BASE_URL}/ColorCode/GetAllColorCode`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch Color Code List");
  //     }

  //     const data = await response.json();
  //     setColorCodeList(data.result);
  //   } catch (error) {
  //     console.error("Error fetching Color Code List:", error);
  //   }
  // };

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchColorCodeList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchColorCodeList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchColorCodeList(1, search, size);
  };

  useEffect(() => {
    fetchColorCodeList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Color Code</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Color Code</li>
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
    {create ? <AddColor fetchItems={fetchColorCodeList} /> : ""}
  </Grid>
</Grid>

        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Color Code</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ColorCode.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={3} component="th" scope="row">
                      <Typography color="error">
                        No Color Codes Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  ColorCode.map((ColorCode, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {ColorCode.name}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {formatDate(ColorCode.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {ColorCode.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditColor
                            fetchItems={fetchColorCodeList}
                            item={ColorCode}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={ColorCode.id}
                            controller={controller}
                            fetchItems={fetchColorCodeList}
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
