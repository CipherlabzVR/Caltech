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
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import SearchCustomer from "@/components/utils/SearchCustomer";

export default function CreateProject({ onProjectCreated, customers = [] }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [formValues, setFormValues] = React.useState({
    customerId: "",
    projectName: "",
    reference: "",
    billType: "",
    notes: "",
  });

  const resetForm = () => {
    setFormValues({
      customerId: "",
      projectName: "",
      reference: "",
      billType: "",
      notes: "",
    });
    setSelectedCustomer(null);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { customerId, projectName, billType } = formValues;

    if (!customerId) {
      toast.error("Customer is required.");
      return;
    }
    if (!projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }
    if (!billType) {
      toast.error("Bill Type is required.");
      return;
    }

    // Get customer name from selectedCustomer state
    const customerName = selectedCustomer
      ? selectedCustomer.firstName && selectedCustomer.lastName
        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
        : selectedCustomer.displayName || selectedCustomer.firstName || ""
      : "";

    const payload = {
      Name: formValues.projectName.trim(),
      Description: formValues.notes?.trim() || null,
      Status: 1,
      BillType: Number(billType),
      Reference: formValues.reference?.trim() || null,
      AssignedToUserId: null,
      CustomerId: Number(customerId),
      CustomerName: customerName,
      IsManufacture: true,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Project/CreateProject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create project");
      }

      const data = await response.json();
      toast.success(data?.message || "Project created successfully.");
      setOpen(false);
      resetForm();
      if (typeof onProjectCreated === "function") {
        onProjectCreated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + Add Project
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-project-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Project Information
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <SearchCustomer
                  label="Customer"
                  placeholder="Search customers by name"
                  main={true}
                  mainItem={selectedCustomer?.id || null}
                  displayValue={selectedCustomer 
                    ? (selectedCustomer.firstName && selectedCustomer.lastName
                        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                        : selectedCustomer.displayName || selectedCustomer.firstName || "")
                    : ""}
                  onSelect={(customer) => {
                    setSelectedCustomer(customer);
                    setFormValues((prev) => ({
                      ...prev,
                      customerId: String(customer.id),
                    }));
                  }}
                  onClear={() => {
                    setSelectedCustomer(null);
                    setFormValues((prev) => ({
                      ...prev,
                      customerId: "",
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Project Name"
                  fullWidth
                  size="small"
                  required
                  value={formValues.projectName}
                  onChange={handleChange("projectName")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reference"
                  fullWidth
                  size="small"
                  value={formValues.reference}
                  onChange={handleChange("reference")}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Bill Type</InputLabel>
                  <Select
                    value={formValues.billType}
                    label="Bill Type"
                    onChange={handleChange("billType")}
                  >
                    <MenuItem value="1">BOM</MenuItem>
                    <MenuItem value="2">BOQ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  value={formValues.notes}
                  onChange={handleChange("notes")}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
            <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="create-project-form" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

