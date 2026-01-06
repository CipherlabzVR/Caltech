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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import SearchCustomer from "@/components/utils/SearchCustomer";

export default function EditProjectModal({ project, onProjectUpdated, customers = [] }) {
  const [open, setOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [formValues, setFormValues] = React.useState({
    customerId: "",
    projectName: "",
    reference: "",
    billType: "",
    notes: "",
  });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open && project) {
      const customerId = project.customerId ? String(project.customerId) : "";
      setFormValues({
        customerId: customerId,
        projectName: project.name || project.projectName || "",
        reference: project.reference || "",
        billType: project.billType ? String(project.billType) : "",
        notes: project.description || project.notes || "",
      });
      
      // Set selected customer if customerId exists
      if (project.customerId) {
        // Try to find customer from customers prop first
        const customer = customers.find((c) => c.id === project.customerId);
        if (customer) {
          setSelectedCustomer(customer);
        } else {
          // If not found in prop, create a placeholder object from project data
          // Split customerName into firstName and lastName if possible
          const customerName = project.customerName || "";
          const nameParts = customerName.trim().split(/\s+/);
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          
          setSelectedCustomer({
            id: project.customerId,
            firstName: firstName,
            lastName: lastName,
            displayName: customerName,
          });
        }
      } else {
        setSelectedCustomer(null);
      }
    }
  }, [project, open, customers]);

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.customerId) {
      toast.error("Customer is required.");
      return;
    }
    if (!formValues.projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }
    if (!formValues.billType) {
      toast.error("Bill Type is required.");
      return;
    }
    if (!project?.id) {
      toast.error("Missing project identifier.");
      return;
    }

    // Get customer name from selectedCustomer state
    const customerName = selectedCustomer
      ? selectedCustomer.firstName && selectedCustomer.lastName
        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
        : selectedCustomer.displayName || selectedCustomer.firstName || ""
      : "";

    const payload = {
      Id: project.id,
      Name: formValues.projectName.trim(),
      Description: formValues.notes?.trim() || null,
      Status: 1,
      AssignedToUserId: null,
      CustomerId: Number(formValues.customerId),
      CustomerName: customerName,
      BillType: Number(formValues.billType),
      Reference: formValues.reference?.trim() || null,
      IsManufacture: true,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Project/UpdateProject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update project");
      }

      const data = await response.json();
      toast.success(data?.message || "Project updated successfully.");
      setOpen(false);
      if (typeof onProjectUpdated === "function") {
        onProjectUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to update project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label="edit project" onClick={() => setOpen(true)}>
          <EditOutlinedIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Project {project?.code ? `- ${project.code}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id={`edit-project-form-${project?.id}`} onSubmit={handleSubmit} noValidate>
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
                  displayValue={(() => {
                    if (!selectedCustomer) return "";
                    
                    // If both firstName and lastName exist, combine them
                    if (selectedCustomer.firstName && selectedCustomer.lastName) {
                      return `${selectedCustomer.firstName} ${selectedCustomer.lastName}`;
                    }
                    
                    // Otherwise use displayName or firstName
                    return selectedCustomer.displayName || selectedCustomer.firstName || "";
                  })()}
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
            <Button variant="outlined" color="inherit" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={`edit-project-form-${project?.id}`}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

