import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import AddAssetCategory from "./create";
import EditAssetCategory from "./edit";
import BASE_URL from "Base/api";

const getDepreciationMethodName = (value) => {
  const methods = {
    1: "Straight Line",
    2: "Reducing Balance",
    3: "Units of Production",
    4: "No Depreciation",
  };
  return methods[value] || "Unknown";
};

const AssetCategories = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
    data: categories,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchCategories,
  } = usePaginatedFetch("asset-categories/GetAllPage", "", 10, true, false);

  // Load category tree for parent dropdown in create/edit modals
  const [categoryTree, setCategoryTree] = useState([]);

  const loadTree = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/asset-categories?tree=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Handle different response shapes
        if (data.result) {
          setCategoryTree(Array.isArray(data.result) ? data.result : []);
        } else if (Array.isArray(data)) {
          setCategoryTree(data);
        }
      }
    } catch (err) {
      console.error("Failed to load category tree:", err);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  // Refresh both list and tree
  const refreshAll = () => {
    fetchCategories();
    loadTree();
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchCategories(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchCategories(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchCategories(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Asset Categories</h1>
        <ul>
          <li>
            <Link href="/assets/category">Asset Categories</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        {/* Search */}
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

        {/* Add Button */}
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? (
            <AddAssetCategory fetchItems={refreshAll} />
          ) : (
            <Typography variant="caption" color="error">
              (Add Permission Required)
            </Typography>
          )}
        </Grid>

        {/* Table */}
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="asset-categories-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Category Name</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Depreciation</TableCell>
                  <TableCell>Useful Life</TableCell>
                  <TableCell>GL Asset A/C</TableCell>
                  <TableCell>Maintenance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="error">
                        No Asset Categories Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {item.categoryCode}
                      </TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>
                        {item.parentCategoryId ? (
                          item.parentCategoryName ?? item.parentCategoryId
                        ) : (
                          <em style={{ color: "#aaa" }}>Root</em>
                        )}
                      </TableCell>
                      <TableCell>
                        {getDepreciationMethodName(item.depreciationMethod)}
                      </TableCell>
                      <TableCell>
                        {item.defaultUsefulLifeMonths} mo
                      </TableCell>
                      <TableCell>{item.glAssetAccount}</TableCell>
                      <TableCell>
                        {item.requiresMaintenance ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="end" gap={0.5}>
                          {update && (
                            <EditAssetCategory
                              item={item}
                              fetchItems={refreshAll}
                              categoryTree={categoryTree}
                            />
                          )}
                          {remove && (
                            <DeleteConfirmationById
                              id={item.id}
                              controller="asset-categories/DeleteAssetCategory"
                              fetchItems={refreshAll}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize) || 1}
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
};

export default AssetCategories;
