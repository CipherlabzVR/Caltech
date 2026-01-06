import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import BorderColorIcon from "@mui/icons-material/BorderColor";

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

// UPDATED: Added CompanyId validation
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

// ADDED: Helper map to convert API enum string to number for the form
const roundingModeMap = {
  "None": 0,
  "Nearest": 1,
  "Down": 2,
  "Up": 3,
};

export default function EditShiftMasterModal({ fetchItems, item }) {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState([]); // ADDED: State for companies
  const firstInputRef = useRef(null);

  useEffect(() => {
    // ADDED: Fetch companies when modal opens
    if (open) {
      fetch(`${BASE_URL}/ShiftCompany/list`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setCompanies(data))
        .catch((err) => console.error("Failed to fetch companies:", err));
      
      if (firstInputRef.current) {
        setTimeout(() => firstInputRef.current.focus(), 100);
      }
    }
  }, [open]);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      ...values,
      StartTime: `${values.StartTime}:00`,
      EndTime: `${values.EndTime}:00`,
    };

    fetch(`${BASE_URL}/ShiftMaster/UpdateShift`, {
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
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Formik
            initialValues={{
              Id: item.id,
              CompanyId: item.companyId || "", // ADDED: CompanyId to form state
              Code: item.code || "",
              Name: item.name || "",
              StartTime: item.startTime ? item.startTime.substring(0, 5) : "00:00",
              EndTime: item.endTime ? item.endTime.substring(0, 5) : "00:00",
              BreakMinutes: item.breakMinutes || 0,
              LateGraceMinutes: item.lateGraceMinutes || 0,
              EarlyLeaveGraceMinutes: item.earlyLeaveGraceMinutes || 0,
              RoundingMode: roundingModeMap[item.roundingMode] ?? 0, // CORRECTED: Use map
              RoundingIntervalMinutes: item.roundingIntervalMinutes || 0,
              IsNightShift: item.isNightShift || false,
              IsActive: item.isActive || false,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, isSubmitting, values }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Edit Shift
                    </Typography>
                  </Grid>

                  {/* ADDED: Company Dropdown Field */}
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
                  
                  {/* ... The rest of your form fields remain the same ... */}
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
                      {/* CORRECTED: Enum values are 0-based */}
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
                    <Button variant="outlined" color="error" onClick={handleClose} disabled={isSubmitting}>
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