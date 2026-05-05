import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const styles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 520, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

/** Group notification types for easier scanning (Payments & Reservations, Reminders, HR & Leave, Sales). */
function getNotificationTypeGroupName(id) {
  if (id >= 200) return "Sales";
  if (id >= 100) return "HR & Leave";
  if (id >= 15 && id <= 16) return "Reminders";
  return "Payments & Reservations";
}

/** Extract role IDs as numbers so comparison works (API may return string or number, camelCase or PascalCase). */
function extractRoleIds(roles) {
  return (roles || [])
    .map((r) => Number(r.roleId ?? r.roleID ?? r.RoleId ?? r.id ?? r.Id ?? 0))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export default function NotificationTypeMapping({ role }) {
  const [open, setOpen] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [mappingList, setMappingList] = useState([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [initialTypeIds, setInitialTypeIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTypes = useMemo(
    () =>
      normalizedSearch
        ? notificationTypes.filter((type) =>
            (type.name || "").toLowerCase().includes(normalizedSearch)
          )
        : notificationTypes,
    [notificationTypes, normalizedSearch]
  );

  const selectedSet = useMemo(() => new Set(selectedTypeIds), [selectedTypeIds]);
  const selectableIds = useMemo(
    () =>
      filteredTypes
        .map((type) => Number(type.id ?? type.Id ?? 0))
        .filter((n) => !Number.isNaN(n) && n > 0),
    [filteredTypes]
  );
  const selectedCount = selectedTypeIds.length;
  const totalCount = notificationTypes.length;
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedSet.has(id));
  const isIndeterminate =
    selectableIds.some((id) => selectedSet.has(id)) && !allSelected;

  const groupedTypes = useMemo(() => {
    const grouped = filteredTypes.reduce((acc, type) => {
      const group = getNotificationTypeGroupName(type.id);
      if (!acc[group]) acc[group] = [];
      acc[group].push(type);
      return acc;
    }, {});

    const groupOrder = ["Payments & Reservations", "Reminders", "Sales", "HR & Leave", "Other"];
    const ordered = {};
    groupOrder.forEach((group) => {
      if (grouped[group]?.length) {
        ordered[group] = grouped[group];
      }
    });

    Object.keys(grouped).forEach((group) => {
      if (!ordered[group]) ordered[group] = grouped[group];
    });

    return ordered;
  }, [filteredTypes]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchNotificationTypes = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE_URL}/NotificationRoleMapping/GetAllNotificationCategories`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch notification types");

    const data = await response.json();
    const raw = data.result ?? data.Result ?? data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((t) => ({
      id: Number(t.id ?? t.Id ?? 0),
      name: t.name ?? t.Name ?? "",
    })).filter((t) => t.id > 0);
  };

  const fetchMappings = async () => {
    const token = localStorage.getItem("token");
    const query = `${BASE_URL}/NotificationRoleMapping/GetAllMappings?SkipCount=0&MaxResultCount=2000&Search=null`;
    const response = await fetch(query, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch notification mappings");

    const data = await response.json();
    const result = data.result ?? data.Result ?? data;
    const items = result?.items ?? result?.Items;
    return Array.isArray(items) ? items : [];
  };

  /** Load notification type IDs assigned to this role from backend (single source of truth). */
  const fetchNotificationTypeIdsByRoleId = async (roleId) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${BASE_URL}/NotificationRoleMapping/GetNotificationTypeIdsByRoleId?roleId=${Number(roleId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch notification types for role");

    const data = await response.json();
    const result = data.result ?? data.Result ?? data;
    if (!Array.isArray(result)) return [];
    return result.map((id) => Number(id)).filter((n) => !Number.isNaN(n) && n > 0);
  };

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const roleIdNum = Number(role?.id ?? role?.Id ?? 0);
      if (!roleIdNum || Number.isNaN(roleIdNum)) {
        setNotificationTypes([]);
        setMappingList([]);
        setSelectedTypeIds([]);
        setInitialTypeIds([]);
        return;
      }

      const [types, mappings, typeIdsForRole] = await Promise.all([
        fetchNotificationTypes(),
        fetchMappings(),
        fetchNotificationTypeIdsByRoleId(roleIdNum),
      ]);

      setNotificationTypes(Array.isArray(types) ? types : []);
      setMappingList(mappings);
      setSelectedTypeIds(typeIdsForRole);
      setInitialTypeIds(typeIdsForRole);
    } catch (error) {
      toast.error(error.message || "Failed to load notification types");
      setSelectedTypeIds([]);
      setInitialTypeIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      refreshData();
    }
  }, [open]);

  const handleSelectAllToggle = (event) => {
    if (event.target.checked) {
      setSelectedTypeIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    } else {
      setSelectedTypeIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    }
  };

  const handleToggleType = (typeId) => {
    setSelectedTypeIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const selectedSet = new Set(selectedTypeIds);
      const initialSet = new Set(initialTypeIds);
      const affectedTypeIds = Array.from(new Set([...selectedSet, ...initialSet]));

      if (affectedTypeIds.length === 0) {
        toast.info("No notification types selected");
        setIsSaving(false);
        return;
      }

      const roleIdNum = Number(role?.id ?? role?.Id ?? 0);
      if (!roleIdNum || Number.isNaN(roleIdNum)) {
        toast.error("Invalid role");
        setIsSaving(false);
        return;
      }

      const mappingByTypeId = mappingList.reduce((acc, mapping) => {
        const key = Number(mapping.notificationCategoryId ?? mapping.NotificationCategoryId ?? 0);
        if (!Number.isNaN(key) && key > 0) acc[key] = mapping;
        return acc;
      }, {});

      const requests = [];
      for (const typeId of affectedTypeIds) {
        const typeIdNum = Number(typeId);
        const mapping = mappingByTypeId[typeIdNum];
        const rolesArray = mapping?.roles ?? mapping?.Roles;
        const currentRoleIds = mapping ? extractRoleIds(rolesArray) : [];
        const hasRole = currentRoleIds.includes(roleIdNum);
        const shouldHaveRole = selectedSet.has(typeIdNum) || selectedSet.has(typeId);

        if (hasRole === shouldHaveRole) {
          continue;
        }

        if (!mapping) {
          if (shouldHaveRole) {
            requests.push(
              fetch(`${BASE_URL}/NotificationRoleMapping/CreateMapping`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  NotificationCategoryId: typeIdNum,
                  RoleIds: [roleIdNum],
                }),
              })
            );
          }
          continue;
        }

        const nextRoleIds = shouldHaveRole
          ? Array.from(new Set([...currentRoleIds, roleIdNum]))
          : currentRoleIds.filter((id) => id !== roleIdNum);

        const mappingId = Number(mapping.id ?? mapping.Id ?? 0);
        if (nextRoleIds.length === 0) {
          requests.push(
            fetch(`${BASE_URL}/NotificationRoleMapping/DeleteMapping?id=${mappingId}`, {
              method: "POST",
              headers,
            })
          );
        } else {
          requests.push(
            fetch(`${BASE_URL}/NotificationRoleMapping/UpdateMapping`, {
              method: "PUT",
              headers,
              body: JSON.stringify({
                Id: mappingId,
                NotificationCategoryId: typeIdNum,
                RoleIds: nextRoleIds,
              }),
            })
          );
        }
      }

      if (requests.length === 0) {
        toast.info("No changes to update");
        setIsSaving(false);
        return;
      }

      const responses = await Promise.all(requests);
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const errorData = await failed.json().catch(() => null);
        const msg = errorData?.message ?? errorData?.Message ?? "Failed to update notification types";
        throw new Error(msg);
      }

      toast.success("Notification types updated successfully");
      setInitialTypeIds(selectedTypeIds);
      handleClose();
    } catch (error) {
      toast.error(error.message || "Failed to update notification types");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} size="small">
          <NotificationsIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose}>
        <Box sx={styles} className="bg-black">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ fontWeight: "500", mb: "6px" }}>
                Notification Types
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {role?.displayName || role?.name}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Search notification types"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                sx={{ mb: 1 }}
              />
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAllToggle}
                    disabled={isLoading || selectableIds.length === 0}
                  />
                  <Typography variant="body2">
                    Select all {normalizedSearch ? "(filtered)" : ""}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {selectedCount} selected
                  {normalizedSearch ? ` • ${filteredTypes.length} filtered` : ` • ${totalCount} total`}
                </Typography>
              </Box>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  maxHeight: 320,
                  overflowY: "auto",
                }}
              >
                {isLoading ? (
                  <Box p={2}>
                    <Typography variant="body2" color="text.secondary">
                      Loading notification types...
                    </Typography>
                  </Box>
                ) : filteredTypes.length === 0 ? (
                  <Box p={2}>
                    <Typography variant="body2" color="text.secondary">
                      No notification types found
                    </Typography>
                  </Box>
                ) : (
                  <List dense disablePadding subheader={<li />}>
                    {Object.entries(groupedTypes).map(([groupName, items]) => (
                      <li key={groupName}>
                        <ul style={{ padding: 0 }}>
                          <ListSubheader disableSticky>{groupName}</ListSubheader>
                          {items.map((option) => {
                            const optionId = Number(option.id ?? option.Id ?? 0);
                            const checked = selectedSet.has(optionId);
                            return (
                              <ListItem key={optionId || option.id} disablePadding>
                                <ListItemButton onClick={() => handleToggleType(optionId)}>
                                  <ListItemIcon sx={{ minWidth: 36 }}>
                                    <Checkbox size="small" checked={checked} />
                                  </ListItemIcon>
                                  <ListItemText primary={option.name} />
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
