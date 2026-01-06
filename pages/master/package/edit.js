import React, { useEffect, useRef, useState } from "react";
import { ButtonGroup, Checkbox, FormControlLabel, Grid, IconButton, InputAdornment, MenuItem, Select, styled, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BorderColorIcon from "@mui/icons-material/BorderColor";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const validationSchema = Yup.object().shape({
  PackageName: Yup.string().required("Name is required"),
  Description: Yup.string().required("Description is required"),
  Duration: Yup.string().required("Duration is required"),
  Rate: Yup.number()
    .typeError("Rate must be a number")
    .required("Rate is required"),
  PackageCost: Yup.number()
    .typeError("Package Cost must be a number")
    .required("Package Cost is required")
    .test(
      "max-cost",
      "Package Cost cannot be more than Rate",
      function (value) {
        const { Rate } = this.parent;
        return value <= Rate;
      }
    )
});

export default function EditPackage({ item, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const [unit, setUnit] = useState("Min");
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

  const handleOpen = async () => {
    setOpen(true);
  };

  const handleSubmit = async (values) => {
    setOpen(false);
    const formData = new FormData();
    formData.append("Id", values.Id);
    formData.append("PackageName", values.PackageName);
    formData.append("Description", values.Description);
    formData.append("Duration", values.Duration);
    formData.append("DurationUnit", unit);
    formData.append("Rate", parseFloat(values.Rate));
    formData.append("PackageCost", parseFloat(values.PackageCost));
    formData.append("FileName", values.FileName ? values.FileName : "");
    formData.append("IsActive", values.IsActive);
    if (values.File) {
      formData.append("File", values.File);
    }

    const response = await fetch(`${BASE_URL}/Package/UpdatePackage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (data.statusCode == 200) {
      toast.success(data.message);
      setOpen(false);
      fetchItems();
    } else {
      toast.error(data.message);
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
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: item.id,
              PackageName: item.packageName || "",
              Description: item.description || "",
              Duration: item.duration || "",
              Rate: item.rate || "",
              PackageCost: item.packageCost || "",
              File: null,
              FileName: "",
              IsActive: item.isActive || true,
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
                      Edit Package
                    </Typography>
                  </Grid>
                  <Box sx={{ maxHeight: '60vh', overflowY: 'scroll' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            mb: "5px",
                          }}
                        >
                          Package Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="PackageName"
                          inputRef={inputRef}
                          error={touched.PackageName && Boolean(errors.PackageName)}
                          helperText={touched.PackageName && errors.PackageName}
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
                          multiline
                          maxRows={4}
                          error={touched.Description && Boolean(errors.Description)}
                          helperText={touched.Description && errors.Description}
                        />
                      </Grid>
                      <Grid item xs={12} mt={1}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Duration
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Duration"
                          type="text"
                          error={touched.Duration && Boolean(errors.Duration)}
                          helperText={touched.Duration && errors.Duration}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Select
                                  value={unit}
                                  onChange={(e) => setUnit(e.target.value)}
                                  variant="standard"
                                  sx={{ minWidth: 70 }}
                                >
                                  <MenuItem value="Min">Min</MenuItem>
                                  <MenuItem value="H">H</MenuItem>
                                </Select>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} mt={1}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Rate
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Rate"
                          type="text"
                          error={touched.Rate && Boolean(errors.Rate)}
                          helperText={touched.Rate && errors.Rate}
                        />
                      </Grid>
                      <Grid item xs={12} mt={1}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Package Cost
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="PackageCost"
                          type="text"
                          error={touched.PackageCost && Boolean(errors.PackageCost)}
                          helperText={touched.PackageCost && errors.PackageCost}
                        />
                      </Grid>
                      <Grid item xs={12} mt={1}>
                        <Typography
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "5px",
                          }}
                        >
                          Upload Cover Image
                        </Typography>
                        <Button
                          component="label"
                          role={undefined}
                          variant="contained"
                          tabIndex={-1}
                          startIcon={<CloudUploadIcon />}
                        >
                          Upload files
                          <VisuallyHiddenInput
                            type="file"
                            onChange={(event) => {
                              setFieldValue("File", event.target.files[0]);
                              setFieldValue("FileName", event.target.files[0]?.name || "");
                            }}
                          />

                        </Button>
                        {values.FileName && (
                          <Typography variant="body2" mt={1}>
                            Selected File: <strong>{values.FileName}</strong>
                          </Typography>
                        )}

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
                        color="error"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained">
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
