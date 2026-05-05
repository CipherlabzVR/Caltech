import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ParentLocationAutocomplete from "./ParentLocationAutocomplete";
import { assetLocationValidationSchema } from "../../../components/utils/assetLocationValidation";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const locationLevels = [
  { value: 1, label: "Entity (Top Level)" },
  { value: 2, label: "Site" },
  { value: 3, label: "Building" },
  { value: 4, label: "Floor" },
  { value: 5, label: "Room" },
  { value: 6, label: "Bay / Rack" },
];

export default function AddAssetLocation({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const payload = {
      locationCode: values.LocationCode,
      locationName: values.LocationName,
      parentLocationId: values.ParentLocationId || null,
      locationLevel: values.LocationLevel,
      fullPath: values.FullPath || null,
      address: values.Address || null,
      isActive: values.IsActive,
    };

    try {
      const response = await fetch(`${BASE_URL}/asset-locations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")
      ) {
        toast.success(data.message || "Asset location created successfully");
        resetForm();
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to create asset location");
      }
    } catch (error) {
      console.error("Error creating asset location:", error);
      toast.error("An error occurred while creating the asset location");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + Add New
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-asset-location-modal"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              LocationCode: "",
              LocationName: "",
              ParentLocationId: "",
              LocationLevel: 1,
              FullPath: "",
              Address: "",
              IsActive: true,
            }}
            validationSchema={assetLocationValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "600", mb: 2 }}
                    >
                      Add New Asset Location
                    </Typography>
                  </Grid>

                  {/* Location Code */}
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Location Code *"
                      name="LocationCode"
                      inputRef={inputRef}
                      inputProps={{ maxLength: 20 }}
                      error={
                        touched.LocationCode && Boolean(errors.LocationCode)
                      }
                      helperText={
                        touched.LocationCode && errors.LocationCode
                          ? errors.LocationCode
                          : "e.g. HQ-B1-F2"
                      }
                    />
                  </Grid>

                  {/* Location Name */}
                  <Grid item xs={12} md={8}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Location Name *"
                      name="LocationName"
                      inputProps={{ maxLength: 150 }}
                      error={
                        touched.LocationName && Boolean(errors.LocationName)
                      }
                      helperText={touched.LocationName && errors.LocationName}
                    />
                  </Grid>

                  {/* Parent Location — searchable */}
                  <Grid item xs={12}>
                    <ParentLocationAutocomplete
                      modalOpen={open}
                      value={values.ParentLocationId}
                      onChange={(id) =>
                        setFieldValue("ParentLocationId", id === "" ? "" : id)
                      }
                      onSelect={(option) => {
                        if (!option) {
                          setFieldValue("LocationLevel", 1);
                          return;
                        }
                        const pl = option.locationLevel;
                        if (pl != null && !Number.isNaN(Number(pl))) {
                          setFieldValue(
                            "LocationLevel",
                            Math.min(Number(pl) + 1, 6)
                          );
                        }
                      }}
                      error={
                        touched.ParentLocationId &&
                        Boolean(errors.ParentLocationId)
                      }
                      helperText={
                        touched.ParentLocationId && errors.ParentLocationId
                      }
                    />
                  </Grid>

                  {/* Location Level */}
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      error={
                        touched.LocationLevel && Boolean(errors.LocationLevel)
                      }
                    >
                      <InputLabel>Location Level *</InputLabel>
                      <Field
                        as={Select}
                        name="LocationLevel"
                        label="Location Level *"
                      >
                        {locationLevels.map((l) => (
                          <MenuItem key={l.value} value={l.value}>
                            {l.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.LocationLevel && errors.LocationLevel && (
                        <FormHelperText>{errors.LocationLevel}</FormHelperText>
                      )}
                    </FormControl>
                    {values.ParentLocationId ? (
                      <Typography variant="caption" color="text.secondary">
                        Auto-set from parent. You can override.
                      </Typography>
                    ) : null}
                  </Grid>

                  {/* Active */}
                  <Grid item xs={12} md={6} display="flex" alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.IsActive}
                          onChange={(e) =>
                            setFieldValue("IsActive", e.target.checked)
                          }
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  {/* Full Path */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Full Path"
                      name="FullPath"
                      inputProps={{ maxLength: 250 }}
                      error={touched.FullPath && Boolean(errors.FullPath)}
                      helperText={
                        touched.FullPath && errors.FullPath
                          ? errors.FullPath
                          : "Display path (optional, e.g. HQ > Server Room > Rack 1)"
                      }
                    />
                  </Grid>

                  {/* Address */}
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={2}
                      label="Address"
                      name="Address"
                      inputProps={{ maxLength: 500 }}
                      error={touched.Address && Boolean(errors.Address)}
                      helperText={
                        touched.Address && errors.Address
                          ? errors.Address
                          : "Physical address (optional)"
                      }
                    />
                  </Grid>

                  {/* Buttons */}
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    justifyContent="flex-end"
                    gap={2}
                    mt={2}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Location"}
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
