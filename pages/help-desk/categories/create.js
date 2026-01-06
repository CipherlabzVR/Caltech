import React, { useState } from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AddIcon from "@mui/icons-material/Add";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

const validationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Name is required"),
  description: Yup.string().trim(),
  ticketPrefix: Yup.string().trim().max(10, "Max 10 chars"),
  ticketSuffix: Yup.string().trim().max(10, "Max 10 chars"),
  sequencePadding: Yup.number().typeError("Must be a number").integer("Must be an integer").min(1, "Min 1").max(12, "Max 12").required("Padding is required"),
  isActive: Yup.boolean(),
});

export default function CreateCategoryModal({ fetchItems, currentPage = 1, currentSearch = "", currentPageSize = 10 }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/CreateCategory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          isActive: values.isActive,
          ticketPrefix: values.ticketPrefix || "HD",
          ticketSuffix: values.ticketSuffix || "",
          sequencePadding: values.sequencePadding || 6,
        }),
      });

      const data = await response.json();

      // Check if the request was successful
      if (response.ok) {
        // If response is OK, treat as success unless explicitly marked as error
        const isSuccess = data.status === "SUCCESS" || 
                         data.statusCode === 200 || 
                         response.status === 200 ||
                         !data.status || // If no status field, assume success
                         (data.status && data.status !== "ERROR" && data.status !== "FAIL");
        
        if (isSuccess) {
          toast.success(data.message || "Category created successfully!");
          resetForm();
          handleClose();
          // Refresh the table with current page parameters
          fetchItems(currentPage, currentSearch, currentPageSize);
        } else {
          // Response is OK but status indicates failure
          toast.error(data.message || "Failed to create category");
        }
      } else {
        // HTTP error response
        toast.error(data.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("An error occurred while creating the category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Create New Category">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ mb: 2 }}
        >
          Create Category
        </Button>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="create-category-modal"
        aria-describedby="create-category-form"
      >
        <Box sx={style}>
          <Typography id="create-category-modal" variant="h6" component="h2" mb={2}>
            Create New Category
          </Typography>

          <Formik
            initialValues={{
              name: "",
              description: "",
              ticketPrefix: "HD",
              ticketSuffix: "",
              sequencePadding: 6,
              isActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="name"
                      label="Name"
                      error={touched.name && !!errors.name}
                      helperText={touched.name && errors.name}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={3}
                      name="description"
                      label="Description"
                      error={touched.description && !!errors.description}
                      helperText={touched.description && errors.description}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ticketPrefix"
                      label="Ticket Prefix"
                      placeholder="HD"
                      error={touched.ticketPrefix && !!errors.ticketPrefix}
                      helperText={touched.ticketPrefix && errors.ticketPrefix}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ticketSuffix"
                      label="Ticket Suffix"
                      placeholder=""
                      error={touched.ticketSuffix && !!errors.ticketSuffix}
                      helperText={touched.ticketSuffix && errors.ticketSuffix}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="sequencePadding"
                      type="number"
                      label="Sequence Padding"
                      placeholder="6"
                      error={touched.sequencePadding && !!errors.sequencePadding}
                      helperText={touched.sequencePadding && errors.sequencePadding}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field name="isActive">
                      {({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          }
                          label="Active"
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                      <Button onClick={handleClose} variant="outlined">
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create Category"}
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

