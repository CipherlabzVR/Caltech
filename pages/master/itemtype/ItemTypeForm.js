import React, { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Field, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "92vw", md: 720 },
  maxHeight: "90vh",
  overflow: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().trim().required("Item Type Name is required"),
  Features: Yup.array().of(
    Yup.object().shape({
      Name: Yup.string().trim().required("Feature name is required"),
      Options: Yup.array()
        .of(
          Yup.object().shape({
            Value: Yup.string().trim().required("Option value is required"),
          })
        )
        .min(1, "Add at least one option for each feature"),
    })
  ),
});

const emptyFeature = () => ({ Id: null, Name: "", SortOrder: 0, Options: [] });

const buildPayload = (values, idIfEdit) => {
  const payload = {
    Name: values.Name?.trim(),
    Description: values.Description || "",
    IsActive: !!values.IsActive,
    Features: (values.Features || []).map((f, fi) => ({
      Id: f.Id || null,
      Name: f.Name?.trim() || "",
      SortOrder: fi,
      Options: (f.Options || []).map((o, oi) => ({
        Id: o.Id || null,
        Value: o.Value?.trim() || "",
        SortOrder: oi,
      })),
    })),
  };
  if (idIfEdit) payload.Id = idIfEdit;
  return payload;
};

export default function ItemTypeForm({
  open,
  onClose,
  initialValues,
  itemTypeId,
  fetchItems,
  title,
  endpoint,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = (values, { setSubmitting }) => {
    const payload = buildPayload(values, itemTypeId);
    fetch(`${BASE_URL}/ItemType/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        const sc = data.statusCode ?? data.StatusCode;
        const msg = data.message ?? data.Message ?? "";
        if (sc === 200) {
          toast.success(msg || "Saved");
          onClose?.();
          fetchItems?.();
        } else {
          toast.error(msg || "Failed to save");
        }
      })
      .catch((e) => toast.error(e?.message || "Network error"))
      .finally(() => setSubmitting(false));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} className="bg-black">
        <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
          {title}
        </Typography>

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue, isSubmitting }) => (
            <Form>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1 }}>
                    Item Type Name
                  </Typography>
                  <Field
                    as={TextField}
                    fullWidth
                    inputRef={inputRef}
                    name="Name"
                    placeholder="e.g. Ecom, NonEcom"
                    error={touched.Name && Boolean(errors.Name)}
                    helperText={touched.Name && errors.Name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1 }}>
                    Description
                  </Typography>
                  <Field as={TextField} fullWidth name="Description" />
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

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6">Features</Typography>
                    <FieldArray name="Features">
                      {({ push }) => (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => push(emptyFeature())}
                        >
                          Add Feature
                        </Button>
                      )}
                    </FieldArray>
                  </Box>

                  <FieldArray name="Features">
                    {({ remove: removeFeature }) => (
                      <Stack spacing={2}>
                        {(values.Features || []).length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No features yet. Add one (e.g. Size, Color).
                          </Typography>
                        )}
                        {(values.Features || []).map((feature, fi) => (
                          <Box
                            key={fi}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={5}>
                                <Field
                                  as={TextField}
                                  size="small"
                                  fullWidth
                                  name={`Features.${fi}.Name`}
                                  placeholder="Feature name (e.g. Size)"
                                  error={
                                    touched.Features?.[fi]?.Name &&
                                    Boolean(errors.Features?.[fi]?.Name)
                                  }
                                  helperText={
                                    touched.Features?.[fi]?.Name &&
                                    errors.Features?.[fi]?.Name
                                  }
                                />
                              </Grid>
                              <Grid item xs={12} md={7} display="flex" justifyContent="flex-end">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => removeFeature(fi)}
                                  title="Remove feature"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Grid>
                              <Grid item xs={12}>
                                <FieldArray name={`Features.${fi}.Options`}>
                                  {({ push: pushOption, remove: removeOption }) => (
                                    <OptionsEditor
                                      options={feature.Options || []}
                                      onAdd={(val) =>
                                        pushOption({ Id: null, Value: val, SortOrder: 0 })
                                      }
                                      onRemove={removeOption}
                                      error={
                                        typeof errors.Features?.[fi]?.Options === "string"
                                          ? errors.Features[fi].Options
                                          : null
                                      }
                                    />
                                  )}
                                </FieldArray>
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </FieldArray>
                </Grid>
              </Grid>

              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button
                  type="button"
                  variant="contained"
                  color="error"
                  onClick={onClose}
                  sx={{ textTransform: "capitalize", borderRadius: "8px", px: 3 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ textTransform: "capitalize", borderRadius: "8px", px: 3 }}
                >
                  Save
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Modal>
  );
}

function OptionsEditor({ options, onAdd, onRemove, error }) {
  const [val, setVal] = React.useState("");
  const handleAdd = () => {
    const v = val.trim();
    if (!v) return;
    if (options.some((o) => (o.Value || "").trim().toLowerCase() === v.toLowerCase())) {
      toast.warning("Option already exists");
      return;
    }
    onAdd(v);
    setVal("");
  };
  return (
    <Box>
      <Box display="flex" gap={1} mb={1}>
        <TextField
          size="small"
          fullWidth
          placeholder="Option (e.g. S, M, L, XL) — press Enter or Add"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button variant="outlined" onClick={handleAdd} startIcon={<AddIcon />}>
          Add
        </Button>
      </Box>
      <Box display="flex" gap={0.5} flexWrap="wrap">
        {options.map((o, oi) => (
          <Chip
            key={oi}
            label={o.Value}
            onDelete={() => onRemove(oi)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
}

export { emptyFeature };
