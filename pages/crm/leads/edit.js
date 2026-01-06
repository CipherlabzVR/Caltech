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
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import FormHelperText from "@mui/material/FormHelperText";
import Chip from "@mui/material/Chip";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import useCRMAccounts from "hooks/useCRMAccounts";
import useContactsByAccount from "hooks/useContactsByAccount";

const getAccountValue = (account) => String(account.id);

export default function EditLeadModal({ lead, onLeadUpdated }) {
  const [open, setOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    leadSource: "",
    status: "",
    leadScore: 0,
    notes: "",
    accountId: "",
    contactId: ""
  });
  const [statusOptions, setStatusOptions] = React.useState([]);
  const [loadingStatuses, setLoadingStatuses] = React.useState(false);
  const [statusError, setStatusError] = React.useState(null);
  const [sourceOptions, setSourceOptions] = React.useState([]);
  const [loadingSources, setLoadingSources] = React.useState(false);
  const [sourceError, setSourceError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [pendingStatusChange, setPendingStatusChange] = React.useState(null);
  const { accounts, isLoading: accountsLoading, error: accountsError } = useCRMAccounts();
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

  const isStatusLocked = React.useMemo(() => {
    if (!lead) return false;
    const normalizedStatus =
      lead.status !== undefined && lead.status !== null
        ? lead.status
        : lead.leadStatus !== undefined && lead.leadStatus !== null
        ? lead.leadStatus
        : null;
    return normalizedStatus === 8 || normalizedStatus === "8";
  }, [lead]);

  React.useEffect(() => {
    if (open && lead) {
      const normalizedStatus =
        lead.status !== undefined && lead.status !== null
          ? lead.status
          : lead.leadStatus !== undefined && lead.leadStatus !== null
          ? lead.leadStatus
          : "";

      setFormValues({
        fullName: lead.fullName || lead.leadName || "",
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.phone || lead.mobileNo || "",
        leadSource: lead.leadSource !== undefined && lead.leadSource !== null ? String(lead.leadSource) : "",
        status: normalizedStatus !== "" ? String(normalizedStatus) : "",
        leadScore: typeof lead.leadScore === "number" ? lead.leadScore : 50,
        notes: lead.notes || lead.description || "",
        accountId: lead.accountId ? String(lead.accountId) : "",
        contactId: lead.contactId ? String(lead.contactId) : ""
      });
    }
  }, [lead, open]);

  const handleChange = (field) => (event) => {
    const newValue = event.target.value;
    
    // Check if status is being changed to 8
    if (field === "status" && (newValue === "8" || newValue === 8)) {
      // Store the pending status change and show confirmation dialog
      setPendingStatusChange(newValue);
      setConfirmDialogOpen(true);
      return;
    }
    
    setFormValues((prev) => {
      const newValues = {
        ...prev,
        [field]: newValue,
      };
      if (field === "accountId") {
        const selectedAccount = accounts.find(acc => getAccountValue(acc) === newValue);
        if (selectedAccount) {
          newValues.contactId = selectedAccount.contactId ? String(selectedAccount.contactId) : "";
          const fullName = [selectedAccount.firstName, selectedAccount.lastName].filter(Boolean).join(" ");
          newValues.fullName = fullName;
          newValues.company = selectedAccount.accountName || "";
          newValues.email = selectedAccount.email || "";
          newValues.phone = selectedAccount.mobileNo || "";
        } else {
          newValues.contactId = "";
          newValues.fullName = "";
          newValues.company = "";
          newValues.email = "";
          newValues.phone = "";
        }
      }
      return newValues;
    });
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange !== null) {
      setFormValues((prev) => ({
        ...prev,
        status: String(pendingStatusChange),
      }));
      setPendingStatusChange(null);
    }
    setConfirmDialogOpen(false);
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
    setConfirmDialogOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formValues.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    if (!formValues.phone.trim()) {
      toast.error("Mobile number is required.");
      return;
    }
    if (!formValues.leadSource) {
      toast.error("Lead source is required.");
      return;
    }
    if (!formValues.status) {
      toast.error("Lead status is required.");
      return;
    }
    if (!lead?.id) {
      toast.error("Missing lead identifier.");
      return;
    }

    const selectedAccount = accounts.find(acc => getAccountValue(acc) === formValues.accountId);
    const contactId = selectedAccount?.contactId || null;
    const fullName = selectedAccount ? [selectedAccount.firstName, selectedAccount.lastName].filter(Boolean).join(" ") : formValues.fullName.trim();

    const payload = {
      Id: lead.id,
      LeadName: fullName,
      Company: formValues.company.trim(),
      Email: formValues.email.trim(),
      MobileNo: formValues.phone.trim(),
      LeadSource: Number(formValues.leadSource),
      LeadStatus: Number(formValues.status),
      LeadScore: Number(formValues.leadScore) || 0,
      Description: formValues.notes?.trim() || "",
      AccountId: formValues.accountId || null,
      ContactId: contactId
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Leads/UpdateLead`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update lead");
      }

      const data = await response.json();
      toast.success(data?.message || "Lead updated successfully.");
      setOpen(false);
      if (typeof onLeadUpdated === "function") {
        onLeadUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to update lead");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label="edit lead" onClick={() => setOpen(true)}>
          <EditOutlinedIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Lead</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id={`edit-lead-form-${lead?.id}`} onSubmit={handleSubmit} noValidate>
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
                  disabled
                  value={formValues.phone}
                  onChange={handleChange("phone")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lead Source</InputLabel>
                  <Select
                    value={formValues.leadSource}
                    label="Lead Source"
                    onChange={handleChange("leadSource")}
                    disabled={loadingSources || sourceOptions.length === 0}
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
                    value={formValues.status}
                    label="Status"
                    onChange={handleChange("status")}
                    disabled={loadingStatuses || statusOptions.length === 0 || isStatusLocked}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {isStatusLocked && (
                    <FormHelperText>
                      Status cannot be changed when status is 8
                    </FormHelperText>
                  )}
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
                    value={formValues.leadScore}
                    onChange={(_, value) =>
                      setFormValues((prev) => ({
                        ...prev,
                        leadScore: Array.isArray(value) ? value[0] : value,
                      }))
                    }
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
              form={`edit-lead-form-${lead?.id}`}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDialogOpen} onClose={handleCancelStatusChange} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Status Update</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Cannot update again. Are you sure you want to update the status to 8? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStatusChange} color="inherit">
            No
          </Button>
          <Button onClick={handleConfirmStatusChange} color="primary" variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}





