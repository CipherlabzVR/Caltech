import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import ProjectFormDialog from "@/components/ProjectManagementModule/ProjectFormDialog";
import ProjectDetailDialog from "@/components/ProjectManagementModule/ProjectDetailDialog";
import MetricCard from "@/components/ProjectManagementModule/MetricCard";
import StatusPill from "@/components/ProjectManagementModule/StatusPill";
import {
  assignProjectMembers,
  createProject,
  getProjectDetails,
  getProjects,
  getTeamMembers,
  updateProject,
  updateProjectStatus,
} from "@/Services/projectManagementService";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";

const statusOptions = [
  { label: "All", value: "" },
  { label: "Planned", value: 1 },
  { label: "In Progress", value: 2 },
  { label: "On Hold", value: 3 },
  { label: "Completed", value: 4 },
];

const Projects = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const {
    data: customersData,
    loading: customersLoading,
  } = useApi("/Customer/GetAllCustomer");
  const {
    data: masterProjectsData,
    loading: masterProjectsLoading,
  } = useApi("/Project/GetAllProjects");

  const loadTeamMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const payload = {};
      if (filters.status) payload.status = filters.status;
      if (filters.search) payload.searchTerm = filters.search;
      const response = await getProjects(payload);
      setProjects(response ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (values) => {
    await createProject(values);
    setProjectDialogOpen(false);
    await loadProjects();
  };

  const handleEditProject = async (e, project) => {
    e.stopPropagation(); // Prevent card click
    try {
      const details = await getProjectDetails(project.projectId);
      setEditingProject(details);
      setProjectDialogOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateProject = async (values) => {
    if (!editingProject) return;
    await updateProject(editingProject.projectId, values);
    setProjectDialogOpen(false);
    setEditingProject(null);
    await loadProjects();
  };

  const handleProjectFormSubmit = async (values) => {
    if (editingProject) {
      await handleUpdateProject(values);
    } else {
      await handleCreateProject(values);
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      const details = await getProjectDetails(projectId);
      setSelectedProject(details);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedProject) return;
    await updateProjectStatus(selectedProject.projectId, status);
    const refreshed = await getProjectDetails(selectedProject.projectId);
    setSelectedProject(refreshed);
    await loadProjects();
  };

  const handleCreateTaskFromProject = () => {
    if (!selectedProject) return;
    setSelectedProject(null);
    router.push({
      pathname: "/pmo/tasks",
      query: { projectId: selectedProject.projectId },
    });
  };

  const analytics = useMemo(() => {
    const total = projects.length;
    const byStatus = projects.reduce(
      (acc, project) => {
        const key = project.statusName ?? "Unknown";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {}
    );
    return { total, byStatus };
  }, [projects]);

  return (
    <>
      <PageHeader
        title="Project Portfolio"
        subtitle="Launch, track and steer every client engagement with clarity."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setProjectDialogOpen(true)}
          >
            Add Project
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Project name or client"
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <MetricCard label="Total Projects" value={analytics.total} />
            </Grid>
            <Grid item xs={12} md={9}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {Object.entries(analytics.byStatus).map(([statusName, count]) => (
                  <Chip key={statusName} label={`${statusName}: ${count}`} />
                ))}
              </Paper>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} md={6} lg={4} key={project.projectId}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    height: "100%",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: "background.paper",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: (theme) =>
                        theme.palette.mode === "dark"
                          ? "0 20px 40px rgba(15, 23, 42, 0.35)"
                          : "0 16px 30px rgba(15, 23, 42, 0.1)",
                    },
                  }}
                  onClick={() => handleProjectClick(project.projectId)}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {project.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title="Edit Project">
                          <IconButton
                            size="small"
                            onClick={(e) => handleEditProject(e, project)}
                            sx={{
                              color: "primary.main",
                              "&:hover": {
                                bgcolor: "action.hover",
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <StatusPill label={project.statusName} />
                      </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {project.clientName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`Budget: ${
                          project.budgetAmount?.toLocaleString() ?? "N/A"
                        }`}
                      />
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={`Progress: ${project.progress}%`}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Delivery by {dayjs(project.endDate).format("MMM D, YYYY")}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
            {!projects.length ? (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: 3,
                    textAlign: "center",
                    border: (theme) => `1px dashed ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    No projects yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first project to start tracking progress.
                  </Typography>
                </Paper>
              </Grid>
            ) : null}
          </Grid>
        </>
      )}

      <ProjectFormDialog
        open={projectDialogOpen}
        onClose={() => {
          setProjectDialogOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleProjectFormSubmit}
        initialValues={editingProject ? {
          name: editingProject.name || "",
          clientName: editingProject.clientName || "",
          clientPhoneNumber: editingProject.clientPhoneNumber || "",
          clientEmail: editingProject.clientEmail || "",
          advancedAmount: editingProject.advancedAmount || null,
          budgetAmount: editingProject.budgetAmount || null,
          startDate: editingProject.startDate ? dayjs(editingProject.startDate) : dayjs(),
          endDate: editingProject.endDate ? dayjs(editingProject.endDate) : dayjs().add(7, "day"),
          primaryOwnerId: editingProject.primaryOwnerId || null,
          description: editingProject.description || "",
          notes: editingProject.notes || "",
          memberIds: editingProject.Members?.map(m => m.teamMemberId) || [],
          customerId: editingProject.customerId || null,
        } : undefined}
        title={editingProject ? "Edit Project" : "New Project"}
        teamMembers={teamMembers}
        customersData={customersData}
        customersLoading={customersLoading}
        masterProjectsData={masterProjectsData}
        masterProjectsLoading={masterProjectsLoading}
      />

      <ProjectDetailDialog
        open={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        onCreateTask={handleCreateTaskFromProject}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};

export default Projects;

