import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatDate } from "@/components/utils/formatHelper";

/** Must match SidebarData Matrimonial → Contact Form categoryId. */
const MATRIMONIAL_CATEGORY_CONTACT_FORMS = 225;

const statusColor = (status) => {
  const s = (status || "New").toLowerCase();
  if (s === "read") return "info";
  if (s === "replied") return "success";
  if (s === "archived") return "default";
  return "warning";
};

const field = (row, camel, pascal) => row?.[camel] ?? row?.[pascal] ?? "";

export default function MatrimonialContactForms() {
  const { navigate, update, permissionsLoading } = IsPermissionEnabled(
    MATRIMONIAL_CATEGORY_CONTACT_FORMS
  );
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusDraft, setStatusDraft] = useState("Read");
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = async (
    currentPage = page,
    currentRowsPerPage = rowsPerPage,
    currentSearch = searchTerm,
    currentStatus = statusFilter
  ) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const skipCount = currentPage * currentRowsPerPage;
      const searchValue = currentSearch?.trim() ? encodeURIComponent(currentSearch.trim()) : "null";
      let url = `${BASE_URL}/Matrimonial/GetAllContactFormsPaged?SkipCount=${skipCount}&MaxResultCount=${currentRowsPerPage}&Search=${searchValue}`;
      if (currentStatus) url += `&status=${encodeURIComponent(currentStatus)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      const wrap = data?.result ?? data?.Result ?? {};
      const items = wrap.items ?? wrap.Items ?? [];
      setItems(Array.isArray(items) ? items : []);
      setTotalCount(Number(wrap.totalCount ?? wrap.TotalCount ?? 0) || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch contact form submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("category", String(MATRIMONIAL_CATEGORY_CONTACT_FORMS));
  }, []);

  useEffect(() => {
    fetchItems(page, rowsPerPage, searchTerm, statusFilter);
  }, [page, rowsPerPage, searchTerm, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const openView = async (row) => {
    try {
      const token = localStorage.getItem("token");
      const id = row.id ?? row.Id;
      const response = await fetch(`${BASE_URL}/Matrimonial/GetContactFormById?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to load");
      const data = await response.json();
      const detail = data?.result ?? data?.Result ?? row;
      setSelected(detail);
      setStatusDraft(field(detail, "status", "Status") || "New");
      setNotesDraft(field(detail, "adminNotes", "AdminNotes") || "");
      setViewOpen(true);
    } catch {
      toast.error("Could not load submission");
    }
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Matrimonial/UpdateContactFormStatus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Id: selected.id ?? selected.Id,
          Status: statusDraft,
          AdminNotes: notesDraft,
        }),
      });
      const data = await response.json();
      if (data?.statusCode === 200 || data?.statusCode === 1) {
        toast.success("Updated");
        setViewOpen(false);
        fetchItems();
      } else {
        toast.error(data?.message || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    );
  }

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Contact Form</h1>
        <ul>
          <li>
            <Link href="/matrimonial/matrimonials/">Matrimonial</Link>
          </li>
          <li>Contact Form</li>
        </ul>
      </div>

      <ToastContainer />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search name, email, message..."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Read">Read</MenuItem>
              <MenuItem value="Replied">Replied</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table className="dark-table" sx={{ tableLayout: "fixed", minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }}>#</TableCell>
              <TableCell sx={{ width: "18%" }}>Name</TableCell>
              <TableCell sx={{ width: "20%" }}>Email</TableCell>
              <TableCell sx={{ width: "32%" }}>Message</TableCell>
              <TableCell sx={{ width: 90 }}>Status</TableCell>
              <TableCell sx={{ width: 140 }}>Submitted</TableCell>
              <TableCell align="right" sx={{ width: 80 }}>
                View
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">
                    No contact form submissions yet. Messages from the website contact page appear here.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((row, idx) => {
                const first = field(row, "firstName", "FirstName");
                const last = field(row, "lastName", "LastName");
                const name = `${first} ${last}`.trim() || "—";
                const email = field(row, "email", "Email");
                const message = field(row, "message", "Message");
                const status = field(row, "status", "Status") || "New";
                const created = row.createdOn ?? row.CreatedOn;
                return (
                  <TableRow key={row.id ?? row.Id}>
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 0,
                      }}
                    >
                      {name}
                    </TableCell>
                    <TableCell
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 0,
                      }}
                    >
                      {email}
                    </TableCell>
                    <TableCell
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 0,
                      }}
                      title={message}
                    >
                      {message.length > 80 ? `${message.slice(0, 80)}…` : message || "—"}
                    </TableCell>
                    <TableCell>
                      <Chip label={status} size="small" color={statusColor(status)} variant="outlined" />
                    </TableCell>
                    <TableCell>{created ? formatDate(created) : "—"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openView(row)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalCount > rowsPerPage && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={Math.ceil(totalCount / rowsPerPage)}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
            color="primary"
          />
        </Box>
      )}

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact form submission</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="body2">
                <strong>Name:</strong>{" "}
                {`${field(selected, "firstName", "FirstName")} ${field(selected, "lastName", "LastName")}`.trim() ||
                  "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {field(selected, "email", "Email") || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Submitted:</strong>{" "}
                {selected.createdOn || selected.CreatedOn
                  ? formatDate(selected.createdOn || selected.CreatedOn)
                  : "—"}
              </Typography>
              {field(selected, "sourcePath", "SourcePath") ? (
                <Typography variant="body2">
                  <strong>Page:</strong> {field(selected, "sourcePath", "SourcePath")}
                </Typography>
              ) : null}
              <Typography variant="body2" component="div">
                <strong>Message:</strong>
                <Box
                  mt={1}
                  p={1.5}
                  bgcolor="grey.50"
                  borderRadius={1}
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {field(selected, "message", "Message")}
                </Box>
              </Typography>
              {update ? (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusDraft}
                      label="Status"
                      onChange={(e) => setStatusDraft(e.target.value)}
                    >
                      <MenuItem value="New">New</MenuItem>
                      <MenuItem value="Read">Read</MenuItem>
                      <MenuItem value="Replied">Replied</MenuItem>
                      <MenuItem value="Archived">Archived</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Admin notes"
                    multiline
                    minRows={3}
                    fullWidth
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                  />
                </>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
          {update && selected ? (
            <Button variant="contained" onClick={saveStatus} disabled={saving}>
              {saving ? "Saving…" : "Save status"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
}
