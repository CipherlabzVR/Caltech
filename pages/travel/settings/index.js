import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import styles from "@/styles/PageTitle.module.css";
import { masterCategoryContainedButtonSx } from "@/styles/masterCategoryButtons";
import BASE_URL from "Base/api";

const SETTING_NAME = "TravelConvenienceFeePercent";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

export default function TravelSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState(null); // full AppSetting row from API
  const [feeValue, setFeeValue] = useState("");

  const loadSetting = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/AppSetting/GetAllAppSettings`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.result ?? [];
      const row = list.find((s) => s.settingName === SETTING_NAME);
      if (row) {
        setSetting(row);
        setFeeValue(row.value ?? "0");
      } else {
        toast.error(
          `Setting "${SETTING_NAME}" not found. Restart the API so the seeder can create it.`
        );
      }
    } catch (err) {
      toast.error(err?.message || "Failed to load travel settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  const handleSave = async () => {
    if (!setting) return;
    const trimmed = String(feeValue).trim();
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      toast.error("Convenience fee must be a number between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...setting,
        SettingName: setting.settingName,
        Value: String(num),
        IsEnabled: setting.isEnabled ?? true,
      };
      const res = await fetch(`${BASE_URL}/AppSetting/UpdateAppSetting`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data?.statusCode === 200 || data?.statusCode === 1) {
        toast.success(data?.message || "Convenience fee updated.");
        await loadSetting();
      } else {
        toast.error(data?.message || "Update failed.");
      }
    } catch (err) {
      toast.error(err?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Travel Settings</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Travel</li>
          <li>Settings</li>
        </ul>
      </div>

      <Grid item xs={12}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>
              Custom Plan Pricing
            </Typography>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadSetting}
              disabled={loading || saving}
            >
              Reload
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" alignItems="center" gap={1} py={2}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading…</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Convenience fee
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={feeValue}
                  onChange={(e) => setFeeValue(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 100, step: 0.01 },
                  }}
                  helperText="Percentage added on top of the planner subtotal (hotels + entry fees + vehicle) on the Luxora website. Set to 0 to disable."
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={masterCategoryContainedButtonSx}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Grid>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
