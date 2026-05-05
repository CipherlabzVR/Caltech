import React, { useState } from "react";
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
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddAsset from "./create";
import EditAsset from "./edit";
import ViewAsset from "./view";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

const getStatusBadge = (statusValue) => {
  switch (statusValue) {
    case 1:
      return <span className="warningBadge">Draft</span>;
    case 2:
      return <span className="infoBadge">Pending Approval</span>;
    case 3:
      return <span className="successBadge">Active</span>;
    case 4:
      return <span className="infoBadge">In Maintenance</span>;
    case 5:
      return <span className="warningBadge">Transferred</span>;
    case 6:
      return <span className="dangerBadge">Disposed</span>;
    case 7:
      return <span className="dangerBadge">Retired</span>;
    default:
      return <span className="infoBadge">Unknown</span>;
  }
};

const Assets = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print, approve1 } = IsPermissionEnabled(cId);

  const {
    data: assets,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchAssets,
  } = usePaginatedFetch("assets", "", 10, true, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchAssets(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchAssets(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchAssets(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Assets Registry</h1>
        <ul>
          <li>
            <Link href="/assets/asset">Assets Registry</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        {/* Search */}
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search assets.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        {/* Add Button */}
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? (
            <AddAsset fetchItems={fetchAssets} />
          ) : (
            <Typography variant="caption" color="error">
              (Add Permission Required)
            </Typography>
          )}
        </Grid>

        {/* Table */}
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="assets-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">No Assets Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>{item.assetCode}</TableCell>
                      <TableCell>{item.assetName}</TableCell>
                      <TableCell>{item.category?.categoryName || "—"}</TableCell>
                      <TableCell>{item.location?.locationName || "—"}</TableCell>
                      <TableCell>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell align="right">
                        {item.currencyCode} {item.purchaseCost?.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="end" gap={0.5}>
                          {print && <ViewAsset item={item} fetchItems={fetchAssets} approve1={approve1} />}
                          {update && <EditAsset item={item} fetchItems={fetchAssets} />}
                          {remove && (
                            <DeleteConfirmationById
                              id={item.id}
                              controller="assets/AssetDelete"
                              fetchItems={fetchAssets}
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
};

export default Assets;
