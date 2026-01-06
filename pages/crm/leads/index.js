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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddLeadModal from "./create";
import EditLeadModal from "./edit";
import { ToastContainer } from "react-toastify";
import Chip from "@mui/material/Chip";
import { format } from "date-fns";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const STATUS_META = {
  1: { label: "New", color: "default" },
  2: { label: "Contacted", color: "info" },
  3: { label: "Qualified", color: "primary" },
  4: { label: "Proposal", color: "warning" },
  5: { label: "Negotiation", color: "secondary" },
  6: { label: "Won", color: "success" },
  7: { label: "Lost", color: "error" },
  8: { label: "Project Created", color: "success" },
};

const SOURCE_LABELS = {
  1: "Website",
  2: "Referral",
  3: "Social",
  4: "Event",
  5: "Direct",
  6: "Other",
};

export default function LeadsList() {
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
  } = usePaginatedFetch("Leads/GetAllLeads", "", 10, false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleDeleteClick = (lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedLead(null);
  };

  const handleDeleteLead = async () => {
    if (!selectedLead?.id) {
      toast.error("Unable to determine lead to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/Leads/DeleteLead?id=${selectedLead.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete lead");
      }

      const data = await response.json();
      toast.success(data?.message || "Lead deleted successfully.");
      handleCloseDialog();
      fetchLeads(page, search, pageSize, false);
    } catch (error) {
      toast.error(error.message || "Unable to delete lead");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchLeads(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchLeads(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchLeads(1, search, size, false);
  };

  const handleLeadCreated = () => {
    setPage(1);
    fetchLeads(1, search, pageSize, false);
  };

  const renderStatusChip = (status) => {
    const meta = STATUS_META[status] || { label: "Unknown", color: "default" };
    return (
      <Chip
        label={meta.label}
        color={meta.color}
        variant={meta.color === "default" ? "outlined" : "filled"}
        size="small"
        sx={{ textTransform: "capitalize" }}
      />
    );
  };

  const renderLeadSource = (source) => SOURCE_LABELS[source] || "Unknown";

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Leads</h1>
        <ul>
          <li>
            <Link href="/crm/leads/">Leads</Link>
          </li>
        </ul>
      </div>
      <ToastContainer />
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search leads..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <AddLeadModal onLeadCreated={handleLeadCreated} />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="leads table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Lead Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Lead Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No leads available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.leadName}</TableCell>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.mobileNo}</TableCell>
                      <TableCell>{lead.accountName}</TableCell>
                      <TableCell>{renderLeadSource(lead.leadSource)}</TableCell>
                      <TableCell>{renderStatusChip(lead.leadStatus)}</TableCell>
                      <TableCell>{lead.description || "-"}</TableCell>
                      <TableCell>
                        {lead.createdOn ? format(new Date(lead.createdOn), "MMM dd, yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <EditLeadModal lead={lead} onLeadUpdated={handleLeadCreated} />
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="delete lead"
                            onClick={() => handleDeleteClick(lead)}
                          >
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
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Lead</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedLead ? selectedLead.leadName || selectedLead.fullName : "this lead"}</strong>? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteLead} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}



