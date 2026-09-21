import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Grid,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import {
  getAllAgents,
  getWhatsAppAccounts,
  saveAgent,
  getMappableUsers,
  getAgentTypes,
  saveAgentType,
  deleteAgentType,
  isApiSuccess,
} from "@/Services/photographyAgentService";

const CATEGORY_ID = 346;

const AGENT_TYPE_ICONS = {
  1: "👋",
  2: "💰",
  3: "📸",
};

const AGENT_TYPE_COLORS = {
  1: "#4caf50",
  2: "#2196f3",
  3: "#9c27b0",
};

const colorByIndex = (i) => ["#4caf50", "#2196f3", "#9c27b0", "#ff9800", "#00bcd4", "#e91e63"][i % 6];
const iconByIndex = (i) => ["👋", "💰", "📸", "🧩", "⭐", "🛠️"][i % 6];

export default function PhotographyAgents() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update } = IsPermissionEnabled(cId ?? CATEGORY_ID);

  const [agents, setAgents] = useState([]);
  const [agentTypes, setAgentTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [whatsAppAccounts, setWhatsAppAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeForm, setTypeForm] = useState({
    id: null,
    name: "",
    description: "",
    sortOrder: 10,
    isFirstStage: false,
    canManageTasks: false,
    isActive: true,
  });
  const [savingType, setSavingType] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentData, userData, whatsAppData, typeData] = await Promise.all([
        getAllAgents(),
        getMappableUsers(),
        getWhatsAppAccounts(),
        getAgentTypes(),
      ]);

      if (isApiSuccess(agentData)) {
        setAgents(agentData.result || []);
      } else {
        toast.error(agentData.message || "Failed to load agents");
      }

      if (isApiSuccess(userData)) {
        setUsers(userData.result || []);
      }

      if (isApiSuccess(whatsAppData)) {
        setWhatsAppAccounts(whatsAppData.result || []);
      }

      if (isApiSuccess(typeData)) {
        setAgentTypes(typeData.result || []);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (agent) => {
    setEditingId(agent.agentType);
    setFormData({
      id: agent.id,
      agentType: agent.agentType,
      whatsRayAccountId: agent.whatsRayAccountId || "",
      email: agent.email || "",
      userIds: agent.assignedUsers?.map((u) => u.userId) || [],
      isActive: agent.isActive,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.userIds || formData.userIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        whatsRayAccountId: formData.whatsRayAccountId ? Number(formData.whatsRayAccountId) : null,
        isActive: true,
      };

      const result = await saveAgent(payload);
      if (isApiSuccess(result)) {
        toast.success(result.message || "Agent saved successfully");
        setEditingId(null);
        setFormData({});
        fetchData();
      } else {
        toast.error(result.message || "Failed to save agent");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openNewType = () => {
    const maxOrder = agentTypes.reduce((m, t) => Math.max(m, t.sortOrder || 0), 0);
    setTypeForm({
      id: null,
      name: "",
      description: "",
      sortOrder: maxOrder + 1,
      isFirstStage: false,
      canManageTasks: false,
      isActive: true,
    });
    setTypeDialogOpen(true);
  };

  const openEditType = (t) => {
    setTypeForm({
      id: t.id,
      name: t.name || "",
      description: t.description || "",
      sortOrder: t.sortOrder ?? 1,
      isFirstStage: !!t.isFirstStage,
      canManageTasks: !!t.canManageTasks,
      isActive: t.isActive !== false,
    });
    setTypeDialogOpen(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingType(true);
    try {
      const result = await saveAgentType({
        Id: typeForm.id,
        Name: typeForm.name.trim(),
        Description: typeForm.description || null,
        SortOrder: Number(typeForm.sortOrder) || 0,
        IsFirstStage: !!typeForm.isFirstStage,
        CanManageTasks: !!typeForm.canManageTasks,
        IsActive: !!typeForm.isActive,
      });
      if (isApiSuccess(result)) {
        toast.success(result.message || "Agent type saved");
        setTypeDialogOpen(false);
        fetchData();
      } else {
        toast.error(result.message || "Failed to save agent type");
      }
    } catch (e) {
      toast.error(e.message || "Failed to save agent type");
    } finally {
      setSavingType(false);
    }
  };

  const handleDeleteType = async (t) => {
    if (t.isSystem) {
      toast.error("Default agent types cannot be deleted");
      return;
    }
    if (!window.confirm(`Delete agent type "${t.name}"?`)) return;
    try {
      const result = await deleteAgentType(t.id);
      if (isApiSuccess(result)) {
        toast.success("Agent type deleted");
        fetchData();
      } else {
        toast.error(result.message || "Failed to delete");
      }
    } catch (e) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const getSelectedUsers = () => {
    if (!formData.userIds || formData.userIds.length === 0) return [];
    return users.filter((u) => formData.userIds.includes(u.id));
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>🤝 Photography Agents</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Agents</li>
        </ul>
      </div>

      <Alert severity="info" sx={{ mb: 2 }}>
        Default stages: Customer Coordinator, Payment Handler, After Wedding Manager. You can add more agent
        types with sort order — handover follows that order. Assign statuses to agent types on the Statuses
        page; each agent only sees their statuses when changing reservation status.
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }} className="bg-black">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight={700}>
            Agent Types (sort order = handover order)
          </Typography>
          {(create || update) && (
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openNewType}>
              Add Agent Type
            </Button>
          )}
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...agentTypes]
              .sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id))
              .map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.sortOrder}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{t.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {t.isSystem && <Chip size="small" label="Default" />}
                      {t.isFirstStage && <Chip size="small" color="info" label="First stage" />}
                      {t.canManageTasks && <Chip size="small" color="secondary" label="Tasks" />}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {(create || update) && (
                      <IconButton size="small" onClick={() => openEditType(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    {(create || update) && !t.isSystem && (
                      <IconButton size="small" color="error" onClick={() => handleDeleteType(t)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {agentTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">
                    No agent types loaded yet.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Grid container spacing={3}>
          {agents.map((agent, idx) => {
            const isEditing = editingId === agent.agentType;
            const icon = AGENT_TYPE_ICONS[agent.agentType] || iconByIndex(idx);
            const color = AGENT_TYPE_COLORS[agent.agentType] || colorByIndex(idx);

            return (
              <Grid item xs={12} md={4} key={agent.agentType}>
                <Card
                  sx={{
                    height: "100%",
                    borderTop: `4px solid ${color}`,
                  }}
                  className="bg-black"
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h3" component="span">
                          {icon}
                        </Typography>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {agent.agentTypeName}
                          </Typography>
                          <Chip
                            size="small"
                            label={agent.id > 0 && agent.isActive ? "Configured" : "Not Configured"}
                            color={agent.id > 0 && agent.isActive ? "success" : "default"}
                          />
                        </Box>
                      </Box>
                      {(create || update) && !isEditing && (
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(agent)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {isEditing ? (
                      <Box display="flex" flexDirection="column" gap={2}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(option) =>
                            `${option.name}${option.email ? ` (${option.email})` : ""}`
                          }
                          value={getSelectedUsers()}
                          onChange={(event, newValue) => {
                            handleFieldChange(
                              "userIds",
                              newValue.map((u) => u.id)
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Assigned Users *"
                              size="small"
                              placeholder="Select users..."
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                label={option.name}
                                size="small"
                                {...getTagProps({ index })}
                                key={option.id}
                              />
                            ))
                          }
                        />

                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="WhatsApp Number"
                          value={formData.whatsRayAccountId || ""}
                          onChange={(e) => handleFieldChange("whatsRayAccountId", e.target.value)}
                        >
                          <MenuItem value="">None</MenuItem>
                          {whatsAppAccounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.name} ({account.phoneNumber})
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          fullWidth
                          size="small"
                          label="Email"
                          type="email"
                          placeholder="agent@example.com"
                          value={formData.email || ""}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                        />

                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save"}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={1.5} mt={2}>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <PersonIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              Assigned Users:
                            </Typography>
                            {agent.assignedUsers && agent.assignedUsers.length > 0 ? (
                              <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                {agent.assignedUsers.map((u) => (
                                  <Chip key={u.id} size="small" label={u.userName} variant="outlined" />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                <em>Not assigned</em>
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} />
                          <Typography variant="body2">
                            <strong>WhatsApp:</strong>{" "}
                            {agent.whatsAppAccountName ? (
                              <>
                                {agent.whatsAppAccountName}
                                {agent.whatsAppNumber && (
                                  <span style={{ color: "#888" }}> ({agent.whatsAppNumber})</span>
                                )}
                              </>
                            ) : (
                              <em style={{ color: "#999" }}>Not set</em>
                            )}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            <strong>Email:</strong>{" "}
                            {agent.email || <em style={{ color: "#999" }}>Not set</em>}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={typeDialogOpen} onClose={() => setTypeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{typeForm.id ? "Edit Agent Type" : "Add Agent Type"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name *"
              size="small"
              fullWidth
              value={typeForm.name}
              onChange={(e) => setTypeForm((p) => ({ ...p, name: e.target.value }))}
            />
            <TextField
              label="Description"
              size="small"
              fullWidth
              value={typeForm.description}
              onChange={(e) => setTypeForm((p) => ({ ...p, description: e.target.value }))}
            />
            <TextField
              label="Sort Order *"
              type="number"
              size="small"
              fullWidth
              value={typeForm.sortOrder}
              onChange={(e) => setTypeForm((p) => ({ ...p, sortOrder: e.target.value }))}
              helperText="Handover moves to the next higher sort order"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!typeForm.isFirstStage}
                  onChange={(e) => setTypeForm((p) => ({ ...p, isFirstStage: e.target.checked }))}
                />
              }
              label="First stage (new reservations / first meeting)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!typeForm.canManageTasks}
                  onChange={(e) => setTypeForm((p) => ({ ...p, canManageTasks: e.target.checked }))}
                />
              }
              label="Can manage reservation tasks"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!typeForm.isActive}
                  onChange={(e) => setTypeForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveType} disabled={savingType}>
            {savingType ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
