import React, { useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { FormControl, Pagination } from "@mui/material";
import { InputLabel, MenuItem, Select } from "@mui/material";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const Category = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const controller = "Category/DeleteCategory";
  const { data: IsEcommerceWebSiteAvailable } = IsAppSettingEnabled(`IsEcommerceWebSiteAvailable`);

  const {
    data: categotyList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchCategoryList,
  } = usePaginatedFetch("Category/GetAllCategoryPage");

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchCategoryList(1, val, pageSize);
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

  const navigateToViewImage = (url) => {
    window.open(url, "_blank");
  };

  useEffect(() => {
    fetchCategoryList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Category</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Category</li>
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
            sx={{ mb: 1 }}
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
            <Grid display="flex" justifyContent="end" item xs={12} md={6} lg={7} order={{ xs: 1, lg: 2 }}>
              {create ? <AddCategory fetchItems={fetchCategoryList} IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable} /> : ""}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Status</TableCell>
                  {IsEcommerceWebSiteAvailable && (<TableCell>Show In Web</TableCell>)}
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categotyList.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={5} component="th" scope="row">
                      <Typography color="error">
                        No Categories Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categotyList.map((cat, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>
                        {cat.categoryImage != null ?
                          <Box sx={{ width: 40, height: 40, p: 1, border: '1px solid #e5e5e5', borderRadius: '5px' }}>
                            <Box onClick={() => navigateToViewImage(cat.categoryImage)} sx={{ width: "100%", height: "100%", backgroundSize: 'cover', backgroundImage: `url(${cat.categoryImage})` }}>
                            </Box>
                          </Box>
                          :
                          <Box sx={{ width: 40, height: 40, p: 1, border: '1px solid #e5e5e5', borderRadius: '5px' }}>
                            <Box sx={{ width: "100%", height: "100%", backgroundSize: 'cover', backgroundImage: `url(/images/no-image.jpg)` }}>
                            </Box>
                          </Box>}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {cat.name}
                      </TableCell>
                      <TableCell>{formatDate(cat.createdOn)}</TableCell>
                      <TableCell>
                        {cat.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      {IsEcommerceWebSiteAvailable && (
                        <TableCell>
                          {cat.isWebView == true ? (
                            <span className="successBadge">Yes</span>
                          ) : (
                            <span className="dangerBadge">No</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {update ? (
                          <EditCategory
                            fetchItems={fetchCategoryList}
                            category={cat}
                            IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={cat.id}
                            controller={controller}
                            fetchItems={fetchCategoryList}
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
};

export default Category;
