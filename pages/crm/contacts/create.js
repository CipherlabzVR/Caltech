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
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import { Checkbox, FormHelperText } from "@mui/material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import useCRMAccounts from "../../../hooks/useCRMAccounts";

const initialFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  mobileNo: "",
  jobTitle: "",
  department: "",
  accountId: "",
  address: "",
  description: "",
  isActive: true,
};

const getAccountValue = (account) => String(account.id);

export default function AddContactModal({ onContactCreated }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formValues, setFormValues] = React.useState(initialFormValues);
  const { accounts, isLoading: accountsLoading, error: accountsError } = useCRMAccounts();

  const handleOpen = () => {
    setOpen(true);
  };

  const resetForm = () => {
    setFormValues(initialFormValues);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCheckboxChange = (event) => {
    setFormValues((prev) => ({
      ...prev,
      isActive: event.target.checked,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.firstName.trim()) {
      toast.error("First name is required.");
      return;
    }

    if (!formValues.lastName.trim()) {
      toast.error("Last name is required.");
      return;
    }

    if (!formValues.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!formValues.mobileNo.trim()) {
      toast.error("Mobile number is required.");
      return;
    }

    const payload = {
      FirstName: formValues.firstName.trim(),
      LastName: formValues.lastName.trim(),
      Email: formValues.email.trim(),
      MobileNo: formValues.mobileNo.trim(),
      JobTitle: formValues.jobTitle.trim() || null,
      Department: formValues.department.trim() || null,
      AccountId: parseInt(formValues.accountId) || null,
      Address: formValues.address.trim() || null,
      Description: formValues.description.trim() || null,
      IsActive: formValues.isActive,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/CRMContacts/CreateCRMContact`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create contact");
      }

      toast.success(data?.message || "Contact created successfully.");
      handleClose();
      if (typeof onContactCreated === "function") {
        onContactCreated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to create contact");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleOpen}>
        + Add Contact
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Contact</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-contact-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Contact Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  size="small"
                  required
                  value={formValues.firstName}
                  onChange={handleFieldChange("firstName")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  required
                  value={formValues.lastName}
                  onChange={handleFieldChange("lastName")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  required
                  value={formValues.email}
                  onChange={handleFieldChange("email")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Mobile Number"
                  fullWidth
                  size="small"
                  required
                  value={formValues.mobileNo}
                  onChange={handleFieldChange("mobileNo")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Job Title"
                  fullWidth
                  size="small"
                  value={formValues.jobTitle}
                  onChange={handleFieldChange("jobTitle")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Department"
                  fullWidth
                  size="small"
                  value={formValues.department}
                  onChange={handleFieldChange("department")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={formValues.accountId}
                    label="Account"
                    onChange={handleFieldChange("accountId")}
                    disabled={accountsLoading || accounts.length === 0}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={getAccountValue(account)}>
                        {account.accountName || account.accountId || getAccountValue(account)}
                      </MenuItem>
                    ))}
                  </Select>
                  {accountsError && <FormHelperText error>{accountsError}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  placeholder="Street, City, State"
                  value={formValues.address}
                  onChange={handleFieldChange("address")}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  minRows={4}
                  size="small"
                  placeholder="Additional notes..."
                  value={formValues.description}
                  onChange={handleFieldChange("description")}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={formValues.isActive} onChange={handleCheckboxChange} />}
                  label="Is Active"
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
            <Button type="submit" form="create-contact-form" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}



