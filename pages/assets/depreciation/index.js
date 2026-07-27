import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Pagination,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import BASE_URL from "Base/api";
import ViewDepreciationRun from "../depreciation-runs/view";
import ViewDepreciationSchedule from "../depreciation-schedules/view";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 450, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
};

const runStatusColor = (status) => {
  if (status === "SUCCESS") return "success";
  if (status === "PARTIAL") return "warning";
  if (status === "FAILED") return "error";
  return "default";
};

const scheduleStatusConfig = (status) => {
  const map = {
    1: { label: "Projected", color: "info" },
    2: { label: "Posted", color: "success" },
    3: { label: "Reversed", color: "error" },
  };
  return map[status] || { label: "Unknown", color: "default" };
};

function CreateRunModal({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    PeriodYear: new Date().getFullYear(),
    PeriodMonth: new Date().getMonth() + 1,
    EntityId: 1,
  });

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/depreciation/runs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          PeriodYear: Number(values.PeriodYear),
          PeriodMonth: Number(values.PeriodMonth),
          EntityId: Number(values.EntityId),
        }),
      });
      const data = await response.json();
      if (response.ok && (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")) {
        toast.success(data.message || "Depreciation run completed");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Depreciation run failed");
      }
    } catch (error) {
      console.error("Depreciation run error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>+ New Run</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Run Depreciation</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Period Year" value={values.PeriodYear} onChange={(e) => setValue("PeriodYear", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Period Month" value={values.PeriodMonth} onChange={(e) => setValue("PeriodMonth", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Entity Id" value={values.EntityId} onChange={(e) => setValue("EntityId", e.target.value)} />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" color="error" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Running..." : "Run"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

function DepreciationRunsTab({ create, update, print }) {
  const { data: runs, totalCount, page, pageSize, search, setPage, setPageSize, setSearch, fetchData } =
    usePaginatedFetch("depreciation/runs", "", 10, false, false);

  const refreshList = () => fetchData(page, search, pageSize);
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchData(1, value, pageSize);
  };

  return (
    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
      <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
        <Search className="search-form">
          <StyledInputBase placeholder="Search status or error..." value={search} onChange={handleSearchChange} />
        </Search>
      </Grid>
      <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
        {create && <CreateRunModal fetchItems={refreshList} />}
      </Grid>
      <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
        <TableContainer component={Paper}>
          <Table className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell><TableCell>Period</TableCell><TableCell>Entity</TableCell><TableCell>Started</TableCell><TableCell>Processed</TableCell><TableCell>Skipped</TableCell><TableCell>Failed</TableCell><TableCell>Total Depreciation</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center"><Typography color="error">No Depreciation Runs Available</Typography></TableCell></TableRow>
              ) : runs.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                  <TableCell>{item.periodYear}/{item.periodMonth}</TableCell>
                  <TableCell>{item.entityId}</TableCell>
                  <TableCell>{item.runStartedOn ? new Date(item.runStartedOn).toLocaleString() : "—"}</TableCell>
                  <TableCell>{item.totalAssetsProcessed}</TableCell>
                  <TableCell>{item.totalAssetsSkipped}</TableCell>
                  <TableCell>{item.totalAssetsFailed}</TableCell>
                  <TableCell>{item.totalDepreciationPosted}</TableCell>
                  <TableCell><Chip size="small" label={item.runStatus || "UNKNOWN"} color={runStatusColor(item.runStatus)} /></TableCell>
                  <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                      {print && <ViewDepreciationRun item={item} fetchItems={refreshList} canUpdate={update} />}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Grid container justifyContent="space-between" mt={2} mb={2}>
            <Pagination count={Math.ceil(totalCount / pageSize) || 1} page={page} onChange={(_, value) => { setPage(value); fetchData(value, search, pageSize); }} color="primary" shape="rounded" />
            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
              <InputLabel>Page Size</InputLabel>
              <Select value={pageSize} label="Page Size" onChange={(e) => { setPageSize(e.target.value); setPage(1); fetchData(1, search, e.target.value); }}>
                <MenuItem value={5}>5</MenuItem><MenuItem value={10}>10</MenuItem><MenuItem value={25}>25</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

function DepreciationSchedulesTab({ print }) {
  const { data: schedules, totalCount, page, pageSize, search, setPage, setPageSize, setSearch, fetchData } =
    usePaginatedFetch("depreciation/schedules", "", 10, false, false);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchData(1, value, pageSize);
  };

  return (
    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
      <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
        <Search className="search-form">
          <StyledInputBase placeholder="Search asset or notes..." value={search} onChange={handleSearchChange} />
        </Search>
      </Grid>
      <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }} />
      <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
        <TableContainer component={Paper}>
          <Table className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell><TableCell>Asset</TableCell><TableCell>Period</TableCell><TableCell>Opening NBV</TableCell><TableCell>Depreciation</TableCell><TableCell>Closing NBV</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center"><Typography color="error">No Depreciation Schedules Available</Typography></TableCell></TableRow>
              ) : schedules.map((item, index) => {
                const status = scheduleStatusConfig(item.status);
                return (
                  <TableRow key={item.id}>
                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight="bold">{item.asset?.assetCode}</Typography><Typography variant="caption">{item.asset?.assetName}</Typography></TableCell>
                    <TableCell>{item.periodYear}/{item.periodMonth}</TableCell>
                    <TableCell>{item.openingNetBookValue}</TableCell>
                    <TableCell>{item.depreciationAmount}</TableCell>
                    <TableCell>{item.closingNetBookValue}</TableCell>
                    <TableCell><Chip size="small" label={status.label} color={status.color} /></TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={0.5}>
                        {print && <ViewDepreciationSchedule item={item} />}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Grid container justifyContent="space-between" mt={2} mb={2}>
            <Pagination count={Math.ceil(totalCount / pageSize) || 1} page={page} onChange={(_, value) => { setPage(value); fetchData(value, search, pageSize); }} color="primary" shape="rounded" />
            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
              <InputLabel>Page Size</InputLabel>
              <Select value={pageSize} label="Page Size" onChange={(e) => { setPageSize(e.target.value); setPage(1); fetchData(1, search, e.target.value); }}>
                <MenuItem value={5}>5</MenuItem><MenuItem value={10}>10</MenuItem><MenuItem value={25}>25</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export default function Depreciation() {
  const [tab, setTab] = useState(0);
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, print } = IsPermissionEnabled(cId);

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Depreciation</h1>
        <ul><li><Link href="/assets/asset">Assets Registry</Link></li><li>Depreciation</li></ul>
      </div>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
          <Tab label="Depreciation Runs" />
          <Tab label="Depreciation Schedules" />
        </Tabs>
      </Paper>
      {tab === 0 && <DepreciationRunsTab create={create} update={update} print={print} />}
      {tab === 1 && <DepreciationSchedulesTab print={print} />}
    </>
  );
}
