import React, { useEffect, useState } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton, Box, Chip, Tabs, Tab } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import AddReservation from "./AddReservation";
import { getAppointment, getAppointmentColor, getBridal, getEventType, getPreferedTime } from "@/components/types/types";
import UpdateReservation from "./UpdateReservation";
import ReservationMedia from "@/components/UIElements/Modal/ReservationMedia";
import CancelConfirmation from "@/components/UIElements/Modal/CancelConfirmation";
import getNext from "@/components/utils/getNext";
import RecreateConfirmation from "./RecreateConfirmation";

export default function Reservation() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print, approve1 } = IsPermissionEnabled(cId);
  const { create: chargeSheetCreate } = IsPermissionEnabled(46);
  const { create: galleryCreate } = IsPermissionEnabled(44);
  const [resList, setResList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const [appointmentType, setAppointmentType] = useState(0);
  const [bridalType, setBridalType] = useState(0);
  const { data: docnumber } = getNext("14");

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setPage(1);
    fetchResList(1, searchTerm, pageSize, newValue, appointmentType, bridalType);
  };

  const handleAppointmentTypeChange = (event) => {
    const value = event.target.value;
    setAppointmentType(value);
    setPage(1);
    fetchResList(1, searchTerm, pageSize, tabIndex, value, bridalType);
  };

  const handleBridalTypeChange = (event) => {
    const value = event.target.value;
    setBridalType(value);
    setPage(1);
    fetchResList(1, searchTerm, pageSize, tabIndex, appointmentType, value);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchResList(1, value, pageSize, tabIndex, appointmentType, bridalType);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchResList(value, searchTerm, pageSize, tabIndex, appointmentType, bridalType);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchResList(1, searchTerm, newSize, tabIndex, appointmentType, bridalType);
  };

  const getReservationTypeByTab = (tab) => {
    if (tab === 2) return 11;
    if (tab === 3) return 4;
    return 5;
  };

  const fetchResList = async (page = 1, search = "", size = pageSize, tab = tabIndex, appointment = appointmentType, bridal = bridalType) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const reservationType = getReservationTypeByTab(tab);
      const query = `${BASE_URL}/Reservation/GetAllReservationSkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&reservationType=${reservationType}&appointmentType=${appointment}&bridalType=${bridal}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setResList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchResList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  const filteredData = resList.filter(
    (item) =>
      (tabIndex === 0 && (item.status === 1 || item.status === 2)) ||
      (tabIndex === 1 && item.status === 3) ||
      (tabIndex === 2 && item.status === 4) ||
      (tabIndex === 3)
  );

  const defaultColSpan = 14;
  const tableColSpan = defaultColSpan + (tabIndex === 1 ? 1 : 0) - (tabIndex === 3 ? 3 : 0);


  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Reservations</h1>
        <ul>
          <li>
            <Link href="/reservation/reservations/">Reservations</Link>
          </li>
        </ul>
      </div>
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Ongoing" />
        <Tab label="Canceled" />
        <Tab label="Completed" />
        <Tab label="Pending Reservations" />
      </Tabs>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={6} lg={2} order={{ xs: 3, lg: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Appointment Type</InputLabel>
            <Select
              value={appointmentType}
              label="Appointment Type"
              onChange={handleAppointmentTypeChange}
            >
              <MenuItem value={0}>All</MenuItem>
              <MenuItem value={1}>First</MenuItem>
              <MenuItem value={2}>Show Saree</MenuItem>
              <MenuItem value={3}>Fabric & Design</MenuItem>
              <MenuItem value={4}>Measurement</MenuItem>
              <MenuItem value={5}>Fiton</MenuItem>
              <MenuItem value={6}>Trial</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} lg={2} order={{ xs: 3, lg: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Bridal Type</InputLabel>
            <Select
              value={bridalType}
              label="Bridal Type"
              onChange={handleBridalTypeChange}
            >
              <MenuItem value={0}>All</MenuItem>
              <MenuItem value={1}>Kandyan</MenuItem>
              <MenuItem value={2}>Indian</MenuItem>
              <MenuItem value={3}>Western</MenuItem>
              <MenuItem value={4}>Hindu</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} lg={4} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 3 }}>
          {create ? <AddReservation fetchItems={fetchResList} documentNo={docnumber} approve1={approve1} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Doc. No</TableCell>
                  <TableCell>Payment Code</TableCell>
                  <TableCell>Payment Date</TableCell>                  
                  <TableCell>Event&nbsp;Type</TableCell>
                  <TableCell>Wedding&nbsp;Date</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Groom&nbsp;Name</TableCell>
                  <TableCell>NIC/Passport No</TableCell>
                  <TableCell>Phone&nbsp;Number</TableCell>
                  <TableCell>Preferd&nbsp;Time</TableCell>
                  <TableCell>Bridal&nbsp;Type</TableCell>
                  {tabIndex !== 3 ? <TableCell>Total&nbsp;Maids</TableCell> : null}
                  {tabIndex !== 3 ? <TableCell>Next&nbsp;Appointment</TableCell> : null}
                  {tabIndex !== 3 ? <TableCell>Status</TableCell> : null}
                  <TableCell>Remark</TableCell>
                  {tabIndex === 1 ? <TableCell>Canceled&nbsp;Reason</TableCell> : ""}                  
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan} align="center">
                      <Typography color="error">No Reservations Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((reservation, index) => (
                    <TableRow key={index} sx={{ background: reservation.status === 2 ? "#FFFECE" : "" }}>
                      <TableCell>{reservation.documentNo}</TableCell>
                      <TableCell>{reservation.paymentCode}</TableCell>
                      <TableCell>{formatDate(reservation.initialPaymentDate)}</TableCell>                      
                      <TableCell>{getEventType(reservation.reservationFunctionType)}</TableCell>
                      <TableCell>{formatDate(reservation.reservationDate)}
                        <br />
                        {reservation.reservationFunctionType === 3 ? (
                          <Chip
                            label={`HC : ${formatDate(reservation.homeComingDate)}`}
                            size="small"
                            variant="filled"
                            sx={{ backgroundColor: '#FFF57E' }}
                          />
                        ) : (
                          <></>
                        )}
                      </TableCell>
                      <TableCell>{reservation.customerName}</TableCell>
                      <TableCell>{reservation.groomName}</TableCell>
                      <TableCell>{reservation.nic}</TableCell>
                      <TableCell>
                        {reservation.mobileNo}
                        {/* {reservation.emergencyContactNo ? `/${reservation.emergencyContactNo}` : ""} */}
                      </TableCell>
                      <TableCell>{getPreferedTime(reservation.preferdTime)}</TableCell>
                      <TableCell>{getBridal(reservation.bridleType)}</TableCell>
                      {tabIndex !== 3 ? (
                        <TableCell>{reservation.reservationDetails.maids || 0}</TableCell>
                      ) : null}
                      {tabIndex !== 3 ? (
                        <TableCell>
                          <Chip size="small" sx={{ background: getAppointmentColor(reservation.nextAppointmentType) }} label={getAppointment(reservation.nextAppointmentType)} />
                        </TableCell>
                      ) : null}
                      {tabIndex !== 3 ? (
                        <TableCell>
                          {reservation.status === 2 ? (
                            <>
                              <Chip size="small" label="Postponed" />
                              {formatDate(reservation.lastModifiedReservationDate)} <Typography color="error" component="span">to</Typography> {formatDate(reservation.reservationDate)}
                            </>
                          ) : (reservation.status === 3 ?
                            <Chip size="small" label="Canceled" color="error" /> : (reservation.status === 4 ? <Chip size="small" label="Complete" color="success" /> : <Chip size="small" label="Ongoing" color="primary" />)

                          )}
                        </TableCell>
                      ) : null}
                      <TableCell>{reservation.reservationDetails.remark}</TableCell>
                      {tabIndex === 1 ? <TableCell>{reservation.canceledReason}</TableCell> : ""}
                      
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {update && tabIndex == 0 ? <UpdateReservation reservation={reservation} fetchItems={fetchResList} approve1={approve1} /> : ""}
                          {galleryCreate ? <ReservationMedia id={reservation.id} /> : ""}
                          {tabIndex == 0 && remove ? <CancelConfirmation id={reservation.id} fetchItems={fetchResList} /> : ""}
                          {tabIndex == 1 && update ? <RecreateConfirmation id={reservation.id} fetchItems={fetchResList} /> : ""}
                          {chargeSheetCreate && tabIndex == 0 ? (
                            <Tooltip title="Create Charges Sheet" placement="top">
                              <a href={`/reservation/reservations/charges-sheet?id=${reservation.id}`} target="_blank">
                                <IconButton aria-label="print" size="small">
                                  <NoteAddIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </a>
                            </Tooltip>
                          ) : ""}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination count={Math.ceil(totalCount / pageSize)} page={page} onChange={handlePageChange} color="primary" shape="rounded" />
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
