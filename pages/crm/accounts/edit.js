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
import useAccountTypes from "../../../hooks/useAccountTypes";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { countries } from "../../../components/utils/countries";

const initialFormValues = {
  name: "",
  industry: "",
  website: "",
  email: "",
  mobileNo: "",
  firstName: "",
  lastName: "",
  jobTitle: "",
  department: "",
  addressLine1: "",
  addressLine2: "",
  addressLine3: "",
  postalCode: "",
  state: "",
  country: "",
  employeeCount: "",
  accountType: "",
  currencyId: "",
  notes: "",
  isActive: true,
};

export default function EditAccountModal({ account, onAccountUpdated }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { accountTypes } = useAccountTypes();
  const [formValues, setFormValues] = React.useState(initialFormValues);
  const [currencyList, setCurrencyList] = React.useState([]);

  const fetchCurrencyList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Currency/GetAllCurrency?SkipCount=0&MaxResultCount=1000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Currency List");
      }

      const data = await response.json();
      // Extract currencies from paginated response
      let currencies = [];
      if (data.result && data.result.items) {
        currencies = data.result.items;
      } else if (Array.isArray(data.result)) {
        currencies = data.result;
      }
      
      // Filter only active currencies
      setCurrencyList(currencies.filter(currency => currency.isActive !== false));
    } catch (error) {
      console.error("Error fetching Currency List:", error);
    }
  };

  React.useEffect(() => {
    if (open && account) {
      setFormValues({
        name: account.accountName || "",
        industry: account.industry || "",
        website: account.website || "",
        email: account.email || "",
        mobileNo: account.mobileNo || "",
        firstName: account.firstName || "",
        lastName: account.lastName || "",
        jobTitle: account.jobTitle || "",
        department: account.department || "",
        addressLine1: account.addressLine1 || "",
        addressLine2: account.addressLine2 || "",
        addressLine3: account.addressLine3 || "",
        postalCode: account.postalCode || "",
        state: account.state || "",
        country: account.country || "",
        employeeCount: account.employeeCount != null ? String(account.employeeCount) : "",
        accountType:
          account.accountType != null ? String(account.accountType) : "",
        currencyId: account.currencyId != null ? String(account.currencyId) : "",
        notes: account.notes || "",
        isActive:
          typeof account.isActive === "boolean" ? account.isActive : account.status === "Active",
      });
      fetchCurrencyList();
    } else if (!open) {
      setFormValues(initialFormValues);
    }
  }, [account, open]);

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const parseDecimal = (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!account?.id) {
      toast.error("Unable to determine account to update.");
      return;
    }

    if (!formValues.name.trim()) {
      toast.error("Account name is required.");
      return;
    }

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

    if (!formValues.accountType) {
      toast.error("Account type is required.");
      return;
    }

    // Construct verification link with actual account ID
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const verificationLink = `${baseUrl}/verified`;

    const payload = {
      Id: account?.id,
      AccountName: formValues.name.trim(),
      Industry: formValues.industry.trim() || null,
      Website: formValues.website.trim() || null,
      MobileNo: formValues.mobileNo.trim(),
      Email: formValues.email.trim() || null,
      FirstName: formValues.firstName.trim() || "",
      LastName: formValues.lastName.trim() || "",
      JobTitle: formValues.jobTitle.trim() || "",
      Department: formValues.department.trim() || "",
      AddressLine1: formValues.addressLine1.trim() || "",
      AddressLine2: formValues.addressLine2.trim() || "",
      AddressLine3: formValues.addressLine3.trim() || "",
      PostalCode: formValues.postalCode.trim() || "",
      State: formValues.state.trim() || "",
      Country: formValues.country.trim() || "",
      AnnualRevenue: 0,
      EmployeeCount: parseDecimal(formValues.employeeCount),
      AccountType: Number(formValues.accountType),
      CurrencyId: formValues.currencyId || null,
      Description: formValues.notes.trim() || "",
      IsActive: formValues.isActive,
      VerificationLink: verificationLink,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/CRMAccounts/UpdateCRMAccount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update account");
      }

      toast.success(data?.message || "Account updated successfully.");
      setOpen(false);
      if (typeof onAccountUpdated === "function") {
        onAccountUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to update account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label="edit account" onClick={() => setOpen(true)}>
          <EditOutlinedIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id={`edit-account-form-${account?.id}`} onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600}>
                Account Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Company Name"
                fullWidth
                size="small"
                required
                value={formValues.name}
                onChange={handleFieldChange("name")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Industry"
                fullWidth
                size="small"
                value={formValues.industry}
                onChange={handleFieldChange("industry")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Website"
                fullWidth
                size="small"
                value={formValues.website}
                onChange={handleFieldChange("website")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Company Size"
                fullWidth
                size="small"
                value={formValues.employeeCount}
                onChange={handleFieldChange("employeeCount")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Account Type</InputLabel>
                <Select value={formValues.accountType} label="Account Type" onChange={handleFieldChange("accountType")}>
                  {accountTypes.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Currency</InputLabel>
                <Select
                  value={formValues.currencyId}
                  label="Select Currency"
                  onChange={handleFieldChange("currencyId")}
                >
                  {currencyList.length === 0 ? (
                    <MenuItem disabled>
                      No Currencies Available
                    </MenuItem>
                  ) : (
                    currencyList.map((currency) => (
                      <MenuItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

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

            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600}>
                Address Information
              </Typography>
            </Grid>

            <Grid item xs={12} lg={6}>
              <TextField
                label="Address Line 1"
                fullWidth
                size="small"
                value={formValues.addressLine1}
                onChange={handleFieldChange("addressLine1")}
              />
            </Grid>

            <Grid item xs={12} lg={6}>
              <TextField
                label="Address Line 2"
                fullWidth
                size="small"
                value={formValues.addressLine2}
                onChange={handleFieldChange("addressLine2")}
              />
            </Grid>

            <Grid item xs={12} lg={6}>
              <TextField
                label="City"
                fullWidth
                size="small"
                value={formValues.addressLine3}
                onChange={handleFieldChange("addressLine3")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Postal Code"
                fullWidth
                size="small"
                value={formValues.postalCode}
                onChange={handleFieldChange("postalCode")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="State/Province"
                fullWidth
                size="small"
                value={formValues.state}
                onChange={handleFieldChange("state")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Country</InputLabel>
                <Select
                  value={formValues.country}
                  label="Country"
                  onChange={handleFieldChange("country")}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.label}>
                      {country.label}
                    </MenuItem>
                  ))}
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
                onChange={handleFieldChange("notes")}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={formValues.isActive} onChange={handleCheckboxChange("isActive")} />}
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
            <Button type="submit" form={`edit-account-form-${account?.id}`} variant="contained" disabled={submitting}>
              {submitting ? "Updating..." : "Update"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

