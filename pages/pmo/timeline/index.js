import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import TimelineGanttChart from "@/components/ProjectManagementModule/TimelineGanttChart";
import TimelineEntryFormDialog from "@/components/ProjectManagementModule/TimelineEntryFormDialog";
import {
  createTimelineEntry,
  deleteTimelineEntry,
  getProjects,
  getTeamMembers,
  getTimeline,
  updateTimelineEntry,
} from "@/Services/projectManagementService";
import dayjs from "dayjs";

const TimelinePage = () => {
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects({});
      setProjects(data ?? []);
      if (data?.length && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedProject]);

  const loadTeamMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadTimeline = useCallback(
    async (projectId) => {
      if (!projectId) return;
      try {
        const data = await getTimeline(projectId);
        setTimeline(data ?? []);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    []
  );

  useEffect(() => {
    loadProjects();
    loadTeamMembers();
  }, [loadProjects, loadTeamMembers]);

  useEffect(() => {
    if (selectedProject?.projectId) {
      loadTimeline(selectedProject.projectId);
    }
  }, [selectedProject, loadTimeline]);

  const handleSubmitEntry = async (values) => {
    if (!selectedProject) return;
    if (editEntry) {
      await updateTimelineEntry(editEntry.timelineEntryId, {
        ...values,
        projectId: selectedProject.projectId,
      });
    } else {
      await createTimelineEntry({
        ...values,
        projectId: selectedProject.projectId,
      });
    }
    setDialogOpen(false);
    setEditEntry(null);
    await loadTimeline(selectedProject.projectId);
  };

  const handleDeleteEntry = async (entryId) => {
    await deleteTimelineEntry(entryId);
    await loadTimeline(selectedProject.projectId);
  };

  return (
    <>
      <PageHeader
        title="Project Timeline"
        subtitle="Plan SDLC milestones, dependencies and deliverable dates."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditEntry(null);
              setDialogOpen(true);
            }}
            disabled={!selectedProject}
          >
            Add Phase
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Autocomplete
          sx={{ maxWidth: 320 }}
          options={projects}
          value={selectedProject}
          getOptionLabel={(option) => option.name ?? ""}
          onChange={(_, newValue) => setSelectedProject(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Select Project" />
          )}
        />
      </Paper>

      {selectedProject ? (
        <>
          <TimelineGanttChart data={timeline} />

          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Phase Ledger
            </Typography>
            <Stack spacing={2}>
              {timeline.map((entry) => {
                // Normalize entry to handle both camelCase and PascalCase
                const members = entry.members || entry.Members || [];
                const memberNames = members.length > 0
                  ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
                  : entry.assignedToName || entry.AssignedToName || "Unassigned";
                
                const normalizedEntry = {
                  timelineEntryId: entry.timelineEntryId || entry.TimelineEntryId,
                  phaseName: entry.phaseName || entry.PhaseName || "",
                  phaseType: entry.phaseType || entry.PhaseType || "",
                  startDate: entry.startDate || entry.StartDate,
                  endDate: entry.endDate || entry.EndDate,
                  assignedToMemberId: entry.assignedToMemberId || entry.AssignedToMemberId || null,
                  assignedToName: memberNames,
                  members: members,
                  notes: entry.notes || entry.Notes || "",
                };
                return (
                <Box
                  key={normalizedEntry.timelineEntryId}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {normalizedEntry.phaseName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {normalizedEntry.startDate ? new Date(normalizedEntry.startDate).toLocaleDateString() : "N/A"} →{" "}
                      {normalizedEntry.endDate ? new Date(normalizedEntry.endDate).toLocaleDateString() : "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      {normalizedEntry.assignedToName ?? "Unassigned"}
                    </Typography>
                    {normalizedEntry.notes ? (
                      <Typography variant="body2" color="text.secondary">
                        {normalizedEntry.notes}
                      </Typography>
                    ) : null}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => {
                        setEditEntry(normalizedEntry);
                        setDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteEntry(normalizedEntry.timelineEntryId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Box>
              );
              })}
              {!timeline.length ? (
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  No timeline entries yet. Start with planning, design and dev
                  checkpoints.
                </Box>
              ) : null}
            </Stack>
          </Paper>
        </>
      ) : (
        <Box
          sx={{
            p: 5,
            borderRadius: 3,
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          Select a project to manage timeline.
        </Box>
      )}

      <TimelineEntryFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditEntry(null);
        }}
        onSubmit={handleSubmitEntry}
        initialValues={
          editEntry
            ? {
                phaseName: editEntry.phaseName || "",
                phaseType: editEntry.phaseType || "Planning",
                startDate: editEntry.startDate ? dayjs(editEntry.startDate) : dayjs(),
                endDate: editEntry.endDate ? dayjs(editEntry.endDate) : dayjs().add(3, "day"),
                assignedToMemberId: editEntry.assignedToMemberId || null,
                memberIds: editEntry.members && editEntry.members.length > 0
                  ? editEntry.members.map((m) => m.memberId)
                  : editEntry.assignedToMemberId
                  ? [editEntry.assignedToMemberId]
                  : [],
                notes: editEntry.notes || "",
              }
            : undefined
        }
        title={editEntry ? "Update Phase" : "Add Phase"}
        teamMembers={teamMembers}
      />
    </>
  );
};

// Disable SSR for this page to prevent fetch errors during build
export default dynamic(() => Promise.resolve(TimelinePage), {
  ssr: false,
});

