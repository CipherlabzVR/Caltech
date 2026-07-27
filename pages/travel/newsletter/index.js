import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import * as XLSX from "xlsx";
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Stack,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { masterCategoryContainedButtonSx } from "@/styles/masterCategoryButtons";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import EmailIcon from "@mui/icons-material/Email";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const isOk = (res) => res?.statusCode === 200 || res?.statusCode === 1;

const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

/** Sri Lanka (Asia/Colombo) — same wall-clock time for all back-office users */
const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("en-LK", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
};

export default function NewsletterSubscribers() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, update, remove } = IsPermissionEnabled(cId);

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/TravelNewsletter/GetAllSubscribers`, {
        method: "GET",
        headers: authJsonHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch subscribers");
      const data = await response.json();
      setSubscribers(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const siteOptions = useMemo(() => {
    const set = new Set();
    subscribers.forEach((s) => {
      if (s.siteKey) set.add(s.siteKey);
    });
    return Array.from(set).sort();
  }, [subscribers]);

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      if (statusFilter === "active" && !s.isActive) return false;
      if (statusFilter === "inactive" && s.isActive) return false;
      if (siteFilter !== "all") {
        const key = s.siteKey || "";
        if (siteFilter === "__none__" ? key !== "" : key !== siteFilter) return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.trim().toLowerCase();
      return (
        (s.email || "").toLowerCase().includes(q) ||
        (s.sourcePath || "").toLowerCase().includes(q) ||
        (s.siteKey || "").toLowerCase().includes(q)
      );
    });
  }, [subscribers, statusFilter, siteFilter, searchTerm]);

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const activeCount = subscribers.filter((s) => s.isActive).length;

  // ---------- Toggle status ----------

  const handleToggle = async (row, isActive) => {
    try {
      const response = await fetch(`${BASE_URL}/TravelNewsletter/ToggleStatus`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ id: row.id, isActive }),
      });
      const data = await response.json();
      if (!isOk(data)) throw new Error(data?.message || "Failed to update");
      setSubscribers((list) =>
        list.map((x) =>
          x.id === row.id
            ? { ...x, isActive, unsubscribedOn: isActive ? null : new Date().toISOString() }
            : x
        )
      );
      toast.success(isActive ? "Subscriber re-activated" : "Subscriber unsubscribed");
    } catch (err) {
      toast.error(err.message || "Failed to update");
    }
  };

  // ---------- Delete ----------

  const openDelete = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `${BASE_URL}/TravelNewsletter/DeleteSubscriber?id=${toDelete.id}`,
        { method: "POST", headers: authJsonHeaders() }
      );
      const data = await response.json();
      if (!isOk(data)) throw new Error(data?.message || "Failed to delete");
      toast.success("Subscriber deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ---------- Export ----------

  const handleCopyAllEmails = () => {
    const emails = filtered.filter((s) => s.isActive).map((s) => s.email).join(", ");
    if (!emails) {
      toast.info("No active emails to copy.");
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(emails);
      toast.success(`Copied ${emails.split(", ").length} emails to clipboard`);
    }
  };

  const handleExportExcel = () => {
    const data = filtered.map((s, idx) => ({
      "#": idx + 1,
      Email: s.email,
      "Source Site": s.siteKey || "",
      Status: s.isActive ? "Active" : "Unsubscribed",
      "Source Path": s.sourcePath || "",
      "Subscribed On": s.createdOn ? formatDate(s.createdOn) : "",
      "Unsubscribed On": s.unsubscribedOn ? formatDate(s.unsubscribedOn) : "",
      "IP Address": s.ipAddress || "",
      "User Agent": s.userAgent || "",
    }));

    if (data.length === 0) {
      toast.info("No subscribers to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    // Auto-size columns roughly based on header + sample content
    const colWidths = Object.keys(data[0]).map((key) => {
      const maxContentLen = Math.max(
        key.length,
        ...data.slice(0, 100).map((r) => String(r[key] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxContentLen + 2, 12), 60) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscribers");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Travel_Newsletter_Subscribers_${stamp}.xlsx`);
    toast.success(`Exported ${data.length} subscriber(s)`);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>
          Newsletter Subscribers{" "}
          <Chip
            label={`${activeCount} active / ${subscribers.length} total`}
            size="small"
            sx={{ ml: 1, verticalAlign: "middle" }}
          />
        </h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Travel</li>
          <li>
            <Link href="/travel/newsletter/">Newsletter</Link>
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
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
          alignItems="center"
          gap={1}
          order={{ xs: 1, lg: 2 }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>Source Site</InputLabel>
            <Select
              value={siteFilter}
              label="Source Site"
              onChange={(e) => {
                setSiteFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All sites</MenuItem>
              {siteOptions.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
              <MenuItem value="__none__">(no source)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 170 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active only</MenuItem>
              <MenuItem value="inactive">Unsubscribed only</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchAll} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            onClick={handleCopyAllEmails}
            disabled={loading || filtered.length === 0}
          >
            Copy Emails
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportExcel}
            disabled={loading || filtered.length === 0}
          >
            Download Excel
          </Button>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>

          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Subscribed On</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Source Site</TableCell>
                  <TableCell>Source Page</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Unsubscribed On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary">No subscribers found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{formatDate(row.createdOn)}</TableCell>
                      <TableCell>
                        <a href={`mailto:${row.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                          <EmailIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                          {row.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {row.siteKey ? (
                          <Chip label={row.siteKey} size="small" variant="outlined" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{row.sourcePath || "-"}</TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={!!row.isActive}
                          disabled={!update}
                          onChange={(e) => handleToggle(row, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>{row.unsubscribedOn ? formatDate(row.unsubscribedOn) : "-"}</TableCell>
                      <TableCell align="right">
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDelete(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
              <Pagination
                count={Math.max(1, Math.ceil(filtered.length / rowsPerPage))}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Page Size"
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* ===== Delete Confirm ===== */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete Subscriber</DialogTitle>
        <DialogContent>
          Are you sure you want to permanently delete &quot;{toDelete?.email}&quot;?
          <br />
          <Typography variant="caption" color="textSecondary">
            Tip: use the Active toggle to soft-unsubscribe instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}
