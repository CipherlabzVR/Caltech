import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

const Section = ({ title, children }) => (
  <Box>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "#64748B",
        mb: 1.25,
      }}
    >
      {title}
    </Typography>
    <Stack spacing={1.75}>{children}</Stack>
  </Box>
);

export default function BoardSettingsDrawer({
  open,
  onClose,
  settings,
  onChange,
  statuses,
  eventTypes,
  teams,
}) {
  const set = (patch) => onChange({ ...settings, ...patch });

  const visibleIds = Array.isArray(settings.visibleStatusIds)
    ? settings.visibleStatusIds.map(Number)
    : (statuses || []).map((s) => Number(s.id ?? s.Id));

  const toggleStatus = (id) => {
    const nid = Number(id);
    const next = visibleIds.includes(nid)
      ? visibleIds.filter((x) => Number(x) !== nid)
      : [...visibleIds, nid];
    set({ visibleStatusIds: next });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          bgcolor: "#F8FAFC",
        },
      }}
    >
      <Box
        sx={{
          p: 2.5,
          bgcolor: "#fff",
          borderBottom: "1px solid #E2E8F0",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "#EEF2FF",
              color: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TuneIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Display settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Saved on this device for TV / wall use
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={3}>
          <Section title="Appearance">
            <FormControl fullWidth size="small">
              <InputLabel>Text scale</InputLabel>
              <Select
                label="Text scale"
                value={settings.scale}
                onChange={(e) => set({ scale: e.target.value })}
                sx={{ bgcolor: "#fff", borderRadius: 2 }}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="large">Large (recommended)</MenuItem>
                <MenuItem value="xl">XL (far viewing)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.displayMode}
                  onChange={(e) => set({ displayMode: e.target.checked })}
                />
              }
              label="Display mode (compact chrome)"
              sx={{ m: 0, bgcolor: "#fff", px: 1.5, py: 0.75, borderRadius: 2, border: "1px solid #E2E8F0" }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!settings.hideEmpty}
                  onChange={(e) => set({ hideEmpty: e.target.checked })}
                />
              }
              label="Hide empty status columns"
              sx={{ m: 0, bgcolor: "#fff", px: 1.5, py: 0.75, borderRadius: 2, border: "1px solid #E2E8F0" }}
            />
          </Section>

          <Divider />

          <Section title="Refresh & window">
            <FormControl fullWidth size="small">
              <InputLabel>Auto-refresh</InputLabel>
              <Select
                label="Auto-refresh"
                value={settings.refreshSec}
                onChange={(e) => set({ refreshSec: Number(e.target.value) })}
                sx={{ bgcolor: "#fff", borderRadius: 2 }}
              >
                <MenuItem value={0}>Off</MenuItem>
                <MenuItem value={15}>Every 15 seconds</MenuItem>
                <MenuItem value={30}>Every 30 seconds</MenuItem>
                <MenuItem value={60}>Every 60 seconds</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Date window</InputLabel>
              <Select
                label="Date window"
                value={settings.dateWindow}
                onChange={(e) => set({ dateWindow: Number(e.target.value) })}
                sx={{ bgcolor: "#fff", borderRadius: 2 }}
              >
                <MenuItem value={-1}>All reservations</MenuItem>
                <MenuItem value={0}>All upcoming</MenuItem>
                <MenuItem value={30}>Today + 30 days</MenuItem>
                <MenuItem value={60}>Today + 60 days</MenuItem>
                <MenuItem value={90}>Today + 90 days</MenuItem>
              </Select>
            </FormControl>
          </Section>

          <Divider />

          <Section title="Filters">
            <TextField
              size="small"
              label="Search"
              value={settings.search || ""}
              onChange={(e) => set({ search: e.target.value })}
              placeholder="Card no, name, location…"
              sx={{ bgcolor: "#fff", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Event type</InputLabel>
              <Select
                label="Event type"
                value={settings.eventTypeId || ""}
                onChange={(e) => set({ eventTypeId: e.target.value })}
                sx={{ bgcolor: "#fff", borderRadius: 2 }}
              >
                <MenuItem value="">All types</MenuItem>
                {(eventTypes || []).map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Team</InputLabel>
              <Select
                label="Team"
                value={settings.teamId || ""}
                onChange={(e) => set({ teamId: e.target.value })}
                sx={{ bgcolor: "#fff", borderRadius: 2 }}
              >
                <MenuItem value="">All teams</MenuItem>
                {(teams || []).map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Section>

          <Divider />

          <Section title="Visible statuses">
            <Box
              sx={{
                bgcolor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 2,
                p: 1,
              }}
            >
              <Stack spacing={0.15}>
                {(statuses || []).map((s) => {
                  const id = s.id ?? s.Id;
                  const name = s.name ?? s.Name;
                  const color = s.colorCode || s.ColorCode || "#6366F1";
                  return (
                    <FormControlLabel
                      key={id}
                      control={
                        <Checkbox
                          checked={visibleIds.includes(id)}
                          onChange={() => toggleStatus(id)}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: color,
                            }}
                          />
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{name}</Typography>
                        </Stack>
                      }
                      sx={{
                        m: 0,
                        px: 0.75,
                        py: 0.35,
                        borderRadius: 1.5,
                        "&:hover": { bgcolor: "#F8FAFC" },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Section>

          <Button
            variant="contained"
            fullWidth
            onClick={onClose}
            sx={{
              mt: 0.5,
              py: 1.25,
              borderRadius: 2,
              fontWeight: 800,
              bgcolor: "#0F172A",
              "&:hover": { bgcolor: "#1E293B" },
            }}
          >
            Apply & close
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
