import React, { useEffect, useRef, useState } from "react";
import { Checkbox, FormControlLabel, Grid, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

import CloseIcon from "@mui/icons-material/Close";
import {
  DEFAULT_ICON_KEY,
  ICON_OPTIONS,
  resolveEventTypeIcon,
} from "@/utils/photography/eventTypeIcons";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 520, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
  DisplayOrder: Yup.number()
    .typeError("Order must be a number")
    .min(0, "Cannot be negative")
    .required("Order is required"),
});

function IconPicker({ value, onChange, color }) {
  const SelectedIcon = resolveEventTypeIcon(value);

  const handleClear = () => {
    // "Deleting" the icon just falls back to the default — the field is
    // never left empty.
    onChange(DEFAULT_ICON_KEY);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Paper
          variant="outlined"
          sx={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            color: color || "text.primary",
          }}
        >
          <SelectedIcon />
        </Paper>
        <Typography variant="body2" color="text.secondary">
          {value && value !== DEFAULT_ICON_KEY
            ? ICON_OPTIONS.find((o) => o.key === value)?.label || value
            : "Default icon"}
        </Typography>
        {value && value !== DEFAULT_ICON_KEY && (
          <Tooltip title="Reset to default icon">
            <IconButton size="small" onClick={handleClear}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {ICON_OPTIONS.map(({ key, label, Icon }) => {
          const selected = value === key || (!value && key === DEFAULT_ICON_KEY);
          return (
            <Tooltip key={key} title={label}>
              <IconButton
                onClick={() => onChange(key)}
                sx={{
                  border: "1px solid",
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected ? "action.selected" : "transparent",
                  borderRadius: 2,
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

export default function AddEventType({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const payload = {
      ...values,
      DisplayOrder: Math.max(0, Number(values.DisplayOrder) || 0),
      Code: values.Code || null,
      ColorCode: values.ColorCode || null,
      IconName: values.IconName || DEFAULT_ICON_KEY,
    };
    fetch(`${BASE_URL}/PhotographyEventType/CreateEventType`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200 || sc === "SUCCESS") {
          toast.success(msg || "Event type created");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to create event type");
        }
      })
      .catch((error) => toast.error(error.message || ""));
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add new
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            key={String(open)}
            initialValues={{
              Name: "",
              Code: "",
              DisplayOrder: 1,
              ColorCode: "#6366F1",
              IconName: DEFAULT_ICON_KEY,
              ConsumesWeddingCapacity: false,
              IsActive: true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Add Event Type
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={8} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      inputRef={inputRef}
                      placeholder="e.g. Engagement"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>

                  <Grid item xs={12} md={4} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Display Order
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      name="DisplayOrder"
                      size="small"
                      inputProps={{ min: 0 }}
                      error={touched.DisplayOrder && Boolean(errors.DisplayOrder)}
                      helperText={touched.DisplayOrder && errors.DisplayOrder}
                    />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Code (optional)
                    </Typography>
                    <Field as={TextField} fullWidth name="Code" size="small" placeholder="e.g. Engagement" />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Color
                    </Typography>
                    <Field as={TextField} fullWidth type="color" name="ColorCode" size="small" />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Icon
                    </Typography>
                    <IconPicker
                      value={values.IconName}
                      color={values.ColorCode}
                      onChange={(key) => setFieldValue("IconName", key)}
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="ConsumesWeddingCapacity"
                          checked={values.ConsumesWeddingCapacity}
                          onChange={() =>
                            setFieldValue(
                              "ConsumesWeddingCapacity",
                              !values.ConsumesWeddingCapacity
                            )
                          }
                        />
                      }
                      label="Consumes wedding team capacity"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsActive"
                          checked={values.IsActive}
                          onChange={() => setFieldValue("IsActive", !values.IsActive)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                </Grid>

                <Box display="flex" mt={2} justifyContent="space-between">
                  <Button variant="contained" color="error" onClick={handleClose} size="small">
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" size="small">
                    Save
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