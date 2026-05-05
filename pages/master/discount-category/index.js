import React from "react";
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
import {
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import AddDiscountCategoryDialog from "./create";
import EditDiscountCategoryDialog from "./edit";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function DiscountCategories() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);

  const controller = "DiscountCategory/Delete";

  const {
    data: discountList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchDiscountList,
  } = usePaginatedFetch("DiscountCategory/GetPaged", "", 10, true, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchDiscountList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchDiscountList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchDiscountList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Discount Categories</h1>
        <ul>
          <li>
            <Link href="/master/discount-category/">Discount Categories</Link>
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
              value={search}
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
          <AddDiscountCategoryDialog
            fetchItems={() => {
              setPage(1);
              fetchDiscountList(1, search, pageSize);
            }}
          />
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Discount Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discountList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="error">
                        No Discount Categories Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  discountList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.discountName || ""}</TableCell>
                      <TableCell>
                        {item.discountType === 1 ? "Value" : "Percentage"}
                      </TableCell>
                      <TableCell>{item.value || 0}</TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <Typography style={{ color: "#4caf50", fontWeight: "500" }}>
                            Active
                          </Typography>
                        ) : (
                          <Typography style={{ color: "#f44336", fontWeight: "500" }}>
                            Inactive
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <EditDiscountCategoryDialog
                          fetchItems={fetchDiscountList}
                          item={item}
                        />
                        <DeleteConfirmationById
                          id={item.id}
                          controller={controller}
                          fetchItems={fetchDiscountList}
                        />
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
}

