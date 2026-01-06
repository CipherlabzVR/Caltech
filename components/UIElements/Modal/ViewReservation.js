import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import { formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import { getAppointment, getBridal, getDressingType, getEventType, getLocation, getPreferedTime } from "@/components/types/types";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: 400 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const tabPanelStyle = {
  maxHeight: "60vh",
  overflowY: "auto",
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function ViewReservation({ reservationId }) {
  const [open, setOpen] = useState(false);
  const [reservation, setReservation] = useState({});
  const handleOpen = () => setOpen(true);
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleClose = () => {
    setOpen(false);
  };
  const handleChange = (event, newValue) => {
    setValue(newValue);
  }; const fetchReservation = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/GetReservationViewById?resId=${reservationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      await setReservation(data.result.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    fetchReservation();

  }, []);

  return (
    <>
      <Tooltip sx={{ width: '30px', height: '30px' }} title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <RemoveRedEyeIcon color="primary" fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Typography variant="h6" mb={2}>View Reservation</Typography>
          <Formik
          >
            {({ values, errors, touched }) => (
              <Form>
                <Box>
                  <AppBar
                    sx={{ background: "#e5e5e5", boxShadow: "none" }}
                    position="static"
                  >
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      indicatorColor="white"
                      variant="fullWidth"
                      aria-label="full width tabs example"
                    >
                      <Tab
                        label="General"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(0)}
                      />
                      <Tab
                        label="Outfit/Accessories & Retinue"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(1)}
                      />
                      <Tab
                        label="Dressing Time"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(2)}
                      />
                      <Tab
                        label="Appointments"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(3)}
                      />
                    </Tabs>
                  </AppBar>
                  <Box sx={tabPanelStyle}>
                    <TabPanel value={value} index={0} dir={theme.direction}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding Date</Typography>
                          <Field
                            as={TextField}
                            value={formatDate(reservation.reservationDate)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Event Type</Typography>
                          <FormControl fullWidth>
                            <Field
                              as={TextField}
                              value={getEventType(reservation.reservationFunctionType)}
                            />
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Name of Bride</Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={reservation.customerName}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Contact No</Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={reservation.mobileNo}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Emergency Contact No</Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={reservation.emergencyContactNo}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding Venue</Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={reservation.reservationDetails.weddingVenue}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Dressing Venue</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.dressingVenue}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Prefered Time</Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={getPreferedTime(reservation.preferdTime)}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bridal Type</Typography>
                          <Field
                            as={TextField}
                            value={getBridal(reservation.bridleType)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Location</Typography>
                          <Field
                            as={TextField}
                            fullWidth
                            value={getLocation(reservation.location)}
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography>Address Line 1</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.addressLine1}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 2</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.addressLine2}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 3</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.addressLine3}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography variant="h6">
                            Wedding Day Contact Details
                          </Typography>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.weddingDayContactPerson}
                            fullWidth
                            placeholder="Contact Name"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.weddingDayContactPersonNo}
                            fullWidth
                            type="number"
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <FormGroup>
                            <FormControlLabel
                              control={<Checkbox checked={reservation.reservationDetails.isGoingAway} />}
                              label="Going Away"
                            />
                            <FormControlLabel
                              control={<Checkbox checked={reservation.reservationDetails.isHomeComing} />}
                              label="Home Coming"
                            />
                          </FormGroup>
                        </Grid>

                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Home Coming Date</Typography>
                          <Field
                            as={TextField}
                            value={formatDate(reservation.reservationDetails.homeComingDate)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Home Coming Venue</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.homeComingVenue}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Home Coming Outfit</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.homeComingOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Home Coming Outfit By</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.homeComingOutfitBy}
                            fullWidth
                          />
                        </Grid>

                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Going Away Dressing Venue</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.goingAwayDressingVenue}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Going Away Outfit</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.goingAwayOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Going Away Outfit By</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.goingAwayOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          lg={6}
                          mb={1}
                        >
                          <Typography>Remark</Typography>
                          <Field
                            as={TextField}
                            value={reservation.reservationDetails.remark}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Groom's Outfit</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.groomsOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Groom's Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.groomsOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wed Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.wedOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.maidsOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.fgOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.fgOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>G/A Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.gaOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>H/C Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.hcOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bouquets By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.bouquetsBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Photographer</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.photographer}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography variant="h6" fontWeight="700">
                            Retinue
                          </Typography>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            value={reservation.reservationDetails.maids}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Flower Girls</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            value={reservation.reservationDetails.flowerGirls}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Little Maids</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            value={reservation.reservationDetails.littleMaids}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Pupil Maids</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={reservation.reservationDetails.pupilMaids}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={2} dir={theme.direction}>
                      <Grid container>
                        <Grid item xs={12}>
                          <TableContainer>
                            <Table fullWidth aria-label="simple table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Dressing</TableCell>
                                  <TableCell>Start Time</TableCell>
                                  <TableCell>End Time</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reservation.reservationDressingTime.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{getDressingType(row.dressingType)}</TableCell>
                                    <TableCell>
                                      {row.startTime}
                                    </TableCell>
                                    <TableCell>
                                      {row.endTime}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={3} dir={theme.direction}>
                      <Grid container>
                        <Grid item xs={12}>
                          <TableContainer>
                            <Table fullWidth aria-label="simple table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Completed</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>First Reserve Date</TableCell>
                                  <TableCell>Second Reserve Date</TableCell>
                                  <TableCell>Remark</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {reservation.reservationAppointment.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Checkbox
                                        checked={row.isAppointmentTypeChecked}
                                      />
                                    </TableCell>
                                    <TableCell>{getAppointment(row.appointmentType)}</TableCell>
                                    <TableCell>
                                      {formatDate(row.startDate)}
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(row.endDate)}
                                    </TableCell>
                                    <TableCell>
                                      {row.remark}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </TabPanel>
                  </Box>
                </Box>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    color="error"
                  >
                    Close
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
