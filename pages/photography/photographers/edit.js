import React, { useEffect, useRef, useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  maxHeight: "90vh",
  overflowY: "auto",
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().required("Name is required"),
});

export default function EditPhotographer({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);
  const { data: teams } = useApi("/PhotographyTeam/GetActiveTeams");

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const payload = {
      ...values,
      DefaultTeamId: values.DefaultTeamId ? Number(values.DefaultTeamId) : null,
    };
    fetch(`${BASE_URL}/Photographer/UpdatePhotographer`, {
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
          toast.success(msg || "Updated");
          setOpen(false);
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to update");
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
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: item.id,
              Name: item.name || "",
              ContactNo: item.contactNo || "",
              Email: item.email || "",
              DefaultTeamId: item.defaultTeamId || "",
              IsVideography: !!item.isVideography,
              IsContentCreator: !!item.isContentCreator,
              IsActive: item.isActive,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Edit Photographer
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      inputRef={inputRef}
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Contact No
                    </Typography>
                    <Field as={TextField} fullWidth name="ContactNo" size="small" />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Email
                    </Typography>
                    <Field as={TextField} fullWidth name="Email" size="small" />
                  </Grid>

                  <Grid item xs={12} md={6} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Default Team
                    </Typography>
                    <Field
                      as={TextField}
                      select
                      fullWidth
                      name="DefaultTeamId"
                      size="small"
                    >
                      <MenuItem value="">None</MenuItem>
                      {(teams || []).map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                          {t.name}
                        </MenuItem>
                      ))}
                    </Field>
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsVideography"
                          checked={values.IsVideography}
                          onChange={() => setFieldValue("IsVideography", !values.IsVideography)}
                        />
                      }
                      label="Videography"
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsContentCreator"
                          checked={values.IsContentCreator}
                          onChange={() => setFieldValue("IsContentCreator", !values.IsContentCreator)}
                        />
                      }
                      label="Content Creator"
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
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
                    Update
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
