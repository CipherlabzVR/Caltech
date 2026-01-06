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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Chip, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { getBookingPaymentStatus, getBookingStatus, getNationality, getPaymentMethods } from "@/components/types/types";
import { formatDate } from "@/components/utils/formatHelper";
import AddBooking from "./create";
import EditBooking from "./edit";
import CancelBookingById from "@/components/UIElements/Modal/CancelBookingById";
import ViewDetails from "./view-details";

export default function Bookings() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: bookingList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchBookingList,
  } = usePaginatedFetch("Booking/GetAllBookings");

  const controller = "Booking/BookingCancelation";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchBookingList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchBookingList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchBookingList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Bookings</h1>
        <ul>
          <li>
            <Link href="/reservation/booking/">Bookings</Link>
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
          {create ? <AddBooking fetchItems={fetchBookingList} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Contact No</TableCell>
                  <TableCell>Persons</TableCell>
                  <TableCell>Nationality</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Packages</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookingList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11}>
                      <Typography color="error">No Bookings Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookingList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.phoneNumber}</TableCell>
                      <TableCell>{item.personCount}</TableCell>
                      <TableCell>{getNationality(item.nationality)}</TableCell>
                      <TableCell>{getPaymentMethods(item.paymentMethod)}</TableCell>
                      <TableCell>
                        <Chip size="small" color={item.paymentStatus === 2 ? "primary" : "default"} label={getBookingPaymentStatus(item.paymentStatus)} />
                      </TableCell>
                      <TableCell>
                        <ViewDetails id={item.id}/>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={item.bookingStatus === 2 ? "warning" : (item.bookingStatus === 3 ? "error" : "success")} label={getBookingStatus(item.bookingStatus)} />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={2}>
                          {update && item.bookingStatus != 3 ? <EditBooking item={item} fetchItems={fetchBookingList} /> : ""}
                          {remove && item.bookingStatus != 3 ? <CancelBookingById id={item.id} controller={controller} fetchItems={fetchBookingList} /> : ""}
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