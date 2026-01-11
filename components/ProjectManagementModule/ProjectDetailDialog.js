import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import StatusPill from "./StatusPill";
import MetricCard from "./MetricCard";

// Category mapping for fallback display
const categoryMap = {
  1: "General",
  2: "Salary",
  3: "Server Cost",
  4: "Database Cost",
  5: "Infrastructure",
  6: "Operational Expense",
  7: "Travel",
  8: "Marketing",
  9: "Other",
  10: "Project Billing",
  11: "Change Request",
  12: "Maintenance",
  13: "Consulting",
  14: "Product Sales",
  15: "Other Income",
};

const getCategoryName = (record) => {
  if (record.categoryName) {
    return record.categoryName;
  }
  // Fallback to mapping if categoryName is not available
  return categoryMap[record.category] || record.category?.toString() || "Unknown";
};

const TabPanel = ({ value, index, children }) => {
  if (value !== index) return null;
  return (
    <Box sx={{ mt: 2 }}>
      {children}
    </Box>
  );
};

const ProjectDetailDialog = ({
  open,
  onClose,
  project,
  onCreateTask,
  onStatusChange,
}) => {
  const [tab, setTab] = useState(0);

  if (!project) {
    return null;
  }

  const {
    name,
    statusName,
    clientName,
    clientPhoneNumber,
    clientEmail,
    description,
    startDate,
    endDate,
    financialSummary,
    members,
    timeline,
    taskBoard,
    code,
    notes,
  } = project;

  const statusActions = [
    { label: "Planned", value: 1 },
    { label: "In Progress", value: 2 },
    { label: "On Hold", value: 3 },
    { label: "Completed", value: 4 },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {code}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <StatusPill label={statusName} />
          <Button variant="contained" onClick={onCreateTask}>
            Create Task
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab label="Overview" />
          <Tab label="Team & Workflow" />
          <Tab label="Financials" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Budget"
                value={`${
                  financialSummary?.totalBudget
                    ? financialSummary.totalBudget.toLocaleString()
                    : "0"
                }`}
                accent="secondary.main"
                secondary={`Advance: ${
                  financialSummary?.totalAdvance
                    ? financialSummary.totalAdvance.toLocaleString()
                    : 0
                } | Due: ${
                  financialSummary?.totalDue
                    ? financialSummary.totalDue.toLocaleString()
                    : 0
                }`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Income"
                value={`${financialSummary?.totalIncome?.toLocaleString() ?? 0}`}
                accent="primary.main"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Profit / Loss"
                value={`${financialSummary?.profitOrLoss?.toLocaleString() ?? 0}`}
                accent={
                  financialSummary?.profitOrLoss >= 0
                    ? "success.main"
                    : "error.main"
                }
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Project Brief
                </Typography>
                <List dense disablePadding>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Client"
                      secondary={clientName}
                      primaryTypographyProps={{
                        variant: "caption",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Contact"
                      secondary={
                        <>
                          {clientPhoneNumber ? (
                            <Typography variant="body2">{clientPhoneNumber}</Typography>
                          ) : null}
                          {clientEmail ? (
                            <Typography variant="body2">{clientEmail}</Typography>
                          ) : null}
                        </>
                      }
                      primaryTypographyProps={{
                        variant: "caption",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemText
                      primary="Schedule"
                      secondary={`${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()}`}
                      primaryTypographyProps={{
                        variant: "caption",
                        color: "text.secondary",
                      }}
                    />
                  </ListItem>
                </List>
                {description ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {description}
                    </Typography>
                  </Box>
                ) : null}
                {notes ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Internal Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {notes}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Timeline
                </Typography>
                {timeline && timeline.length ? (
                  <List dense disablePadding>
                    {timeline.map((item) => (
                      <ListItem
                        key={item.timelineEntryId}
                        disableGutters
                        sx={{
                          mb: 1.5,
                          alignItems: "flex-start",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2">
                                {item.phaseName}
                              </Typography>
                              {item.phaseType ? (
                                <Chip size="small" label={item.phaseType} />
                              ) : null}
                            </Stack>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(item.startDate).toLocaleDateString()} →{" "}
                                {new Date(item.endDate).toLocaleDateString()}
                              </Typography>
                              {(() => {
                                const members = item.members || [];
                                const memberNames = members.length > 0
                                  ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
                                  : item.assignedToName;
                                
                                return memberNames ? (
                                  <Typography variant="body2">
                                    {memberNames}
                                  </Typography>
                                ) : null;
                              })()}
                              {item.notes ? (
                                <Typography variant="body2" color="text.secondary">
                                  {item.notes}
                                </Typography>
                              ) : null}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Timeline has not been defined yet.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Team Members</Typography>
                </Stack>
                {members && members.length ? (
                  <List dense disablePadding>
                    {members.map((member) => (
                      <ListItem key={member.teamMemberId} disableGutters sx={{ py: 1.2 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle2">{member.name}</Typography>
                              {member.role ? (
                                <Chip size="small" label={member.role} variant="outlined" />
                              ) : null}
                            </Stack>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {member.position ?? "Member"}
                            </Typography>
                          }
                        />
                        {onStatusChange ? null : null}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No members assigned yet.
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Workflow Snapshot
                </Typography>
                {taskBoard?.columns && taskBoard.columns.length ? (
                  <Stack spacing={1.5}>
                    {taskBoard.columns.map((column) => (
                      <Box
                        key={column.columnId}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "background.default",
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="subtitle2">
                            {column.title || "Untitled Column"}
                          </Typography>
                          <Chip
                            label={`${(column.cards || []).length} tasks`}
                            size="small"
                          />
                        </Stack>

                        {(column.cards || []).length ? (
                          <List dense disablePadding>
                            {column.cards.map((task) => (
                              <ListItem
                                key={task.taskId}
                                disableGutters
                                sx={{
                                  py: 0.5,
                                  borderTop: (theme) =>
                                    `1px dashed ${theme.palette.divider}`,
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {task.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      flexWrap="wrap"
                                      sx={{ mt: 0.25 }}
                                    >
                                      {task.assignedToName ? (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {task.assignedToName}
                                        </Typography>
                                      ) : null}
                                      {task.dueDate ? (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          Due:{" "}
                                          {new Date(task.dueDate).toLocaleDateString()}
                                        </Typography>
                                      ) : null}
                                      {typeof task.progressPercentage === "number" ? (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {Math.round(task.progressPercentage)}%
                                        </Typography>
                                      ) : null}
                                    </Stack>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No tasks in this column.
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tasks created yet.
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "background.default",
                  border: (theme) => `1px dashed ${theme.palette.divider}`,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Update Status:
                </Typography>
                {statusActions.map((action) => (
                  <Chip
                    key={action.value}
                    label={action.label}
                    variant="outlined"
                    onClick={() => onStatusChange?.(action.value)}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Total Expenses"
                value={`${financialSummary?.totalExpenses?.toLocaleString() ?? 0}`}
                accent="error.main"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Total Income"
                value={`${financialSummary?.totalIncome?.toLocaleString() ?? 0}`}
                accent="primary.main"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Net Result"
                value={`${financialSummary?.profitOrLoss?.toLocaleString() ?? 0}`}
                accent={
                  financialSummary?.profitOrLoss >= 0
                    ? "success.main"
                    : "error.main"
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Financial Records
            </Typography>
            {project.financialRecords && project.financialRecords.length ? (
              <List dense disablePadding>
                {project.financialRecords.slice(0, 6).map((record) => (
                  <ListItem
                    key={record.financialRecordId}
                    disableGutters
                    sx={{
                      py: 1.2,
                      borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">
                            {getCategoryName(record)}
                          </Typography>
                          <Chip
                            label={record.recordType === 1 ? "Income" : "Expense"}
                            color={record.recordType === 1 ? "success" : "error"}
                            size="small"
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {record.notes || "No remarks"}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="subtitle2"
                      color={record.recordType === 1 ? "success.main" : "error.main"}
                    >
                      {record.recordType === 1 ? "+" : "-"}
                      {record.amount.toLocaleString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No financial records captured yet.
              </Typography>
            )}
          </Box>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;

