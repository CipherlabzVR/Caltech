import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
  Box,
  Modal,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import BASE_URL from "Base/api";

// Modal style
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: "4px",
};

// Validation schema
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Department name is required"),
});

export default function AddDepartment({ fetchItems = [] }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        Name: values.name,
        Description: values.description || "",
        IsActive: values.isActive !== undefined ? values.isActive : true,
      };

      const response = await fetch(`${BASE_URL}/Department/CreateDepartment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.statusCode === 200 || data.statusCode === 201) {
        toast.success(data.message || "Department created successfully");
        handleClose();
        resetForm();
        if (fetchItems) fetchItems();
      } else {
        toast.error(data.message || "Failed to create department");
      }
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<AddIcon />}
        size="medium"
      >
        Add Department
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-department-modal-title"
        aria-describedby="add-department-modal-description"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              name: "",
              description: "",
              isActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Create Department
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Department Name *
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      inputRef={inputRef}
                      name="name"
                      placeholder="Enter department name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      InputProps={{
                        style: { borderRadius: 8 },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="description"
                      placeholder="Enter description"
                      multiline
                      rows={3}
                      InputProps={{
                        style: { borderRadius: 8 },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.isActive}
                          onChange={(e) =>
                            setFieldValue("isActive", e.target.checked)
                          }
                        />
                      }
                      label="Is Active"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </Box>
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

