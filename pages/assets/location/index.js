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
import AddAssetLocation from "./create";
import EditAssetLocation from "./edit";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import BASE_URL from "Base/api";

const getLevelLabel = (level) => {
  const labels = {
    1: "Entity",
    2: "Site",
    3: "Building",
    4: "Floor",
    5: "Room",
    6: "Bay/Rack",
  };
  return labels[level] || `Level ${level}`;
};

const getLevelColor = (level) => {
  const colors = {
    1: "error",
    2: "warning",
    3: "info",
    4: "primary",
    5: "success",
    6: "default",
  };
  return colors[level] || "default";
};

const AssetLocations = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
    data: locations,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchLocations,
  } = usePaginatedFetch("asset-locations/GetAllPage", "", 10, true, false);

  // Load location tree for parent dropdown in create/edit modals
  const [locationTree, setLocationTree] = useState([]);

  const loadTree = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/asset-locations?tree=true`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setLocationTree(Array.isArray(data.result) ? data.result : []);
        } else if (Array.isArray(data)) {
          setLocationTree(data);
        }
      }
    } catch (err) {
      console.error("Failed to load location tree:", err);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const refreshAll = () => {
    fetchLocations();
    loadTree();
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchLocations(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchLocations(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchLocations(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Asset Locations</h1>
        <ul>
          <li>
            <Link href="/assets/location">Asset Locations</Link>
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
            <AddAssetLocation fetchItems={refreshAll} />
          ) : (
            <Typography variant="caption" color="error">
              (Add Permission Required)
            </Typography>
          )}
        </Grid>

        {/* Table */}
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="asset-locations-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Location Name</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Full Path</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">
                        No Asset Locations Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  locations.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {item.locationCode}
                      </TableCell>
                      <TableCell>{item.locationName}</TableCell>
                      <TableCell>
                        <Chip
                          label={getLevelLabel(item.locationLevel)}
                          color={getLevelColor(item.locationLevel)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.parentLocationId ? (
                          item.parentLocationName ?? item.parentLocationId
                        ) : (
                          <em style={{ color: "#aaa" }}>Top Level</em>
                        )}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                      >
                        {item.fullPath || "—"}
                      </TableCell>
                      <TableCell>{item.address || "—"}</TableCell>
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
                            <EditAssetLocation
                              item={item}
                              fetchItems={refreshAll}
                              locationTree={locationTree}
                            />
                          )}
                          {remove && (
                            <DeleteConfirmationById
                              id={item.id}
                              controller="asset-locations/DeleteAssetLocation"
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

export default AssetLocations;
