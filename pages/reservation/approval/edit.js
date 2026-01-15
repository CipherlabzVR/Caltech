import React, { useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Button,
  Modal,
  MenuItem,
  FormControl,
  Select,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 400 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const validationSchema = Yup.object().shape({
  NIC: Yup.string().required("Required"),
  CustomerName: Yup.string().required("Required"),
  MobileNo: Yup.string().required("Required"),
  ReservationDate: Yup.string().required("Required"),
  PaymentDate: Yup.string().required("Required"),
  ReservationFunctionType: Yup.number().required("Required"),
  Location: Yup.number().required("Required"),
  BridleType: Yup.number().required("Required"),
  PreferdTime: Yup.number().required("Required"),
  PaymentMethod: Yup.number().required("Required"),
  PaidAmount: Yup.number().required("Required").min(0),
});

export default function EditApproval({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [tab, setTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);      

      if (values.PaymentMethod === 3) {
        values.PaidAmount = Number(values.CashAmount || 0) + Number(values.CardAmount || 0);
      }

      if (values.ReservationFunctionType === 3 && values.HomeComingDate === null) {
        toast.info("Please Enter Home Coming Details");
        setIsSubmitting(false);
        return;
      }

      // Check if file is required for payment types 2, 3, or 4 (only if no existing slip)
      if ([2, 3, 4].includes(values.PaymentMethod) && !values.File && !item.paySlipURL) {
        toast.info("Please Upload Receipt");
        setIsSubmitting(false);
        return;
      }

        const formData = new FormData();
        formData.append("File", values.File);
        formData.append("FileName", values.File ? values.File.name : "");
        formData.append("ApprovalId", values.ApprovalId);
        formData.append("ReservationFunctionType", values.ReservationFunctionType);
        formData.append("ReservationDate", values.ReservationDate);
        formData.append("PaymentDate", values.PaymentDate);
        formData.append("HomeComingDate", values.HomeComingDate || "");
        formData.append("CustomerName", values.CustomerName);
        formData.append("MobileNo", values.MobileNo);
        formData.append("PreferdTime", values.PreferdTime);
        formData.append("BridleType", values.BridleType);
        formData.append("Location", values.Location);
        formData.append("HomeComingPreferredTime", values.HomeComingPreferredTime || "");
        formData.append("HomeComingBridleType", values.HomeComingBridleType || "");
        formData.append("HomeComingLocation", values.HomeComingLocation || "");
        formData.append("PaymentCode", values.PaymentCode || "");
        formData.append("Description", values.Description || "");
        formData.append("NIC", values.NIC);
        formData.append("PaymentMethod", values.PaymentMethod);
        formData.append("PaidAmount", values.PaidAmount);
        formData.append("CardAmount", values.CardAmount || 0);
        formData.append("CashAmount", values.CashAmount || 0);
        formData.append("PaymentDescription", values.PaymentDescription || "");
        formData.append("ReservationId", values.ReservationId);

        const response = await fetch(
          `${BASE_URL}/ReservationApproval/UpdateReservationApproval`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
          }
        );

        const data = await response.json();

        if (data.statusCode == 200) {
          toast.success(data.result.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }

    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={handleOpen} variant="outlined" color="primary">
        Edit
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Edit Approval
          </Typography>

          <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)}>
            <Tab label="Customer Details" />
            <Tab label="Payment Details" />
          </Tabs>

          <Formik
            initialValues={{
              ApprovalId: item.paymentApprovalId,
              ReservationFunctionType: item.reservationFunctionType,
              ReservationDate: formatDate(item.weddingDate),
              PaymentDate: formatDate(item.paymentDate),
              HomeComingDate: formatDate(item.homeComingDate) || null,
              CustomerName: item.customerName,
              MobileNo: item.mobileNo,
              PreferdTime: item.prefferdTime,
              BridleType: item.bridleType,
              Location: item.location,
              HomeComingPreferredTime: item.homeComingPreferredTime,
              HomeComingBridleType: item.homeComingBridleType,
              HomeComingLocation: item.homeComingLocation,
              PaymentCode: item.paymentCode,
              Description: item.description,
              NIC: item.nic,
              PaymentMethod: item.paymentType,
              PaidAmount: item.paidAmount,
              CardAmount: item.cardAmount,
              CashAmount: item.cashAmount,
              PaymentDescription: item.paymentDescription,
              ReservationId: item.reservationId,
              File: null,
              FileName: ""
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, errors, touched, setFieldValue }) => (
              <Form>
                <Box sx={{ maxHeight: "50vh", overflowY: "auto", mt: 2 }}>
                  {tab === 0 && (
                    <Grid container spacing={1}>
                      <Grid item xs={12} lg={6}>
                        <Typography>Event Type </Typography>
                        <FormControl fullWidth>
                          <Field
                            as={Select}
                            name="ReservationFunctionType"
                            size="small"
                            value={values.ReservationFunctionType}
                            onChange={handleChange}
                            error={touched.ReservationFunctionType && !!errors.ReservationFunctionType}
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
                      <Grid item xs={12} lg={6}>
                        <Typography>Name </Typography>
                        <Field
                          as={TextField}
                          name="CustomerName"
                          size="small"
                          fullWidth
                          error={touched.CustomerName && !!errors.CustomerName}
                          helperText={touched.CustomerName && errors.CustomerName}
                        />
                      </Grid>
                      <Grid item xs={12} lg={6}>
                        <Typography>Phone Number </Typography>
                        <Field
                          as={TextField}
                          name="MobileNo"
                          size="small"
                          fullWidth
                          error={touched.MobileNo && !!errors.MobileNo}
                          helperText={touched.MobileNo && errors.MobileNo}
                        />
                      </Grid>
                      <Grid item xs={12} lg={6}>
                        <Typography>NIC/Passport No </Typography>
                        <Field
                          as={TextField}
                          name="NIC"
                          size="small"
                          fullWidth
                          error={touched.NIC && !!errors.NIC}
                          helperText={touched.NIC && errors.NIC}
                        />
                      </Grid>
                      {values.ReservationFunctionType === 3 ?
                        <Grid item xs={12} lg={12} mt={2}>
                          <Typography color="primary">Wedding Details</Typography>
                        </Grid>
                        : ""}
                      <Grid item xs={12} lg={3}>
                        <Typography>Date </Typography>
                        <Field
                          as={TextField}
                          name="ReservationDate"
                          type="date"
                          size="small"
                          fullWidth
                          error={touched.ReservationDate && !!errors.ReservationDate}
                          helperText={touched.ReservationDate && errors.ReservationDate}
                        />
                      </Grid>
                      <Grid item xs={12} lg={3}>
                        <Typography>Preferred Time </Typography>
                        <FormControl fullWidth>
                          <Field
                            as={Select}
                            name="PreferdTime"
                            size="small"
                            value={values.PreferdTime}
                            onChange={handleChange}
                            error={touched.PreferdTime && !!errors.PreferdTime}
                          >
                            <MenuItem value={1}>Morning</MenuItem>
                            <MenuItem value={2}>Evening</MenuItem>
                          </Field>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} lg={3}>
                        <Typography>Bridal Type </Typography>
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
                      <Grid item xs={12} lg={3}>
                        <Typography>Location </Typography>
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
                      <Grid item xs={12} mb={3}>
                        <Typography>Description</Typography>
                        <Field
                          as={TextField}
                          name="Description"
                          type="text"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  )}

                  {tab === 1 && (
                    <Grid container spacing={1}>
                      <Grid item xs={12} lg={6}>
                        <Typography>Payment Date </Typography>
                        <Field
                          as={TextField}
                          name="PaymentDate"
                          type="date"
                          size="small"
                          fullWidth
                          error={touched.PaymentDate && !!errors.PaymentDate}
                          helperText={touched.PaymentDate && errors.PaymentDate}
                        />
                      </Grid>
                      <Grid item xs={12} lg={6}>
                        <Typography>Payment Code </Typography>
                        <Field
                          as={TextField}
                          name="PaymentCode"
                          type="text"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} lg={6}>
                        <Typography>Payment Method </Typography>
                        <FormControl fullWidth>
                          <Field
                            as={Select}
                            name="PaymentMethod"
                            size="small"
                            value={values.PaymentMethod}
                            onChange={handleChange}
                          >
                            <MenuItem value={1}>Cash</MenuItem>
                            <MenuItem value={2}>Card</MenuItem>
                            <MenuItem value={3}>Cash & Card</MenuItem>
                            <MenuItem value={4}>Bank Transfer</MenuItem>
                            <MenuItem value={5}>Cheque</MenuItem>
                          </Field>
                        </FormControl>
                      </Grid>
                      {values.PaymentMethod === 3 ? (
                        <>
                          <Grid item xs={12} lg={6}>
                            <Typography>Cash Amount</Typography>
                            <Field
                              as={TextField}
                              name="CashAmount"
                              type="number"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12} lg={6}>
                            <Typography>Card Amount</Typography>
                            <Field
                              as={TextField}
                              name="CardAmount"
                              type="number"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                        </>
                      ) : (
                        <Grid item xs={12} lg={6}>
                          <Typography>Paid Amount </Typography>
                          <Field
                            as={TextField}
                            name="PaidAmount"
                            type="number"
                            size="small"
                            fullWidth
                            error={touched.PaidAmount && !!errors.PaidAmount}
                            helperText={touched.PaidAmount && errors.PaidAmount}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} lg={6}>
                        <Typography>Payment Description </Typography>
                        <Field
                          as={TextField}
                          name="PaymentDescription"
                          type="text"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      {[2, 3, 4].includes(values.PaymentMethod) && (
                        <Grid item xs={12}>
                          <Typography>Upload Receipt</Typography>
                          <input
                            type="file"
                            onChange={(event) => {
                              const file = event.target.files[0];
                              setFieldValue("File", file);
                              setFieldValue("FileName", file ? file.name : "");
                            }}
                          />
                          {values.FileName && (
                            <Typography variant="body2" mt={1}>
                              Selected File: <strong>{values.FileName}</strong>
                            </Typography>
                          )}
                          {item.paySlipURL && !values.File && (
                            <Typography variant="body2" mt={1} color="text.secondary">
                              Current: <a href={item.paySlipURL} target="_blank" rel="noopener noreferrer">View existing slip</a>
                            </Typography>
                          )}
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Box>

                <Grid container spacing={1}>
                  <Grid
                    item
                    xs={12}
                    mt={2}
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Button onClick={handleClose} variant="contained" color="error">
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
        </Box>
      </Modal>
    </>
  );
}
