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
import { Pagination, Select, MenuItem, Typography } from "@mui/material";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddTopBarNotification from "./create";
import EditTopBarNotification from "./edit";

export default function TopBarNotifications() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const controller = "ECommerce/DeleteTopBarNotification";

  const {
    data,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData,
  } = usePaginatedFetch("ECommerce/GetAllTopBarNotifications");

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatus = (item) => {
    const now = new Date();
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    if (!item.isActive) return { label: "Inactive", className: "dangerBadge" };
    if (now < start) return { label: "Scheduled", className: "warningBadge" };
    if (now >= start && now <= end) return { label: "Active", className: "successBadge" };
    return { label: "Expired", className: "dangerBadge" };
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Topbar Notifications</h1>
        <ul>
          <li>
            <Link href="/ecom/topbar-notifications/">
              Topbar Notifications
            </Link>
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
              placeholder="Search by message.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          {create ? <AddTopBarNotification fetchItems={fetchData} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={7} component="th" scope="row">
                      <Typography color="error">
                        No Topbar Notifications Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const status = getStatus(item);
                    return (
                      <TableRow
                        key={item.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {page * pageSize + index + 1}
                        </TableCell>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ maxWidth: 300 }}
                        >
                          {item.message}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {formatDate(item.startDate)}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {formatDate(item.endDate)}
                        </TableCell>
                        <TableCell>
                          <span className={status.className}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {formatDate(item.createdOn)}
                        </TableCell>
                        <TableCell align="right">
                          {update ? (
                            <EditTopBarNotification
                              item={item}
                              fetchItems={fetchData}
                            />
                          ) : (
                            ""
                          )}
                          {remove ? (
                            <DeleteConfirmationById
                              id={item.id}
                              controller={controller}
                              fetchItems={fetchData}
                            />
                          ) : (
                            ""
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Grid
              container
              p={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Grid item display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Rows per page:</Typography>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
                <Typography variant="body2" ml={2}>
                  Total: {totalCount}
                </Typography>
              </Grid>
              <Grid item>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(e, value) => setPage(value - 1)}
                  color="primary"
                  shape="rounded"
                />
              </Grid>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
