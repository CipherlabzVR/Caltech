import React from "react";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import KanbanColumn from "./column";
import LeadDetailDrawer from "./LeadDetailDrawer";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import AddLeadModal from "../leads/create";
import { toast, ToastContainer } from "react-toastify";

const MODULE_ENDPOINTS = {
  Leads: {
    stages: "/EnumLookup/LeadStatuses",
    data: "/Leads/GetCRMLeads",
  },
};

export default function KanbanBoard() {
  const [searchValue, setSearchValue] = React.useState("");
  const [filterDrawer, setFilterDrawer] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState({
    stages: [],
    owners: [],
    statuses: [],
    startDate: "",
    endDate: "",
  });
  const [boardData, setBoardData] = React.useState([]);
  const [stageDefinitions, setStageDefinitions] = React.useState([]);
  const [originalRecords, setOriginalRecords] = React.useState([]);
  const [draggedItem, setDraggedItem] = React.useState(null);
  const [loadingStages, setLoadingStages] = React.useState(false);
  const [stageError, setStageError] = React.useState(null);
  const [loadingOwners, setLoadingOwners] = React.useState(false);
  const [ownersError, setOwnersError] = React.useState(null);
  const [loadingRecords, setLoadingRecords] = React.useState(false);
  const [recordsError, setRecordsError] = React.useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [pendingMove, setPendingMove] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState(null);
  const [filterOptions, setFilterOptions] = React.useState({
    stages: [],
    owners: [],
    statuses: [],
  });

  const totalItems = React.useMemo(
    () => boardData.reduce((acc, stage) => acc + stage.items.length, 0),
    [boardData]
  );
  const totalStages = React.useMemo(() => boardData.length, [boardData]);

  const fetchOwners = React.useCallback(async () => {
    try {
      setLoadingOwners(true);
      setOwnersError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${BASE_URL}/User/GetAllUser`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load owners");
      }

      const data = await response.json().catch(() => null);
      const users = Array.isArray(data) ? data : data?.result || [];
      const owners = users.map((user) => ({
        id: String(user.id),
        label: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userTypeName || `User #${user.id}`,
      }));

      setFilterOptions((prev) => ({
        ...prev,
        owners,
      }));
      setSelectedFilters((prev) => ({
        ...prev,
        owners: prev.owners.filter((label) => owners.some((owner) => owner.label === label)),
      }));
    } catch (error) {
      console.error("Error loading owners:", error);
      setOwnersError(error.message || "Failed to load owners");
      setFilterOptions((prev) => ({
        ...prev,
        owners: [],
      }));
      setSelectedFilters((prev) => ({
        ...prev,
        owners: [],
      }));
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  const fetchStages = React.useCallback(
    async () => {
      const stageEndpoint = MODULE_ENDPOINTS.Leads?.stages;
      if (!stageEndpoint) {
        setBoardData([]);
        setFilterOptions((prev) => ({
          ...prev,
          stages: [],
          statuses: [],
        }));
        setSelectedFilters((prev) => ({
          ...prev,
          stages: [],
          statuses: [],
        }));
        return;
      }

      try {
        setLoadingStages(true);
        setStageError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}${stageEndpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to load stages");
        }

        const data = await response.json();
        const entries = Object.entries(data?.result || {});

        const stageDefs = entries.map(([value, label]) => ({
          id: `stage-${value}`,
          title: label,
        }));

        setStageDefinitions(stageDefs);
        setBoardData(stageDefs.map((stage) => ({ ...stage, items: [] })));
        const stageTitles = stageDefs.map((stage) => stage.title);

        setFilterOptions((prev) => ({
          ...prev,
          stages: [],
          statuses: stageTitles,
        }));

        setSelectedFilters((prev) => ({
          ...prev,
          stages: [],
          statuses: prev.statuses.filter((value) => stageTitles.includes(value)),
        }));
      } catch (error) {
        console.error("Error loading stages:", error);
        setStageError(error.message || "Failed to load stages");
        setStageDefinitions([]);
        setBoardData([]);
        setFilterOptions((prev) => ({
          ...prev,
          stages: [],
          statuses: [],
        }));
        setSelectedFilters((prev) => ({
          ...prev,
          stages: [],
          statuses: [],
        }));
      } finally {
        setLoadingStages(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const fetchRecords = React.useCallback(
    async () => {
      const dataEndpoint = MODULE_ENDPOINTS.Leads?.data;
      if (!dataEndpoint) {
        setBoardData([]);
        return;
      }

      try {
        setLoadingRecords(true);
        setRecordsError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}${dataEndpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to load records");
        }

        const data = await response.json().catch(() => null);
        const records = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        const stageKey = "leadStatus";
        const stageLabelKey = "leadStatusName";

        setOriginalRecords(records);
      } catch (error) {
        console.error("Error loading board records:", error);
        setRecordsError(error.message || "Failed to load records");
        setOriginalRecords([]);
        setBoardData((prevStages) =>
          prevStages.map((stage) => ({
            ...stage,
            items: [],
          }))
        );
      } finally {
        setLoadingRecords(false);
      }
    },
    []
  );

  React.useEffect(() => {
    const loadBoard = async () => {
      await fetchStages();
      await fetchRecords();
    };

    loadBoard();
  }, [fetchStages, fetchRecords]);

  const updateLeadStatus = React.useCallback(async (card, statusValue, statusLabel) => {
    if (!card?.raw) {
      return { success: false, error: "Card data is missing" };
    }

    const lead = card.raw;

    const currentStatus = lead.leadStatus ?? lead.status;
    if (currentStatus === 8 || currentStatus === "8") {
      return { success: false, error: "Status cannot be updated when create project" };
    }

    const payload = {
      Id: lead.id,
      LeadName: lead.leadName || lead.name || "Unnamed Lead",
      Company: lead.company || "",
      Email: lead.email || "",
      MobileNo: lead.mobileNo || "",
      LeadSource: Number(lead.leadSource ?? 0),
      LeadStatus: Number(statusValue),
      LeadScore: Number(lead.leadScore ?? 0),
      Description: lead.description || "",
      ContactId: lead.contactId || null,
      AccountId: lead.accountId || null
    };

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${BASE_URL}/Leads/UpdateLead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || response.status !== 200 || (data && data.statusCode !== 200)) {
        const errorMessage = data?.message || "Failed to update lead status";
        return { success: false, error: errorMessage };
      }

      setOriginalRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === lead.id
            ? {
              ...record,
              leadStatus: Number(statusValue),
              leadStatusName: statusLabel,
            }
            : record
        )
      );

      return { success: true, data };
    } catch (error) {
      console.error("Error updating lead status:", error);
      return { success: false, error: error.message || "Failed to update lead status" };
    }
  }, []);

  const buildBoardData = React.useCallback(
    (stages, records, filters, searchTerm) => {
      if (!Array.isArray(stages) || stages.length === 0) {
        return [];
      }

      let filteredRecords = Array.isArray(records) ? [...records] : [];
      const stageKey = "leadStatus";
      const stageNameKey = "leadStatusName";
      const stageValueToLabel = {};

      stages.forEach((stage) => {
        stageValueToLabel[stage.id.replace("stage-", "")] = stage.title;
      });

      if (filters.owners.length > 0) {
        filteredRecords = filteredRecords.filter((record) =>
          filters.owners.includes(record.createdByName || "-")
        );
      }

      if (filters.statuses.length > 0) {
        filteredRecords = filteredRecords.filter((record) => {
          const stageValue = record[stageKey];
          const stageLabel =
            record[stageNameKey] ||
            stageValueToLabel[String(stageValue)] ||
            String(stageValue ?? "");
          return filters.statuses.includes(stageLabel);
        });
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filteredRecords = filteredRecords.filter((record) => {
          if (!record.createdOn) {
            return false;
          }
          const created = new Date(record.createdOn);
          return !Number.isNaN(created.getTime()) && created >= startDate;
        });
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filteredRecords = filteredRecords.filter((record) => {
          if (!record.createdOn) {
            return false;
          }
          const created = new Date(record.createdOn);
          return !Number.isNaN(created.getTime()) && created <= endDate;
        });
      }

      const trimmedSearch = searchTerm.trim().toLowerCase();
      if (trimmedSearch) {
        filteredRecords = filteredRecords.filter((record) => {
          const fields = [record.leadName, record.company, record.email, record.createdByName];
          return fields.some(
            (value) => value && String(value).toLowerCase().includes(trimmedSearch)
          );
        });
      }

      const toCard = (record, stageTitle) => ({
        id: `leads-${record.id}`,
        name: record.leadName || record.company || `Lead #${record.id}`,
        company: record.company || "-",
        value: `Score: ${record.leadScore ?? "-"}`,
        owner: record.createdByName || "-",
        status: stageTitle,
        createdDate: record.createdOn ? new Date(record.createdOn).toLocaleDateString() : "-",
        dueDate: "-",
        raw: record,
      });

      return stages.map((stage) => {
        const stageValue = stage.id.replace("stage-", "");
        const stageTitle = stage.title;
        const stageRecords = filteredRecords.filter(
          (record) => String(record[stageKey]) === stageValue
        );

        return {
          ...stage,
          items: stageRecords.map((record) => toCard(record, stageTitle)),
        };
      });
    },
    []
  );

  React.useEffect(() => {
    setBoardData(
      buildBoardData(stageDefinitions, originalRecords, selectedFilters, searchValue)
    );
  }, [
    buildBoardData,
    stageDefinitions,
    originalRecords,
    selectedFilters,
    searchValue,
  ]);

  const handleRefreshAfterCreate = React.useCallback(() => {
    fetchStages();
    fetchRecords();
  }, [fetchStages, fetchRecords]);

  const handleFilterToggle = (group, value) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[group];
      const exists = currentValues.includes(value);
      return {
        ...prev,
        [group]: exists ? currentValues.filter((item) => item !== value) : [...currentValues, value],
      };
    });
  };

  const handleDateChange = (field) => (event) => {
    const value = event.target.value;
    setSelectedFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDragStart = (sourceStageId, itemId) => {
    // Find the card being dragged
    const sourceStage = boardData.find((stage) => stage.id === sourceStageId);
    const card = sourceStage?.items?.find((item) => item.id === itemId);

    if (card?.raw) {
      const currentStatus = card.raw.leadStatus ?? card.raw.status;
      if (currentStatus === 8 || currentStatus === "8") {
        toast.error("Status cannot be updated when project created");
        return;
      }
    }

    setDraggedItem({ sourceStageId, itemId });
  };

  const handleDropCard = async (targetStageId) => {
    if (!draggedItem) return;

    // Store original board data before any changes
    const originalBoardData = boardData;

    // Check if target stage is the last column
    const isLastColumn = stageDefinitions.length > 0 &&
      targetStageId === stageDefinitions[stageDefinitions.length - 1].id;

    if (isLastColumn) {
      // Store the pending move data
      setPendingMove({
        targetStageId,
        originalBoardData,
        draggedItem: { ...draggedItem },
      });
      // Revert board to original state immediately (card goes back)
      setBoardData(originalBoardData);
      setConfirmDialogOpen(true);
      return;
    }

    // Proceed with normal move if not last column
    await proceedWithMove(targetStageId, originalBoardData);
  };

  const proceedWithMove = async (targetStageId, originalBoardData, draggedItemToUse = null) => {
    const itemToMove = draggedItemToUse || draggedItem;
    if (!itemToMove) return;

    // Get the card from original board data before updating state
    const sourceStage = originalBoardData.find((stage) => stage.id === itemToMove.sourceStageId);
    const movedCard = sourceStage?.items?.find((item) => item.id === itemToMove.itemId);

    if (!movedCard) {
      toast.error("Card not found");
      setDraggedItem(null);
      return;
    }

    // Update board visually
    setBoardData((prevStages) => {
      const stagesWithoutCard = prevStages.map((stage) => {
        if (stage.id === itemToMove.sourceStageId) {
          const remaining = stage.items.filter((item) => item.id !== itemToMove.itemId);
          return { ...stage, items: remaining };
        }
        return stage;
      });

      const updatedStages = stagesWithoutCard.map((stage) => {
        if (stage.id === targetStageId) {
          const stageValue = targetStageId.replace("stage-", "");
          const stageTitle = stage.title;
          const updatedCard = {
            ...movedCard,
            status: stageTitle,
            raw: movedCard.raw
              ? {
                ...movedCard.raw,
                leadStatus: Number(stageValue),
                leadStatusName: stageTitle,
              }
              : movedCard.raw,
          };

          return {
            ...stage,
            items: [
              ...stage.items,
              updatedCard,
            ],
          };
        }
        return stage;
      });

      return updatedStages;
    });

    // Get target stage info
    const targetStage = originalBoardData.find((stage) => stage.id === targetStageId);
    const stageValue = targetStageId.replace("stage-", "");
    const stageLabel = targetStage?.title || stageValue;
    const targetStatusValue = Number(stageValue);

    // Call updateLeadStatus API
    const result = await updateLeadStatus(movedCard, targetStatusValue, stageLabel);

    if (!result || !result.success) {
      // Revert board on error
      setBoardData(originalBoardData);
      toast.error(result?.error || "Failed to update lead status");
      setDraggedItem(null);
      return;
    }

    setDraggedItem(null);
  };

  const handleConfirmMove = async () => {
    setConfirmDialogOpen(false);
    if (pendingMove) {
      setDraggedItem(pendingMove.draggedItem);
      await proceedWithMove(pendingMove.targetStageId, pendingMove.originalBoardData, pendingMove.draggedItem);
      setPendingMove(null);
    }
  };

  const handleCancelMove = () => {
    setConfirmDialogOpen(false);
    if (pendingMove) {
      // Revert to original board data and clear dragged item
      setBoardData(pendingMove.originalBoardData);
      setDraggedItem(null);
      setPendingMove(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleCardClick = React.useCallback((card) => {
    if (card?.raw) {
      setSelectedLead(card.raw);
      setDrawerOpen(true);
    }
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setDrawerOpen(false);
    setSelectedLead(null);
  }, []);

  const handleLeadUpdated = React.useCallback(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>CRM Kanban Board</h1>
        <ul>
          <li>
            <Link href="/crm/kanban/">Kanban Board</Link>
          </li>
        </ul>
      </div>

      <Grid container spacing={2} alignItems="center" justifyContent="space-between">
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle1" color="text.secondary">
            Visual view of all leads by stage
          </Typography>
        </Grid>
        <Grid item xs={12} md="auto">
          <Typography variant="subtitle2" color="text.secondary">
            {totalItems} Leads across {totalStages} stages
          </Typography>
        </Grid>
      </Grid>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        mt={3}
        mb={3}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, flexGrow: 1 }}>
          <Search className="search-form" sx={{ flexGrow: 1 }}>
            <StyledInputBase
              placeholder="Search leads..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </Search>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
          <AddLeadModal onLeadCreated={handleRefreshAfterCreate} />
          <IconButton color="primary" onClick={() => setFilterDrawer(true)}>
            <FilterAltOutlinedIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          overflowX: "auto",
          pb: 3,
          pr: 1,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            height: 8,
          },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 10,
            backgroundColor: "rgba(148, 163, 184, 0.6)",
          },
        }}
      >
        {loadingStages || loadingRecords ? (
          <Box
            sx={{
              minWidth: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <Typography color="text.secondary">Loading board...</Typography>
          </Box>
        ) : stageError ? (
          <Box
            sx={{
              minWidth: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <Typography color="error">{stageError}</Typography>
          </Box>
        ) : recordsError ? (
          <Box
            sx={{
              minWidth: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <Typography color="error">{recordsError}</Typography>
          </Box>
        ) : boardData.length === 0 ? (
          <Box
            sx={{
              minWidth: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <Typography color="text.secondary">No stages available.</Typography>
          </Box>
        ) : (
          boardData.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stageId={stage.id}
              stageTitle={stage.title}
              items={stage.items}
              onDragStart={handleDragStart}
              onDropCard={handleDropCard}
              onDragEnd={handleDragEnd}
              onCardClick={handleCardClick}
            />
          ))
        )}
      </Box>

      <Drawer anchor="right" open={filterDrawer} onClose={() => setFilterDrawer(false)}>
        <Box sx={{ width: { xs: 280, sm: 320 }, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Filters
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Narrow the board to focus on specific leads.
          </Typography>
          <Divider sx={{ mb: 2 }} />


          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Owner
          </Typography>
          <Stack spacing={1}>
            {loadingOwners ? (
              <Typography color="text.secondary">Loading owners...</Typography>
            ) : ownersError ? (
              <Typography color="error">{ownersError}</Typography>
            ) : filterOptions.owners.length === 0 ? (
              <Typography color="text.secondary">No owners available.</Typography>
            ) : (
              filterOptions.owners.map((owner) => (
                <FormControlLabel
                  key={owner.id}
                  control={
                    <Checkbox
                      checked={selectedFilters.owners.includes(owner.label)}
                      onChange={() => handleFilterToggle("owners", owner.label)}
                    />
                  }
                  label={owner.label}
                />
              ))
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Date Range
          </Typography>
          <Stack spacing={1} direction="row">
            <TextField
              type="date"
              size="small"
              fullWidth
              value={selectedFilters.startDate}
              onChange={handleDateChange("startDate")}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              fullWidth
              value={selectedFilters.endDate}
              onChange={handleDateChange("endDate")}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          {filterOptions.statuses.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Status
              </Typography>
              <Stack spacing={1}>
                {filterOptions.statuses.map((status) => (
                  <FormControlLabel
                    key={status}
                    control={
                      <Checkbox
                        checked={selectedFilters.statuses.includes(status)}
                        onChange={() => handleFilterToggle("statuses", status)}
                      />
                    }
                    label={status}
                  />
                ))}
              </Stack>
            </>
          )}

          <Stack direction="row" spacing={1.5} mt={3}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() =>
                setSelectedFilters({
                  stages: [],
                  owners: [],
                  statuses: [],
                  startDate: "",
                  endDate: "",
                })
              }
            >
              Clear
            </Button>
            <Button variant="contained" onClick={() => setFilterDrawer(false)}>
              Apply
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <Dialog open={confirmDialogOpen} onClose={handleCancelMove} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Status Update</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Cannot update again. Are you sure you want to move this lead to the last column? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelMove} color="inherit">
            No
          </Button>
          <Button onClick={handleConfirmMove} color="primary" variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <LeadDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        lead={selectedLead}
        onLeadUpdated={handleLeadUpdated}
      />

      <ToastContainer />
    </>
  );
}

