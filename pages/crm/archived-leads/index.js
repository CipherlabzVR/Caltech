import React from "react";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { ToastContainer, toast } from "react-toastify";
import { format } from "date-fns";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";

export default function ArchivedLeadsPage() {
  const {
    data: leads,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchLeads,
  } = usePaginatedFetch("Leads/GetArchivedLeads", "", 10, false);

  const [restoreTarget, setRestoreTarget] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [working, setWorking] = React.useState(false);

  const refresh = () => fetchLeads(page, search, pageSize, false);

  const onSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    setPage(1);
    fetchLeads(1, v, pageSize, false);
  };

  const onPageChange = (_e, value) => {
    setPage(value);
    fetchLeads(value, search, pageSize, false);
  };

  const onPageSizeChange = (e) => {
    const size = e.target.value;
    setPageSize(size);
    setPage(1);
    fetchLeads(1, search, size, false);
  };

  const handleRestore = async () => {
    if (!restoreTarget?.id) return;
    try {
      setWorking(true);
      const res = await fetch(`${BASE_URL}/Leads/RestoreLead?id=${restoreTarget.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to restore lead");
      }
      toast.success(data?.message || "Lead restored.");
      setRestoreTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.message || "Unable to restore lead");
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setWorking(true);
      const res = await fetch(`${BASE_URL}/Leads/DeleteLead?id=${deleteTarget.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to delete lead");
      }
      toast.success(data?.message || "Lead deleted.");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.message || "Unable to delete lead");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Archived Leads</h1>
        <ul>
          <li>
            <Link href="/crm/archived-leads/">Archived Leads</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search archived leads..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={onSearch}
            />
          </Search>
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="archived leads table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Lead Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Last Stage</TableCell>
                  <TableCell>Archived On</TableCell>
                  <TableCell>Archived By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="text.secondary">No archived leads.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.leadName}</TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.mobileNo}</TableCell>
                      <TableCell>
                        {lead.campaignName ? (
                          <Chip size="small" label={lead.campaignName} variant="outlined" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{lead.leadStatusName || "-"}</TableCell>
                      <TableCell>
                        {lead.archivedOn ? format(new Date(lead.archivedOn), "MMM dd, yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell>{lead.archivedByName || "-"}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Restore">
                          <IconButton size="small" color="primary" onClick={() => setRestoreTarget(lead)}>
                            <RestoreIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete permanently">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(lead)}>
                            <DeleteOutlineIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
                page={page}
                onChange={onPageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={onPageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={!!restoreTarget} onClose={() => setRestoreTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Restore Lead</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Restore <strong>{restoreTarget?.leadName}</strong> back to the active board?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreTarget(null)} color="inherit" disabled={working}>Cancel</Button>
          <Button onClick={handleRestore} color="primary" variant="contained" disabled={working}>
            {working ? "Restoring..." : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Lead Permanently</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Permanently delete <strong>{deleteTarget?.leadName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={working}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={working}>
            {working ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
