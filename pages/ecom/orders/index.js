import React, { useEffect, useMemo, useState } from "react";
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
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Box,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  TextField,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import UndoIcon from "@mui/icons-material/Undo";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency } from "@/components/utils/formatHelper";
import { formatDate } from "@fullcalendar/core";
import Chip from "@mui/material/Chip";
import BASE_URL from "Base/api";

const STATUS_TABS = [
  { value: "1", label: "Queued" },
  { value: "2", label: "In Progress" },
  { value: "3", label: "Dispatched" },
  { value: "4", label: "Delivered" },
  { value: "5", label: "Completed" },
  { value: "all", label: "All" },
];

const ORDER_FLOW_STEPS = [
  "Queued",
  "In Progress",
  "Dispatched",
  "Delivered",
  "Completed",
];

function extraQueryForStatusTab(tabValue) {
  return tabValue === "all" ? {} : { OrderStatus: Number(tabValue) };
}

function formatStatusHistoryAction(action) {
  const a = (action ?? "").trim();
  if (a === "Created") return "Order placed";
  if (a === "Advance") return "Status advanced";
  if (a === "Revert") return "Status reverted";
  if (a === "CustomerConfirm") return "Customer confirmed completion";
  return a || "Update";
}

/** Short, friendly labels + icon + MUI palette key for accents */
function getStatusHistoryVisuals(action) {
  const a = (action ?? "").trim();
  if (a === "Created") {
    return {
      title: "Order placed",
      description: "This order was created in the system.",
      palette: "info",
      Icon: ReceiptLongIcon,
    };
  }
  if (a === "Advance") {
    return {
      title: "Moved forward",
      description: "Fulfillment moved to the next step.",
      palette: "success",
      Icon: TrendingUpIcon,
    };
  }
  if (a === "Revert") {
    return {
      title: "Rolled back",
      description: "The order was moved to an earlier step.",
      palette: "warning",
      Icon: UndoIcon,
    };
  }
  if (a === "CustomerConfirm") {
    return {
      title: "Customer confirmed",
      description: "The buyer marked this order as completed.",
      palette: "success",
      Icon: HowToRegIcon,
    };
  }
  return {
    title: formatStatusHistoryAction(action),
    description: "Status update recorded.",
    palette: "grey",
    Icon: MoreHorizIcon,
  };
}

async function readOrderStatusApiResult(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? data?.Message ?? `Request failed (${response.status})`);
  }
  const code = data?.statusCode ?? data?.StatusCode;
  if (code === -99 || code === "FAILED") {
    throw new Error(data?.message ?? data?.Message ?? "Request failed");
  }
  return data;
}

export default function Orders() {
  const theme = useTheme();
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: ordersList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    setExtraQuery,
    fetchData: fetchOrders,
  } = usePaginatedFetch("ECommerce/GetAllOnlineOrders");

  const [statusTab, setStatusTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [revertingOrderId, setRevertingOrderId] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTargetOrderId, setRevertTargetOrderId] = useState(null);
  const [revertReason, setRevertReason] = useState("");

  const STATUS_META = useMemo(
    () => ({
      1: { label: "Queued", color: "default" },
      2: { label: "In Progress", color: "info" },
      3: { label: "Dispatched", color: "warning" },
      4: { label: "Delivered", color: "secondary" },
      5: { label: "Completed", color: "success" },
    }),
    []
  );

  const PAYMENT_MAPPER = useMemo(
    () => ({
      1: "Cash on Delivery",
      2: "Card",
      3: "Bank Transfer",
    }),
    []
  );

  const orders = useMemo(() => {
    if (!Array.isArray(ordersList)) {
      return [];
    }

    return ordersList.map((order) => {
      const statusValue = Number(order.orderStatus ?? order.OrderStatus);
      const statusMeta =
        STATUS_META[statusValue] ?? { label: "Unknown", color: "default" };
      const createdOnRaw = order.createdOn ?? order.CreatedOn;
      const createdOnDate = createdOnRaw ? new Date(createdOnRaw) : null;
      const paymentOpt = Number(order.paymentOption ?? order.PaymentOption);

      return {
        ...order,
        orderStatus: Number.isFinite(statusValue) ? statusValue : order.orderStatus ?? order.OrderStatus,
        statusLabel: statusMeta.label,
        statusColor: statusMeta.color,
        paymentLabel: PAYMENT_MAPPER[paymentOpt] ?? "Unknown",
        createdOnDate,
        orderId: order.orderId ?? order.OrderId,
        orderNo: order.orderNo ?? order.OrderNo,
        subTotal: order.subTotal ?? order.SubTotal,
        deliveryCharge: order.deliveryCharge ?? order.DeliveryCharge,
        netTotal: order.netTotal ?? order.NetTotal,
        checkoutAddress: order.checkoutAddress ?? order.CheckoutAddress,
        customerName: order.customerName ?? order.CustomerName,
        lines: order.lines ?? order.Lines ?? [],
        customerFeedback: order.customerFeedback ?? order.CustomerFeedback ?? "",
        customerFeedbackOn: order.customerFeedbackOn ?? order.CustomerFeedbackOn ?? null,
      };
    });
  }, [ordersList, STATUS_META, PAYMENT_MAPPER]);

  const handleStatusTabChange = (_event, value) => {
    setStatusTab(value);
    const nextExtra = extraQueryForStatusTab(value);
    setExtraQuery(nextExtra);
    setPage(1);
    fetchOrders(1, search, pageSize, undefined, undefined, nextExtra);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    const nextExtra = extraQueryForStatusTab(statusTab);
    setExtraQuery(nextExtra);
    fetchOrders(1, event.target.value, pageSize, undefined, undefined, nextExtra);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchOrders(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchOrders(1, search, size);
  };

  const handleOpenItems = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseItems = () => {
    setSelectedOrder(null);
    setStatusHistory([]);
  };

  useEffect(() => {
    const orderId = selectedOrder?.orderId ?? selectedOrder?.OrderId;
    if (!orderId) {
      setStatusHistory([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const response = await fetch(
          `${BASE_URL}/ECommerce/GetOnlineOrderStatusHistory?orderId=${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await readOrderStatusApiResult(response);
        const list = data?.result ?? data?.Result ?? [];
        if (!cancelled) {
          setStatusHistory(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) {
          setStatusHistory([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrder?.orderId, selectedOrder?.OrderId, historyRefreshKey]);

  const handleUpdateStatus = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      const response = await fetch(
        `${BASE_URL}/ECommerce/UpdateOnlineOrderStatus?orderId=${orderId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      await readOrderStatusApiResult(response);
      toast.success("Order status advanced");
      fetchOrders(page, search, pageSize, undefined, undefined, extraQueryForStatusTab(statusTab));
    } catch (error) {
      toast.error(error.message || "Unable to update status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenRevertDialog = (orderId) => {
    setRevertTargetOrderId(orderId);
    setRevertReason("");
    setRevertDialogOpen(true);
  };

  const handleCloseRevertDialog = () => {
    if (revertingOrderId != null) return;
    setRevertDialogOpen(false);
    setRevertTargetOrderId(null);
    setRevertReason("");
  };

  const handleConfirmRevert = async () => {
    const orderId = revertTargetOrderId;
    const reason = revertReason.trim();
    if (!orderId) return;
    if (!reason) {
      toast.error("Please enter a reason for reverting this order.");
      return;
    }
    try {
      setRevertingOrderId(orderId);
      const response = await fetch(`${BASE_URL}/ECommerce/RevertOnlineOrderStatus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          OrderId: orderId,
          Reason: reason,
        }),
      });
      await readOrderStatusApiResult(response);
      toast.success("Order status reverted");
      setRevertDialogOpen(false);
      setRevertTargetOrderId(null);
      setRevertReason("");
      fetchOrders(page, search, pageSize, undefined, undefined, extraQueryForStatusTab(statusTab));
      if (selectedOrder?.orderId === orderId || selectedOrder?.OrderId === orderId) {
        setHistoryRefreshKey((k) => k + 1);
      }
    } catch (error) {
      toast.error(error.message || "Unable to revert status");
    } finally {
      setRevertingOrderId(null);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const totalPages = Math.max(1, Math.ceil((totalCount ?? orders.length) / (pageSize || 1)));
  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Orders</h1>
        <ul>
          <li>
            <Link href="/ecom/orders/">Orders</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              mb: 2,
              overflow: "hidden",
            }}
          >
            <Tabs
              value={statusTab}
              onChange={handleStatusTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Order status filters"
              sx={{
                minHeight: 48,
                px: { xs: 0, sm: 1 },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  minHeight: 48,
                },
              }}
            >
              {STATUS_TABS.map((t) => (
                <Tab key={t.value} label={t.label} value={t.value} />
              ))}
            </Tabs>
          </Paper>
        </Grid>
        
        <Grid item xs={12} order={{ xs: 4, lg: 4 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Order No</TableCell>
                  <TableCell>Sub Total</TableCell>
                  <TableCell>Delivery Charge</TableCell>
                  <TableCell>Net Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Mobile No</TableCell>
                  <TableCell align="center">View</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography color="error">No Orders Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.orderNo ?? "-"}</TableCell>
                      <TableCell>
                        {formatCurrency(item.subTotal)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.deliveryCharge)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.netTotal)}
                      </TableCell>
                      <TableCell>{item.paymentLabel}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.statusLabel}
                          color={item.statusColor}
                          variant={item.statusColor === "default" ? "outlined" : "filled"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.createdOnDate
                          ? formatDate(item.createdOnDate, {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {item.checkoutAddress?.mobileNo ?? item.checkoutAddress?.MobileNo ?? "-"}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenItems(item)}
                          sx={{
                            textTransform: "uppercase",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            letterSpacing: "0.04em",
                            borderRadius: 1.5,
                            px: 1.75,
                            py: 0.5,
                            borderColor: "primary.main",
                            color: "primary.main",
                            bgcolor: "transparent",
                            "&:hover": {
                              borderColor: "primary.dark",
                              color: "primary.dark",
                              bgcolor: (theme) =>
                                theme.palette.mode === "dark"
                                  ? "rgba(144, 202, 249, 0.08)"
                                  : "rgba(25, 118, 210, 0.06)",
                            },
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
                          {Number(item.orderStatus) > 1 && (
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => handleOpenRevertDialog(item.orderId)}
                              disabled={
                                revertingOrderId === item.orderId || updatingOrderId === item.orderId
                              }
                            >
                              {revertingOrderId === item.orderId ? "Reverting…" : "Revert status"}
                            </Button>
                          )}
                          {item.orderStatus !== 5 && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleUpdateStatus(item.orderId)}
                              disabled={
                                updatingOrderId === item.orderId || revertingOrderId === item.orderId
                              }
                            >
                              {updatingOrderId === item.orderId ? "Updating…" : "Update status"}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalPages}
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

      <Dialog
        open={Boolean(selectedOrder)}
        onClose={handleCloseItems}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.12)",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : "linear-gradient(180deg, #fafbff 0%, #ffffff 48%)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.35rem",
            color: "primary.main",
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box>
            Order overview
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
              {selectedOrder?.orderNo ?? selectedOrder?.OrderNo ?? "—"}
            </Typography>
          </Box>
          <Chip
            label={
              STATUS_META[Number(selectedOrder?.orderStatus ?? selectedOrder?.OrderStatus)]?.label ??
              "Unknown"
            }
            color={
              STATUS_META[Number(selectedOrder?.orderStatus ?? selectedOrder?.OrderStatus)]?.color ??
              "default"
            }
            variant={
              STATUS_META[Number(selectedOrder?.orderStatus ?? selectedOrder?.OrderStatus)]?.color ===
              "default"
                ? "outlined"
                : "filled"
            }
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          {selectedOrder && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    height: "100%",
                  }}
                >
                  <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.6}>
                    Fulfillment progress
                  </Typography>
                  <Box sx={{ overflowX: "auto", py: 1.5, mx: -0.5 }}>
                    <Stepper
                      activeStep={Math.min(
                        4,
                        Math.max(0, Number(selectedOrder.orderStatus ?? selectedOrder.OrderStatus ?? 1) - 1)
                      )}
                      alternativeLabel
                      sx={{
                        minWidth: { xs: 520, sm: "100%" },
                        "& .MuiStepLabel-label": { fontSize: "0.7rem", fontWeight: 600 },
                      }}
                    >
                      {ORDER_FLOW_STEPS.map((label) => (
                        <Step key={label}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>

                  <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mt: 1, display: "block" }}>
                    Line items
                  </Typography>
                  {(selectedOrder.lines ?? selectedOrder.Lines)?.length ? (
                    <Stack spacing={1.25} sx={{ mt: 1 }}>
                      {(selectedOrder.lines ?? selectedOrder.Lines).map((line, index) => (
                        <Card
                          key={line.lineId ?? line.LineId ?? index}
                          variant="outlined"
                          sx={{
                            borderRadius: 1.5,
                            borderColor: "divider",
                            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.light",
                              boxShadow: "0 2px 12px rgba(25, 118, 210, 0.08)",
                            },
                          }}
                        >
                          <CardContent sx={{ py: 1.25, px: 1.75, "&:last-child": { pb: 1.25 } }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight={700}>
                                {line.productName ?? line.ProductName ?? `Item ${index + 1}`}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {typeof (line.lineTotal ?? line.LineTotal) === "number"
                                  ? formatCurrency(line.lineTotal ?? line.LineTotal)
                                  : "—"}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              Qty {line.quantity ?? line.Quantity ?? 0}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No items available for this order.
                    </Typography>
                  )}

                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        minWidth: { xs: "100%", sm: 220 },
                      }}
                    >
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Order total
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {selectedOrder.netTotal != null ? formatCurrency(selectedOrder.netTotal) : "—"}
                      </Typography>
                    </Paper>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? theme.palette.background.paper : "grey.50",
                    height: "100%",
                  }}
                >
                  <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.6}>
                    Customer & delivery
                  </Typography>
                  <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Name
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {(selectedOrder.customerName ?? selectedOrder.CustomerName) || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                        {(selectedOrder.checkoutAddress?.email ?? selectedOrder.checkoutAddress?.Email) || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Mobile No
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                        {(selectedOrder.checkoutAddress?.mobileNo ??
                          selectedOrder.checkoutAddress?.MobileNo) ||
                          "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Address
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.checkoutAddress
                          ? (() => {
                              const addr = selectedOrder.checkoutAddress;
                              const line = [
                                addr.addressLine1 ?? addr.AddressLine1,
                                addr.addressLine2 ?? addr.AddressLine2,
                                addr.addressLine3 ?? addr.AddressLine3,
                              ]
                                .filter(Boolean)
                                .join(", ");
                              const pc = addr.postalCode ?? addr.PostalCode;
                              return [line, pc].filter(Boolean).join(" ") || "—";
                            })()
                          : "—"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Totals
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedOrder.subTotal != null ? formatCurrency(selectedOrder.subTotal) : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">
                        Delivery
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedOrder.deliveryCharge != null
                          ? formatCurrency(selectedOrder.deliveryCharge)
                          : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: "1px dashed", borderColor: "divider" }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Net total
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                        {selectedOrder.netTotal != null ? formatCurrency(selectedOrder.netTotal) : "—"}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark" ? theme.palette.background.paper : "grey.50",
                  }}
                >
                  <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={0.6}>
                    Customer feedback
                  </Typography>
                  {(() => {
                    const fb = String(
                      selectedOrder.customerFeedback ?? selectedOrder.CustomerFeedback ?? ""
                    ).trim();
                    const rawOn =
                      selectedOrder.customerFeedbackOn ?? selectedOrder.CustomerFeedbackOn ?? null;
                    const onDate = rawOn ? new Date(rawOn) : null;
                    const isCompleted =
                      Number(selectedOrder.orderStatus ?? selectedOrder.OrderStatus) === 5;
                    if (fb) {
                      return (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {fb}
                          </Typography>
                          {onDate ? (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                              Submitted{" "}
                              {formatDate(onDate, {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Typography>
                          ) : null}
                        </Box>
                      );
                    }
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {isCompleted
                          ? "No feedback submitted for this order yet."
                          : "Feedback can be submitted by the customer after the order is completed."}
                      </Typography>
                    );
                  })()}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    background: (t) =>
                      t.palette.mode === "dark"
                        ? alpha(t.palette.primary.main, 0.04)
                        : alpha(t.palette.primary.main, 0.02),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1}>
                        Status history
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                        Newest events appear first
                      </Typography>
                    </Box>
                    {historyLoading && <CircularProgress size={22} thickness={5} />}
                  </Box>
                  {!historyLoading && statusHistory.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No status changes recorded yet. History appears after the database table is deployed and new
                      updates occur.
                    </Typography>
                  )}
                  {!historyLoading && statusHistory.length > 0 && (
                    <Stack spacing={0} sx={{ position: "relative" }}>
                      {statusHistory.map((row, idx) => {
                        const fromS = Number(row.fromStatus ?? row.FromStatus ?? 0);
                        const toS = Number(row.toStatus ?? row.ToStatus ?? 0);
                        const fromLabel =
                          fromS > 0 ? STATUS_META[fromS]?.label ?? `Status ${fromS}` : "Start";
                        const toLabel = STATUS_META[toS]?.label ?? `Status ${toS}`;
                        const fromChipColor = fromS > 0 ? STATUS_META[fromS]?.color ?? "default" : "default";
                        const toChipColor = STATUS_META[toS]?.color ?? "default";
                        const actor = row.actor ?? row.Actor ?? "—";
                        const action = row.action ?? row.Action ?? "";
                        const reasonText = (row.reason ?? row.Reason ?? "").trim();
                        const createdRaw = row.createdOn ?? row.CreatedOn;
                        const createdDate = createdRaw ? new Date(createdRaw) : null;
                        const visuals = getStatusHistoryVisuals(action);
                        const IconCmp = visuals.Icon;
                        const pal = visuals.palette;
                        const mainColor =
                          pal === "grey" ? theme.palette.text.secondary : theme.palette[pal].main;
                        const softBg =
                          pal === "grey"
                            ? alpha(theme.palette.action.hover, 0.6)
                            : alpha(theme.palette[pal].main, 0.12);
                        const isLast = idx === statusHistory.length - 1;
                        return (
                          <Box
                            key={row.id ?? row.Id ?? idx}
                            sx={{
                              display: "flex",
                              gap: { xs: 1.5, sm: 2 },
                              pb: isLast ? 0 : 2,
                              position: "relative",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: 48,
                                flexShrink: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  bgcolor: softBg,
                                  color: mainColor,
                                  border: "2px solid",
                                  borderColor:
                                    pal === "grey"
                                      ? theme.palette.divider
                                      : alpha(theme.palette[pal].main, 0.35),
                                  zIndex: 1,
                                }}
                              >
                                <IconCmp sx={{ fontSize: 22 }} />
                              </Box>
                              {!isLast && (
                                <Box
                                  sx={{
                                    width: 2,
                                    flex: 1,
                                    minHeight: 12,
                                    mt: 0.5,
                                    mb: -1,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                  }}
                                />
                              )}
                            </Box>
                            <Paper
                              elevation={0}
                              sx={{
                                flex: 1,
                                minWidth: 0,
                                p: { xs: 1.5, sm: 2 },
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderLeftWidth: 4,
                                borderLeftColor: mainColor,
                                bgcolor: "background.paper",
                                boxShadow: (t) =>
                                  t.palette.mode === "dark" ? "none" : "0 1px 4px rgba(15, 23, 42, 0.06)",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: { xs: "column", sm: "row" },
                                  alignItems: { sm: "flex-start" },
                                  justifyContent: "space-between",
                                  gap: 1,
                                  mb: 1.25,
                                }}
                              >
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3 }}>
                                    {visuals.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                    {visuals.description}
                                  </Typography>
                                </Box>
                                {createdDate ? (
                                  <Box
                                    sx={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      px: 1.25,
                                      py: 0.5,
                                      borderRadius: 10,
                                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                                      alignSelf: { xs: "flex-start", sm: "flex-start" },
                                    }}
                                  >
                                    <ScheduleIcon sx={{ fontSize: 16, color: "primary.main", opacity: 0.85 }} />
                                    <Typography variant="caption" fontWeight={600} color="primary.dark">
                                      {formatDate(createdDate, {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Typography>
                                  </Box>
                                ) : null}
                              </Box>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{ gap: 1, mb: 1.25 }}
                              >
                                <Chip
                                  size="small"
                                  label={fromLabel}
                                  color={fromChipColor}
                                  variant={fromS > 0 ? "filled" : "outlined"}
                                  sx={{ fontWeight: 700 }}
                                />
                                <ArrowForwardIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                                <Chip size="small" label={toLabel} color={toChipColor} sx={{ fontWeight: 700 }} />
                              </Stack>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.75,
                                  color: "text.secondary",
                                }}
                              >
                                <PersonOutlineIcon sx={{ fontSize: 18, opacity: 0.75 }} />
                                <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
                                  <Box component="span" fontWeight={600} color="text.primary">
                                    By{" "}
                                  </Box>
                                  {actor}
                                </Typography>
                              </Box>
                              {action === "Revert" && reasonText ? (
                                <Box
                                  sx={{
                                    mt: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                                    border: "1px solid",
                                    borderColor: alpha(theme.palette.warning.main, 0.28),
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight={800}
                                    color="warning.dark"
                                    display="block"
                                    sx={{ mb: 0.5, letterSpacing: 0.3 }}
                                  >
                                    Revert reason
                                  </Typography>
                                  <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap" }}>
                                    {reasonText}
                                  </Typography>
                                </Box>
                              ) : null}
                            </Paper>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button variant="contained" onClick={handleCloseItems} sx={{ px: 3, fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={revertDialogOpen}
        onClose={handleCloseRevertDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={revertingOrderId != null}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Revert order status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason. This will be stored in the order status history for your team&apos;s records.
          </Typography>
          <TextField
            autoFocus
            required
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            placeholder="e.g. Customer requested cancellation, stock issue, duplicate order…"
            value={revertReason}
            onChange={(e) => setRevertReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${revertReason.length}/500`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseRevertDialog} disabled={revertingOrderId != null}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmRevert}
            disabled={revertingOrderId != null || !revertReason.trim()}
          >
            {revertingOrderId != null ? "Reverting…" : "Revert status"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}