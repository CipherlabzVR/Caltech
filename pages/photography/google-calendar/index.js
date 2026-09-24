import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";

export default function GoogleCalendarSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    calendarId: "",
    hasServiceAccount: false,
  });
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/GoogleCalendar/GetSettings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.result) {
        setSettings({
          enabled: data.result.enabled,
          calendarId: data.result.calendarId || "",
          hasServiceAccount: data.result.hasServiceAccount,
        });
      }
    } catch (e) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const payload = {
        enabled: settings.enabled,
        calendarId: settings.calendarId,
        serviceAccountJson: serviceAccountJson || undefined,
      };
      const res = await fetch(`${BASE_URL}/GoogleCalendar/SaveSettings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.statusCode === "SUCCESS" || data.statusCode === 200) {
        toast.success("Settings saved successfully");
        setServiceAccountJson("");
        fetchSettings();
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/GoogleCalendar/TestConnection`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResult({
        success: data.statusCode === "SUCCESS" || data.statusCode === 200,
        message: data.message,
      });
    } catch (e) {
      setTestResult({ success: false, message: "Connection test failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result;
        JSON.parse(json); // Validate JSON
        setServiceAccountJson(json);
        toast.success("Service account file loaded");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>📅 Google Calendar Integration</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Google Calendar</li>
        </ul>
      </div>

      <Paper sx={{ p: 3 }} className="bg-black">
        <Typography variant="h6" gutterBottom>
          Google Calendar Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Connect your photography calendar to automatically create events when the first payment is approved.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Enable Google Calendar Integration</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When enabled, calendar events will be created automatically for new bookings
                  </Typography>
                </Box>
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Calendar ID
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g., primary or your-calendar@group.calendar.google.com"
              value={settings.calendarId}
              onChange={(e) => setSettings({ ...settings, calendarId: e.target.value })}
              helperText="Use 'primary' for the main calendar or enter a specific calendar ID"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Service Account Credentials
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {settings.hasServiceAccount ? (
                <Chip icon={<CheckCircleIcon />} label="Configured" color="success" size="small" />
              ) : (
                <Chip icon={<ErrorIcon />} label="Not configured" color="warning" size="small" />
              )}
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<CloudUploadIcon />}
              >
                {settings.hasServiceAccount ? "Replace" : "Upload"} JSON Key
                <input type="file" hidden accept=".json" onChange={handleFileUpload} />
              </Button>
            </Box>
            {serviceAccountJson && (
              <Alert severity="success" sx={{ mt: 1 }}>
                New service account file loaded. Click Save to apply.
              </Alert>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} alignItems="center">
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <CircularProgress size={20} /> : "Save Settings"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testing || !settings.hasServiceAccount}
              >
                {testing ? <CircularProgress size={20} /> : "Test Connection"}
              </Button>
            </Box>
          </Grid>

          {testResult && (
            <Grid item xs={12}>
              <Alert severity={testResult.success ? "success" : "error"}>
                {testResult.message}
              </Alert>
            </Grid>
          )}
        </Grid>

        <Box mt={4} p={2} bgcolor="info.main" borderRadius={1} sx={{ opacity: 0.9 }}>
          <Typography variant="subtitle2" color="info.contrastText" gutterBottom>
            Setup Instructions
          </Typography>
          <Typography variant="body2" color="info.contrastText" sx={{ mb: 1.5 }}>
            This integration uses a <strong>Service Account</strong> (not OAuth Client IDs).
            You can ignore the yellow &quot;Configure consent screen&quot; banner in Google Cloud for this setup.
          </Typography>
          <Typography variant="body2" color="info.contrastText" component="div">
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#fff", fontWeight: 600 }}
                >
                  Google Cloud Console
                </a>{" "}
                and select (or create) your project.
              </li>
              <li>
                Open <strong>APIs &amp; Services → Library</strong>, search for{" "}
                <strong>Google Calendar API</strong>, and click <strong>Enable</strong>.
              </li>
              <li>
                Go to <strong>APIs &amp; Services → Credentials</strong> →{" "}
                <strong>+ Create credentials</strong> → <strong>Service account</strong>.
                Name it (e.g. <em>banza-calendar</em>) and finish. Roles are optional.
              </li>
              <li>
                Open the new service account → <strong>Keys</strong> → <strong>Add key</strong> →{" "}
                <strong>Create new key</strong> → <strong>JSON</strong> → download the file.
              </li>
              <li>
                In{" "}
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#fff", fontWeight: 600 }}
                >
                  Google Calendar
                </a>
                , open your calendar → <strong>Settings and sharing</strong> →{" "}
                <strong>Share with specific people</strong>. Add the service account{" "}
                <code>client_email</code> from the JSON (ends with{" "}
                <code>@....iam.gserviceaccount.com</code>) and set permission to{" "}
                <strong>Make changes to events</strong>.
              </li>
              <li>
                Copy your <strong>Calendar ID</strong> from Google Calendar settings
                (<code>primary</code> for your main calendar, or the long{" "}
                <code>...@group.calendar.google.com</code> ID) and paste it in the field above.
              </li>
              <li>
                Click <strong>Upload JSON Key</strong>, select the downloaded file, turn{" "}
                <strong>Enable Google Calendar Integration</strong> On, then{" "}
                <strong>Save Settings</strong>.
              </li>
              <li>
                Click <strong>Test Connection</strong>. If it succeeds, new bookings can create
                calendar events automatically when the first payment is approved.
              </li>
            </ol>
          </Typography>
        </Box>
      </Paper>
    </>
  );
}
