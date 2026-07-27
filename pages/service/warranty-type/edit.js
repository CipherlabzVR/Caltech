import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Tooltip,
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
import BorderColorIcon from "@mui/icons-material/BorderColor";
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

export default function EditWarrantyType({ item, fetchItems }) {
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
    fetch(`${BASE_URL}/WarrantyType/UpdateWarrantyType`, {
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
        if (sc === 200 || sc === "SUCCESS") {
          toast.success(msg || "Updated");
          setOpen(false);
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to update");
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
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: item.id,
              Name: item.name || "",
              Code: item.code || "",
              DurationMonths: Math.max(0, Number(item.durationMonths) || 0),
              FreeServicesAllowed: Math.max(0, Number(item.freeServicesAllowed) || 0),
              CoverageType: item.coverageType || "Parts + Labor",
              Terms: item.terms || "",
              IsActive: item.isActive,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Edit Warranty Type
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
