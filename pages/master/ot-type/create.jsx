import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const PER_RATE_OPTIONS = [
  { value: 1, label: "Per Hour" },
  { value: 2, label: "Per Minute" },
];

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 0,
};
const validationSchema = Yup.object({
  Name: Yup.string().trim().required("Name is required"),
  GracePeriodMinutes: Yup.number().nullable().min(0, "Must be 0 or more"),
  PerRateAmount: Yup.number().nullable().min(0, "Must be 0 or more"),
});

export default function CreateOTTypeModal({ fetchItems }) {
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
    const payload = {
      ...values,
      GracePeriodMinutes:
        values.GracePeriodMinutes === "" || values.GracePeriodMinutes == null
          ? null
          : Number(values.GracePeriodMinutes),
      PerRateAmount:
        values.PerRateAmount === "" || values.PerRateAmount == null
          ? null
          : Number(values.PerRateAmount),
      PerRateType: values.PerRateType ?? 1,
    };

    fetch(`${BASE_URL}/OTType/CreateOTType`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        + Add New
      </Button>

      <Modal open={open} onClose={() => handleClose()}>
        <Box sx={style}>
          <Formik
            initialValues={{
              Name: "",
              Description: "",
              GracePeriodMinutes: "",
              PerRateAmount: "",
              PerRateType: 1,
              IsActive: false,
            }}
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
                      Create OT Type
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
                          Name
                        </Typography>
                        <Field
                          as={TextField}
                          name="Name"
                          fullWidth
                          inputRef={firstInputRef}
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
                          fullWidth
                          multiline
                          minRows={2}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                          Grace Period (mins)
                        </Typography>
                        <Field
                          as={TextField}
                          name="GracePeriodMinutes"
                          fullWidth
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          placeholder="e.g. 15"
                          error={
                            touched.GracePeriodMinutes &&
                            Boolean(errors.GracePeriodMinutes)
                          }
                          helperText={
                            touched.GracePeriodMinutes &&
                            errors.GracePeriodMinutes
                          }
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography sx={{ fontWeight: 500, mb: "5px" }}>
                          Per Rate
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={7}>
                            <Field
                              as={TextField}
                              name="PerRateAmount"
                              fullWidth
                              type="number"
                              inputProps={{ min: 0, step: 0.01 }}
                              placeholder="Amount"
                              error={
                                touched.PerRateAmount &&
                                Boolean(errors.PerRateAmount)
                              }
                              helperText={
                                touched.PerRateAmount && errors.PerRateAmount
                              }
                            />
                          </Grid>
                          <Grid item xs={5}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Unit</InputLabel>
                              <Select
                                name="PerRateType"
                                label="Unit"
                                value={values.PerRateType ?? 1}
                                onChange={(e) =>
                                  setFieldValue(
                                    "PerRateType",
                                    Number(e.target.value)
                                  )
                                }
                              >
                                {PER_RATE_OPTIONS.map((opt) => (
                                  <MenuItem
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
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
                          label="Is Active"
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
