import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency } from "@/components/utils/formatHelper";
import { formatDate } from "@fullcalendar/core";
import Chip from "@mui/material/Chip";
import BASE_URL from "Base/api";

export default function Orders() {
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
    fetchData: fetchOrders,
  } = usePaginatedFetch("ECommerce/GetAllOnlineOrders");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const STATUS_META = useMemo(
    () => ({
      1: { label: "Queued", color: "default" },
      2: { label: "In Progress", color: "info" },
      3: { label: "Shipping", color: "warning" },
      4: { label: "Completed", color: "success" },
    }),
    []
  );

  const PAYMENT_MAPPER = useMemo(
    () => ({
      1: "Cash on Delivery",
      2: "Card",
    }),
    []
  );

  const orders = useMemo(() => {
    if (!Array.isArray(ordersList)) {
      return [];
    }

    return ordersList.map((order) => {
      const statusMeta =
        STATUS_META[order.orderStatus] ?? { label: "Unknown", color: "default" };
      const createdOnDate = order.createdOn ? new Date(order.createdOn) : null;

      return {
        ...order,
        statusLabel: statusMeta.label,
        statusColor: statusMeta.color,
        paymentLabel: PAYMENT_MAPPER[order.paymentOption] ?? "Unknown",
        createdOnDate,
      };
    });
  }, [ordersList, STATUS_META, PAYMENT_MAPPER]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchOrders(1, event.target.value, pageSize);
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
  };

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

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast.success("Order status updated");
      fetchOrders(page, search, pageSize);
    } catch (error) {
      toast.error(error.message || "Unable to update status");
    } finally {
      setUpdatingOrderId(null);
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
                  <TableCell>Checkout Address</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
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
                        {item.checkoutAddress ? (
                          <Box>
                            <Typography variant="body2">
                              {[item.checkoutAddress.addressLine1, item.checkoutAddress.addressLine2, item.checkoutAddress.addressLine3]
                                .filter(Boolean)
                                .join(", ")}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {item.checkoutAddress.postalCode}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {item.checkoutAddress.mobileNo}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {item.checkoutAddress.email}
                            </Typography>
                          </Box>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
                          <Button variant="outlined" size="small" onClick={() => handleOpenItems(item)}>
                            View Items
                          </Button>
                          {item.orderStatus !== 4 && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleUpdateStatus(item.orderId)}
                              disabled={updatingOrderId === item.orderId}
                            >
                              {updatingOrderId === item.orderId ? "Updating..." : "Update Status"}
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Order Items</DialogTitle>
        <DialogContent dividers>
          {selectedOrder?.lines?.length ? (
            selectedOrder.lines.map((line, index) => (
              <Box key={line.lineId ?? index} sx={{ mb: index === selectedOrder.lines.length - 1 ? 0 : 2 }}>
                <Typography variant="subtitle2">
                  {line.productName ?? `Item ${index + 1}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Qty: {line.quantity ?? 0} &mdash; Price:{" "}
                  {typeof line.price === "number" ? line.price.toLocaleString() : "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: {typeof line.lineTotal === "number" ? line.lineTotal.toLocaleString() : "-"}
                </Typography>
                {index !== selectedOrder.lines.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No items available for this order.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItems}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}