import React, { useEffect, useRef, useState } from "react";
import { Grid, IconButton, MenuItem, Tooltip, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { formatDate } from "@/components/utils/formatHelper";

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
  Name: Yup.string().required("Name is required"),
  StartDate: Yup.string().required("Start date is required"),
  EndDate: Yup.string()
    .required("End date is required")
    .test("after-start", "End date must be after start date", function (value) {
      return !this.parent.StartDate || !value || value > this.parent.StartDate;
    }),
  Status: Yup.number().required("Status is required"),
});

export default function EditFiscalYear({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const datesLocked = (item.periodCount || 0) > 0;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (values) => {
    setIsLoading(true);
    fetch(`${BASE_URL}/FiscalYear/UpdateFiscalYear/${item.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode === 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message || "Failed to update fiscal year.");
        }
      })
      .catch((error) => {
        toast.error(error.message || "Failed to update fiscal year.");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            enableReinitialize
            initialValues={{
              Name: item.name || "",
              StartDate: formatDate(item.startDate) || "",
              EndDate: formatDate(item.endDate) || "",
              Status: item.status || 1,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched }) => (
              <Form>
                <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                  Edit Fiscal Year
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Name</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      size="small"
                      name="Name"
                      inputRef={inputRef}
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Start Date</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      size="small"
                      type="date"
                      name="StartDate"
                      disabled={datesLocked}
                      error={touched.StartDate && Boolean(errors.StartDate)}
                      helperText={
                        datesLocked
                          ? "Dates cannot change after periods are generated."
                          : touched.StartDate && errors.StartDate
                      }
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>End Date</Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      size="small"
                      type="date"
                      name="EndDate"
                      disabled={datesLocked}
                      error={touched.EndDate && Boolean(errors.EndDate)}
                      helperText={touched.EndDate && errors.EndDate}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1} mb={2}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Status</Typography>
                    <Field as={TextField} select fullWidth size="small" name="Status">
                      <MenuItem value={1}>Open</MenuItem>
                      <MenuItem value={2}>Closed</MenuItem>
                    </Field>
                  </Grid>
                </Grid>
                <Box display="flex" justifyContent="space-between">
                  <Button variant="contained" color="error" size="small" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button disabled={isLoading} type="submit" variant="contained" size="small">
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
