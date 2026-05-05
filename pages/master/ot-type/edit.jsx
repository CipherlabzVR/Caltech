import React, { useEffect, useRef } from "react";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

const PER_RATE_OPTIONS = [
  { value: 1, label: "Per Hour" },
  { value: 2, label: "Per Minute" },
];

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
  Name: Yup.string().trim().required("Name is required"),
  GracePeriodMinutes: Yup.number().nullable().min(0, "Must be 0 or more"),
  PerRateAmount: Yup.number().nullable().min(0, "Must be 0 or more"),
});

export default function EditOTType({ fetchItems, item }) {
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

    fetch(`${BASE_URL}/OTType/UpdateOTType`, {
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
              Name: item.name || "",
              Description: item.description || "",
              GracePeriodMinutes:
                item.gracePeriodMinutes != null ? item.gracePeriodMinutes : "",
              PerRateAmount:
                item.perRateAmount != null ? item.perRateAmount : "",
              PerRateType: item.perRateType ?? 1,
              IsActive: item.isActive ?? item.IsActive ?? false,
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
                      Edit OT Type
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
                          Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Name"
                          inputRef={inputRef}
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
                          multiline
                          minRows={2}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography
                          sx={{ fontWeight: "500", mb: "5px" }}
                        >
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
                        <Typography
                          sx={{ fontWeight: "500", mb: "5px" }}
                        >
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
                            <Field
                              as={Checkbox}
                              name="IsActive"
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