import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { getOrgId } from "components/utils/apiHelpers";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 1, // Smoothed the corners slightly
};

// Updated Validation Schema
const validationSchema = Yup.object({
  Code: Yup.string().trim().required("Code is required"),
  Name: Yup.string().trim().required("Name is required"),
});

export default function CreateEmploymentTypeModal({ fetchItems }) {
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
    const payload = {
      ...values,
      orgid: getOrgId() || values.orgid || "",
    };

    fetch(`${BASE_URL}/EmploymentType/CreateEmploymentType`, { 
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
              Code: "",
              Name: "",
              IsPayrollEligible: true,
              IsActive: true,
              orgid: getOrgId() || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, resetForm }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Create Employment Type
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                      Code
                    </Typography>
                    <Field
                      as={TextField}
                      name="Code"
                      fullWidth
                      inputRef={firstInputRef} 
                      error={touched.Code && Boolean(errors.Code)}
                      helperText={touched.Code && errors.Code}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                      Name
                    </Typography>
                    <Field
                      as={TextField}
                      name="Name"
                      fullWidth
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={FormControlLabel}
                      name="IsPayrollEligible" 
                      control={<Field as={Checkbox} name="IsPayrollEligible" />}
                      label="Payroll Eligible" 
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: -1 }}>
                    <Field
                      as={FormControlLabel}
                      name="IsActive"
                      control={<Field as={Checkbox} name="IsActive" />}
                      label="Is Active"
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    mt={2}
                    style={{
                      display: "flex",
                      justifyContent: "space-between", 
                      gap: 8,
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleClose(resetForm)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                    >
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