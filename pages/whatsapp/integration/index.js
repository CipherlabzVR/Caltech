import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/BorderColor";
import SyncIcon from "@mui/icons-material/Sync";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import AccountFormModal from "./AccountFormModal";
import {
  DELETE_ACCOUNT_CONTROLLER,
  getAccounts,
  getRemoteNumbers,
  setDefaultAccount,
  syncRemoteNumber,
  testConnection,
} from "@/Services/whatsRay";

const statusColor = (status) => {
  const value = (status || "").toLowerCase();
  if (value === "connected" || value === "verified") return "success";
  if (value === "pending") return "warning";
  return "default";
};

export default function WhatsAppIntegration() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const [activeTab, setActiveTab] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [editAccount, setEditAccount] = useState(null);
  const [prefill, setPrefill] = useState(null);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [remoteNumbers, setRemoteNumbers] = useState([]);
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [numbersError, setNumbersError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      if (data.statusCode === 200) {
        setAccounts(data.result || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load WhatsApp connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts.find((item) => item.isDefault)?.id ?? accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const loadRemoteNumbers = useCallback(async (accountId) => {
    if (!accountId) return;
    setNumbersLoading(true);
    setNumbersError(null);
    try {
      const data = await getRemoteNumbers(accountId);
      if (data.statusCode === 200) {
        setRemoteNumbers(data.result || []);
      } else {
        setRemoteNumbers([]);
        setNumbersError(data.message);
      }
    } catch (error) {
      setRemoteNumbers([]);
      setNumbersError(error.message || "Failed to reach WhatsRay.");
    } finally {
      setNumbersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 1 && selectedAccountId) {
      loadRemoteNumbers(selectedAccountId);
    }
  }, [activeTab, selectedAccountId, loadRemoteNumbers]);

  const runAccountAction = async (id, action, action_name) => {
    setBusyId(id);
    try {
      const data = await action(id);
      if (data.statusCode === 200) {
        toast.success(data.message);
      } else {
        // A whitelist rejection carries the IP WhatsRay saw, which is the actionable part.
        toast.error(data.message, { autoClose: 12000 });
      }
      await fetchAccounts();
    } catch (error) {
      toast.error(error.message || `Failed to ${action_name}.`);
    } finally {
      setBusyId(null);
    }
  };

  const handleAddFromRemote = (number) => {
    const source = accounts.find((item) => item.id === selectedAccountId);
    setPrefill({
      name: number.businessName || `WhatsApp ${number.phoneNumber}`,
      clientId: source?.clientId ?? "",
      phoneNumber: number.phoneNumber ?? "",
      baseUrl: source?.baseUrl ?? "",
      remoteAccountId: number.id || "",
      phoneNumberId: number.phoneNumberId ?? "",
      businessName: number.businessName ?? "",
    });
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const failedAccounts = accounts.filter((item) => item.lastTestSucceeded === false);

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>WhatsApp Integration</h1>
        <ul>
          <li>
            <Link href="/whatsapp/integration/">WhatsApp</Link>
          </li>
          <li>Integration</li>
        </ul>
      </div>

      <ToastContainer />

      {failedAccounts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Last connection test failed</AlertTitle>
          {failedAccounts.map((item) => (
            <Typography key={item.id} variant="body2">
              <strong>{item.name}:</strong> {item.lastTestMessage}
            </Typography>
          ))}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(event, value) => setActiveTab(value)} variant="fullWidth">
          <Tab label="Connections" />
          <Tab label="Connected Numbers" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Paper sx={{ p: 2 }} className="bg-black">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6">WhatsApp Accounts</Typography>
              <Typography variant="body2" color="text.secondary">
                Accounts connected through WhatsRay. Messages sent from this system use the
                default account unless another one is chosen.
              </Typography>
            </Box>
            {create && <AccountFormModal fetchItems={fetchAccounts} />}
          </Box>

          <TableContainer component={Paper}>
            <Table aria-label="whatsapp accounts" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>WhatsApp Number</TableCell>
                  <TableCell>Client ID</TableCell>
                  <TableCell>WhatsRay ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Test</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">
                        No WhatsApp accounts yet. Use &quot;Add WhatsApp Account&quot; to connect one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account, index) => (
                    <TableRow key={account.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {account.name}
                        {account.isDefault && (
                          <Chip label="Default" color="primary" size="small" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>{account.phoneNumber}</TableCell>
                      <TableCell>{account.clientId}</TableCell>
                      <TableCell>{account.remoteAccountId ?? "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={account.isActive ? account.connectionStatus || "Active" : "Inactive"}
                          color={account.isActive ? statusColor(account.connectionStatus) : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {account.lastTestedOn ? (
                          <Chip
                            label={account.lastTestSucceeded ? "Passed" : "Failed"}
                            color={account.lastTestSucceeded ? "success" : "error"}
                            size="small"
                          />
                        ) : (
                          "Not tested"
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Test connection" placement="top">
                          <span>
                            <IconButton
                              size="small"
                              disabled={busyId === account.id}
                              onClick={() =>
                                runAccountAction(account.id, testConnection, "test the connection")
                              }
                            >
                              <WifiTetheringIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {update && (
                          <Tooltip title="Sync number details from WhatsRay" placement="top">
                            <span>
                              <IconButton
                                size="small"
                                disabled={busyId === account.id}
                                onClick={() =>
                                  runAccountAction(account.id, syncRemoteNumber, "sync the number")
                                }
                              >
                                <SyncIcon fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        {update && (
                          <Tooltip
                            title={account.isDefault ? "Default account" : "Set as default"}
                            placement="top"
                          >
                            <span>
                              <IconButton
                                size="small"
                                disabled={account.isDefault || busyId === account.id}
                                onClick={() =>
                                  runAccountAction(account.id, setDefaultAccount, "set the default")
                                }
                              >
                                {account.isDefault ? (
                                  <StarIcon fontSize="inherit" color="primary" />
                                ) : (
                                  <StarBorderIcon fontSize="inherit" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}

                        {update && (
                          <Tooltip title="Edit" placement="top">
                            <IconButton size="small" onClick={() => setEditAccount(account)}>
                              <EditIcon fontSize="inherit" color="primary" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {remove && (
                          <DeleteConfirmationById
                            id={account.id}
                            controller={DELETE_ACCOUNT_CONTROLLER}
                            fetchItems={fetchAccounts}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }} className="bg-black">
          <Box mb={2}>
            <Typography variant="h6">Numbers Connected on WhatsRay</Typography>
            <Typography variant="body2" color="text.secondary">
              Live from WhatsRay for the selected credentials. Add any number that is not yet in
              this system.
            </Typography>
          </Box>

          <Grid container spacing={1} alignItems="center" mb={2}>
            <Grid item xs={12} lg={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Credentials"
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
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<SyncIcon />}
                disabled={!selectedAccountId || numbersLoading}
                onClick={() => loadRemoteNumbers(selectedAccountId)}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>

          {numbersError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {numbersError}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table aria-label="whatsray numbers" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>WhatsRay ID</TableCell>
                  <TableCell>Meta Phone Number ID</TableCell>
                  <TableCell>Connection</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {numbersLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : remoteNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No numbers returned by WhatsRay.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  remoteNumbers.map((number, index) => (
                    <TableRow key={`${number.id}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{number.businessName || "-"}</TableCell>
                      <TableCell>{number.phoneNumber || "-"}</TableCell>
                      <TableCell>{number.id || "-"}</TableCell>
                      <TableCell>{number.phoneNumberId || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={number.connectionStatus || "unknown"}
                          color={statusColor(number.connectionStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={number.verificationStatus || "unknown"}
                          color={statusColor(number.verificationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {number.isLinked ? (
                          <Chip label="In system" color="success" size="small" />
                        ) : (
                          create && (
                            <Button size="small" onClick={() => handleAddFromRemote(number)}>
                              Add to system
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {editAccount && (
        <AccountFormModal
          account={editAccount}
          open={Boolean(editAccount)}
          onClose={() => setEditAccount(null)}
          fetchItems={fetchAccounts}
        />
      )}

      {prefill && (
        <AccountFormModal
          prefill={prefill}
          open={Boolean(prefill)}
          onClose={() => setPrefill(null)}
          fetchItems={fetchAccounts}
        />
      )}
    </>
  );
}
