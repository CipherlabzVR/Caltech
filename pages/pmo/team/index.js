import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import MetricCard from "@/components/ProjectManagementModule/MetricCard";
import TeamMemberFormDialog from "@/components/ProjectManagementModule/TeamMemberFormDialog";
import {
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
} from "@/Services/projectManagementService";

const TeamDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers();
      setTeam(data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleCreateMember = async (values) => {
    if (editMember) {
      await updateTeamMember(editMember.memberId, values);
    } else {
      await createTeamMember(values);
    }
    setDialogOpen(false);
    setEditMember(null);
    await loadTeam();
  };

  const metrics = useMemo(() => {
    const total = team.length;
    const active = team.filter((member) => member.isActive).length;
    const capacity = team.reduce((acc, member) => acc + member.activeTaskCount, 0);
    const completed = team.reduce(
      (acc, member) => acc + member.completedTaskCount,
      0
    );
    return { total, active, capacity, completed };
  }, [team]);

  return (
    <>
      <PageHeader
        title="Project Crew"
        subtitle="Dedicated resource pool for project delivery (independent of system users)."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditMember(null);
              setDialogOpen(true);
            }}
          >
            Register Member
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <MetricCard label="Total Members" value={metrics.total} />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Active"
                value={metrics.active}
                accent="success.main"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Live Tasks"
                value={metrics.capacity}
                accent="primary.main"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Completed Tasks"
                value={metrics.completed}
                accent="secondary.main"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {team.map((member) => (
              <Grid item xs={12} md={6} lg={4} key={member.memberId}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.position ?? "Contributor"}
                      </Typography>
                    </Box>
                    <Chip
                      label={member.isActive ? "Active" : "Inactive"}
                      color={member.isActive ? "success" : "default"}
                      size="small"
                    />
                  </Stack>
                  <Stack spacing={0.5}>
                    {member.email ? (
                      <Typography variant="body2">{member.email}</Typography>
                    ) : null}
                    {member.mobileNumber ? (
                      <Typography variant="body2">{member.mobileNumber}</Typography>
                    ) : null}
                    {member.employeeId ? (
                      <Typography variant="caption" color="text.secondary">
                        Emp ID: {member.employeeId}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`In progress: ${member.activeTaskCount}`}
                      variant="outlined"
                      color="primary"
                    />
                    <Chip
                      label={`Completed: ${member.completedTaskCount}`}
                      variant="outlined"
                      color="success"
                    />
                  </Stack>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Current Focus
                    </Typography>
                    {member.currentTasks && member.currentTasks.length ? (
                      <Stack spacing={1}>
                        {member.currentTasks.map((task) => (
                          <Box
                            key={task.taskId}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: "background.default",
                              border: (theme) => `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {task.taskTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.projectName}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned to active tasks.
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setEditMember(member);
                      setDialogOpen(true);
                    }}
                  >
                    Manage
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <TeamMemberFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditMember(null);
        }}
        initialValues={editMember ? { ...editMember } : undefined}
        onSubmit={handleCreateMember}
        title={editMember ? "Update Member" : "Register Member"}
      />
    </>
  );
};

export default TeamDashboard;

