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
import Stack from "@mui/material/Stack";

const settingTypes = ["LeadSource", "Stage", "Tag", "Priority", "Region"];

export default function AddSettingModal() {
  const [open, setOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + Add Setting
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Setting</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-setting-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Setting Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Setting Type</InputLabel>
                  <Select defaultValue="LeadSource" label="Setting Type">
                    {settingTypes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField label="Order" type="number" fullWidth size="small" defaultValue={1} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField label="Key" fullWidth size="small" />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField label="Value" fullWidth size="small" />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />}
                  label={isActive ? "Active" : "Inactive"}
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
            <Button type="submit" form="create-setting-form" variant="contained">
              Save
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

