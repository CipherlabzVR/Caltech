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
import { Typography } from "@mui/material";
import AddGSM from "@/components/UIElements/Modal/AddGSM";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import EditGSM from "@/components/UIElements/Modal/EditGSM";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { InputLabel, MenuItem, Select } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import {
  FormControl,
  Pagination,
} from "@mui/material";
export default function GSM() {
  const [gsmList, setGSMList] = useState([]);
  const controller = "GSM/DeleteGSM";
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);

  const {
    data: GSM,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchGSMList,
  } = usePaginatedFetch("GSM/GetAllGSMPage");


  // const fetchGSMList = async () => {
  //   try {
  //     const response = await fetch(`${BASE_URL}/GSM/GetAllGSM`, {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to fetch GSM List");
  //     }

  //     const data = await response.json();
  //     setGSMList(data.result);
  //   } catch (error) {
  //     console.error("Error fetching GSM List:", error);
  //   }
  // };

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchGSMList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchGSMList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchGSMList(1, search, size);
  };

  useEffect(() => {
    fetchGSMList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>GSM</h1>
        <ul>
          <li>
            <Link href="/">Master</Link>
          </li>
          <li>GSM</li>
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
            {create ? <AddGSM fetchItems={fetchGSMList} /> : ""}
          </Grid>
        </Grid>
        
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>GSM Name</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {GSM.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={3} component="th" scope="row">
                      <Typography color="error">No GSM Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  GSM.map((GSM, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {GSM.name}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {formatDate(GSM.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {GSM.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditGSM fetchItems={fetchGSMList} item={GSM} />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={GSM.id}
                            controller={controller}
                            fetchItems={fetchGSMList}
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
