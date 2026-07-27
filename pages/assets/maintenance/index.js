import React from "react";
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
import AddSchedule from "./create";
import EditSchedule from "./edit";
import ViewSchedule from "./view";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

const getMaintenanceTypeLabel = (type) => {
  switch (type) {
    case 1: return "Preventive";
    case 2: return "Corrective";
    case 3: return "Inspection";
    case 4: return "Emergency";
    default: return "Unknown";
  }
};

const MaintenanceRegistry = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);

  const {
    data: schedules,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSchedules,
  } = usePaginatedFetch("maintenance/schedules", "", 10, false, false);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchSchedules(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSchedules(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSchedules(1, search, size);
  };

  const refreshList = () => fetchSchedules(page, search, pageSize);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Asset Maintenance Schedules</h1>
        <ul>
          <li>
            <Link href="/assets/asset">Assets Registry</Link>
          </li>
          <li>Maintenance</li>
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
              placeholder="Search asset, description…"
              inputProps={{ "aria-label": "search maintenance schedules" }}
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
          alignItems="center"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? (
            <AddSchedule fetchItems={refreshList} />
          ) : (
            <Typography variant="caption" color="error">
              (Add Permission Required)
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="schedules-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Interval (Days)</TableCell>
                  <TableCell>Next Maintenance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">No Schedules Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {item.asset?.assetCode}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.asset?.assetName}
                        </Typography>
                      </TableCell>
                      <TableCell>{getMaintenanceTypeLabel(item.maintenanceType)}</TableCell>
                      <TableCell>{item.intervalDays}</TableCell>
                      <TableCell>
                        {item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          {print && <ViewSchedule item={item} />}
                          {update && (
                            <EditSchedule item={item} fetchItems={refreshList} />
                          )}
                          {remove && (
                            <DeleteConfirmationById
                              id={item.id}
                              controller="maintenance/schedules/DeleteMaintenanceSchedule"
                              fetchItems={refreshList}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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

export default MaintenanceRegistry;
