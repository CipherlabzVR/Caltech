import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, IconButton, MenuItem, Radio, RadioGroup, Select, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 750, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  PhoneNumber: Yup.string().required("Contact No is required"),
  Date: Yup.string().required("Date is required"),
});


export default function EditBooking({ item, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const [packages, setPackages] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const inputRef = useRef(null);

  const handleDateChange = (date) => {
    var formattedDate = formatDate(date);
    fetchSlots(formattedDate);
  }

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Package/GetAll`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setPackages(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchSlots = async (date) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Booking/GetAvailableSlotByDate?date=${date}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setSlots(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchPackages();
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

    var formattedDate = formatDate(item.date);
    fetchSlots(formattedDate);
    const defaultSelected = item.reservedPackages?.map(pkg => pkg.packageId) || [];
    setSelectedPackages(defaultSelected);
  }, [open]);

  const handleOpen = async () => {
    setOpen(true);
  };

  const handleSubmit = (values) => {
    if (!values.SlotId) {
      toast.error("Please select slot");
      return;
    }
    if(values.Packages.length === 0){
          toast.error("Please select at least one package");
          return;
        }
    const bookingData = {
      Id: item.id,
      DocumentNo: '',
      Date: values.Date,
      SlotId: values.SlotId,
      CustomerId: item.customerId,
      PersonCount: values.PersonCount,
      CustomerName: values.Name,
      Email: values.Email,
      PhoneNumber: values.PhoneNumber,
      MemberType: values.PersonCount > 1 ? 2 : 1,
      BookingStatus: item.bookingStatus,
      PaymentStatus: item.paymentStatus,
      PaymentMethod: values.PaymentMethod,
      IsActive: values.IsActive ?? true,
      Nationality: values.Nationality,
      ReservedPackages: values.Packages.map((pkgId) => ({
        ReservedDate: values.Date,
        PackageId: pkgId,
        IsActive: true,
      })),
    };

    fetch(`${BASE_URL}/Booking/UpdateBooking`, {
      method: "POST",
      body: JSON.stringify(bookingData),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
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
              Id: item.id,
              Name: item.customerName || "",
              Email: item.email || "",
              PhoneNumber: item.phoneNumber || "",
              Nationality: item.nationality || 1,
              Date: formatDate(item.date) || "",
              SlotId: item.slotId || null,
              PersonCount: item.personCount || 1,
              MemberType: 1,
              PaymentMethod: item.paymentMethod || 1,
              Packages: item.reservedPackages?.map(pkg => pkg.packageId) || [],
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, handleSubmit, touched, errors }) => (
              <Form onSubmit={handleSubmit}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="h5" fontWeight={500}>
                      Create New Booking
                    </Typography>
                  </Grid>
                </Grid>
                <Box sx={{ maxHeight: "60vh", overflowY: 'scroll' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Name</Typography>
                      <TextField
                        inputRef={inputRef}
                        type="text"
                        name="Name"
                        fullWidth
                        value={values.Name}
                        onChange={(e) => setFieldValue("Name", e.target.value)}
                        error={touched.Name && Boolean(errors.Name)}
                        helperText={touched.Name && errors.Name}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Contact No</Typography>
                      <TextField
                        type="text"
                        name="PhoneNumber"
                        fullWidth
                        value={values.PhoneNumber}
                        onChange={(e) => setFieldValue("PhoneNumber", e.target.value)}
                        error={touched.PhoneNumber && Boolean(errors.PhoneNumber)}
                        helperText={touched.PhoneNumber && errors.PhoneNumber}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Email</Typography>
                      <TextField
                        type="text"
                        name="Email"
                        value={values.Email}
                        fullWidth
                        onChange={(e) => setFieldValue("Email", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Nationality</Typography>
                      <Select fullWidth name="Nationality" value={values.Nationality} onChange={(e) => setFieldValue("Nationality", e.target.value)}>
                        <MenuItem value={1}>Sri Lankan</MenuItem>
                        <MenuItem value={2}>Other</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <Typography>Packages</Typography>
                      <Grid container spacing={1}>
                        {packages.map((pkg, index) => (
                          <Grid item lg={4} xs={12} key={index}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedPackages.includes(pkg.id)}
                                  onChange={(e) => {
                                    const newSelected = e.target.checked
                                      ? [...selectedPackages, pkg.id]
                                      : selectedPackages.filter((id) => id !== pkg.id);
                                    setSelectedPackages(newSelected);
                                    setFieldValue("Packages", newSelected);
                                  }}
                                />
                              }
                              label={pkg.packageName}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Choose a Date</Typography>
                      <TextField
                        type="date"
                        name="Date"
                        value={values.Date}
                        fullWidth
                        onChange={(e) => { setFieldValue("Date", e.target.value); handleDateChange(e.target.value) }}
                        error={touched.Date && Boolean(errors.Date)}
                        helperText={touched.Date && errors.Date}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Time Slot</Typography>
                      <Select fullWidth name="SlotId" value={values.SlotId} onChange={(e) => setFieldValue("SlotId", e.target.value)}>
                        {slots.length === 0 ?
                          <MenuItem disabled>Not Available</MenuItem>
                          : (slots.map((slot, index) => (
                            <MenuItem key={index} disabled={!slot.isAvailable} value={slot.id}>{slot.startTime} - {slot.endTime}</MenuItem>
                          )))}
                      </Select>
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Person Count</Typography>
                      <TextField
                        type="number"
                        name="PersonCount"
                        value={values.PersonCount}
                        fullWidth
                        onChange={(e) => setFieldValue("PersonCount", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} lg={6} mt={1}>
                      <Typography>Payment Method</Typography>
                      <RadioGroup
                        name="PaymentMethod"
                        value={values.PaymentMethod}
                        onChange={(event) =>
                          setFieldValue("PaymentMethod", parseInt(event.target.value))
                        }
                        row
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                        }}
                      >
                        <FormControlLabel
                          value={1}
                          control={<Radio />}
                          label="Cash"
                        />
                        <FormControlLabel
                          value={2}
                          control={<Radio />}
                          label="Card"
                        />
                      </RadioGroup>
                    </Grid>
                    <Grid item xs={12} mt={1}>
                      <FormControlLabel
                        control={
                          <Field
                            as={Checkbox}
                            name="IsActive"
                            checked={values.IsActive}
                            onChange={() =>
                              setFieldValue("IsActive", !values.IsActive)
                            }
                          />
                        }
                        label="Active"
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained">
                      Save
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal >
    </>
  );
}
