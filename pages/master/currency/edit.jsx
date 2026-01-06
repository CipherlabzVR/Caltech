import React, { useEffect, useRef } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Tooltip,
  Typography,
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
import BorderColorIcon from "@mui/icons-material/BorderColor";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 320, xs: 300 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
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

export default function EditCurrency({ fetchItems, item }) {
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleSubmit = (values) => {
    // Convert Code to uppercase
    const payload = {
      Id: item.id,
      Code: values.Code.toUpperCase().trim(),
      Name: values.Name.trim(),
      Description: values.Description?.trim() || "",
      Symbol: values.Symbol.trim(),
      IsActive: values.IsActive,
    };

    fetch(`${BASE_URL}/Currency/UpdateCurrency`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(async (response) => {
        // Read response as text first to handle empty or malformed responses
        const responseText = await response.text();
        let data;
        
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          toast.error("Invalid response from server. Please try again.");
          return;
        }

        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "An error occurred");
        }
      })
      .catch((error) => {
        console.error("Request error:", error);
        toast.error(error.message || "Failed to update currency. Please try again.");
      });
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
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: item.id,
              Code: item.code || "",
              Name: item.name || "",
              Description: item.description || "",
              Symbol: item.symbol || "",
              IsActive: item.isActive !== undefined ? item.isActive : true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, resetForm }) => (
              <Form>
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "500",
                        mb: "5px",
                      }}
                    >
                      Edit Currency
                    </Typography>
                  </Grid>
                  <Box sx={{ maxHeight: "60vh", overflowY: "scroll" }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Code
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Code"
                          size="small"
                          inputRef={inputRef}
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
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Name"
                          size="small"
                          error={touched.Name && Boolean(errors.Name)}
                          helperText={touched.Name && errors.Name}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Description
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Description"
                          size="small"
                          multiline
                          minRows={2}
                          error={touched.Description && Boolean(errors.Description)}
                          helperText={touched.Description && errors.Description}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Symbol
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Symbol"
                          size="small"
                          error={touched.Symbol && Boolean(errors.Symbol)}
                          helperText={touched.Symbol && errors.Symbol}
                        />
                      </Grid>
                      <Grid item xs={12} mt={1} p={1}>
                        <FormControlLabel
                          control={
                            <Field
                              as={Checkbox}
                              name="IsActive"
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
                      display="flex"
                      justifyContent="space-between"
                      item
                      xs={12}
                      p={1}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" size="small">
                        Save
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
