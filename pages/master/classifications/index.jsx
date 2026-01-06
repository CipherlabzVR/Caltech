import styles from "@/styles/PageTitle.module.css";
import React from "react";
import { ToastContainer } from "react-toastify";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
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
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
// CHANGED: Imported Classification modals
import CreateClassificationModal from "./create";
import EditClassificationModal from "./edit";

const Index = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  
  // CHANGED: Updated hook for Classifications
  const {
    data: classificationList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchClassificationList,
  } = usePaginatedFetch("Classifications/GetAllClassifications");

  // CHANGED: Delete controller endpoint
  const controller = "Classifications/DeleteClassification";

  const handleSearchChange = (event) => {
    const newSearch = event.target.value;
    setSearch(newSearch);
    setPage(1);
    fetchClassificationList(1, newSearch, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchClassificationList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchClassificationList(1, search, size);
  };

  // The original component was missing the AccessDenied check, re-adding for completeness
  if (!navigate) {
    // Assuming you have an AccessDenied component
    // return <AccessDenied />;
    return <div>Access Denied</div>;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        {/* CHANGED: Title and Breadcrumb */}
        <h1>Classifications</h1>
        <ul>
          <li>
            <Link href="/master/classifications/">Classifications</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by Name..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {/* CHANGED: Using CreateClassificationModal */}
          {create && <CreateClassificationModal fetchItems={fetchClassificationList} />}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                {/* CHANGED: Table Headers */}
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classificationList.length === 0 ? (
                  <TableRow>
                    {/* CHANGED: ColSpan and message */}
                    <TableCell colSpan={3} align="center">
                      <Typography color="error">No Classifications Found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  classificationList.map((item, index) => (
                    <TableRow key={item.id || index}>
                      {/* CHANGED: Table Cells */}
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update && (
                          // CHANGED: Using EditClassificationModal
                          <EditClassificationModal
                            fetchItems={fetchClassificationList}
                            item={item}
                          />
                        )}
                        {remove && (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchClassificationList}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container alignItems="center" justifyContent="space-between" p={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
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