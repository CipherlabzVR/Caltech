import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  FormControl,
  MenuItem,
  Button,
  Box,
  Modal,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import AddIcon from "@mui/icons-material/Add";
import BASE_URL from "Base/api";
import { getOrgId } from "components/utils/apiHelpers";

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

// Validation schema for the new job title form
const validationSchema = Yup.object().shape({
  name: Yup.string().required("Job Title is required"),
  rankOrder: Yup.number()
    .typeError("Rank Order must be a number")
    .required("Rank Order is required")
    .min(0, "Rank Order cannot be negative"),
  // supplierId: Yup.string().required("Company selection is required"),
});

export default function AddJobTitle({ fetchItems = [] }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Debug logging
  // useEffect(() => {
  //   console.log("AddJobTitle - suppliers prop:", suppliers);
  // }, [suppliers]);

  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  // Handle form submission using async/await
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {


    try {
      const token = localStorage.getItem("token");
      // const payload = {
      //   ...values,
      //   // normalize types
      //   rankOrder: Number(values.rankOrder),
      //   supplierId: String(values.supplierId || ""),
      // };

      // console.log(payload);
      // return;

      const payload = {
        ...values,
        orgid: getOrgId() || values.orgid || "",
      };

      const response = await fetch(`${BASE_URL}/JobTitle/CreateJobTitle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create job title.");
      }

      const data = await response.json();

      if (data.statusCode === 201 || data.statusCode === 200) {
        toast.success(data.message || "Job Title created");
        handleClose();
        resetForm();
        fetchItems && fetchItems(); // Refresh list
      } else {
        toast.error(data.message || "Failed to create job title.");
      }
    } catch (error) {
      console.error("Error creating job title:", error);
      toast.error(error.message || "An unexpected error occurred.");
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
        Add Job Title
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-job-title-modal-title"
      >
        <Box sx={style} className="bg-black">
          <Typography
            id="add-job-title-modal-title"
            variant="h5"
            sx={{ fontWeight: "600", mb: 2 }}
          >
            Create Job Title
          </Typography>

          <Formik
            initialValues={{
              name: "",
              description: "",
              rankOrder: 0,
              isActive: true,
              orgid: getOrgId() || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, values, setFieldValue }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Job Title
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

                  {/* <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Select Company
                    </Typography>
                    <FormControl
                      fullWidth
                      error={touched.supplierId && Boolean(errors.supplierId)}
                    >
                      <Field
                        as={TextField}
                        select
                        fullWidth
                        name="supplierId"
                        size="small"
                        value={values.supplierId}
                        onChange={(e) =>
                          setFieldValue("supplierId", String(e.target.value))
                        }
                        helperText={touched.supplierId && errors.supplierId}
                      >
                        {suppliers && suppliers.length > 0 ? (
                          suppliers.map((supplier) => (
                            <MenuItem
                              key={supplier.id}
                              value={String(supplier.id)}
                            >
                              {supplier.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>
                            {suppliers === undefined
                              ? "Loading companies..."
                              : "No Companies Available"}
                          </MenuItem>
                        )}
                      </Field>
                    </FormControl>
                  </Grid> */}

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

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Rank Order
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="rankOrder"
                      type="number"
                      size="small"
                      value={values.rankOrder}
                      onChange={(e) =>
                        setFieldValue("rankOrder", Number(e.target.value))
                      }
                      error={touched.rankOrder && Boolean(errors.rankOrder)}
                      helperText={touched.rankOrder && errors.rankOrder}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                    sx={{ display: "flex", alignItems: "center", mt: 3 }}
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
