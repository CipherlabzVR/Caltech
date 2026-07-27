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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import KanbanColumn from "./column";
import LeadDetailDrawer from "./LeadDetailDrawer";
import ManageColumnsDrawer from "./ManageColumnsDrawer";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import AddLeadModal from "../leads/create";
import { toast, ToastContainer } from "react-toastify";

const MODULE_ENDPOINTS = {
  Leads: {
    columns: "/CRMKanbanColumn/GetAll",
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
    agePreset: "AllTime",
    onlyPastLeads: false,
    pastLeadDays: 60,
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
  const [manageColumnsOpen, setManageColumnsOpen] = React.useState(false);
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
      const columnsEndpoint = MODULE_ENDPOINTS.Leads?.columns;
      if (!columnsEndpoint) {
        setBoardData([]);
        setFilterOptions((prev) => ({ ...prev, stages: [], statuses: [] }));
        setSelectedFilters((prev) => ({ ...prev, stages: [], statuses: [] }));
        return;
      }

      try {
        setLoadingStages(true);
        setStageError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}${columnsEndpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to load columns");
        }

        const data = await response.json();
        const columns = Array.isArray(data?.result) ? data.result : [];

        const stageDefs = columns
          .slice()
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((col) => ({
            id: `column-${col.id}`,
            columnId: col.id,
            title: col.title,
            color: col.color || null,
            legacyStatus: col.legacyStatus ?? null,
            isWonColumn: !!col.isWonColumn,
            leadCount: col.leadCount ?? 0,
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
        console.error("Error loading columns:", error);
        setStageError(error.message || "Failed to load columns");
        setStageDefinitions([]);
        setBoardData([]);
        setFilterOptions((prev) => ({ ...prev, stages: [], statuses: [] }));
        setSelectedFilters((prev) => ({ ...prev, stages: [], statuses: [] }));
      } finally {
        setLoadingStages(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const filtersRef = React.useRef(selectedFilters);
  React.useEffect(() => {
    filtersRef.current = selectedFilters;
  }, [selectedFilters]);

  const fetchRecords = React.useCallback(
    async (overrideFilters) => {
      const dataEndpoint = MODULE_ENDPOINTS.Leads?.data;
      if (!dataEndpoint) {
        setBoardData([]);
        return;
      }

      try {
        setLoadingRecords(true);
        setRecordsError(null);

        const f = overrideFilters || filtersRef.current;
        const params = new URLSearchParams();
        const presetMap = {
          AllTime: 0,
          Last7Days: 1,
          Last30Days: 2,
          Last90Days: 3,
          OlderThan90Days: 4,
          Custom: 5,
        };
        let presetToSend = f.agePreset;
        if (presetToSend === "AllTime" && (f.startDate || f.endDate)) {
          presetToSend = "Custom";
        }
        params.set("AgePreset", String(presetMap[presetToSend] ?? 0));
        if (presetToSend === "Custom") {
          if (f.startDate) params.set("FromDate", f.startDate);
          if (f.endDate) params.set("ToDate", f.endDate);
        }
        if (f.onlyPastLeads) {
          params.set("OnlyPastLeads", "true");
          params.set("PastLeadDays", String(f.pastLeadDays || 60));
        }

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}${dataEndpoint}?${params.toString()}`, {
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

  // Initial board load runs exactly once. Subsequent refetches happen via the
  // server-side filter effect below.
  React.useEffect(() => {
    const loadBoard = async () => {
      await fetchStages();
      await fetchRecords();
    };
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch records when date / age filters change. We skip the very first
  // run because the initial load above already fetched with default filters.
  const isFirstFilterRun = React.useRef(true);
  React.useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedFilters.agePreset,
    selectedFilters.startDate,
    selectedFilters.endDate,
    selectedFilters.onlyPastLeads,
    selectedFilters.pastLeadDays,
  ]);

  const updateLeadStatus = React.useCallback(async (card, targetStage) => {
    if (!card?.raw) {
      return { success: false, error: "Card data is missing" };
    }

    const lead = card.raw;

    const currentStatus = lead.leadStatus ?? lead.status;
    if (currentStatus === 8 || currentStatus === "8") {
      return { success: false, error: "Status cannot be updated when create project" };
    }

    // For user-defined columns there is no enum to update, so we keep the
    // previous LeadStatus. For columns mapped to a legacy status (the
    // seeded defaults), we keep the enum in sync too.
    const nextLeadStatus = targetStage?.legacyStatus
      ? Number(targetStage.legacyStatus)
      : Number(lead.leadStatus ?? 0);

    const payload = {
      Id: lead.id,
      LeadName: lead.leadName || lead.name || "Unnamed Lead",
      Company: lead.company || "",
      Email: lead.email || "",
      MobileNo: lead.mobileNo || "",
      LeadSource: Number(lead.leadSource ?? 0),
      LeadStatus: nextLeadStatus,
      LeadScore: Number(lead.leadScore ?? 0),
      Description: lead.description || "",
      ContactId: lead.contactId || null,
      AccountId: lead.accountId || null,
      KanbanColumnId: targetStage?.columnId ?? null,
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
              leadStatus: nextLeadStatus,
              leadStatusName: targetStage?.title ?? record.leadStatusName,
              kanbanColumnId: targetStage?.columnId ?? null,
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
      const stageNameKey = "leadStatusName";
      const legacyStatusToColumnId = {};
      stages.forEach((stage) => {
        if (stage.legacyStatus != null) {
          legacyStatusToColumnId[String(stage.legacyStatus)] = stage.columnId;
        }
      });

      const resolveColumnId = (record) => {
        if (record.kanbanColumnId != null) return record.kanbanColumnId;
        const legacy = record.leadStatus;
        if (legacy != null && legacyStatusToColumnId[String(legacy)] != null) {
          return legacyStatusToColumnId[String(legacy)];
        }
        return null;
      };

      if (filters.owners.length > 0) {
        filteredRecords = filteredRecords.filter((record) =>
          filters.owners.includes(record.createdByName || "-")
        );
      }

      if (filters.statuses.length > 0) {
        const stageById = {};
        stages.forEach((s) => {
          stageById[s.columnId] = s.title;
        });
        filteredRecords = filteredRecords.filter((record) => {
          const colId = resolveColumnId(record);
          const stageLabel = stageById[colId] || record[stageNameKey] || "";
          return filters.statuses.includes(stageLabel);
        });
      }

      // Date / age filtering is done server-side via GetCRMLeads query params,
      // so we no longer re-filter on the client to avoid double-filtering.

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
        campaign: record.campaignId
          ? {
              id: record.campaignId,
              name: record.campaignName || "Campaign",
              type: record.campaignTypeName || null,
              startDate: record.campaignStartDate || null,
              endDate: record.campaignEndDate || null,
              owner: record.campaignOwnerName || null,
            }
          : null,
        raw: record,
      });

      return stages.map((stage) => {
        const stageTitle = stage.title;
        const stageRecords = filteredRecords.filter(
          (record) => resolveColumnId(record) === stage.columnId
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

  const handleBoardRefresh = React.useCallback(() => {
    fetchStages();
    fetchRecords();
  }, [fetchStages, fetchRecords]);

  const handleRefreshAfterCreate = React.useCallback((message) => {
    handleBoardRefresh();
    const successMessage =
      typeof message === "string" && message.trim()
        ? message
        : "Lead created successfully.";
    window.setTimeout(() => toast.success(successMessage), 0);
  }, [handleBoardRefresh]);

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

    const targetStage = originalBoardData.find((stage) => stage.id === targetStageId);

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
          const stageTitle = stage.title;
          const updatedCard = {
            ...movedCard,
            status: stageTitle,
            raw: movedCard.raw
              ? {
                ...movedCard.raw,
                kanbanColumnId: stage.columnId,
                leadStatus: stage.legacyStatus ?? movedCard.raw.leadStatus,
                leadStatusName: stageTitle,
              }
              : movedCard.raw,
          };

          return { ...stage, items: [...stage.items, updatedCard] };
        }
        return stage;
      });

      return updatedStages;
    });

    const result = await updateLeadStatus(movedCard, targetStage);

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

  const [archiveTarget, setArchiveTarget] = React.useState(null);
  const [archiveWorking, setArchiveWorking] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [deleteWorking, setDeleteWorking] = React.useState(false);

  const handleArchiveCard = React.useCallback((item) => {
    if (!item?.raw?.id) return;
    setArchiveTarget(item);
  }, []);

  const handleArchiveConfirm = React.useCallback(async () => {
    const leadId = archiveTarget?.raw?.id;
    if (!leadId) return;
    try {
      setArchiveWorking(true);
      const response = await fetch(`${BASE_URL}/Leads/ArchiveLead?id=${leadId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to archive lead");
      }
      toast.success(data?.message || "Lead archived.");
      setArchiveTarget(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.message || "Unable to archive lead");
    } finally {
      setArchiveWorking(false);
    }
  }, [archiveTarget, fetchRecords]);

  const handleDeleteCard = React.useCallback((item) => {
    if (!item?.raw?.id) return;
    setDeleteTarget(item);
  }, []);

  const handleDeleteConfirm = React.useCallback(async () => {
    const leadId = deleteTarget?.raw?.id;
    if (!leadId) return;
    try {
      setDeleteWorking(true);
      const response = await fetch(`${BASE_URL}/Leads/DeleteLead?id=${leadId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to delete lead");
      }
      toast.success(data?.message || "Lead deleted successfully.");
      setDeleteTarget(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.message || "Unable to delete lead");
    } finally {
      setDeleteWorking(false);
    }
  }, [deleteTarget, fetchRecords]);

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
          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={() => setManageColumnsOpen(true)}
          >
            Manage Columns
          </Button>
          <AddLeadModal onLeadCreated={handleRefreshAfterCreate} />
          <IconButton color="primary" onClick={() => setFilterDrawer(true)}>
            <FilterAltOutlinedIcon />
          </IconButton>
        </Stack>
      </Stack>

      {(() => {
        const f = selectedFilters;
        const presetLabels = {
          Last7Days: "leads created in the last 7 days",
          Last30Days: "leads created in the last 30 days",
          Last90Days: "leads created in the last 90 days",
          OlderThan90Days: "leads older than 90 days",
        };
        const parts = [];
        if (presetLabels[f.agePreset]) parts.push(presetLabels[f.agePreset]);
        if (f.agePreset === "Custom" && (f.startDate || f.endDate)) {
          parts.push(
            `leads created ${f.startDate ? `from ${f.startDate}` : ""}${
              f.startDate && f.endDate ? " " : ""
            }${f.endDate ? `to ${f.endDate}` : ""}`.trim()
          );
        }
        if (f.onlyPastLeads) {
          const today = new Date();
          today.setDate(today.getDate() - (f.pastLeadDays || 60));
          parts.push(`only past leads (created before ${today.toLocaleDateString()})`);
        }
        if (parts.length === 0) return null;
        return (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
                size="small"
                color="inherit"
                onClick={() =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    startDate: "",
                    endDate: "",
                    agePreset: "AllTime",
                    onlyPastLeads: false,
                    pastLeadDays: 60,
                  }))
                }
              >
                Clear filter
              </Button>
            }
          >
            Showing {parts.join(" and ")}.
          </Alert>
        );
      })()}

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          overflowX: "auto",
          overflowY: "hidden",
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
              stageColor={stage.color}
              isWonColumn={stage.isWonColumn}
              items={stage.items}
              onDragStart={handleDragStart}
              onDropCard={handleDropCard}
              onDragEnd={handleDragEnd}
              onCardClick={handleCardClick}
              onArchiveCard={handleArchiveCard}
              onDeleteCard={handleDeleteCard}
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
            Lead Age
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Quick filter</InputLabel>
            <Select
              label="Quick filter"
              value={selectedFilters.agePreset}
              onChange={(event) =>
                setSelectedFilters((prev) => ({
                  ...prev,
                  agePreset: event.target.value,
                  startDate: event.target.value === "Custom" ? prev.startDate : "",
                  endDate: event.target.value === "Custom" ? prev.endDate : "",
                }))
              }
            >
              <MenuItem value="AllTime">All time</MenuItem>
              <MenuItem value="Last7Days">Last 7 days</MenuItem>
              <MenuItem value="Last30Days">Last 30 days</MenuItem>
              <MenuItem value="Last90Days">Last 90 days</MenuItem>
              <MenuItem value="OlderThan90Days">Older than 90 days</MenuItem>
              <MenuItem value="Custom">Custom range</MenuItem>
            </Select>
          </FormControl>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Typography variant="body2">
              Show <strong>past leads</strong> only
            </Typography>
            <Switch
              size="small"
              checked={selectedFilters.onlyPastLeads}
              onChange={(event) =>
                setSelectedFilters((prev) => ({
                  ...prev,
                  onlyPastLeads: event.target.checked,
                }))
              }
            />
          </Stack>
          {selectedFilters.onlyPastLeads && (
            <TextField
              size="small"
              fullWidth
              type="number"
              label="Past lead threshold (days)"
              value={selectedFilters.pastLeadDays}
              onChange={(event) => {
                const v = Number(event.target.value);
                setSelectedFilters((prev) => ({
                  ...prev,
                  pastLeadDays: Number.isFinite(v) && v > 0 ? v : 60,
                }));
              }}
              sx={{ mb: 2 }}
            />
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Custom Date Range
          </Typography>
          <Stack spacing={1} direction="row">
            <TextField
              type="date"
              size="small"
              fullWidth
              value={selectedFilters.startDate}
              onChange={(event) =>
                setSelectedFilters((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                  agePreset: event.target.value || prev.endDate ? "Custom" : prev.agePreset,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              size="small"
              fullWidth
              value={selectedFilters.endDate}
              onChange={(event) =>
                setSelectedFilters((prev) => ({
                  ...prev,
                  endDate: event.target.value,
                  agePreset: event.target.value || prev.startDate ? "Custom" : prev.agePreset,
                }))
              }
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
                  agePreset: "AllTime",
                  onlyPastLeads: false,
                  pastLeadDays: 60,
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

      <ManageColumnsDrawer
        open={manageColumnsOpen}
        onClose={() => setManageColumnsOpen(false)}
        onChanged={handleBoardRefresh}
      />

      <Dialog open={!!archiveTarget} onClose={() => setArchiveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Archive Lead</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Archive <strong>{archiveTarget?.name}</strong>? It will be moved out of the active board and accessible from
            the Archived Leads page.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveTarget(null)} color="inherit" disabled={archiveWorking}>
            Cancel
          </Button>
          <Button onClick={handleArchiveConfirm} color="warning" variant="contained" disabled={archiveWorking}>
            {archiveWorking ? "Archiving..." : "Archive"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Lead</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Permanently delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleteWorking}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteWorking}>
            {deleteWorking ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

