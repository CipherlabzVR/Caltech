"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";

const statusConfig = {
  1: { label: "Draft", color: "default" },
  2: { label: "In Progress", color: "info" },
  3: { label: "Completed", color: "success" },
  4: { label: "Cancelled", color: "error" },
};

const ViewProductionOrder = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);

  const fetchOrder = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ProductionOrder/GetProductionOrderById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setOrder(data.result);
    } catch (error) {
      console.error("Error fetching production order:", error);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const navigateToBack = () => {
    router.push({ pathname: "/production/production-order/" });
  };

  if (!order) return null;

  const status = statusConfig[order.status] || { label: "Unknown", color: "default" };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>View Production Order</h1>
        <ul>
          <li>
            <Link href="/production/production-order/">Production Order</Link>
          </li>
          <li>View</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" gap={1} justifyContent="end" alignItems="center">
              <Chip label={status.label} color={status.color} />
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>Doc No: {order.documentNo}</Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Go Back
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Finished Product
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={order.productName} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Production Date
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={formatDate(order.productionDate)} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Planned Quantity
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={order.plannedQuantity} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Actual Quantity Produced
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={order.actualQuantity} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Source Warehouse
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={order.sourceWarehouseName || order.sourceWarehouseId} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Target Warehouse
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={order.targetWarehouseName || order.targetWarehouseId} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Selling Price
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={formatCurrency(order.sellingPrice)} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Cost Per Unit
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={formatCurrency(order.costPerUnit)} disabled />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Remark
              </Typography>
              <TextField sx={{ width: "60%" }} size="small" fullWidth value={order.remark || "-"} disabled />
            </Grid>

            <Grid item xs={12} mt={3}>
              <Typography variant="h6" sx={{ mb: 1 }}>Consumed Raw Materials</Typography>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="consumed-materials" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Raw Material</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Required Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Consumed Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.productionOrderLineDetails.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.requiredQuantity}</TableCell>
                        <TableCell>{item.consumedQuantity}</TableCell>
                        <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell align="right" colSpan={4}>
                        <Typography>Total Raw Material Cost</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography>{formatCurrency(order.totalRawMaterialCost)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ViewProductionOrder;
