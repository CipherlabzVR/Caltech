import React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import FormHelperText from "@mui/material/FormHelperText";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export default function CreateSubscriptionModal({ onSubscriptionCreated }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [moduleOptions, setModuleOptions] = React.useState([]);
  const [loadingModules, setLoadingModules] = React.useState(false);
  const [moduleError, setModuleError] = React.useState(null);
  const [billingTypeOptions, setBillingTypeOptions] = React.useState([]);
  const [loadingBillingTypes, setLoadingBillingTypes] = React.useState(false);
  const [billingTypeError, setBillingTypeError] = React.useState(null);
  const [formValues, setFormValues] = React.useState({
    moduleId: "",
    price: "",
    billingType: "",
    isActive: true,
    features: [{ description: "" }],
  });

  const fetchModules = React.useCallback(async () => {
    try {
      setLoadingModules(true);
      setModuleError(null);

      const response = await fetch(`${BASE_URL}/EnumLookup/ModuleTypes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load module types");
      }

      const data = await response.json();
      const modules = data?.result
        ? Object.entries(data.result).map(([value, label]) => ({
            value,
            label,
          }))
        : [];

      setModuleOptions(modules);
    } catch (error) {
      setModuleError(error.message || "Unable to load module types");
      setModuleOptions([]);
    } finally {
      setLoadingModules(false);
    }
  }, []);

  const fetchBillingTypes = React.useCallback(async () => {
    try {
      setLoadingBillingTypes(true);
      setBillingTypeError(null);

      const response = await fetch(`${BASE_URL}/EnumLookup/BillingTypes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load billing types");
      }

      const data = await response.json();
      const billingTypes = data?.result
        ? Object.entries(data.result).map(([value, label]) => ({
          value,
          label,
        }))
        : [];

      setBillingTypeOptions(billingTypes);
    } catch (error) {
      setBillingTypeError(error.message || "Unable to load billing types");
      setBillingTypeOptions([]);
    } finally {
      setLoadingBillingTypes(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      if (moduleOptions.length === 0 && !loadingModules && !moduleError) {
        fetchModules();
      }
      if (billingTypeOptions.length === 0 && !loadingBillingTypes && !billingTypeError) {
        fetchBillingTypes();
      }
    }
  }, [
    open,
    fetchModules,
    fetchBillingTypes,
    moduleOptions.length,
    loadingModules,
    moduleError,
    billingTypeOptions.length,
    loadingBillingTypes,
    billingTypeError,
  ]);

  const resetForm = () => {
    setFormValues({
      moduleId: "",
      price: "",
      billingType: "",
      isActive: true,
      features: [{ description: "" }],
    });
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureChange = (index, field) => (event) => {
    setFormValues((prev) => {
      const newFeatures = [...prev.features];
      newFeatures[index] = {
        ...newFeatures[index],
        [field]: event.target.value,
      };
      return {
        ...prev,
        features: newFeatures,
      };
    });
  };

  const handleAddFeature = () => {
    setFormValues((prev) => ({
      ...prev,
      features: [...prev.features, { description: "" }],
    }));
  };

  const handleRemoveFeature = (index) => {
    setFormValues((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.moduleId) {
      toast.error("Module is required.");
      return;
    }
    if (!formValues.price || parseFloat(formValues.price) < 0) {
      toast.error("Price must be greater than or equal to 0.");
      return;
    }
    if (!formValues.billingType) {
      toast.error("Billing type is required.");
      return;
    }

    const payload = {
      ModuleId: Number(formValues.moduleId),
      Price: parseFloat(formValues.price),
      BillingType: Number(formValues.billingType),
      IsActive: formValues.isActive,
      Features: formValues.features
        .filter((f) => f.description && f.description.trim())
        .map((f) => ({
          Description: f.description.trim(),
        })),
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Subscription/CreateSubscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create subscription");
      }

      const data = await response.json();
      toast.success(data?.message || "Subscription created successfully.");
      setOpen(false);
      resetForm();
      if (typeof onSubscriptionCreated === "function") {
        onSubscriptionCreated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + Add Subscription
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Subscription</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-subscription-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Subscription Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Module</InputLabel>
                  <Select
                    value={formValues.moduleId}
                    label="Module"
                    onChange={handleChange("moduleId")}
                    disabled={loadingModules || moduleOptions.length === 0}
                  >
                    <MenuItem value="" disabled>
                      Select Module
                    </MenuItem>
                    {moduleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {moduleError && <FormHelperText error>{moduleError}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  size="small"
                  required
                  inputProps={{ min: 0, step: "0.01" }}
                  value={formValues.price}
                  onChange={handleChange("price")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Billing Type</InputLabel>
                  <Select
                    value={formValues.billingType}
                    label="Billing Type"
                    onChange={handleChange("billingType")}
                  >
                    <MenuItem value={1}>Monthly</MenuItem>
                    <MenuItem value={2}>Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.isActive}
                      onChange={handleChange("isActive")}
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>
                    Features
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    variant="outlined"
                    onClick={handleAddFeature}
                  >
                    Add Feature
                  </Button>
                </Box>
              </Grid>

              {formValues.features.map((feature, index) => (
                <Grid item xs={12} key={index}>
                  <Box display="flex" gap={1} alignItems="flex-start">
                    <TextField
                      label={`Feature ${index + 1}`}
                      fullWidth
                      multiline
                      size="small"
                      placeholder="Enter features..."
                      value={feature.description}
                      onChange={handleFeatureChange(index, "description")}
                      inputProps={{ maxLength: 1000 }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveFeature(index)}
                      disabled={formValues.features.length === 1}
                      sx={{ mt: 0.5 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
            <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="create-subscription-form" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

