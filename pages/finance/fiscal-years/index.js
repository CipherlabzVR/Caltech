import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import AddFiscalYear from "./create";
import EditFiscalYear from "./edit";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const statusChip = (status) =>
  status === 2 ? (
    <Chip label="Closed" size="small" color="default" variant="outlined" />
  ) : (
    <Chip label="Open" size="small" color="success" variant="outlined" />
  );

export default function FiscalYears() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [years, setYears] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [periodsByYear, setPeriodsByYear] = useState({});
  const [periodDrafts, setPeriodDrafts] = useState({});
  const [loadingPeriods, setLoadingPeriods] = useState({});
  const [savingPeriodId, setSavingPeriodId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  const fetchYears = async () => {
    try {
      const response = await fetch(`${BASE_URL}/FiscalYear/GetAllFiscalYears`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch fiscal years");
      const data = await response.json();
      setYears(Array.isArray(data.result) ? data.result : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fiscal years.");
    }
  };

  const fetchPeriods = async (yearId) => {
    setLoadingPeriods((prev) => ({ ...prev, [yearId]: true }));
    try {
      const response = await fetch(`${BASE_URL}/FiscalYear/GetPeriodsByYear/${yearId}`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch periods");
      const data = await response.json();
      const periods = Array.isArray(data.result) ? data.result : [];
      setPeriodsByYear((prev) => ({ ...prev, [yearId]: periods }));
      setPeriodDrafts((prev) => ({
        ...prev,
        ...Object.fromEntries(periods.map((p) => [p.id, p.status])),
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load periods.");
    } finally {
      setLoadingPeriods((prev) => ({ ...prev, [yearId]: false }));
    }
  };

  const toggleExpand = (yearId) => {
    const next = expandedId === yearId ? null : yearId;
    setExpandedId(next);
    if (next && periodsByYear[yearId] === undefined) {
      fetchPeriods(yearId);
    }
  };

  const handleGenerate = async (yearId) => {
    setGeneratingId(yearId);
    try {
      const response = await fetch(`${BASE_URL}/FiscalYear/GeneratePeriods/${yearId}`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success(data.message);
        await fetchYears();
        await fetchPeriods(yearId);
      } else {
        toast.error(data.message || "Failed to generate periods.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate periods.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSavePeriodStatus = async (period) => {
    const status = periodDrafts[period.id] ?? period.status;
    setSavingPeriodId(period.id);
    try {
      const response = await fetch(`${BASE_URL}/FiscalYear/UpdatePeriodStatus/${period.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
        headers: authHeaders(),
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success(data.message);
        await fetchPeriods(period.fiscalYearId);
      } else {
        toast.error(data.message || "Failed to update period status.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update period status.");
    } finally {
      setSavingPeriodId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fiscal year and its periods?")) return;
    try {
      const response = await fetch(`${BASE_URL}/FiscalYear/DeleteFiscalYear/${id}`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success(data.message);
        if (expandedId === id) setExpandedId(null);
        fetchYears();
      } else {
        toast.error(data.message || "Failed to delete fiscal year.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete fiscal year.");
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Fiscal Years</h1>
        <ul>
          <li>
            <Link href="/finance/fiscal-years/">Fiscal Years</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} mb={1} display="flex" justifyContent="end">
          {create ? <AddFiscalYear fetchItems={fetchYears} /> : ""}
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="fiscal years table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }}></TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {years.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">No Fiscal Years Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  years.map((year) => {
                    const periods = periodsByYear[year.id];
                    const isExpanded = expandedId === year.id;
                    return (
                      <React.Fragment key={year.id}>
                        <TableRow>
                          <TableCell>
                            <IconButton size="small" onClick={() => toggleExpand(year.id)}>
                              {isExpanded ? (
                                <ExpandLessIcon fontSize="small" />
                              ) : (
                                <ExpandMoreIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell>{year.name}</TableCell>
                          <TableCell>{formatDate(year.startDate)}</TableCell>
                          <TableCell>{formatDate(year.endDate)}</TableCell>
                          <TableCell>{statusChip(year.status)}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" justifyContent="end" gap={0.5}>
                              {update ? <EditFiscalYear item={year} fetchItems={fetchYears} /> : ""}
                              {remove ? (
                                <Tooltip title="Delete" placement="top">
                                  <IconButton size="small" onClick={() => handleDelete(year.id)}>
                                    <DeleteIcon color="error" fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                ""
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ py: 0, px: 4, backgroundColor: "action.hover" }}>
                              <Box py={1}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="subtitle2">Periods</Typography>
                                  {!loadingPeriods[year.id] && Array.isArray(periods) && periods.length === 0 && (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      disabled={generatingId === year.id}
                                      onClick={() => handleGenerate(year.id)}
                                    >
                                      Generate monthly periods
                                    </Button>
                                  )}
                                </Box>
                                {loadingPeriods[year.id] || periods === undefined ? (
                                  <Typography variant="body2">Loading periods...</Typography>
                                ) : periods.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary">
                                    No periods yet. Generate 12 monthly periods from this year&apos;s date range.
                                  </Typography>
                                ) : (
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>Start</TableCell>
                                        <TableCell>End</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Save</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {periods.map((period) => (
                                        <TableRow key={period.id}>
                                          <TableCell>{period.periodNumber}</TableCell>
                                          <TableCell>{formatDate(period.startDate)}</TableCell>
                                          <TableCell>{formatDate(period.endDate)}</TableCell>
                                          <TableCell>
                                            <TextField
                                              select
                                              size="small"
                                              value={periodDrafts[period.id] ?? period.status}
                                              onChange={(e) =>
                                                setPeriodDrafts((prev) => ({
                                                  ...prev,
                                                  [period.id]: Number(e.target.value),
                                                }))
                                              }
                                              sx={{ minWidth: 110 }}
                                            >
                                              <MenuItem value={1}>Open</MenuItem>
                                              <MenuItem value={2}>Closed</MenuItem>
                                            </TextField>
                                          </TableCell>
                                          <TableCell align="right">
                                            {update ? (
                                              <Button
                                                size="small"
                                                variant="contained"
                                                disabled={savingPeriodId === period.id}
                                                onClick={() => handleSavePeriodStatus(period)}
                                              >
                                                Save
                                              </Button>
                                            ) : (
                                              ""
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
