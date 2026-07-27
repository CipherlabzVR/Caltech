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
  Chip,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddWorkOrder from "./create";
import EditWorkOrder from "./edit";
import ViewWorkOrder from "./view";

const getStatusChip = (status) => {
  const statusMap = {
    1: { label: "Open", color: "info" },
    2: { label: "In Progress", color: "warning" },
    3: { label: "On Hold", color: "default" },
    4: { label: "Completed", color: "success" },
    5: { label: "Cancelled", color: "error" },
  };
  const config = statusMap[status] || { label: "Unknown", color: "default" };
  return <Chip label={config.label} color={config.color} size="small" />;
};

const getPriorityLabel = (priority) => {
  switch (priority) {
    case 1: return "Low";
    case 2: return "Medium";
    case 3: return "High";
    case 4: return "Critical";
    default: return "Unknown";
  }
};

const WorkOrdersRegistry = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, print } = IsPermissionEnabled(cId);

  const {
    data: workOrders,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchWorkOrders,
  } = usePaginatedFetch("maintenance/work-orders", "", 10, false, false);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchWorkOrders(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchWorkOrders(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchWorkOrders(1, search, size);
  };

  const refreshList = () => fetchWorkOrders(page, search, pageSize);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Asset Work Orders</h1>
        <ul>
          <li>
            <Link href="/assets/asset">Assets Registry</Link>
          </li>
          <li>Work Orders</li>
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
              placeholder="Search WO #, asset, description…"
              inputProps={{ "aria-label": "search work orders" }}
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
            <AddWorkOrder fetchItems={refreshList} />
          ) : (
            <Typography variant="caption" color="error">
              (Add Permission Required)
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="work-orders-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>WO Number</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Scheduled Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">No Work Orders Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{item.workOrderNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {item.asset?.assetCode}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.asset?.assetName}
                        </Typography>
                      </TableCell>
                      <TableCell>{getPriorityLabel(item.priority)}</TableCell>
                      <TableCell>
                        {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>{getStatusChip(item.status)}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          {print && <ViewWorkOrder item={item} />}
                          {update && (
                            <EditWorkOrder item={item} fetchItems={refreshList} />
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

export default WorkOrdersRegistry;
