import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Edit,
  WhatsApp,
  Visibility,
  VisibilityOff,
  ContentCopy,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import BASE_URL from "Base/api";
import CustomerCredentialsPopup from "@/components/UIElements/Modal/CustomerCredentialsPopup";
import { formatDate } from "@/components/utils/formatHelper";

/**
 * Admin "Reserved Customers" module — lists reservations that already have a
 * portal login generated. From here an admin can:
 *   - Open the reservation in the restricted edit form (payment + dressing + appts).
 *   - Re-send credentials over WhatsApp (same password if still known; otherwise issues a new one).
 */
export default function ReservedCustomersPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [credsOpen, setCredsOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [pwdMaskedById, setPwdMaskedById] = useState({});

  const fetchItems = async (pg = page, q = search, size = pageSize) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const skip = (pg - 1) * size;
      const url = `${BASE_URL}/ReservedCustomer/GetAll?SkipCount=${skip}&MaxResultCount=${size}&Search=${encodeURIComponent(q || "")}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data?.result?.items || []);
      setTotal(data?.result?.totalCount || 0);
    } catch (e) {
      toast.error("Failed to load reserved customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(1, "", pageSize);
  }, []);

  const onSearch = (v) => {
    setSearch(v);
    setPage(1);
    fetchItems(1, v, pageSize);
  };

  const openResend = (row) => {
    const stored =
      row.login?.lastIssuedPlainPassword ??
      row.login?.LastIssuedPlainPassword ??
      "";
    setCredentials({
      reservationId: row.id,
      userName: row.login?.userName || "",
      tempPassword: stored,
      email: row.login?.email || "",
      mobileNo: row.login?.mobileNo || row.mobileNo,
      customerName: row.customerName,
    });
    setCredsOpen(true);
  };

  const getStoredPassword = (row) =>
    row.login?.lastIssuedPlainPassword ??
    row.login?.LastIssuedPlainPassword ??
    "";

  const copyPassword = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success("Password copied");
  };

  const initials = (name) =>
    (name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase();

  return (
    <>
      <ToastContainer />
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "white",
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Reserved Customers
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Customers with active portal logins — edit payment/dressing/appointment
          info and re-send credentials.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              placeholder="Search by name, NIC, mobile, payment code…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Chip label={`Total: ${total}`} color="primary" variant="outlined" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "#f5f5fb" }}>
              <TableCell>Customer</TableCell>
              <TableCell>Wedding Date</TableCell>
              <TableCell>Payment Code</TableCell>
              <TableCell>Paid / Total</TableCell>
              <TableCell>Email / Password</TableCell>
              <TableCell>Last Sent</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={3}>
                    No reserved customers yet. Generate a login from a Pencil Note
                    after the advance payment is approved.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {items.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{
                        bgcolor: "#8b5cf6",
                        width: 36,
                        height: 36,
                        fontSize: 14,
                      }}
                    >
                      {initials(row.customerName)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={600}>
                        {row.customerName || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.mobileNo || "—"} · {row.nic || "—"}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{formatDate(row.reservationDate)}</TableCell>
                <TableCell>
                  {row.paymentCode ? (
                    <Chip size="small" label={row.paymentCode} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      not set
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {Number(row.paidAmount || 0).toLocaleString()} /{" "}
                    {Number(row.totalAmount || 0).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {row.login?.userName || "—"}
                  </Typography>
                  {getStoredPassword(row) ? (
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "ui-monospace, monospace",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {pwdMaskedById[row.id] === true
                          ? "••••••••"
                          : getStoredPassword(row)}
                      </Typography>
                      <Tooltip
                        title={
                          pwdMaskedById[row.id] === true
                            ? "Show password"
                            : "Hide password"
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            setPwdMaskedById((prev) => ({
                              ...prev,
                              [row.id]: prev[row.id] !== true,
                            }))
                          }
                          aria-label="toggle password visibility"
                        >
                          {pwdMaskedById[row.id] === true ? (
                            <Visibility fontSize="inherit" />
                          ) : (
                            <VisibilityOff fontSize="inherit" />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy password">
                        <IconButton
                          size="small"
                          onClick={() =>
                            copyPassword(getStoredPassword(row))
                          }
                          aria-label="copy password"
                        >
                          <ContentCopy fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      No password on file — use WhatsApp once to issue and save it here.
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {row.login?.lastCredentialsSentAt ? (
                    <Box>
                      <Typography variant="caption">
                        {formatDate(row.login.lastCredentialsSentAt)}
                      </Typography>
                      <br />
                      <Chip
                        size="small"
                        label={row.login.lastCredentialsSentChannel || "—"}
                        variant="outlined"
                      />
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      never
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit payment / dressing / appointments">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() =>
                        router.push(`/reserved-customers/${row.id}`)
                      }
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Re-send credentials via WhatsApp">
                    <IconButton
                      size="small"
                      sx={{ color: "#25D366" }}
                      onClick={() => openResend(row)}
                    >
                      <WhatsApp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container justifyContent="space-between" mt={2} mb={2}>
        <Pagination
          count={Math.ceil(total / pageSize) || 1}
          page={page}
          onChange={(e, v) => {
            setPage(v);
            fetchItems(v, search, pageSize);
          }}
          color="primary"
          shape="rounded"
        />
        <FormControl size="small" sx={{ width: 100 }}>
          <InputLabel>Page Size</InputLabel>
          <Select
            value={pageSize}
            label="Page Size"
            onChange={(e) => {
              const s = e.target.value;
              setPageSize(s);
              setPage(1);
              fetchItems(1, search, s);
            }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <CustomerCredentialsPopup
        open={credsOpen}
        onClose={() => {
          setCredsOpen(false);
          fetchItems(page, search, pageSize);
        }}
        credentials={credentials}
        variant="resend"
      />
    </>
  );
}
