import React, { useEffect } from "react";
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
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Box, FormControl, InputLabel, MenuItem, Pagination, Select } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import CreateProjectModal from "./create";
import EditProjectModal from "./edit";
import { ToastContainer } from "react-toastify";
import Chip from "@mui/material/Chip";
import { format } from "date-fns";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";

const STATUS_META = {
  1: { label: "Open", color: "primary" },
  2: { label: "Closed", color: "default" },
  3: { label: "In Progress", color: "info" },
  4: { label: "Completed", color: "success" },
  5: { label: "Cancelled", color: "error" },
};

export default function ProjectsList() {
  useEffect(() => {
    sessionStorage.setItem("category", "53"); // Projects (Master Data)
  }, []);

  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);

  const {
    data: projects,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchProjects,
  } = usePaginatedFetch("Project/GetAllProjectsPaged", "", 10, false, false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState(null);

  const handleDeleteClick = (project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject?.id) {
      toast.error("Unable to determine project to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/Project/DeleteProject?id=${selectedProject.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete project");
      }

      const data = await response.json();
      toast.success(data?.message || "Project deleted successfully.");
      handleCloseDialog();
      fetchProjects(page, search, pageSize, false);
    } catch (error) {
      toast.error(error.message || "Unable to delete project");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchProjects(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchProjects(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchProjects(1, search, size, false);
  };

  const handleProjectCreated = () => {
    setPage(1);
    fetchProjects(1, search, pageSize, false);
    setCreateModalOpen(false);
  };

  const handleProjectUpdated = () => {
    fetchProjects(page, search, pageSize, false);
    setEditModalOpen(false);
    setEditProject(null);
  };

  const handleEditClick = (project) => {
    setEditProject(project);
    setEditModalOpen(true);
  };

  const renderStatusChip = (status) => {
    const statusValue = typeof status === "number" ? status : Number(status);
    const meta = STATUS_META[statusValue] || { label: "Open", color: "default" };
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

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Projects</h1>
        <ul>
          <li>
            <Link href="/master/projects/">Projects</Link>
          </li>
        </ul>
      </div>
      <ToastContainer />
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search projects..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          {create && (
            <Button variant="contained" onClick={() => setCreateModalOpen(true)}>
              + Add Project
            </Button>
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="projects table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No projects available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.description || "-"}</TableCell>
                      <TableCell>{renderStatusChip(project.status)}</TableCell>
                      <TableCell>{project.customerName || "-"}</TableCell>
                      <TableCell>{project.assignedToName || "-"}</TableCell>
                      <TableCell>{project.createdByName || "-"}</TableCell>
                      <TableCell>
                        {formatDate(project.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="edit project"
                              onClick={() => handleEditClick(project)}
                            >
                              <BorderColorIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              aria-label="delete project"
                              onClick={() => handleDeleteClick(project)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
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
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedProject ? selectedProject.name || "this project" : "this project"}</strong>? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {create && (
        <CreateProjectModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          fetchItems={handleProjectCreated}
        />
      )}

      {update && editProject && (
        <EditProjectModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditProject(null);
          }}
          project={editProject}
          fetchItems={handleProjectUpdated}
        />
      )}
    </>
  );
}
