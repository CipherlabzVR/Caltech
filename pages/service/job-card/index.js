import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { toast, ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Catelogue } from "Base/catelogue";
import { Report } from "Base/report";
import BASE_URL from "Base/api";

const CATEGORY_ID = 208; // ServiceJobCard

// NOTE: array order MUST match the ServiceJobStatus enum (1-based) so that
// statusLabel() can map a numeric status to its name.
const STATUS_OPTIONS = [
  "Received",
  "Diagnosed",
  "AwaitingApproval",
  "Approved",
  "InProgress",
  "OnHold",
  "Ready",
  "Delivered",
  "Cancelled",
  "AwaitingPartsApproval",
  "Unrepairable",
];

const STATUS_COLOR = {
  Received: "default",
  Diagnosed: "info",
  AwaitingApproval: "warning",
  AwaitingPartsApproval: "warning",
  Approved: "primary",
  InProgress: "secondary",
  OnHold: "warning",
  Ready: "success",
  Delivered: "success",
  Cancelled: "error",
  Unrepairable: "error",
};

// Human-readable labels for statuses whose enum name is hard to read.
const STATUS_LABEL_DISPLAY = {
  AwaitingApproval: "Awaiting Customer Approval",
  AwaitingPartsApproval: "Awaiting Parts Approval",
  Unrepairable: "Can't Repair",
};

function statusLabel(value) {
  if (typeof value === "string") return value;
  return STATUS_OPTIONS[(value || 1) - 1] ?? "Received";
}

function statusDisplay(value) {
  const name = statusLabel(value);
  return STATUS_LABEL_DISPLAY[name] || name;
}

export default function JobCardList() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, update, print, customPrint, remove, whatsAppShare } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );
  const router = useRouter();

  const [confirmDelete, setConfirmDelete] = useState({ open: false, jc: null });

  // Same custom-print plumbing as /inventory/grn — uses the Report server URL.
  const { data: reportName } = GetReportSettingValueByName("ServiceJobCard");
  const currentUserName =
    typeof window !== "undefined" ? localStorage.getItem("name") || "" : "";

  const [technicianFilter, setTechnicianFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [technicians, setTechnicians] = useState([]);

  const {
    data: jobCards,
    totalCount,
    page,
    pageSize,
    search,
    filter,
    isCurrentDate,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    setIsCurrentDate,
    fetchData,
  } = usePaginatedFetch("ServiceJobCard/GetAll");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    fetch(`${BASE_URL}/WorkTrackDetail/GetTechnicians`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const items = json?.result || json?.data || [];
        setTechnicians(Array.isArray(items) ? items : []);
      })
      .catch(() => setTechnicians([]));
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    fetchData(1, e.target.value, pageSize, isCurrentDate, filter);
  };

  const handleStatusChange = (e) => {
    const val = e.target.value || "";
    setFilter(val);
    setPage(1);
    fetchData(1, search, pageSize, isCurrentDate, val);
  };

  const handlePageChange = (_e, value) => {
    setPage(value);
    fetchData(value, search, pageSize, isCurrentDate, filter);
  };

  const handlePageSizeChange = (e) => {
    const size = e.target.value;
    setPageSize(size);
    setPage(1);
    fetchData(1, search, size, isCurrentDate, filter);
  };

  const filteredRows = (jobCards || []).filter((jc) => {
    if (technicianFilter && String(jc.assignedTechnicianId || "") !== String(technicianFilter)) return false;
    if (fromDate) {
      const d = new Date(jc.receivedDate);
      if (d < new Date(fromDate)) return false;
    }
    if (toDate) {
      const d = new Date(jc.receivedDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59);
      if (d > end) return false;
    }
    return true;
  });

  const toWaNumber = (raw) => (raw ? String(raw).replace(/[^\d]/g, "") : "");

  const openWhatsApp = (jc) => {
    const phone = toWaNumber(jc.contactNo);
    if (!phone) { toast.warning("No phone number on this job card."); return; }
    const msg = [
      `Hi ${jc.customerName || "there"},`,
      `Your job card ${jc.documentNo} has been received.`,
      jc.productName ? `Device: ${jc.productName}` : null,
      `Status: ${statusLabel(jc.status)}`,
      `Thank you!`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const defaultPrintLabel = (jc) => {
    const name = statusLabel(jc.status);
    if (name === "Approved") return "Print Customer Bill";
    if (name === "Unrepairable") return "Print (Can't Repair)";
    return "Print (Default)";
  };

  // Default print — route by status (Approved → customer estimate bill).
  const openDefaultPrint = (jc) => {
    const name = statusLabel(jc.status);
    const popup = "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes";

    const query = new URLSearchParams({
      id: String(jc.id ?? ""),
      documentNumber: jc.documentNo ?? "",
    });
    if (name === "Approved") {
      query.set("type", "customer-bill");
    }
    window.open(
      `/service/job-card/print?${query.toString()}`,
      `job-card-print-${jc.id}`,
      popup
    );
  };

  // Custom print = external Report server URL (SSRS-style template).
  const customReportUrl = (jc) =>
    `${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}` +
    `&documentNumber=${encodeURIComponent(jc.documentNo || "")}` +
    `&reportName=${encodeURIComponent(reportName || "")}` +
    `&warehouseId=${jc.warehouseId || ""}` +
    `&currentUser=${encodeURIComponent(currentUserName)}`;

  const openJobCard = (jc) => router.push(`/service/job-card/${jc.id}`);

  const deleteJobCard = async () => {
    const jc = confirmDelete.jc;
    if (!jc) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      const r = await fetch(`${BASE_URL}/ServiceJobCard/Delete/${jc.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === -99) {
        toast.error(j?.message || "Delete failed.");
        return;
      }
      toast.success("Job card deleted.");
      setConfirmDelete({ open: false, jc: null });
      fetchData(page, search, pageSize, isCurrentDate, filter);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Service Job Cards</h1>
        <ul>
          <li>
            <Link href="/service/job-card/">Job Cards</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={1}>
        <Grid item xs={12} md={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by document no, customer, product or serial..."
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={6} md={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={filter || ""} label="Status" onChange={handleStatusChange}>
              <MenuItem value="">All</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_LABEL_DISPLAY[s] || s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Technician</InputLabel>
            <Select
              value={technicianFilter}
              label="Technician"
              onChange={(e) => setTechnicianFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {technicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.fullName || t.userName || t.email || `User #${t.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={1.5}>
          <TextField
            size="small"
            label="From"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </Grid>
        <Grid item xs={6} md={1.5}>
          <TextField
            size="small"
            label="To"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={1} textAlign="right">
          {create && (
            <Button
              variant="contained"
              onClick={() => router.push("/service/job-card/create-job-card")}
            >
              + New
            </Button>
          )}
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Serial</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Technician</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">No job cards</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((jc, idx) => {
                    const label = statusLabel(jc.status);
                    const techName = technicians.find((t) => t.id === jc.assignedTechnicianId);
                    return (
                      <TableRow
                        key={jc.id}
                        hover
                        style={{ cursor: "pointer" }}
                        onClick={() => openJobCard(jc)}
                      >
                        <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>{jc.documentNo}</TableCell>
                        <TableCell>{jc.customerName}</TableCell>
                        <TableCell>{jc.productName}</TableCell>
                        <TableCell>{jc.serialNumber || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={STATUS_LABEL_DISPLAY[label] || label}
                            color={STATUS_COLOR[label] || "default"}
                          />
                        </TableCell>
                        <TableCell>
                          {techName ? (techName.fullName || techName.userName || techName.email) : "-"}
                        </TableCell>
                        <TableCell>{formatDate(jc.receivedDate)}</TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            {whatsAppShare ? (
                              <Tooltip title={jc.contactNo ? "Send via WhatsApp" : "No phone number"}>
                                <span>
                                  <IconButton size="small" color="primary" onClick={() => openWhatsApp(jc)} disabled={!jc.contactNo}>
                                    <WhatsAppIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : ""}
                            {customPrint && label !== "Delivered" ? (
                              <Tooltip title="Print (Custom)" placement="top">
                                <a
                                  href={customReportUrl(jc)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconButton size="small">
                                    <DescriptionIcon color="action" fontSize="small" />
                                  </IconButton>
                                </a>
                              </Tooltip>
                            ) : null}
                            {print !== false && label !== "Delivered" ? (
                              <Tooltip title={defaultPrintLabel(jc)} placement="top">
                                <IconButton size="small" color="primary" onClick={() => openDefaultPrint(jc)}>
                                  <LocalPrintshopIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            {update && (statusLabel(jc.status) === "Received" || statusLabel(jc.status) === "Diagnosed") && (
                              <Tooltip title="Edit job card">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => router.push(`/service/job-card/edit/${jc.id}`)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {remove && (
                              <Tooltip title="Delete job card">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setConfirmDelete({ open: true, jc })}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
              <FormControl size="small" sx={{ mr: 2, width: 100 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, jc: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Job Card</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete job card{" "}
            <strong>{confirmDelete.jc?.documentNo}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Delete is only allowed before any parts/labour are issued. If stock has been issued or
            the card has been delivered, use Cancel from the detail screen instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, jc: null })}>Keep</Button>
          <Button color="error" variant="contained" onClick={deleteJobCard}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
