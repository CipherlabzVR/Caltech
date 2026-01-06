import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
import DownloadIcon from "@mui/icons-material/Download";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import { getReportData, getProjects } from "@/Services/projectManagementService";
import * as XLSX from "xlsx";

const reportTypes = [
  { label: "Financial Summary", value: 1 },
  { label: "Timeline", value: 2 },
  { label: "SDLC Phases", value: 3 },
  { label: "Project Overview", value: 4 },
  { label: "Member Allocation", value: 5 },
];

const ReportsPage = () => {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    reportType: 1,
    projectId: null,
    fromDate: "",
    toDate: "",
  });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getProjects({});
        setProjects(data ?? []);
      } catch (err) {
        setError(err.message);
      }
    };
    loadProjects();
  }, []);

  const columns = useMemo(() => {
    if (!rows?.length) return [];
    const keys = Object.keys(rows[0] ?? {});
    return keys;
  }, [rows]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const payload = {
        reportType: filters.reportType,
        projectId: filters.projectId ?? undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };
      const data = await getReportData(payload);
      setRows(data?.rows ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, "project-management-report.xlsx");
  };

  return (
    <>
      <PageHeader
        title="Reports & Downloads"
        subtitle="Export KPI sheets covering finances, timelines, SDLC and staffing."
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
        <Stack spacing={2}>
          <TextField
            select
            label="Report Type"
            value={filters.reportType}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                reportType: Number(event.target.value),
              }))
            }
            SelectProps={{ native: true }}
            sx={{ maxWidth: 320 }}
          >
            {reportTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </TextField>
          <Autocomplete
            options={projects}
            sx={{ maxWidth: 320 }}
            value={
              projects.find((project) => project.projectId === filters.projectId) ??
              null
            }
            getOptionLabel={(option) => option.name ?? ""}
            onChange={(_, newValue) =>
              setFilters((prev) => ({
                ...prev,
                projectId: newValue ? newValue.projectId : null,
              }))
            }
            renderInput={(params) => <TextField {...params} label="Project (optional)" />}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="From"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  fromDate: event.target.value,
                }))
              }
            />
            <TextField
              label="To"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.toDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  toDate: event.target.value,
                }))
              }
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={!rows.length}
            >
              Download XLSX
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Preview
        </Typography>
        {rows.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>{row[column]?.toString?.() ?? ""}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Box
            sx={{
              py: 4,
              borderRadius: 2,
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            Run a report to preview and download.
          </Box>
        )}
      </Paper>
    </>
  );
};

export default ReportsPage;

