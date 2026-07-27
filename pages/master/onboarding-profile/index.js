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
import AddOnboardingProfileDialog from "./create";
import EditOnboardingProfileDialog from "./edit";
import BASE_URL from "Base/api";
import { createAuthHeaders } from "@/components/utils/apiHelpers";

export default function OnboardingProfiles() {
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deptNameById, setDeptNameById] = useState(() => new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/Employee/GetAlldepartment`, {
          headers: createAuthHeaders(),
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const list = json.result || json || [];
        const m = new Map();
        for (const d of list) {
          const id = d.id ?? d.Id;
          const name = (d.name ?? d.Name ?? "").trim();
          if (id != null && name) {
            m.set(Number(id), name);
          }
        }
        if (!cancelled) setDeptNameById(m);
      } catch {
        /* list still works without names */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    data: profileList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchProfiles,
  } = usePaginatedFetch("hr/onboarding-profiles", "", 10, false, false);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    fetchProfiles(1, e.target.value, pageSize);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    fetchProfiles(value, search, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const size = e.target.value;
    setPageSize(size);
    setPage(1);
    fetchProfiles(1, search, size);
  };

  const refresh = () => {
    setPage(1);
    fetchProfiles(1, search, pageSize);
  };

  const openDelete = (item) => {
    const id = item.id ?? item.Id;
    const name = item.name ?? item.Name ?? "";
    setDeleteId(id);
    setDeleteName(String(name));
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
        `${BASE_URL}/hr/onboarding-profiles/${deleteId}`,
        { method: "DELETE", headers: createAuthHeaders() }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success(data.message || "Onboarding profile deleted.");
        setDeleteId(null);
        setDeleteName("");
        fetchProfiles(page, search, pageSize);
      } else {
        toast.error(data.message || "Failed to delete profile.");
      }
    } catch (e) {
      toast.error(e.message || "Failed to delete profile.");
    } finally {
      setDeleting(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Onboarding Profiles</h1>
        <ul>
          <li>
            <Link href="/master/onboarding-profile/">Onboarding Profiles</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          <AddOnboardingProfileDialog fetchItems={refresh} />
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="onboarding-profiles-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profileList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="error">
                        No Onboarding Profiles Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  profileList.map((item) => {
                    const rowId = item.id ?? item.Id;
                    const deptId = item.departmentId ?? item.DepartmentId;
                    const deptName =
                      deptId != null && deptId !== ""
                        ? deptNameById.get(Number(deptId)) ?? "—"
                        : "—";
                    return (
                      <TableRow key={rowId}>
                        <TableCell>{item.name || item.Name || ""}</TableCell>
                        <TableCell>{deptName}</TableCell>
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
                            <EditOnboardingProfileDialog
                              item={item}
                              fetchItems={fetchProfiles}
                            />
                            <Tooltip title="Delete" placement="top">
                              <IconButton
                                size="small"
                                aria-label="Delete profile"
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
                count={Math.ceil(totalCount / pageSize)}
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

      <Dialog open={deleteId != null} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete onboarding profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete
            {deleteName ? ` “${deleteName}”` : " this profile"}? This cannot be
            undone if the profile is not in use.
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
