import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
import CreateWorkTrackModal from "./create";
import { ToastContainer } from "react-toastify";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";

export default function WorkTrackList() {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem("category", "153"); // Work Track
  }, []);

  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);

  const {
    data: workTracks,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchWorkTracks,
  } = usePaginatedFetch("WorkTrack/GetAllWorkTracksPaged", "", 10, false, false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedWorkTrack, setSelectedWorkTrack] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);

  const handleDeleteClick = (workTrack) => {
    setSelectedWorkTrack(workTrack);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedWorkTrack(null);
  };

  const handleDeleteWorkTrack = async () => {
    if (!selectedWorkTrack?.id) {
      toast.error("Unable to determine work track to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/WorkTrack/DeleteWorkTrack?id=${selectedWorkTrack.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      // Check if the response indicates success
      // ApiResponse has statusCode (200 = SUCCESS, -99 = FAILED) and message
      if (response.ok && (data?.statusCode === 200 || data?.statusCode === "SUCCESS" || data?.message?.toLowerCase().includes("success"))) {
        toast.success(data?.message || "Work Track deleted successfully.", { type: "success" });
        handleCloseDialog();
        fetchWorkTracks(page, search, pageSize, false);
      } else {
        throw new Error(data?.message || "Failed to delete work track");
      }
    } catch (error) {
      toast.error(error.message || "Unable to delete work track", { type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchWorkTracks(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchWorkTracks(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchWorkTracks(1, search, size, false);
  };

  const handleWorkTrackCreated = () => {
    setPage(1);
    fetchWorkTracks(1, search, pageSize, false);
    setCreateModalOpen(false);
  };

  const handleEditClick = (workTrack) => {
    router.push(`/work-track/edit/${workTrack.id}`);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Work Track</h1>
        <ul>
          <li>
            <Link href="/work-track/">Work Track</Link>
          </li>
        </ul>
      </div>
      <ToastContainer />
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search work tracks..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          {create && (
            <Button variant="contained" onClick={() => setCreateModalOpen(true)}>
              + Add Work Track
            </Button>
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="work tracks table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workTracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">No work tracks available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  workTracks.map((workTrack) => (
                    <TableRow key={workTrack.id}>
                      <TableCell>{workTrack.customerName || "-"}</TableCell>
                      <TableCell>{workTrack.projectName || "-"}</TableCell>
                      <TableCell>{workTrack.remarks || "-"}</TableCell>
                      <TableCell>{workTrack.createdByName || "-"}</TableCell>
                      <TableCell>
                        {formatDate(workTrack.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="edit work track"
                              onClick={() => handleEditClick(workTrack)}
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
                              aria-label="delete work track"
                              onClick={() => handleDeleteClick(workTrack)}
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
        <DialogTitle>Delete Work Track</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete this work track? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleDeleteWorkTrack} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {create && (
        <CreateWorkTrackModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          fetchItems={handleWorkTrackCreated}
        />
      )}
    </>
  );
}
