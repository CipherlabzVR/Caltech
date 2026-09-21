import React, { useEffect, useRef, useState } from "react";
import { Autocomplete, Checkbox, Chip, FormControlLabel, Grid, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { getAgentTypes, isApiSuccess } from "@/Services/photographyAgentService";

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
  DisplayOrder: Yup.number()
    .typeError("Order must be a number")
    .min(0, "Cannot be negative")
    .required("Order is required"),
  AgentTypes: Yup.array().min(1, "Select at least one agent type").required("Agent type is required"),
});

export default function AddStatus({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [agentTypeOptions, setAgentTypeOptions] = useState([]);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      getAgentTypes()
        .then((data) => {
          if (isApiSuccess(data)) {
            const list = (data.result || data.Result || []).map((t) => ({
              id: t.id ?? t.Id,
              name: t.name ?? t.Name,
            }));
            setAgentTypeOptions(list);
          }
        })
        .catch(() => setAgentTypeOptions([]));
    }
  }, [open]);

  const handleSubmit = (values) => {
    const token = localStorage.getItem("token");
    const payload = {
      ...values,
      DisplayOrder: Math.max(0, Number(values.DisplayOrder) || 0),
    };
    fetch(`${BASE_URL}/PhotographyEventStatus/CreateStatus`, {
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
          toast.success(msg || "Status created");
          handleClose();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to create status");
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
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
              DisplayOrder: 1,
              ColorCode: "",
              IsActive: true,
              AgentTypes: [],
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Grid spacing={1} container>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
                      Add Status
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
                      Color Code
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="ColorCode"
                      size="small"
                      placeholder="e.g. #2E7D32"
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
                      Agent Types *
                    </Typography>
                    <Autocomplete
                      multiple
                      options={agentTypeOptions}
                      getOptionLabel={(option) => option.name}
                      value={agentTypeOptions.filter((o) => (values.AgentTypes || []).includes(o.id))}
                      onChange={(event, newValue) => {
                        setFieldValue("AgentTypes", newValue.map((v) => v.id));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="Select one or more agents"
                          error={touched.AgentTypes && Boolean(errors.AgentTypes)}
                          helperText={touched.AgentTypes && errors.AgentTypes}
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip label={option.name} size="small" {...getTagProps({ index })} key={option.id} />
                        ))
                      }
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
