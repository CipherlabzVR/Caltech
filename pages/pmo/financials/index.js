import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import MetricCard from "@/components/ProjectManagementModule/MetricCard";
import FinancialRecordFormDialog from "@/components/ProjectManagementModule/FinancialRecordFormDialog";
import {
  createFinancialRecord,
  deleteFinancialRecord,
  updateFinancialRecord,
  getFinancialRecords,
  getFinancialSummary,
  getProjects,
  getTeamMembers,
} from "@/Services/projectManagementService";

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

const FinancialsPage = () => {
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordDefaults, setRecordDefaults] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
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

  const loadTeamMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadFinancials = useCallback(
    async (projectId) => {
      if (!projectId) return;
      try {
        const [summaryResponse, recordsResponse] = await Promise.all([
          getFinancialSummary(projectId),
          getFinancialRecords(projectId),
        ]);
        setSummary(summaryResponse);
        setRecords(recordsResponse ?? []);
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
      loadFinancials(selectedProject.projectId);
    }
  }, [selectedProject, loadFinancials]);

  const handleCreateRecord = async (values) => {
    if (!selectedProject) return;
    await createFinancialRecord({
      ...values,
      projectId: selectedProject.projectId,
    });
    setDialogOpen(false);
    setRecordDefaults(null);
    setEditingRecord(null);
    await loadFinancials(selectedProject.projectId);
  };

  const handleUpdateRecord = async (values) => {
    if (!editingRecord) return;
    await updateFinancialRecord(editingRecord.financialRecordId, values);
    setDialogOpen(false);
    setRecordDefaults(null);
    setEditingRecord(null);
    await loadFinancials(selectedProject.projectId);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setRecordDefaults({
      recordType: record.recordType,
      category: record.category,
      amount: record.amount,
      recordDate: new Date(record.recordDate).toISOString(),
      relatedMemberId: record.relatedMemberId || null,
      reference: record.reference || "",
      notes: record.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteRecord = async (recordId) => {
    await deleteFinancialRecord(recordId);
    await loadFinancials(selectedProject.projectId);
  };

  const totals = useMemo(() => {
    const income = records
      .filter((record) => record.recordType === 1)
      .reduce((acc, record) => acc + record.amount, 0);
    const expense = records
      .filter((record) => record.recordType === 2)
      .reduce((acc, record) => acc + record.amount, 0);
    return { income, expense };
  }, [records]);

  const handleOpenRecordDialog = (recordType) => {
    setRecordDefaults({
      recordType,
      category: 1,
      amount: 0,
      recordDate: new Date().toISOString(),
      relatedMemberId: null,
      reference: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const budget =
    summary?.totalBudget ??
    selectedProject?.budgetAmount ??
    selectedProject?.fullAmount ??
    0;
  const advance =
    summary?.totalAdvance ?? selectedProject?.advancedAmount ?? 0;
  const due =
    summary?.totalDue ?? Math.max((summary?.totalBudget ?? budget) - advance, 0);

  const incomeTotal = totals.income;
  const expenseTotal = totals.expense;
  const ledgerNet = incomeTotal - expenseTotal;

  const profit =
    summary?.profitOrLoss ??
    ((summary?.totalIncome ?? budget + incomeTotal) - expenseTotal);

  return (
    <>
      <PageHeader
        title="Financial Control"
        subtitle="Track budget utilisation, burn rate and net profitability per project."
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
          renderInput={(params) => <TextField {...params} label="Select Project" />}
        />
      </Paper>

      {selectedProject ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Project Budget"
                value={budget.toLocaleString()}
                accent="primary.main"
                secondary={`Advance: ${advance.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Due Amount"
                value={due.toLocaleString()}
                accent="warning.main"
                secondary="Budget - Advanced"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Ledger Expenses"
                value={expenseTotal.toLocaleString()}
                accent="error.main"
                secondary="Sum of expense records"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Profit"
                value={profit.toLocaleString()}
                accent={profit >= 0 ? "success.main" : "error.main"}
                secondary="Budget - Expenses"
              />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Ledger
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Button
                variant="contained"
                color="error"
                startIcon={<AddIcon />}
                onClick={() => handleOpenRecordDialog(2)}
              >
                Add Expense
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => handleOpenRecordDialog(1)}
              >
                Add Income
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.financialRecordId}>
                    <TableCell>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 999,
                          display: "inline-flex",
                          bgcolor:
                            record.recordType === 1
                              ? "success.light"
                              : "error.light",
                          color:
                            record.recordType === 1
                              ? "success.dark"
                              : "error.dark",
                          fontWeight: 600,
                        }}
                      >
                        {record.recordType === 1 ? "Income" : "Expense"}
                      </Box>
                    </TableCell>
                    <TableCell>{getCategoryName(record)}</TableCell>
                    <TableCell>{record.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(record.recordDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.reference ?? "—"}</TableCell>
                    <TableCell>{record.relatedMemberName ?? "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditRecord(record)}
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteRecord(record.financialRecordId)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!records.length ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box
                        sx={{
                          py: 4,
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        No records found. Start logging advances, salaries, infra and
                        other costs.
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <Stack direction="row" justifyContent="flex-end" spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body2">
                Ledger Income: <strong>{incomeTotal.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2">
                Ledger Expenses: <strong>{expenseTotal.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2">
                Income - Expense: <strong>{ledgerNet.toLocaleString()}</strong>
              </Typography>
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
          }}
        >
          Select a project to view financial details.
        </Box>
      )}

      <FinancialRecordFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setRecordDefaults(null);
          setEditingRecord(null);
        }}
        onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
        teamMembers={teamMembers}
        initialValues={recordDefaults ?? undefined}
        title={
          editingRecord
            ? editingRecord.recordType === 1
              ? "Edit Income"
              : "Edit Expense"
            : recordDefaults?.recordType === 1
            ? "Add Income"
            : recordDefaults?.recordType === 2
            ? "Add Expense"
            : "New Financial Record"
        }
      />
    </>
  );
};

export default FinancialsPage;

