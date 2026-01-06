import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 1,
};

const validationSchema = Yup.object({
  CompanyId: Yup.number().required("Company is required"),
  Code: Yup.string().trim().required("Code is required"),
  Name: Yup.string().trim().required("Name is required"),
  StartTime: Yup.string().required("Start Time is required"),
  EndTime: Yup.string().required("End Time is required"),
  BreakMinutes: Yup.number().min(0, "Cannot be negative").required("Break Minutes is required"),
  LateGraceMinutes: Yup.number().min(0, "Cannot be negative").required("Late Grace is required"),
  EarlyLeaveGraceMinutes: Yup.number().min(0, "Cannot be negative").required("Early Leave Grace is required"),
  RoundingIntervalMinutes: Yup.number().min(0, "Cannot be negative").required("Rounding Interval is required"),
});

export default function CreateShiftMasterModal({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetch(`${BASE_URL}/ShiftCompany/list`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setCompanies(data))
        .catch((err) => console.error("Failed to fetch companies:", err));
    }
  }, [open]);

  const handleClose = (resetForm) => {
    setOpen(false);
    if (resetForm) resetForm();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      ...values,
      StartTime: `${values.StartTime}:00`,
      EndTime: `${values.EndTime}:00`,
    };

    fetch(`${BASE_URL}/ShiftMaster/CreateShift`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "An error occurred");
        }
      })
      .catch((error) => {
        toast.error(error.message || "Network error");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        + Add New
      </Button>

      <Modal open={open} onClose={() => handleClose()}>
        <Box sx={style}>
          <Formik
            initialValues={{
              CompanyId: "", 
              Code: "",
              Name: "",
              StartTime: "09:00",
              EndTime: "17:00",
              BreakMinutes: 0,
              LateGraceMinutes: 0,
              EarlyLeaveGraceMinutes: 0,
              RoundingMode: 0, // Using 0 for 'None'
              RoundingIntervalMinutes: 0,
              IsNightShift: false,
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, resetForm, values }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Create Shift
                    </Typography>
                  </Grid>

                 
                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Company*</Typography>
                    <Field as={TextField} name="CompanyId" fullWidth select error={touched.CompanyId && Boolean(errors.CompanyId)} helperText={touched.CompanyId && errors.CompanyId}>
                      <MenuItem value=""><em>Select a Company</em></MenuItem>
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.companyName}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Code</Typography>
                    <Field as={TextField} name="Code" fullWidth inputRef={firstInputRef} error={touched.Code && Boolean(errors.Code)} helperText={touched.Code && errors.Code} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Name</Typography>
                    <Field as={TextField} name="Name" fullWidth error={touched.Name && Boolean(errors.Name)} helperText={touched.Name && errors.Name} />
                  </Grid>
                  
                  
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Start Time</Typography>
                    <Field as={TextField} name="StartTime" type="time" fullWidth error={touched.StartTime && Boolean(errors.StartTime)} helperText={touched.StartTime && errors.StartTime} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>End Time</Typography>
                    <Field as={TextField} name="EndTime" type="time" fullWidth error={touched.EndTime && Boolean(errors.EndTime)} helperText={touched.EndTime && errors.EndTime} />
                  </Grid>

                  <Grid item xs={4}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Break (Mins)</Typography>
                    <Field as={TextField} name="BreakMinutes" type="number" fullWidth error={touched.BreakMinutes && Boolean(errors.BreakMinutes)} helperText={touched.BreakMinutes && errors.BreakMinutes} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Late Grace (Mins)</Typography>
                    <Field as={TextField} name="LateGraceMinutes" type="number" fullWidth error={touched.LateGraceMinutes && Boolean(errors.LateGraceMinutes)} helperText={touched.LateGraceMinutes && errors.LateGraceMinutes} />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Early Leave (Mins)</Typography>
                    <Field as={TextField} name="EarlyLeaveGraceMinutes" type="number" fullWidth error={touched.EarlyLeaveGraceMinutes && Boolean(errors.EarlyLeaveGraceMinutes)} helperText={touched.EarlyLeaveGraceMinutes && errors.EarlyLeaveGraceMinutes} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Rounding Mode</Typography>
                    <Field as={TextField} name="RoundingMode" fullWidth select>
                      <MenuItem value={0}>None</MenuItem>
                      <MenuItem value={1}>Nearest</MenuItem>
                      <MenuItem value={2}>Down</MenuItem>
                      <MenuItem value={3}>Up</MenuItem>
                    </Field>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Rounding Interval (Mins)</Typography>
                    <Field as={TextField} name="RoundingIntervalMinutes" type="number" fullWidth error={touched.RoundingIntervalMinutes && Boolean(errors.RoundingIntervalMinutes)} helperText={touched.RoundingIntervalMinutes && errors.RoundingIntervalMinutes} />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel control={<Field as={Checkbox} name="IsNightShift" checked={values.IsNightShift} />} label="Night Shift" />
                    <FormControlLabel control={<Field as={Checkbox} name="IsActive" checked={values.IsActive} />} label="Is Active" />
                  </Grid>
                  
                  <Grid item xs={12} mt={2} style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button variant="outlined" color="error" onClick={() => handleClose(resetForm)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save"}
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