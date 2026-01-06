import React, { useEffect } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { ToastContainer } from "react-toastify";
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
import CreateCategoryModal from "./create";
import EditCategoryModal from "./edit";

const Index = () => {
  useEffect(() => {
    sessionStorage.setItem("category", "106"); // HelpDeskCategories
  }, []);
  
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
    data: categoryList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchCategoryList,
  } = usePaginatedFetch("HelpDesk/GetAllCategories");

  const controller = "HelpDesk/DeleteCategory";

  const handleSearchChange = (event) => {
    const newSearch = event.target.value;
    setSearch(newSearch);
    setPage(1);
    fetchCategoryList(1, newSearch, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchCategoryList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchCategoryList(1, search, size);
  };

  if (!navigate) {
    return <div>Access Denied</div>;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Help Desk Categories</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Help Desk / Categories</li>
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
          {create && (
            <CreateCategoryModal
              fetchItems={fetchCategoryList}
              currentPage={page}
              currentSearch={search}
              currentPageSize={pageSize}
            />
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Prefix</TableCell>
                  <TableCell>Suffix</TableCell>
                  <TableCell>Padding</TableCell>
                  <TableCell>Next No.</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categoryList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">No Categories Found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categoryList.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description || "N/A"}</TableCell>
                      <TableCell>{item.ticketPrefix || "HD"}</TableCell>
                      <TableCell>{item.ticketSuffix || ""}</TableCell>
                      <TableCell>{item.sequencePadding ?? 6}</TableCell>
                      <TableCell>{item.nextSequenceNumber ?? 1}</TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update && (
                          <EditCategoryModal
                            fetchItems={fetchCategoryList}
                            item={item}
                            currentPage={page}
                            currentSearch={search}
                            currentPageSize={pageSize}
                          />
                        )}
                        {remove && (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchCategoryList}
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

