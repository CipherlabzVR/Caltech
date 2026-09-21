import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { getSendingAccounts, getTemplates } from "@/Services/whatsRay";

const STATUS_OPTIONS = ["approved", "pending", "rejected", "disabled", "all"];

const statusColor = (status) => {
  const value = (status || "").toLowerCase();
  if (value === "approved") return "success";
  if (value === "pending") return "warning";
  if (value === "rejected" || value === "disabled") return "error";
  return "default";
};

export default function WhatsAppTemplates() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const parsedCategory = sessionCategory ? parseInt(sessionCategory, 10) : NaN;
  const cId = Number.isFinite(parsedCategory) ? parsedCategory : 251;
  const { navigate } = IsPermissionEnabled(cId);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [status, setStatus] = useState("approved");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await getSendingAccounts();
        if (data.statusCode === 200) {
          const list = data.result || [];
          setAccounts(list);
          if (list.length > 0) {
            setSelectedAccountId(list[0].id);
          }
        } else {
          toast.error(data.message);
        }
      } catch (loadError) {
        toast.error(loadError.message || "Failed to load WhatsApp connections.");
      }
    };

    loadAccounts();
  }, []);

  const loadTemplates = useCallback(async (accountId, templateStatus) => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTemplates(accountId, templateStatus);
      if (data.statusCode === 200) {
        setTemplates(data.result || []);
      } else {
        setTemplates([]);
        setError(data.message);
      }
    } catch (loadError) {
      setTemplates([]);
      setError(loadError.message || "Failed to reach WhatsRay.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadTemplates(selectedAccountId, status);
    }
  }, [selectedAccountId, status, loadTemplates]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>WhatsApp Templates</h1>
        <ul>
          <li>
            <Link href="/whatsapp/integration/">WhatsApp</Link>
          </li>
          <li>Templates</li>
        </ul>
      </div>

      <ToastContainer />

      <Paper sx={{ p: 2 }} className="bg-black">
        <Box mb={2}>
          <Typography variant="h6">Message Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Templates for the WhatsApp number mapped to your user. Only approved templates can
            be sent.
          </Typography>
        </Box>

        <Grid container spacing={1} alignItems="center" mb={2}>
          <Grid item xs={12} lg={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="WhatsApp Account"
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
            >
              {accounts.length === 0 ? (
                <MenuItem value="">No connections available</MenuItem>
              ) : (
                accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.phoneNumber})
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
          <Grid item xs={12} lg={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              disabled={!selectedAccountId || loading}
              onClick={() => loadTemplates(selectedAccountId, status)}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table aria-label="whatsapp templates" className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Template ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Body</TableCell>
                <TableCell>Variables</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="error">No templates found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template, index) => (
                  <TableRow key={`${template.id}-${index}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{template.id || "-"}</TableCell>
                    <TableCell>{template.name || "-"}</TableCell>
                    <TableCell>{template.language || "-"}</TableCell>
                    <TableCell>{template.category || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        label={template.status || "unknown"}
                        color={statusColor(template.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                      {template.bodyText || "-"}
                    </TableCell>
                    <TableCell>
                      {[...(template.headerVariables || []), ...(template.bodyVariables || [])]
                        .map((variable) => (
                          <Chip key={variable} label={variable} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      {(template.headerVariables || []).length === 0 &&
                        (template.bodyVariables || []).length === 0 &&
                        "None"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
