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

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 320,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 0,
};

const validationSchema = Yup.object({
  Code: Yup.string()
    .trim()
    .required("Code is required")
    .max(5, "Code must be 3-5 characters")
    .min(3, "Code must be 3-5 characters")
    .uppercase("Code must be uppercase"),
  Name: Yup.string().trim().required("Name is required"),
  Description: Yup.string().trim(),
  Symbol: Yup.string().trim().required("Symbol is required"),
});

export default function CreateCurrencyModal({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open && firstInputRef.current) firstInputRef.current.focus();
  }, [open]);

  const handleClose = (resetForm) => {
    setOpen(false);
    if (resetForm) resetForm();
  };

  const handleSubmit = async (values) => {
    try {
      // Convert Code to uppercase
      const payload = {
        Code: values.Code.toUpperCase().trim(),
        Name: values.Name.trim(),
        Description: values.Description?.trim() || "",
        Symbol: values.Symbol.trim(),
        IsActive: values.IsActive,
      };

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }

      const url = `${BASE_URL}/Currency/CreateCurrency`;
      console.log("Creating currency:", { url, payload });

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        // Try to get error message from response
        const errorText = await response.text();
        let errorData;
        try {
          errorData = errorText ? JSON.parse(errorText) : {};
        } catch (e) {
          // If can't parse, use status text
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Read response as text first to handle empty or malformed responses
      const responseText = await response.text();
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error("Response text:", responseText);
        toast.error("Invalid response from server. Please try again.");
        return;
      }

      if (data.statusCode == 200) {
        toast.success(data.message || "Currency created successfully");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "An error occurred");
      }
    } catch (error) {
      console.error("Request error:", error);
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        toast.error("Unable to connect to server. Please check your connection and try again.");
      } else {
        toast.error(error.message || "Failed to create currency. Please try again.");
      }
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        + Add New
      </Button>

      <Modal open={open} onClose={() => handleClose()}>
        <Box sx={style}>
          <Formik
            initialValues={{ Code: "", Name: "", Description: "", Symbol: "", IsActive: true }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({
              errors,
              touched,
              isSubmitting,
              values,
              setFieldValue,
              resetForm,
            }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      Create Currency
                    </Typography>
                  </Grid>

                  <Box
                    sx={{
                      maxHeight: "60vh",
                      overflowY: "auto",
                      pr: 1,
                      width: "100%",
                    }}
                  >
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                          Code
                        </Typography>
                        <Field
                          as={TextField}
                          name="Code"
                          size="small"
                          fullWidth
                          inputRef={firstInputRef}
                          error={touched.Code && Boolean(errors.Code)}
                          helperText={touched.Code && errors.Code}
                          inputProps={{
                            style: { textTransform: "uppercase" },
                            maxLength: 5,
                          }}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setFieldValue("Code", value);
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                          Name
                        </Typography>
                        <Field
                          as={TextField}
                          name="Name"
                          size="small"
                          fullWidth
                          error={touched.Name && Boolean(errors.Name)}
                          helperText={touched.Name && errors.Name}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                          Description (optional)
                        </Typography>
                        <Field
                          as={TextField}
                          name="Description"
                          size="small"
                          fullWidth
                          multiline
                          minRows={2}
                          error={touched.Description && Boolean(errors.Description)}
                          helperText={touched.Description && errors.Description}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                          Symbol
                        </Typography>
                        <Field
                          as={TextField}
                          name="Symbol"
                          size="small"
                          fullWidth
                          error={touched.Symbol && Boolean(errors.Symbol)}
                          helperText={touched.Symbol && errors.Symbol}
                        />
                      </Grid>

                      <Grid item xs={12} mt={1} p={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.IsActive}
                              onChange={() =>
                                setFieldValue("IsActive", !values.IsActive)
                              }
                            />
                          }
                          label="Active"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Grid container>
                    <Grid
                      item
                      xs={12}
                      p={1}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleClose(resetForm)}
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
                    </Grid>
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
