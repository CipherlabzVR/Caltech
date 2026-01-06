import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
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
import AddSubCategory from "@/components/UIElements/Modal/AddSubCategory";
import BASE_URL from "Base/api";
import EditSubCategory from "@/components/UIElements/Modal/EditSubCategory";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { FormControl, Pagination } from "@mui/material";
import { InputLabel, MenuItem, Select } from "@mui/material";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const SubCategory = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const controller = "SubCategory/DeleteSubCategory";
  const [catInfo, setCatInfo] = useState({});
  const { categories } = GetAllItemDetails();
  const { data: IsEcommerceWebSiteAvailable } = IsAppSettingEnabled(`IsEcommerceWebSiteAvailable`);

  useEffect(() => {
    if (categories) {
      const catMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {});
      setCatInfo(catMap);
    }
  }, [categories]);


  const {
    data: subCategoryList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSubCategoryList,
  } = usePaginatedFetch("SubCategory/GetAllSubCategoryPage");


  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchSubCategoryList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSubCategoryList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSubCategoryList(1, search, size);
  };

  useEffect(() => {
    fetchSubCategoryList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }


  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sub Category</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Sub Category</li>
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
            <Grid item xs={12} md={6} lg={7} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
              <AddSubCategory fetchItems={fetchSubCategoryList} IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Sub Category Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Status</TableCell>
                  {IsEcommerceWebSiteAvailable && (<TableCell>Show In Web</TableCell>)}
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subCategoryList.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={4} component="th" scope="row">
                      <Typography color="error">
                        No Sub Categories Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subCategoryList.map((subCategory, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell> {subCategory.name}</TableCell>
                      <TableCell component="th" scope="row">
                        {catInfo[subCategory.categoryId]?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {formatDate(subCategory.createdOn)}
                      </TableCell>
                      <TableCell>
                        {subCategory.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      {IsEcommerceWebSiteAvailable && (
                        <TableCell>
                          {subCategory.isWebView == true ? (
                            <span className="successBadge">Yes</span>
                          ) : (
                            <span className="dangerBadge">No</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {update ? (
                          <EditSubCategory
                            fetchItems={fetchSubCategoryList}
                            subcategory={subCategory}
                            IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={subCategory.id}
                            controller={controller}
                            fetchItems={fetchSubCategoryList}
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

export default SubCategory;
