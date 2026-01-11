import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
} from "@/Services/projectManagementService";

const TeamDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [team, setTeam] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteMember = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteTeamMember(deleteTarget.memberId);
      setDeleteTarget(null);
      await loadTeam();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
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
                    {member.hourlyRate != null && member.hourlyRate !== "" ? (
                      <Typography variant="caption" color="text.secondary">
                        Hourly Rate: {Number(member.hourlyRate).toLocaleString()}
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
                      <Box
                        sx={{
                          maxHeight: 280, // ~5 items visible, scroll for the rest
                          overflowY: "auto",
                          pr: 0.5,
                        }}
                      >
                        <Stack spacing={1}>
                          {[...(member.currentTasks ?? [])]
                            .sort((a, b) => {
                              const aDue = a?.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
                              const bDue = b?.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
                              return aDue - bDue; // nearest due first
                            })
                            .map((task) => (
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
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned to active tasks.
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditMember(member);
                        setDialogOpen(true);
                      }}
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteTarget(member)}
                    >
                      Delete
                    </Button>
                  </Stack>
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

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete team member?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This will remove{" "}
            <strong>{deleteTarget?.name}</strong> from the Project Crew list.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            color="inherit"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteMember}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeamDashboard;

