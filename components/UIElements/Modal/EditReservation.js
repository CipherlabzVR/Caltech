import React, { useState } from "react";
import {
  AppBar,
  Checkbox,
  Grid,
  IconButton,
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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { formatDate } from "@/components/utils/formatHelper";

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

export default function EditReservation({reservation}) {
  console.log(reservation);
  
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [dressingRows, setDressingRows] = useState([
    { label: "Bride", startTime: "", endTime: "" },
    { label: "Maids", startTime: "", endTime: "" },
    { label: "FC", startTime: "", endTime: "" },
    { label: "Touch Up", startTime: "", endTime: "" },
    { label: "Going Away", startTime: "", endTime: "" },
    { label: "Home Coming", startTime: "", endTime: "" },
  ]);

  const [appointments, setAppointments] = useState([
    { label: "First", startDate: "", endDate: "", isChecked: false,remark: "" },
    { label: "Show Saree", startDate: "", endDate: "", isChecked: false,remark: "" },
    { label: "Fabric & Design", startDate: "", endDate: "", isChecked: false,remark: "" },
    { label: "Measurement", startDate: "", endDate: "", isChecked: false,remark: "" },
    { label: "Fiton", startDate: "", endDate: "", isChecked: false,remark: "" },
    { label: "Trail", startDate: "", endDate: "", isChecked: false,remark: "" },
  ]);

  const handleInputChange = (index, field, value) => {
    const updatedRows = dressingRows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setDressingRows(updatedRows);
  };

  const handleAppointmentChange = (index, field, value) => {
    const updatedRows = appointments.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setAppointments(updatedRows);
  };

  const handleSubmit = async (values) => {
    console.log(values);
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Name: "",
            }}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
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
                        label="Outfit/Accessories & Team"
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
                          <Typography>Reservation Date</Typography>
                          <Field as={TextField} type="date" value={formatDate(reservation.ReservationDate)} fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Name of Bride</Typography>
                          <Field as={TextField} name="Name" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Contact No</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding Venue</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Dressing Venue</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Prefered Time</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bridal Type</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Location</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 1</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 2</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 3</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding day Contact</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography>Remark</Typography>
                          <Field as={TextField} name="ContactNo" fullWidth />
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Groom's Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wed Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>G/A Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>H/C Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bouquets By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Photographer</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography variant="h6" fontWeight="700">
                            Team
                          </Typography>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Flower Girls</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Little Maids</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Pupil Maids</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="Outfit"
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
                                {dressingRows.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="time"
                                        fullWidth
                                        value={row.startTime}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "startTime",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="time"
                                        fullWidth
                                        value={row.endTime}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "endTime",
                                            e.target.value
                                          )
                                        }
                                      />
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
                              <TableBody>
                                {appointments.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Checkbox checked={row.isChecked} />
                                    </TableCell>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        value={row.startDate}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "startDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        value={row.endDate}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "endDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="text"
                                        fullWidth
                                        value={row.remark}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "remark",
                                            e.target.value
                                          )
                                        }
                                      />
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
                  <Button variant="contained" onClick={handleClose} color="error">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    Save
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
