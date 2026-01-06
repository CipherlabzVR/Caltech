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
import Slider from "@mui/material/Slider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import FormHelperText from "@mui/material/FormHelperText";
import Chip from "@mui/material/Chip";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import useCRMAccounts from "hooks/useCRMAccounts";
import useContactsByAccount from "hooks/useContactsByAccount";

const getAccountValue = (account) => String(account.id);

export default function CreateLead({ onLeadCreated }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [leadScore, setLeadScore] = React.useState(50);
  const [statusOptions, setStatusOptions] = React.useState([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(false);
  const [statusError, setStatusError] = React.useState(null);
  const [sourceOptions, setSourceOptions] = React.useState([]);
  const [loadingSources, setLoadingSources] = React.useState(false);
  const [sourceError, setSourceError] = React.useState(null);
  const { accounts, isLoading: accountsLoading, error: accountsError } = useCRMAccounts();
  const [formValues, setFormValues] = React.useState({
    leadName: "",
    company: "",
    email: "",
    mobileNo: "",
    leadSource: "",
    leadStatus: "",
    description: "",
    accountId: "",
    contactId: ""
  });
  const { contacts: accountContacts, isLoading: contactsLoading, error: contactsError } = useContactsByAccount(formValues.accountId);

  const fetchStatuses = React.useCallback(async () => {
    try {
      setLoadingStatuses(true);
      setStatusError(null);

      const response = await fetch(`${BASE_URL}/EnumLookup/LeadStatuses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load lead statuses");
      }

      const data = await response.json();
      const statuses = data?.result
        ? Object.entries(data.result).map(([value, label]) => ({
          value,
          label,
        }))
        : [];

      setStatusOptions(statuses);
    } catch (error) {
      setStatusError(error.message || "Unable to load lead statuses");
      setStatusOptions([]);
    } finally {
      setLoadingStatuses(false);
    }
  }, []);

  const fetchSources = React.useCallback(async () => {
    try {
      setLoadingSources(true);
      setSourceError(null);

      const response = await fetch(`${BASE_URL}/EnumLookup/LeadSources`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load lead sources");
      }

      const data = await response.json();
      const sources = data?.result
        ? Object.entries(data.result).map(([value, label]) => ({
          value,
          label,
        }))
        : [];

      setSourceOptions(sources);
    } catch (error) {
      setSourceError(error.message || "Unable to load lead sources");
      setSourceOptions([]);
    } finally {
      setLoadingSources(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      if (statusOptions.length === 0 && !loadingStatuses && !statusError) {
        fetchStatuses();
      }
      if (sourceOptions.length === 0 && !loadingSources && !sourceError) {
        fetchSources();
      }
    }
  }, [
    open,
    fetchStatuses,
    fetchSources,
    statusOptions.length,
    loadingStatuses,
    statusError,
    sourceOptions.length,
    loadingSources,
    sourceError,
  ]);

  const resetForm = () => {
    setFormValues({
      leadName: "",
      company: "",
      email: "",
      mobileNo: "",
      leadSource: "",
      leadStatus: "",
      description: "",
      accountId: "",
      contactId: ""
    });
    setLeadScore(50);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleChange = (field) => (event) => {
    setFormValues((prev) => {
      const newValues = {
        ...prev,
        [field]: event.target.value,
      };
      if (field === "accountId") {
        const selectedAccount = accounts.find(acc => getAccountValue(acc) === event.target.value);
        if (selectedAccount) {
          newValues.contactId = selectedAccount.contactId ? String(selectedAccount.contactId) : "";
          const fullName = [selectedAccount.firstName, selectedAccount.lastName].filter(Boolean).join(" ");
          newValues.leadName = fullName;
          newValues.company = selectedAccount.accountName || "";
          newValues.email = selectedAccount.email || "";
          newValues.mobileNo = selectedAccount.mobileNo || "";
        } else {
          newValues.contactId = "";
          newValues.leadName = "";
          newValues.company = "";
          newValues.email = "";
          newValues.mobileNo = "";
        }
      }
      return newValues;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { leadName, email, mobileNo, leadSource, leadStatus } = formValues;

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!mobileNo.trim()) {
      toast.error("Mobile number is required.");
      return;
    }
    if (!leadSource) {
      toast.error("Lead source is required.");
      return;
    }
    if (!leadStatus) {
      toast.error("Lead status is required.");
      return;
    }

    const selectedAccount = accounts.find(acc => getAccountValue(acc) === formValues.accountId);
    const contactId = selectedAccount?.contactId || null;
    const fullName = selectedAccount ? [selectedAccount.firstName, selectedAccount.lastName].filter(Boolean).join(" ") : formValues.leadName.trim();

    const payload = {
      LeadName: fullName,
      Company: formValues.company.trim(),
      Email: formValues.email.trim(),
      MobileNo: formValues.mobileNo.trim(),
      LeadSource: Number(formValues.leadSource),
      LeadStatus: Number(formValues.leadStatus),
      LeadScore: Number(leadScore) || 0,
      Description: formValues.description?.trim() || "",
      AccountId: formValues.accountId || null,
      ContactId: contactId,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Leads/CreateLead`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create lead");
      }

      const data = await response.json();
      toast.success(data?.message || "Lead created successfully.");
      setOpen(false);
      resetForm();
      if (typeof onLeadCreated === "function") {
        onLeadCreated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + Add Lead
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Lead</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-lead-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Lead Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={formValues.accountId}
                    label="Account"
                    onChange={handleChange("accountId")}
                    disabled={accountsLoading || accounts.length === 0}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.id} value={getAccountValue(account)}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <Typography variant="body2">
                            {account.accountName || account.accountId || getAccountValue(account)}
                          </Typography>
                          {account.emailVerified === true || account.isEmailVerified === true ? (
                            <Chip
                              label="Verified"
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                ml: 1,
                              }}
                            />
                          ) : null}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {accountsError && <FormHelperText error>{accountsError}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Company Name"
                  fullWidth
                  size="small"
                  disabled
                  value={formValues.company}
                  onChange={handleChange("company")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  required
                  disabled
                  value={formValues.email}
                  onChange={handleChange("email")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  size="small"
                  required
                  disabled
                  value={formValues.mobileNo}
                  onChange={handleChange("mobileNo")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lead Source</InputLabel>
                  <Select
                    value={formValues.leadSource}
                    label="Lead Source"
                    disabled={loadingSources || sourceOptions.length === 0}
                    onChange={handleChange("leadSource")}
                  >
                    {sourceOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formValues.leadStatus}
                    label="Status"
                    disabled={loadingStatuses || statusOptions.length === 0}
                    onChange={handleChange("leadStatus")}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                {loadingSources && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading lead sources...
                    </Typography>
                  </Box>
                )}
                {sourceError && (
                  <Typography variant="body2" color="error" mb={2}>
                    {sourceError}
                  </Typography>
                )}
                {loadingStatuses && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Loading lead statuses...
                    </Typography>
                  </Box>
                )}
                {statusError && (
                  <Typography variant="body2" color="error" mb={2}>
                    {statusError}
                  </Typography>
                )}
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Lead Score
                </Typography>
                <Box px={{ xs: 0, md: 1 }}>
                  <Slider
                    value={leadScore}
                    onChange={(_, value) => setLeadScore(value)}
                    valueLabelDisplay="on"
                    step={5}
                    marks
                    min={0}
                    max={100}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  minRows={4}
                  size="small"
                  placeholder="Add additional notes..."
                  value={formValues.description}
                  onChange={handleChange("description")}
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
            <Button type="submit" form="create-lead-form" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

