import React, { } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddMenuItem from "./create";
import EditMenuItem from "./edit";
import ViewPrice from "./view";

export default function MenuList() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);

  const {
    data: menuList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchMenuList,
  } = usePaginatedFetch("MenuList/GetAllMenuItems");

  const controller = "MenuList/DeleteMenuItem";

  const navigateToViewImage = (url) => {
    window.open(url, "_blank");
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchMenuList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchMenuList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchMenuList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Menu List</h1>
        <ul>
          <li>
            <Link href="/master/menu-list/">Menu List</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <AddMenuItem fetchItems={fetchMenuList} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Sub Category</TableCell>
                  <TableCell>Kitchen</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Inventory Item</TableCell>
                  <TableCell>Combo Meal</TableCell>
                  <TableCell>Is WebView</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menuList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <Typography color="error">No Data Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  menuList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {item.productImage != null ?
                          <Box sx={{ width: 50, height: 50, p: 1, border: '1px solid #e5e5e5', borderRadius: '5px' }}>
                            <Box onClick={() => navigateToViewImage(item.productImage)} sx={{ width: "100%", height: "100%", backgroundSize: 'cover', backgroundImage: `url(${item.productImage})` }}>
                            </Box>
                          </Box>
                          :
                          <Box sx={{ width: 50, height: 50, p: 1, border: '1px solid #e5e5e5', borderRadius: '5px' }}>
                            <Box sx={{ width: "100%", height: "100%", backgroundSize: 'cover', backgroundImage: `url(/images/no-image.jpg)` }}>
                            </Box>
                          </Box>}
                      </TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{item.subCategoryName}</TableCell>
                      <TableCell>{item.kitchenName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isInventoryItem ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isComboMeal ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isWebView ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1}>
                          <ViewPrice pricing={item.pricing} />
                          {update ? <EditMenuItem fetchItems={fetchMenuList} item={item} /> : ""}
                          {remove ? <DeleteConfirmationById id={item.id} controller={controller} fetchItems={fetchMenuList} /> : ""}
                        </Box>
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
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
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