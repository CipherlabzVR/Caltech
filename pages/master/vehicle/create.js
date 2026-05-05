import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Typography, MenuItem, Select, FormControl, InputLabel, FormHelperText } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  ModelName: Yup.string().required("Model name is required"),
  VehicleType: Yup.number().required("Vehicle type is required"),
  VehicleNumber: Yup.string().required("Vehicle number is required"),
});

const vehicleTypes = [
  { value: 0, label: "CAR" },
  { value: 1, label: "BIKE" },
  { value: 2, label: "VAN" },
  { value: 3, label: "THREEWHEELER" },
  { value: 4, label: "LORRY" },
];

export default function AddVehicle({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  const [file, setFile] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setFile(null);
  };

  const handleFileChange = (event) => {
    setFile(event.currentTarget.files[0]);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const formData = new FormData();
    formData.append("ModelName", values.ModelName);
    formData.append("VehicleType", values.VehicleType);
    formData.append("VehicleNumber", values.VehicleNumber);
    formData.append("Description", values.Description || "");
    formData.append("IsActive", values.IsActive);
    formData.append("IsSold", values.IsSold);
    
    if (file) {
      formData.append("ImmageOrPdfUploadFile", file);
    }

    try {
      const response = await fetch(`${BASE_URL}/Vehicle/CreateVehicle`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (response.ok && (data.statusCode === 200 || data.isSuccess)) {
        toast.success(data.message || "Vehicle created successfully");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to create vehicle");
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
      toast.error("An error occurred while creating the vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleOpen}>
        + Add New Vehicle
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              ModelName: "",
              VehicleType: "",
              VehicleNumber: "",
              Description: "",
              IsActive: true,
              IsSold: false,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "600", mb: 2 }}>
                      Add New Vehicle
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Model Name"
                      name="ModelName"
                      inputRef={inputRef}
                      error={touched.ModelName && Boolean(errors.ModelName)}
                      helperText={touched.ModelName && errors.ModelName}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={touched.VehicleType && Boolean(errors.VehicleType)}>
                      <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
                      <Field
                        as={Select}
                        labelId="vehicle-type-label"
                        label="Vehicle Type"
                        name="VehicleType"
                      >
                        {vehicleTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.VehicleType && errors.VehicleType && (
                        <FormHelperText>{errors.VehicleType}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Vehicle Number"
                      name="VehicleNumber"
                      error={touched.VehicleNumber && Boolean(errors.VehicleNumber)}
                      helperText={touched.VehicleNumber && errors.VehicleNumber}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      {file ? file.name : "Upload Image/PDF"}
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                      />
                    </Button>
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={3}
                      label="Description"
                      name="Description"
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>

                  <Grid item xs={12} display="flex" gap={2}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsActive"
                          checked={values.IsActive}
                          onChange={(e) => setFieldValue("IsActive", e.target.checked)}
                        />
                      }
                      label="Is Active"
                    />
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsSold"
                          checked={values.IsSold}
                          onChange={(e) => setFieldValue("IsSold", e.target.checked)}
                        />
                      }
                      label="Is Sold"
                    />
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button variant="outlined" color="error" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Vehicle"}
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

