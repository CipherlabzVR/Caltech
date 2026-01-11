import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  Autocomplete,
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import TimelineGanttChart from "@/components/ProjectManagementModule/TimelineGanttChart";
import {
  getProjects,
  getTaskBoard,
} from "@/Services/projectManagementService";

const TimelinePage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

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

  const loadTasks = useCallback(
    async (projectId) => {
      if (!projectId) return;
      try {
        const data = await getTaskBoard(projectId);
        const columns = data?.columns ?? [];
        const flattened = columns.flatMap((col) => (col?.cards ?? []).map((card) => ({
          ...card,
          columnId: col.columnId,
          columnTitle: col.title,
        })));

        // Only tasks with dates should appear on the timeline.
        // SDLC row assignment is handled in the chart (uses phaseType, falls back to phaseName).
        const timelineTasks = flattened.filter((t) => {
          const start = t.startDate || t.StartDate;
          const due = t.dueDate || t.DueDate;
          return Boolean(start) && Boolean(due);
        });

        setTasks(timelineTasks);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    []
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject?.projectId) {
      loadTasks(selectedProject.projectId);
    }
  }, [selectedProject, loadTasks]);

  const phasesLedger = useMemo(() => {
    const groups = new Map();

    tasks.forEach((t) => {
      const phaseName = t.phaseName || t.PhaseName || "Unassigned";
      const phaseType = t.phaseType || t.PhaseType || "";
      const start = t.startDate || t.StartDate;
      const end = t.dueDate || t.DueDate || t.endDate || t.EndDate;
      const key = String(phaseName).toLowerCase();

      if (!groups.has(key)) {
        groups.set(key, {
          phaseName,
          phaseType,
          startDate: start,
          endDate: end,
          taskTitles: [],
        });
      }

      const g = groups.get(key);
      g.phaseType = g.phaseType || phaseType;

      const s = start ? new Date(start) : null;
      const e = end ? new Date(end) : null;
      const gs = g.startDate ? new Date(g.startDate) : null;
      const ge = g.endDate ? new Date(g.endDate) : null;
      if (s && (!gs || s < gs)) g.startDate = start;
      if (e && (!ge || e > ge)) g.endDate = end;

      if (t.title) g.taskTitles.push(t.title);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aS = a.startDate ? new Date(a.startDate).getTime() : 0;
      const bS = b.startDate ? new Date(b.startDate).getTime() : 0;
      return aS - bS;
    });
  }, [tasks]);

  return (
    <>
      <PageHeader
        title="Project Timeline"
        subtitle="Timeline is generated automatically from tasks grouped by phase."
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
          <TimelineGanttChart data={tasks} />

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
              {phasesLedger.map((entry) => (
                <Box
                  key={entry.phaseName}
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
                      {entry.phaseName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.startDate ? new Date(entry.startDate).toLocaleDateString() : "N/A"} →{" "}
                      {entry.endDate ? new Date(entry.endDate).toLocaleDateString() : "N/A"}
                    </Typography>
                    {entry.taskTitles?.length ? (
                      <Typography variant="body2" color="text.secondary">
                        {entry.taskTitles.slice(0, 6).join(", ")}
                        {entry.taskTitles.length > 6 ? " …" : ""}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              ))}
              {!phasesLedger.length ? (
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                    textAlign: "center",
                    color: "text.secondary",
                  }}
                >
                  No timeline tasks yet. Create tasks with Phase + Start/Due dates to
                  generate the timeline.
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
    </>
  );
};

// Disable SSR for this page to prevent fetch errors during build
export default dynamic(() => Promise.resolve(TimelinePage), {
  ssr: false,
});

