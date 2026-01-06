import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Grid,
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
  width: 700, 
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 1,
};

const validationSchema = Yup.object({
  CompanyName: Yup.string().trim().required("Company Name is required"),
  DisplayName: Yup.string().trim().required("Display Name is required"),
  EmailAddress1: Yup.string().email("Invalid email format").required("Email is required"),
  MobileNo1: Yup.string().trim().required("Mobile No. is required"),
  ContactPersonName: Yup.string().trim().required("Contact Person is required"),
  NumberOfEmployees: Yup.number()
    .min(0, "Cannot be negative")
    .required("Number of Employees is required"),
});

export default function CreateShiftCompanyModal({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open && firstInputRef.current) {
      setTimeout(() => firstInputRef.current.focus(), 100);
    }
  }, [open]);

  const handleClose = (resetForm) => {
    setOpen(false);
    if (resetForm) resetForm();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    fetch(`${BASE_URL}/ShiftCompany/CreateShiftCompany`, { 
      method: "POST",
      body: JSON.stringify(values), 
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
              CompanyName: "",
              DisplayName: "",
              Address1: "",
              Address2: "",
              Address3: "",
              MobileNo1: "",
              MobileNo2: "",
              Description: "",
              TelephoneNumber: "",
              EmailAddress1: "",
              EmailAddress2: "",
              ContactPersonName: "",
              NumberOfEmployees: 0,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, resetForm }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Create Company
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Company Name*</Typography>
                    <Field as={TextField} name="CompanyName" fullWidth inputRef={firstInputRef} error={touched.CompanyName && Boolean(errors.CompanyName)} helperText={touched.CompanyName && errors.CompanyName} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Display Name*</Typography>
                    <Field as={TextField} name="DisplayName" fullWidth error={touched.DisplayName && Boolean(errors.DisplayName)} helperText={touched.DisplayName && errors.DisplayName} />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Address 1</Typography>
                    <Field as={TextField} name="Address1" fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Address 2</Typography>
                    <Field as={TextField} name="Address2" fullWidth />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Address 3</Typography>
                    <Field as={TextField} name="Address3" fullWidth />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Mobile No 1*</Typography>
                    <Field as={TextField} name="MobileNo1" fullWidth error={touched.MobileNo1 && Boolean(errors.MobileNo1)} helperText={touched.MobileNo1 && errors.MobileNo1} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Mobile No 2</Typography>
                    <Field as={TextField} name="MobileNo2" fullWidth />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Email 1*</Typography>
                    <Field as={TextField} name="EmailAddress1" fullWidth error={touched.EmailAddress1 && Boolean(errors.EmailAddress1)} helperText={touched.EmailAddress1 && errors.EmailAddress1} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Email 2</Typography>
                    <Field as={TextField} name="EmailAddress2" fullWidth />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Contact Person*</Typography>
                    <Field as={TextField} name="ContactPersonName" fullWidth error={touched.ContactPersonName && Boolean(errors.ContactPersonName)} helperText={touched.ContactPersonName && errors.ContactPersonName} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>No. of Employees*</Typography>
                    <Field as={TextField} name="NumberOfEmployees" type="number" fullWidth error={touched.NumberOfEmployees && Boolean(errors.NumberOfEmployees)} helperText={touched.NumberOfEmployees && errors.NumberOfEmployees} />
                  </Grid>

                   <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>Description</Typography>
                    <Field as={TextField} name="Description" multiline rows={3} fullWidth />
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