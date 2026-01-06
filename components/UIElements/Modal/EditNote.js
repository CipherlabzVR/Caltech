import React, { useEffect, useState } from "react";
import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 400 },
  maxHeight: "80vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function EditNote({ date, note, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const [showExpDate, setShowExpDate] = useState(note.isExpire);
  const handleOpen = () => setOpen(true);
  const formattedDate = new Date(note.reservationExpiryDate)
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
  const handleClose = () => {
    setOpen(false);
  };
  const [value, setValue] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    try {
      if (!values.IsExpire) {
        values.ReservationExpiryDate = null;
      }

      const messages = [
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
          condition: values.IsExpire && !values.ReservationExpiryDate,
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

      setIsSubmitting(true);

      const response = await fetch(`${BASE_URL}/Reservation/UpdatePencilNoteReservation`, {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.statusCode === 200) {
        toast.success(data.message);
        setOpen(false);
        if (fetchItems && date) {
          fetchItems(date);
        } else {
          fetchItems();
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <EditIcon />
      </IconButton>

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
                  Edit Note
                </Typography>
              </Grid>
              <Grid item xs={12} mt={2}>
                <Formik
                  initialValues={{
                    Id: note.id,
                    ReservationFunctionType: note.reservationFunctionType,
                    ReservationDate: note.reservationDate,
                    HomeComingDate: formatDate(note.homeComingDate) || null,
                    CustomerName: note.customerName,
                    MobileNo: note.mobileNo,
                    PreferdTime: note.preferdTime,
                    HomeComingPreferredTime: note.homeComingPreferredTime || null,
                    BridleType: note.bridleType,
                    HomeComingBridleType: note.homeComingBridleType || null,
                    Location: note.location,
                    HomeComingLocation: note.homeComingLocation || null,
                    Description: note.description,
                    IsExpire: note.isExpire,
                    NIC: note.nic,
                    ReservationExpiryDate: formattedDate,
                    BridleType: note.bridleType,

                  }}
                  onSubmit={handleSubmit}
                >
                  {({ values, handleChange }) => (
                    <Form>
                      <Box sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
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
                            <>
                              <Grid item xs={12} lg={12} mt={2}>
                                <Typography color="primary">Wedding Details</Typography>
                              </Grid>
                            </>
                            : ""}

                          <Grid item xs={12} lg={3} mt={1}>
                            <Typography>Date</Typography>
                            <Field
                              as={TextField}
                              name="ReservationDate"
                              type="date"
                              size="small"
                              fullWidth
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} lg={3} mt={1}>
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
                          <Grid item xs={12} lg={3} mt={1}>
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
                          <Grid item xs={12} lg={3} mt={1}>
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
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
