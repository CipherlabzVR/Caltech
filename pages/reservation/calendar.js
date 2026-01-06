import React, { useState, useEffect } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CloseIcon from "@mui/icons-material/Close";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PauseIcon from "@mui/icons-material/Pause";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddPencilNote from "@/components/UIElements/Modal/AddPencilNote";
import DrawerSignIn from "pages/authentication/drawer-sign-in";
import {
  getBridal,
  getEventType,
  getLocation,
  getPreferedTime,
} from "@/components/types/types";
import { ToastContainer } from "react-toastify";
import Delete from "@/components/UIElements/Modal/Delete";
import BASE_URL from "Base/api";
import EditNote from "@/components/UIElements/Modal/EditNote";
import ViewReservation from "@/components/UIElements/Modal/ViewReservation";
import DeleteConfirmationWithReasonById from "@/components/UIElements/Modal/DeleteConfirmationWithReasonById";

const Calendar = () => {
  const currentDate = new Date();
  const formattedApiDate = `${String(currentDate.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(currentDate.getDate()).padStart(
    2,
    "0"
  )}.${currentDate.getFullYear()}`;
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarData, setCalendarData] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [selectedDay, setSelectedDay] = useState();
  const [apiDate, setApiDate] = useState(formattedApiDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isOffcanvasOpen, setOffcanvasOpen] = useState(false);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const controller = "Reservation/DeletePencilNote";

  const fetchNotes = async (date) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/GetAllMonthReservationsByDate?dateTime=${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await response.json();
      setAllNotes(data);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const toggleOffcanvas = () => {
    setOffcanvasOpen(!isOffcanvasOpen);
  };

  const handleClose = () => {
    setIsTableVisible(false);
  };

  useEffect(() => {
    fetchNotes(apiDate);
    const currentDateString = currentDate.toISOString().split("T")[0];
    setSelectedDate(currentDateString);
    generateCalendar(currentDateString);
  }, []);

  const generateCalendar = (date) => {
    if (!date) return;
    setSelectedDay(new Date(date).getDate());

    const inputDate = new Date(date);
    const month = inputDate.getMonth();
    const year = inputDate.getFullYear();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push("");
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    setCalendarData(days);

    setShowCalendar(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setShowCalendar(false);
    generateCalendar(selectedDate);
    setApiDate(e.target.value);
    fetchNotes(e.target.value);
  };

  const handleDayClick = (day) => {
    const formattedDay = `${selectedDate.split("-")[0]}-${selectedDate.split("-")[1]
      }-${String(day).padStart(2, "0")}`;

    setSelectedDay(day);
    setSelectedDate(formattedDay);
    setIsTableVisible(true);
  };

  const getLabel = (type) => {
    if (isXs) {
      return type === 1 ? "PN" : type === 2 ? "ON" : type === 3 ? "PA" : "B";
    } else {
      return type === 1
        ? "Pencil Note"
        : type === 2
          ? "Other Note"
          : type === 3
            ? "Payment Approval"
            : "Bookings";
    }
  };

  const renderCount = (day, type) => {
    const formattedDay = `${selectedDate.split("-")[0]}-${String(
      selectedDate.split("-")[1]
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const formattedResDate = allNotes.map((note) => ({
      ...note,
      reservationDate: note.reservationDate
        ? new Date(note.reservationDate).toLocaleDateString("en-CA")
        : null,
      homeComingDate: note.homeComingDate
        ? new Date(note.homeComingDate).toLocaleDateString("en-CA")
        : null,
    }));

    const notesForDay = formattedResDate.filter(
      (note) =>
        !note.isDeleted &&
        (note.reservationDate === formattedDay || note.homeComingDate === formattedDay)
    );

    if (notesForDay.length > 0) {
      const bookedCount = notesForDay.filter((note) => note.type === type).length;

      return (
        <Typography
          className={`text-start ${bookedCount > 0
            ? type === 1
              ? "text-pencil-note"
              : type === 2
                ? "other-note"
                : type === 3
                  ? "text-pending"
                  : "text-booked"
            : ""
            }`}
          sx={{ padding: 0, fontSize: "14px" }}
        >
          {bookedCount !== 0 && (
            <>
              {bookedCount} {getLabel(type)}
            </>
          )}
        </Typography>
      );
    }

    return null;
  };

  const getNotesForDay = (day) => {
    const formattedDay = `${selectedDate.split("-")[0]}-${selectedDate.split("-")[1]
      }-${String(day).padStart(2, "0")}`;

    const formattedNotes = allNotes.map((note) => ({
      ...note,
      reservationDate: note.reservationDate
        ? new Date(note.reservationDate).toLocaleDateString("en-CA")
        : null,
      homeComingDate: note.homeComingDate
        ? new Date(note.homeComingDate).toLocaleDateString("en-CA")
        : null,
    }));

    return formattedNotes.filter(
      (note) =>
        !note.isDeleted &&
        (note.reservationDate === formattedDay || note.homeComingDate === formattedDay)
    );
  };
  const renderNotes = (type, title, Icon, iconColor) => {
    const notesForSelectedDate = getNotesForDay(selectedDay);
    if (notesForSelectedDate) {
      const filteredNotes = notesForSelectedDate.filter(
        (desc) => desc.type === type
      );

      return filteredNotes.length > 0 ? (
        <List sx={{ width: "100%" }}>
          {filteredNotes.map((note, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <React.Fragment>
                      <Box display="flex" justifyContent="space-between">
                        <Typography
                          component="span"
                          variant="h6"
                          sx={{ fontWeight: "bold" }}
                        >
                          {note.customerName}
                        </Typography>
                        {type === 5 && (
                          <ViewReservation reservationId={note.id} />)}
                        {note.type === 1 ? (
                          <Box display="flex" justifyContent="end" gap={1}>
                            <EditNote date={selectedDate} note={note} fetchItems={fetchNotes} />
                            <DeleteConfirmationWithReasonById id={note.id} controller={controller} fetchItems={fetchNotes} date={selectedDate} />
                          </Box>
                        ) : (
                          ""
                        )}
                      </Box>
                    </React.Fragment>
                  }
                  secondary={
                    <React.Fragment>{note.description}</React.Fragment>
                  }
                />
              </ListItem>
              {note.type === 1 || note.type === 3 || note.type === 5 ? (
                <Box display="flex" justifyContent="end" gap={1}>
                  <Box mb={2} display="flex" justifyContent="end" gap={1}>
                    <Chip
                      size="small"
                      label={getEventType(note.reservationFunctionType)}
                      color="error"
                    />
                    <Chip
                      size="small"
                      label={getPreferedTime(note.preferdTime)}
                      color="success"
                    />
                    <Chip
                      size="small"
                      label={getBridal(note.bridleType)}
                      color="primary"
                    />
                    <Chip
                      size="small"
                      label={getLocation(note.location)}
                      color="warning"
                    />
                  </Box>
                </Box>
              ) : (
                <Box display="flex" justifyContent="end">
                  <Delete id={note.id} url="Reservation/DeleteReservation" fetchItems={fetchNotes} date={apiDate} />
                </Box>
              )}

              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography ml={5} color="secondary">
          No {title.toLowerCase()} for this day.
        </Typography>
      );
    }
    return (
      <Typography ml={5} color="secondary">
        No {title.toLowerCase()} for this day.
      </Typography>
    );
  };
  return (
    <>
      <ToastContainer />
      <Grid container px={2} py={2}>
        <Grid item lg={8} xs={9}>
          <Grid container gap={2}>
            <Grid item lg={3} xs={12}>
              <TextField
                size="small"
                onChange={(e) => {
                  handleDateChange(e);
                  generateCalendar(e.target.value);
                }}
                value={selectedDate}
                type="date"
                fullWidth
              />
            </Grid>
            <Grid item lg={8} xs={12}>
              {/* <TextField
                size="small"
                type="text"
                placeholder="Search here .."
                fullWidth
              /> */}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={3} lg={4} display="flex" justifyContent="end">
          <Button variant="contained" onClick={toggleOffcanvas}>
            Sign In
          </Button>
        </Grid>
        <Grid item xs={12} lg={isTableVisible ? 8 : 12} mt={2}>
          <Box sx={{ bgcolor: "background.paper" }} className="calendar">
            <Box className="calendar-header d-flex justify-content-center">
              {selectedDate &&
                new Date(selectedDate).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
            </Box>
            <Box className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
              {calendarData.map((date, index) => (
                <Box
                  key={index}
                  className={`date ${date === selectedDay ? "selected-date" : ""
                    }`}
                  onClick={() => date && handleDayClick(date)}
                >
                  <Grid container>
                    <Grid
                      item
                      xs={12}
                      display="flex"
                      justifyContent="space-between"
                    >
                      <Typography p={1} fontWeight="bold">
                        {date}
                      </Typography>
                      <Box className="add-lg">
                        {date != "" ? (
                          <AddPencilNote
                            date={selectedDate}
                            type={1}
                            fetchItems={fetchNotes}
                          />
                        ) : (
                          ""
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} mt={2}>
                      {renderCount(date, 5)}
                      {renderCount(date, 1)}
                      {renderCount(date, 2)}
                      {renderCount(date, 3)}
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
        {isTableVisible && (
          <Grid item xs={12} lg={4} mt={2}>
            <Grid container px={3}>
              <Grid
                item
                xs={12}
                my={3}
                display="flex"
                justifyContent="space-between"
              >
                <Typography variant="h5" fontWeight="bold">
                  {selectedDate}
                </Typography>
                <Box display="flex">
                  <Box className="add-xs">
                    <AddPencilNote
                      date={selectedDate}
                      type={2}
                      fetchItems={fetchNotes}
                    />
                  </Box>
                  <IconButton onClick={() => handleClose()}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid
                sx={{ background: "#FFF2AF", borderRadius: "10px" }}
                p={1}
                item
                xs={12}
                mt={2}
              >
                <Divider textAlign="left">
                  <Typography variant="h6" fontWeight="bold">
                    Pencil Notes
                  </Typography>
                </Divider>
                <Box>{renderNotes(1, "Pencil Notes", PendingIcon, "gray")}</Box>
              </Grid>
              <Grid
                sx={{ background: "#BAD8B6", borderRadius: "10px" }}
                p={1}
                item
                xs={12}
                mt={2}
              >
                <Divider textAlign="left">
                  <Typography variant="h6" fontWeight="bold">
                    Confirmed Notes
                  </Typography>
                </Divider>
                <Box>
                  {renderNotes(
                    5,
                    "Confirmed Bookings",
                    CheckCircleIcon,
                    "success"
                  )}
                </Box>
              </Grid>
              <Grid
                sx={{ background: "#9ACBD0", borderRadius: "10px" }}
                p={1}
                item
                xs={12}
                mt={2}
              >
                <Divider textAlign="left">
                  <Typography variant="h6" fontWeight="bold">
                    Payment Approval
                  </Typography>
                </Divider>
                <Box>
                  {renderNotes(3, "Payment Approval", PauseIcon, "warning")}
                </Box>
              </Grid>
              <Grid
                sx={{ background: "#e5e5e5", borderRadius: "10px" }}
                p={1}
                item
                xs={12}
                mt={2}
              >
                <Divider textAlign="left">
                  <Typography variant="h6" fontWeight="bold">
                    Other Notes
                  </Typography>
                </Divider>
                <Box>
                  {renderNotes(2, "Other Notes", EventNoteIcon, "secondary")}
                </Box>
              </Grid>

            </Grid>
          </Grid>
        )}
      </Grid>

      <Drawer anchor="right" open={isOffcanvasOpen} onClose={toggleOffcanvas}>
        <Box
          sx={{
            width: 300,
            padding: 2,
          }}
          role="presentation"
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography fontWeight="bold" variant="h5">
              Sign In
            </Typography>
            <IconButton onClick={toggleOffcanvas}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body1">
            <DrawerSignIn />
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default Calendar;
