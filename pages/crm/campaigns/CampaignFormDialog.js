import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const todayIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
};

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function CampaignFormDialog({ open, onClose, campaign, onSaved }) {
  const isEdit = !!campaign?.id;
  const [submitting, setSubmitting] = React.useState(false);
  const [typeOptions, setTypeOptions] = React.useState([]);
  const [form, setForm] = React.useState({
    name: "",
    campaignType: "",
    startDate: "",
    endDate: "",
    description: "",
    isActive: true,
  });

  React.useEffect(() => {
    if (!open) return;
    fetch(`${BASE_URL}/EnumLookup/CampaignTypes`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const list = d?.result
          ? Object.entries(d.result).map(([value, label]) => ({ value, label }))
          : [];
        setTypeOptions(list);
      })
      .catch(() => setTypeOptions([]));
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        name: campaign.name || "",
        campaignType: campaign.campaignType ? String(campaign.campaignType) : "",
        startDate: campaign.startDate ? String(campaign.startDate).slice(0, 10) : "",
        endDate: campaign.endDate ? String(campaign.endDate).slice(0, 10) : "",
        description: campaign.description || "",
        isActive: !!campaign.isActive,
      });
    } else {
      setForm({
        name: "",
        campaignType: "",
        startDate: todayIso(),
        endDate: "",
        description: "",
        isActive: true,
      });
    }
  }, [open, isEdit, campaign]);

  const handleChange = (field) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Campaign name is required.");
    if (!form.campaignType) return toast.error("Campaign type is required.");
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      return toast.error("End date must be on or after the start date.");
    }

    const payload = {
      Name: form.name.trim(),
      CampaignType: Number(form.campaignType),
      StartDate: form.startDate || null,
      EndDate: form.endDate || null,
      Description: form.description?.trim() || null,
      IsActive: !!form.isActive,
    };

    try {
      setSubmitting(true);
      const url = isEdit ? "/CRMCampaign/UpdateCampaign" : "/CRMCampaign/CreateCampaign";
      const body = isEdit ? { ...payload, Id: campaign.id } : payload;
      const res = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to save campaign");
      }
      toast.success(data?.message || (isEdit ? "Campaign updated." : "Campaign created."));
      onSaved?.();
    } catch (err) {
      toast.error(err.message || "Unable to save campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
      <DialogContent dividers>
        <Box component="form" id="campaign-form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Campaign Name"
                fullWidth size="small" required
                value={form.name}
                onChange={handleChange("name")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Type</InputLabel>
                <Select
                  value={form.campaignType}
                  label="Type"
                  onChange={handleChange("campaignType")}
                >
                  {typeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.isActive}
                    onChange={handleChange("isActive")}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date" label="Start Date"
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={handleChange("startDate")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="date" label="End Date"
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={handleChange("endDate")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description" fullWidth multiline minRows={3} size="small"
                value={form.description}
                onChange={handleChange("description")}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="campaign-form" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update" : "Save"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
