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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const settingTypes = ["LeadSource", "Stage", "Tag", "Priority", "Region"];

export default function EditSettingModal({ setting }) {
  const [open, setOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState({
    type: "",
    key: "",
    value: "",
    order: 1,
    active: true,
  });

  React.useEffect(() => {
    if (open && setting) {
      setFormValues({
        type: setting.type || "LeadSource",
        key: setting.key || "",
        value: setting.value || "",
        order: setting.order || 1,
        active: setting.active ?? true,
      });
    }
  }, [setting, open]);

  const handleFieldChange = (field) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label="edit setting" onClick={() => setOpen(true)}>
          <EditOutlinedIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Setting</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id={`edit-setting-form-${setting?.id}`} onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Setting Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Setting Type</InputLabel>
                  <Select
                    value={formValues.type}
                    label="Setting Type"
                    onChange={handleFieldChange("type")}
                  >
                    {settingTypes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Order"
                  type="number"
                  fullWidth
                  size="small"
                  value={formValues.order}
                  onChange={handleFieldChange("order")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Key"
                  fullWidth
                  size="small"
                  value={formValues.key}
                  onChange={handleFieldChange("key")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Value"
                  fullWidth
                  size="small"
                  value={formValues.value}
                  onChange={handleFieldChange("value")}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.active}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          active: event.target.checked,
                        }))
                      }
                    />
                  }
                  label={formValues.active ? "Active" : "Inactive"}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
            <Button variant="outlined" color="inherit" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={`edit-setting-form-${setting?.id}`} variant="contained">
              Update
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

