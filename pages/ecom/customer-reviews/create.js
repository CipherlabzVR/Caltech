import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, MenuItem, Typography } from "@mui/material";
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
  width: { lg: 520, xs: 360 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  reviewerDisplayName: Yup.string().required("Name is required").max(120),
  reviewText: Yup.string().required("Review text is required").max(2000),
  rating: Yup.number().min(1).max(5).required(),
});

export default function AddCustomerReview({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (values, { resetForm }) => {
    const token = localStorage.getItem("token");
    const body = {
      id: null,
      reviewerDisplayName: values.reviewerDisplayName,
      location: values.location || null,
      rating: Number(values.rating),
      reviewText: values.reviewText,
      submitterEmail: values.submitterEmail || null,
      isApproved: values.isApproved,
      displayOrder: Number(values.displayOrder) || 0,
    };
    fetch(`${BASE_URL}/ECommerce/SaveCustomerReviewStaff`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const ok = data.statusCode === 200 || data.statusCode === "200";
        if (ok) {
          toast.success(data.message || "Saved");
          resetForm();
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Save failed");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add review
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Formik
            initialValues={{
              reviewerDisplayName: "",
              location: "",
              rating: 5,
              reviewText: "",
              submitterEmail: "",
              isApproved: true,
              displayOrder: 0,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Add customer review
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      inputRef={inputRef}
                      fullWidth
                      name="reviewerDisplayName"
                      label="Display name"
                      error={touched.reviewerDisplayName && Boolean(errors.reviewerDisplayName)}
                      helperText={touched.reviewerDisplayName && errors.reviewerDisplayName}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field as={TextField} fullWidth name="location" label="Location (optional)" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field as={TextField} fullWidth select name="rating" label="Rating">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <MenuItem key={n} value={n}>
                          {n} stars
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      minRows={3}
                      name="reviewText"
                      label="Review text"
                      error={touched.reviewText && Boolean(errors.reviewText)}
                      helperText={touched.reviewText && errors.reviewText}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field as={TextField} fullWidth name="submitterEmail" label="Contact email (optional, internal)" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      name="displayOrder"
                      label="Display order"
                      type="number"
                      helperText="Lower shows earlier in the storefront carousel."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="isApproved">
                      {({ field }) => (
                        <FormControlLabel
                          control={<Checkbox {...field} checked={Boolean(field.value)} />}
                          label="Approved (visible on website)"
                        />
                      )}
                    </Field>
                  </Grid>
                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" variant="contained">
                      Save
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
