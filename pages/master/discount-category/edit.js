import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  Typography,
  MenuItem,
  Select,
  FormControl,
  FormHelperText,
} from "@mui/material";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";

const validationSchema = Yup.object().shape({
  DiscountName: Yup.string().required("Discount Name is required"),
  DiscountType: Yup.number().required("Discount Type is required"),
  Value: Yup.number().required("Value is required").min(0, "Value must be positive"),
});

export default function EditDiscountCategoryDialog({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/DiscountCategory/Update`, {
      method: "PUT",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(
          error.message || "Discount Category Update failed. Please try again."
        );
      });
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton
          onClick={handleClickOpen("paper")}
          aria-label="edit"
          size="small"
        >
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <div className="bg-black">
          <DialogTitle id="scroll-dialog-title">
            Edit Discount Category
          </DialogTitle>
          <DialogContent>
            <Formik
              initialValues={{
                Id: item.id || "",
                DiscountName: item.discountName || "",
                DiscountType: item.discountType || 1,
                Value: item.value || 0,
                IsActive: item.isActive || false,
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, values, setFieldValue, handleBlur }) => (
                <Form>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Discount Name
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="DiscountName"
                        placeholder="Enter discount name"
                        error={touched.DiscountName && Boolean(errors.DiscountName)}
                        helperText={touched.DiscountName && errors.DiscountName}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Discount Type
                      </Typography>
                      <FormControl fullWidth error={touched.DiscountType && Boolean(errors.DiscountType)}>
                        <Select
                          name="DiscountType"
                          value={values.DiscountType}
                          onChange={(e) => setFieldValue("DiscountType", e.target.value)}
                          onBlur={handleBlur}
                        >
                          <MenuItem value={1}>Value</MenuItem>
                          <MenuItem value={2}>Percentage</MenuItem>
                        </Select>
                        {touched.DiscountType && errors.DiscountType && (
                          <FormHelperText>{errors.DiscountType}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Value
                      </Typography>
                      <Field
                        as={TextField}
                        fullWidth
                        name="Value"
                        type="number"
                        placeholder="Enter value"
                        error={touched.Value && Boolean(errors.Value)}
                        helperText={touched.Value && errors.Value}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.IsActive}
                            onChange={(e) =>
                              setFieldValue("IsActive", e.target.checked)
                            }
                            name="IsActive"
                          />
                        }
                        label="Active"
                      />
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button onClick={handleClose} color="inherit">
                          Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                          Update
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}

