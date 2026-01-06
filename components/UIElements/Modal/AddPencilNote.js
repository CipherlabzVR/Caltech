import React, { useState } from "react";
import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddIcon from "@mui/icons-material/Add";
import style from "@/styles/reservation/modal";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function AddPencilNote({
  date,
  onFormSubmit,
  type,
  fetchItems,
}) {
  const [open, setOpen] = React.useState(false);
  const [showExpDate, setShowExpDate] = useState(false);
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setShowExpDate(false);
  };
  const [value, setValue] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSubmit = (values) => {
    if (!values.IsExpire) {
      values.ReservationExpiryDate = null;
    }
    if (values.Type === 1) {
      const messages = [
        {
          condition: values.ReservationFunctionType === null,
          message: "Please Enter Event Type",
        },
        {
          condition: values.CustomerName === "",
          message: "Please Enter Name",
        },
        {
          condition: values.MobileNo === "",
          message: "Please Enter Mobile Number",
        },
        {
          condition: values.NIC === "",
          message: "Please Enter NIC/Passport Number",
        },
        {
          condition: values.IsExpire && values.ReservationExpiryDate === null,
          message: "Please Enter Expiry Date",
        },
        {
          condition: values.ReservationFunctionType === 3 && values.HomeComingDate === null,
          message: "Please Enter Home Coming Date",
        },
      ];

      const invalidField = messages.find(({ condition }) => condition);
      if (invalidField) {
        toast.info(invalidField.message);
        return;
      }
    } else {
      const messages = [
        {
          condition: values.Description === "",
          message: "Please Enter Description",
        },
      ];
      const invalidField = messages.find(({ condition }) => condition);
      if (invalidField) {
        toast.info(invalidField.message);
        return;
      }
    }
    setIsSubmitting(true);
    fetch(`${BASE_URL}/Reservation/CreateReservation`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success(data.result.message);
          setOpen(false);
          if (fetchItems) {
            fetchItems(date);
            setShowExpDate(false);
          }
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "An error occurred");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <>
      {type === 1 ? (
        <IconButton onClick={handleOpen}>
          <AddIcon />
        </IconButton>
      ) : (
        <Button onClick={handleOpen} variant="outlined">
          Add Note
        </Button>
      )}

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <Typography variant="h5" fontWeight="bold">
                  Add Notes
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {type === 3 ? "" : date}
                </Typography>
              </Grid>
              <Grid item xs={12} mt={2}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                  >
                    <Tab label="Pencil Note" {...a11yProps(0)} />
                    {type === 3 ? (
                      ""
                    ) : (
                      <Tab label="Other Note" {...a11yProps(1)} />
                    )}
                  </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
                  <Formik
                    initialValues={{
                      ReservationFunctionType: 1,
                      ReservationDate: date,
                      HomeComingDate: null,
                      CustomerName: "",
                      MobileNo: "",
                      PreferdTime: 1,
                      HomeComingPreferredTime: 1,
                      BridleType: 1,
                      HomeComingBridleType: 1,
                      Location: 1,
                      HomeComingLocation: 1,
                      Description: "",
                      Type: 1,
                      IsExpire: false,
                      NIC: "",
                      ReservationExpiryDate: null,
                    }}
                    onSubmit={handleSubmit}
                  >
                    {({ values, handleChange }) => (
                      <Form>
                        <Box sx={{ maxHeight: '60vh', overflowY: 'scroll' }}>
                          <Grid container spacing={1}>
                            <Grid item xs={12} lg={6} mt={2}>
                              <Typography>Event Type</Typography>
                              <FormControl fullWidth>
                                <Field
                                  as={Select}
                                  name="ReservationFunctionType"
                                  size="small"
                                  value={values.ReservationFunctionType}
                                  onChange={handleChange}
                                >
                                  <MenuItem value={1}>Wedding</MenuItem>
                                  <MenuItem value={2}>Home Coming</MenuItem>
                                  <MenuItem value={3}>Wedding & Home Coming</MenuItem>
                                  <MenuItem value={4}>Normal Dressing</MenuItem>
                                  <MenuItem value={5}>Photo Shoot</MenuItem>
                                  <MenuItem value={6}>Outfit Only</MenuItem>
                                  <MenuItem value={7}>Engagement</MenuItem>
                                </Field>
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} lg={6} mt={2}>
                              <Typography>Name</Typography>
                              <Field
                                as={TextField}
                                name="CustomerName"
                                type="text"
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} lg={6} mt={2}>
                              <Typography>Phone Number</Typography>
                              <Field
                                as={TextField}
                                name="MobileNo"
                                type="text"
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} lg={6} mt={2}>
                              <Typography>NIC/Passport No</Typography>
                              <Field
                                as={TextField}
                                name="NIC"
                                type="text"
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            {values.ReservationFunctionType === 3 ?
                              <Grid item xs={12} lg={12} mt={2}>
                                <Typography color="primary">Wedding Details</Typography>
                              </Grid>
                              : ""}
                            {values.ReservationFunctionType === 3 || type === 3 ?
                              <>
                                <Grid item xs={12} lg={3} mt={1}>
                                  <Typography>Wedding Date</Typography>
                                  <Field
                                    as={TextField}
                                    name="ReservationDate"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    // disabled
                                  />
                                </Grid>
                              </>
                              : ""}


                            <Grid item xs={12} lg={values.ReservationFunctionType === 3 || type === 3 ? "3" : "4"} mt={1}>
                              <Typography>Preferred Time</Typography>
                              <FormControl fullWidth>
                                <Field
                                  as={Select}
                                  name="PreferdTime"
                                  size="small"
                                  value={values.PreferdTime}
                                  onChange={handleChange}
                                >
                                  <MenuItem value={1}>Morning</MenuItem>
                                  <MenuItem value={2}>Evening</MenuItem>
                                </Field>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} lg={values.ReservationFunctionType === 3 || type === 3 ? "3" : "4"} mt={1}>
                              <Typography>Bridal Type</Typography>
                              <FormControl fullWidth>
                                <Field
                                  as={Select}
                                  name="BridleType"
                                  size="small"
                                  value={values.BridleType}
                                  onChange={handleChange}
                                >
                                  <MenuItem value={1}>Kandyan</MenuItem>
                                  <MenuItem value={2}>Indian</MenuItem>
                                  <MenuItem value={3}>Western</MenuItem>
                                  <MenuItem value={4}>Hindu</MenuItem>
                                </Field>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} lg={values.ReservationFunctionType === 3 || type === 3 ? "3" : "4"} mt={1}>
                              <Typography>Location</Typography>
                              <FormControl fullWidth>
                                <Field
                                  as={Select}
                                  name="Location"
                                  size="small"
                                  value={values.Location}
                                  onChange={handleChange}
                                >
                                  <MenuItem value={1}>Studio</MenuItem>
                                  <MenuItem value={2}>Away</MenuItem>
                                  <MenuItem value={3}>Overseas</MenuItem>
                                </Field>
                              </FormControl>
                            </Grid>
                            {values.ReservationFunctionType === 3 ?
                              <>
                                <Grid item xs={12} lg={12} mt={2}>
                                  <Typography color="primary">Home Coming Details</Typography>
                                </Grid>
                                <Grid item xs={12} lg={3} mt={1}>
                                  <Typography>Home Coming Date</Typography>
                                  <Field
                                    as={TextField}
                                    name="HomeComingDate"
                                    type="date"
                                    size="small"
                                    fullWidth
                                  />
                                </Grid>
                                <Grid item xs={12} lg={3} mt={1}>
                                  <Typography>Preferred Time</Typography>
                                  <FormControl fullWidth>
                                    <Field
                                      as={Select}
                                      name="HomeComingPreferredTime"
                                      size="small"
                                      value={values.HomeComingPreferredTime}
                                      onChange={handleChange}
                                    >
                                      <MenuItem value={1}>Morning</MenuItem>
                                      <MenuItem value={2}>Evening</MenuItem>
                                    </Field>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} lg={3} mt={1}>
                                  <Typography>Bridal Type</Typography>
                                  <FormControl fullWidth>
                                    <Field
                                      as={Select}
                                      name="HomeComingBridleType"
                                      size="small"
                                      value={values.HomeComingBridleType}
                                      onChange={handleChange}
                                    >
                                      <MenuItem value={1}>Kandyan</MenuItem>
                                      <MenuItem value={2}>Indian</MenuItem>
                                      <MenuItem value={3}>Western</MenuItem>
                                      <MenuItem value={4}>Hindu</MenuItem>
                                    </Field>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} lg={3} mt={1}>
                                  <Typography>Location</Typography>
                                  <FormControl fullWidth>
                                    <Field
                                      as={Select}
                                      name="HomeComingLocation"
                                      size="small"
                                      value={values.HomeComingLocation}
                                      onChange={handleChange}
                                    >
                                      <MenuItem value={1}>Studio</MenuItem>
                                      <MenuItem value={2}>Away</MenuItem>
                                      <MenuItem value={3}>Overseas</MenuItem>
                                    </Field>
                                  </FormControl>
                                </Grid>
                              </> : ""}
                            <Grid item xs={12} mt={2}>
                              <Typography>Description</Typography>
                              <Field
                                as={TextField}
                                name="Description"
                                type="text"
                                size="small"
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <FormControlLabel
                                control={
                                  <Field
                                    as={Checkbox}
                                    name="IsExpire"
                                    checked={values.IsExpire}
                                    onChange={(e) => {
                                      handleChange(e);
                                      setShowExpDate(e.target.checked);
                                    }}
                                  />
                                }
                                label="isExpiring"
                              />
                            </Grid>
                            {showExpDate && (
                              <Grid item lg={6} xs={12} mt={2}>
                                <Typography>Exp Date</Typography>
                                <Field
                                  as={TextField}
                                  name="ReservationExpiryDate"
                                  type="date"
                                  size="small"
                                  fullWidth
                                  inputProps={{
                                    min: new Date(Date.now() + 86400000)
                                      .toISOString()
                                      .split("T")[0],
                                  }}
                                />
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid
                            item
                            xs={12}
                            mt={2}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Button
                              onClick={handleClose}
                              variant="contained"
                              color="error"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={isSubmitting}
                              startIcon={
                                isSubmitting ? (
                                  <CircularProgress size={20} color="inherit" />
                                ) : null
                              }
                            >
                              {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                          </Grid>
                        </Grid>
                      </Form>
                    )}
                  </Formik>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                  <Formik
                    initialValues={{
                      ReservationFunctionType: null,
                      ReservationDate: date,
                      CustomerName: "",
                      MobileNo: "",
                      PreferdTime: 0,
                      BridleType: 0,
                      Location: 0,
                      Description: "",
                      Type: 2,
                      IsExpire: false,
                      NIC: "0",
                      ReservationExpiryDate: null,
                    }}
                    onSubmit={handleSubmit}
                  >
                    {({ values, handleChange }) => (
                      <Form>
                        <Grid container spacing={1}>
                          <Grid item xs={12} mt={2}>
                            <Typography>Description</Typography>
                            <Field
                              as={TextField}
                              name="Description"
                              type="text"
                              size="small"
                              fullWidth
                              multiline
                              minRows={4}
                            />
                          </Grid>
                          <Grid
                            item
                            xs={12}
                            mt={2}
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Button
                              onClick={handleClose}
                              variant="contained"
                              color="error"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={isSubmitting}
                              startIcon={
                                isSubmitting ? (
                                  <CircularProgress size={20} color="inherit" />
                                ) : null
                              }
                            >
                              {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                          </Grid>
                        </Grid>
                      </Form>
                    )}
                  </Formik>
                </CustomTabPanel>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
