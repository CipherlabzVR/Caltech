import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Button,
  Modal,
  TextField,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import BorderColorIcon from "@mui/icons-material/BorderColor";

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

export default function EditDepartment({ item, fetchItems = [] }) {
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
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        Id: values.id,
        Name: values.name,
        Description: values.description || "",
        IsActive: values.isActive !== undefined ? values.isActive : true,
      };

      const response = await fetch(`${BASE_URL}/Department/UpdateDepartment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.statusCode === 200) {
        toast.success(data.message || "Department updated successfully");
        handleClose();
        if (fetchItems) fetchItems();
      } else {
        toast.error(data.message || "Failed to update department");
      }
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
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
        aria-labelledby="edit-department-modal-title"
        aria-describedby="edit-department-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Typography
            id="edit-department-modal-title"
            variant="h5"
            sx={{ fontWeight: "600", mb: 2 }}
          >
            Edit Department
          </Typography>

          <Formik
            enableReinitialize
            initialValues={{
              id: item?.id,
              name: item?.name || "",
              description: item?.description || "",
              isActive: item?.isActive !== undefined ? item.isActive : true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Department Name *
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      inputRef={inputRef}
                      name="name"
                      size="small"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={3}
                      name="description"
                      size="small"
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isActive"
                          checked={values.isActive}
                          onChange={(e) =>
                            setFieldValue("isActive", e.target.checked)
                          }
                        />
                      }
                      label="Is Active"
                    />
                  </Grid>
                </Grid>

                <Box display="flex" mt={3} justifyContent="flex-end" gap={1}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClose}
                    size="small"
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
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

