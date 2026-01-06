import React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { countries } from "../../../components/utils/countries";

export default function CreateCustomer({ onCustomerCreated }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    mobileNo: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
  });

  const resetForm = () => {
    setFormValues({
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      mobileNo: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "",
    });
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
    const { firstName, lastName, email, mobileNo } = formValues;

    if (!firstName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!mobileNo.trim()) {
      toast.error("Mobile number is required.");
      return;
    }

    const payload = {
      Title: "",
      FirstName: formValues.firstName.trim(),
      LastName: formValues.lastName.trim(),
      Company: formValues.company.trim(),
      DisplayName: formValues.firstName.trim(),
      Email: formValues.email.trim(),
      MobileNo: formValues.mobileNo.trim(),
      AddressLine1: formValues.addressLine1?.trim() || "",
      AddressLine2: formValues.addressLine2?.trim() || "",
      AddressLine3: formValues.city?.trim() || "",
      State: formValues.state?.trim() || "",
      Country: formValues.country?.trim() || "",
      Designation: "",
      NIC: "",
      DateOfBirth: null,
      ReceivableAccount: null,
      IsManufacture: true,
      CustomerContactDetails: [
        {
          ContactName: formValues.firstName.trim(),
          EmailAddress: formValues.email.trim(),
          ContactNo: formValues.mobileNo.trim()
        }
      ]
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Customer/CreateCustomer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create customer");
      }

      const data = await response.json();
      toast.success(data?.message || "Customer created successfully.");
      setOpen(false);
      resetForm();
      if (typeof onCustomerCreated === "function") {
        onCustomerCreated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + Add Customer
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Customer</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-customer-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Customer Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  size="small"
                  required
                  value={formValues.firstName}
                  onChange={handleChange("firstName")}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  required
                  value={formValues.lastName}
                  onChange={handleChange("lastName")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Company"
                  fullWidth
                  size="small"
                  value={formValues.company}
                  onChange={handleChange("company")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  required
                  value={formValues.email}
                  onChange={handleChange("email")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mobile Number"
                  fullWidth
                  size="small"
                  required
                  value={formValues.mobileNo}
                  onChange={handleChange("mobileNo")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address Line 1"
                  fullWidth
                  size="small"
                  value={formValues.addressLine1}
                  onChange={handleChange("addressLine1")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address Line 2"
                  fullWidth
                  size="small"
                  value={formValues.addressLine2}
                  onChange={handleChange("addressLine2")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="City"
                  fullWidth
                  size="small"
                  value={formValues.city}
                  onChange={handleChange("city")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="State/Province"
                  fullWidth
                  size="small"
                  value={formValues.state}
                  onChange={handleChange("state")}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={formValues.country}
                    label="Country"
                    onChange={handleChange("country")}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.label}>
                        {country.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
            <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="create-customer-form" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

