import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  maxHeight: "90vh",
  overflowY: "auto",
};

const coverageOptions = [
  "Parts only",
  "Labor only",
  "Parts + Labor",
  "Full (Parts + Labor + On-site)",
];

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  Code: Yup.string().required("Code is required"),
  DurationMonths: Yup.number()
    .typeError("Duration must be a number")
    .min(0, "Duration cannot be negative")
    .required("Duration is required"),
  FreeServicesAllowed: Yup.number()
    .typeError("Free services must be a number")
    .min(0, "Cannot be negative")
    .required("Free services count is required"),
  CoverageType: Yup.string().required("Coverage type is required"),
});

export default function AddWarrantyType({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const payload = {
      ...values,
      DurationMonths: Math.max(0, Number(values.DurationMonths) || 0),
      FreeServicesAllowed: Math.max(0, Number(values.FreeServicesAllowed) || 0),
    };
    fetch(`${BASE_URL}/WarrantyType/CreateWarrantyType`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200) {
          toast.success(msg || "Warranty type created");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to create warranty type");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add new
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            key={String(open)}
            initialValues={{
              Name: "",
              Code: "",
              DurationMonths: 12,
              FreeServicesAllowed: 0,
              CoverageType: "Parts + Labor",
              Terms: "",
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Add Warranty Type
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Code
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Code"
                      size="small"
                      inputRef={inputRef}
                      placeholder="e.g. WTY-STD-1Y"
                      error={touched.Code && Boolean(errors.Code)}
                      helperText={touched.Code && errors.Code}
                    />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      placeholder="e.g. 1 Year Standard"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Duration (months)
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      name="DurationMonths"
                      size="small"
                      inputProps={{ min: 0 }}
                      error={touched.DurationMonths && Boolean(errors.DurationMonths)}
                      helperText={touched.DurationMonths && errors.DurationMonths}
                    />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Free Services Allowed
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      name="FreeServicesAllowed"
                      size="small"
                      placeholder="e.g. 3"
                      inputProps={{ min: 0 }}
                      error={touched.FreeServicesAllowed && Boolean(errors.FreeServicesAllowed)}
                      helperText={
                        (touched.FreeServicesAllowed && errors.FreeServicesAllowed) ||
                        "How many free services this warranty entitles the customer to"
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Coverage Type
                    </Typography>
                    <Field
                      as={TextField}
                      select
                      fullWidth
                      name="CoverageType"
                      size="small"
                      error={touched.CoverageType && Boolean(errors.CoverageType)}
                      helperText={touched.CoverageType && errors.CoverageType}
                    >
                      {coverageOptions.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Terms &amp; Conditions
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      minRows={3}
                      name="Terms"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsActive"
                          checked={values.IsActive}
                          onChange={() => setFieldValue("IsActive", !values.IsActive)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                </Grid>

                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button variant="contained" color="error" onClick={handleClose} size="small">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small">
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
