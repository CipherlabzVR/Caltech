import React, { useState } from "react";
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
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import AddTemplateDialog from "./create";
import EditTemplateDialog from "./edit";
import BASE_URL from "Base/api";
import { createAuthHeaders, getOrgId } from "@/components/utils/apiHelpers";

const TEMPLATE_TYPES = ["All", "OfferLetter", "Email", "Other"];

export default function Templates() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const orgId = getOrgId() ?? 0;

  const {
    data: templateList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchTemplates,
  } = usePaginatedFetch(
    `hr/templates`,
    "",
    10,
    false,
    false,
    orgId ? `OrgId=${orgId}` : ""
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    fetchTemplates(1, e.target.value, pageSize);
  };

  const handleTypeFilterChange = (e) => {
    const val = e.target.value === "All" ? "" : e.target.value;
    setTypeFilter(e.target.value);
    setPage(1);
    const extra = [
      orgId ? `OrgId=${orgId}` : "",
      val ? `Type=${val}` : "",
    ]
      .filter(Boolean)
      .join("&");
    fetchTemplates(1, search, pageSize, extra);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    fetchTemplates(value, search, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const size = e.target.value;
    setPageSize(size);
    setPage(1);
    fetchTemplates(1, search, size);
  };

  const refresh = () => {
    setPage(1);
    fetchTemplates(1, search, pageSize);
  };

  const openDelete = (item) => {
    setDeleteId(item.id ?? item.Id);
    setDeleteName(item.name ?? item.Name ?? "");
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteId(null);
    setDeleteName("");
  };

  const handleDeleteConfirm = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/templates/${deleteId}?orgId=${orgId}`,
        { method: "DELETE", headers: createAuthHeaders() }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success(data.message || "Template deleted.");
        setDeleteId(null);
        setDeleteName("");
        refresh();
      } else {
        toast.error(data.message || "Failed to delete template.");
      }
    } catch (e) {
      toast.error(e.message || "Failed to delete template.");
    } finally {
      setDeleting(false);
    }
  };

  const typeLabel = (type) => {
    if (type === "OfferLetter") return "Offer Letter";
    return type ?? "—";
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Templates</h1>
        <ul>
          <li>
            <Link href="/master/hr/templates/">Templates</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        {/* Search */}
        <Grid item xs={12} sm={6} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by name…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        {/* Type filter */}
        <Grid item xs={12} sm={4} lg={3} order={{ xs: 3, lg: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter || "All"}
              label="Type"
              onChange={handleTypeFilterChange}
            >
              {TEMPLATE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t === "OfferLetter" ? "Offer Letter" : t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Add button */}
        <Grid
          item
          xs={12}
          lg={5}
          mb={1}
          display="flex"
          justifyContent="flex-end"
          order={{ xs: 1, lg: 3 }}
        >
          <AddTemplateDialog fetchItems={refresh} />
        </Grid>

        {/* Table */}
        <Grid item xs={12} order={{ xs: 4, lg: 4 }}>
          <TableContainer component={Paper}>
            <Table aria-label="templates-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templateList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="error">
                        No Templates Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  templateList.map((item) => {
                    const rowId = item.id ?? item.Id;
                    return (
                      <TableRow key={rowId}>
                        <TableCell>{item.name ?? item.Name ?? ""}</TableCell>
                        <TableCell>
                          {typeLabel(item.type ?? item.Type)}
                        </TableCell>
                        <TableCell>
                          {(item.isActive ?? item.IsActive) ? (
                            <span className="successBadge">Active</span>
                          ) : (
                            <span className="dangerBadge">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="flex-end"
                            gap={0.5}
                          >
                            <EditTemplateDialog item={item} fetchItems={refresh} />
                            <Tooltip title="Delete" placement="top">
                              <IconButton
                                size="small"
                                aria-label="Delete template"
                                onClick={() => openDelete(item)}
                              >
                                <DeleteIcon color="error" fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize) || 1}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handlePageSizeChange}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Delete confirm dialog */}
      <Dialog open={deleteId != null} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete template</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete
            {deleteName ? ` "${deleteName}"` : " this template"}? This cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
