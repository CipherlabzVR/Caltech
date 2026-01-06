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
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import { ToastContainer, toast } from "react-toastify";
import { format } from "date-fns";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddActivityModal from "./create";
import EditActivityModal from "./edit";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import useActivityTypes from "../../../hooks/useActivityTypes";
import useRelatedEntityTypes from "../../../hooks/useRelatedEntityTypes";
import useActivityStatuses from "../../../hooks/useActivityStatuses";
import useActivityPriorities from "../../../hooks/useActivityPriorities";
import useUsers from "../../../hooks/useUsers";
import BASE_URL from "Base/api";

export default function ActivitiesList() {
  const {
    data: activities,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchActivities,
  } = usePaginatedFetch("CRMActivities/GetAllCRMActivities", "", 10, false, false);

  const { types: activityTypes } = useActivityTypes();
  const { entities: relatedEntities } = useRelatedEntityTypes();
  const { statuses: activityStatuses } = useActivityStatuses();
  const { priorities: activityPriorities } = useActivityPriorities();
  const { users } = useUsers();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedActivity, setSelectedActivity] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const typeMap = React.useMemo(() => {
    const map = {};
    activityTypes.forEach((type) => {
      map[String(type.value)] = type.label;
    });
    return map;
  }, [activityTypes]);

  const relatedEntityMap = React.useMemo(() => {
    const map = {};
    relatedEntities.forEach((entity) => {
      map[String(entity.value)] = entity.label;
    });
    return map;
  }, [relatedEntities]);

  const statusMap = React.useMemo(() => {
    const map = {};
    activityStatuses.forEach((status) => {
      map[String(status.value)] = status.label;
    });
    return map;
  }, [activityStatuses]);

  const priorityMap = React.useMemo(() => {
    const map = {};
    activityPriorities.forEach((priority) => {
      map[String(priority.value)] = priority.label;
    });
    return map;
  }, [activityPriorities]);

  const userMap = React.useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[String(user.id)] = [user.firstName, user.lastName].filter(Boolean).join(" ") || `User #${user.id}`;
    });
    return map;
  }, [users]);

  const refreshActivities = React.useCallback(
    (targetPage = page) => {
      fetchActivities(targetPage, search, pageSize, false);
    },
    [fetchActivities, page, pageSize, search]
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchActivities(1, value, pageSize, false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchActivities(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchActivities(1, search, size, false);
  };

  const handleDeleteClick = (activity) => {
    setSelectedActivity(activity);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedActivity(null);
    setDeleteLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedActivity?.id) {
      toast.error("Unable to determine activity to delete.");
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`${BASE_URL}/CRMActivities/DeleteCRMActivity?id=${selectedActivity.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete activity");
      }

      toast.success(data?.message || "Activity deleted successfully.");
      handleCloseDialog();
      refreshActivities(page);
    } catch (error) {
      toast.error(error.message || "Unable to delete activity");
      setDeleteLoading(false);
    }
  };

  const normalizedActivities = React.useMemo(
    () =>
      activities.map((activity) => ({
        ...activity,
        subject: activity.subject || "",
        type: String(activity.type ?? ""),
        relatedEntityType: String(activity.relatedEntityType ?? ""),
        relatedEntityName: activity.relatedEntityName || activity.relatedEntityTypeName || "",
        assignedTo: String(activity.assignedTo ?? ""),
        status: String(activity.status ?? ""),
        priority: String(activity.priority ?? ""),
      })),
    [activities]
  );

  const formatDateValue = (value) => {
    if (!value) {
      return "-";
    }
    try {
      return format(new Date(value), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return value;
    }
  };

  const renderStatusChip = (statusValue) => {
    const label = statusMap[String(statusValue)] || "Unknown";
    const lowerLabel = label.toLowerCase();
    let chipClass = "infoBadge";

    if (lowerLabel === "completed") {
      chipClass = "successBadge";
    } else if (lowerLabel === "canceled") {
      chipClass = "dangerBadge";
    } else if (lowerLabel === "pending") {
      chipClass = "warningBadge";
    }

    return <span className={chipClass}>{label}</span>;
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Activities</h1>
        <ul>
          <li>
            <Link href="/crm/activities/">Activities</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search activities..."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          <AddActivityModal
            onActivityCreated={() => {
              setPage(1);
              refreshActivities(1);
            }}
          />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="activities table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Related To</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {normalizedActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No activities available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  normalizedActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.subject}</TableCell>
                      <TableCell>{typeMap[String(activity.type)] || activity.typeName || "-"}</TableCell>
                      <TableCell>
                        {relatedEntityMap[String(activity.relatedEntityType)] || activity.relatedEntityTypeName || "-"}
                        {activity.relatedEntityName ? ` - ${activity.relatedEntityName}` : ""}
                      </TableCell>
                      <TableCell>{userMap[String(activity.assignedTo)] || activity.assignedToName || "-"}</TableCell>
                      <TableCell>{renderStatusChip(activity.status)}</TableCell>
                      <TableCell>{priorityMap[String(activity.priority)] || activity.priorityName || "-"}</TableCell>
                      <TableCell>{formatDateValue(activity.startDate)}</TableCell>
                      <TableCell>{formatDateValue(activity.endDate)}</TableCell>
                      <TableCell align="right">
                        <EditActivityModal
                          activity={{
                            ...activity,
                            relatedTo: `${relatedEntityMap[String(activity.relatedEntityType)] || ""} - ${activity.relatedEntityName || ""}`,
                            type: activity.type,
                          }}
                          onActivityUpdated={() => refreshActivities(page)}
                        />
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="delete activity"
                            onClick={() => handleDeleteClick(activity)}
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Activity</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{selectedActivity ? selectedActivity.subject : "this activity"}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit" disabled={deleteLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}

