"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
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
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";

const EditProductionOrder = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [productionDate, setProductionDate] = useState("");
  const [plannedQty, setPlannedQty] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [remark, setRemark] = useState("");
  const [sourceWarehouse, setSourceWarehouse] = useState(null);
  const [targetWarehouse, setTargetWarehouse] = useState(null);
  const [addedRows, setAddedRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stockMap, setStockMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const { data: warehouses } = GetAllWarehouse();

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
      const result = data.result;
      setOrder(result);
      setProductionDate(formatDate(result.productionDate));
      setPlannedQty(result.plannedQuantity);
      setSellingPrice(result.sellingPrice);
      setRemark(result.remark || "");
      setTotal(result.totalRawMaterialCost);

      setAddedRows(
        result.productionOrderLineDetails.map((line) => ({
          id: line.productId,
          name: line.productName,
          code: line.productCode,
          costPrice: line.costPrice,
          requiredQty: line.requiredQuantity,
          lineTotal: line.lineTotal,
        }))
      );
    } catch (error) {
      console.error("Error fetching production order:", error);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order && warehouses && warehouses.length > 0) {
      const src = warehouses.find((w) => w.id === order.sourceWarehouseId);
      const tgt = warehouses.find((w) => w.id === order.targetWarehouseId);
      if (src) setSourceWarehouse(src);
      if (tgt) setTargetWarehouse(tgt);
    }
  }, [order, warehouses]);

  const fetchStockForWarehouse = async (warehouseId, productIds) => {
    if (!warehouseId || productIds.length === 0) return;
    try {
      const response = await fetch(
        `${BASE_URL}/StockBalance/GetStockBalanceForProductsByWarehouse?warehouseId=${warehouseId}&productIds=${productIds.join(",")}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch stock");
      const data = await response.json();
      setStockMap(data.result || {});
    } catch (err) {
      console.error("Error fetching stock:", err);
      setStockMap({});
    }
  };

  useEffect(() => {
    if (sourceWarehouse && addedRows.length > 0) {
      fetchStockForWarehouse(
        sourceWarehouse.id,
        addedRows.map((r) => r.id)
      );
    }
  }, [sourceWarehouse, addedRows]);

  const handleSubmit = async () => {
    if (!plannedQty || +plannedQty <= 0) return toast.warning("Please enter planned quantity");
    if (!sourceWarehouse) return toast.warning("Please select source warehouse");
    if (!targetWarehouse) return toast.warning("Please select target warehouse");
    if (!sellingPrice) return toast.warning("Please enter selling price");

    const costPerUnit = +plannedQty > 0 ? total / +plannedQty : 0;

    const data = {
      Id: order.id,
      DocumentNo: order.documentNo,
      ProductionDate: productionDate,
      RecipeId: order.recipeId,
      BOMId: order.bomId,
      ProductId: order.productId,
      ProductCode: order.productCode,
      ProductName: order.productName,
      PlannedQuantity: parseFloat(plannedQty),
      SourceWarehouseId: sourceWarehouse.id,
      TargetWarehouseId: targetWarehouse.id,
      TotalRawMaterialCost: parseFloat(total),
      CostPerUnit: Math.round(costPerUnit * 100) / 100,
      SellingPrice: parseFloat(sellingPrice),
      Remark: remark,
      ProductionOrderLineDetails: addedRows.map((row) => ({
        ProductionOrderHeaderId: order.id,
        ProductId: row.id,
        ProductCode: row.code,
        ProductName: row.name,
        RequiredQuantity: row.requiredQty,
        ConsumedQuantity: 0,
        CostPrice: row.costPrice,
        LineTotal: row.lineTotal,
        WarehouseId: sourceWarehouse.id,
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(`${BASE_URL}/ProductionOrder/UpdateProductionOrder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const jsonResponse = await response.json();
      if (response.ok && jsonResponse.statusCode === 200) {
        toast.success(jsonResponse.message);
        setTimeout(() => {
          window.location.href = "/production/production-order/";
        }, 1500);
      } else {
        toast.error(jsonResponse.message || "Failed to update production order");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Are you sure you want to complete this production order? This will consume raw materials and produce finished goods. This action cannot be undone.")) {
      return;
    }

    try {
      setIsCompleting(true);
      const response = await fetch(
        `${BASE_URL}/ProductionOrder/CompleteProductionOrder?id=${order.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.statusCode === 200) {
          toast.success(jsonResponse.message);
          setTimeout(() => {
            window.location.href = "/production/production-order/";
          }, 1500);
        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Failed to complete production order");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsCompleting(false);
    }
  };

  const navigateToBack = () => {
    router.push({ pathname: "/production/production-order/" });
  };

  if (!order) return null;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Edit Production Order</h1>
        <ul>
          <li>
            <Link href="/production/production-order/">Production Order</Link>
          </li>
          <li>Edit</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" gap={1} justifyContent="end" alignItems="center">
              <Chip label={order.status === 1 ? "Draft" : order.status === 2 ? "In Progress" : "Unknown"} color={order.status === 1 ? "default" : "info"} />
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
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Planned Quantity
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                type="number"
                value={plannedQty}
                onChange={(e) => setPlannedQty(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Selling Price
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Source Warehouse (Raw Materials)
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                size="small"
                options={warehouses || []}
                getOptionLabel={(option) => option.name || ""}
                value={sourceWarehouse}
                onChange={(e, val) => setSourceWarehouse(val)}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => <TextField {...params} placeholder="Select Source Warehouse" />}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Target Warehouse (Finished Goods)
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                size="small"
                options={warehouses || []}
                getOptionLabel={(option) => option.name || ""}
                value={targetWarehouse}
                onChange={(e, val) => setTargetWarehouse(val)}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => <TextField {...params} placeholder="Select Target Warehouse" />}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Remark
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} mt={3}>
              <Typography variant="h6" sx={{ mb: 1 }}>Raw Materials</Typography>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="production-lines" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Raw Material</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Required Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Available Stock</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedRows.map((item, index) => {
                      const available = stockMap[item.id] || 0;
                      const isInsufficient = item.requiredQty > available && sourceWarehouse;
                      return (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.requiredQty}</TableCell>
                          <TableCell>
                            <Typography color={isInsufficient ? "error" : "inherit"} fontWeight={isInsufficient ? "bold" : "normal"}>
                              {sourceWarehouse ? available : "-"}
                              {isInsufficient ? " (Insufficient)" : ""}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.lineTotal)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell align="right" colSpan={4}>
                        <Typography>Total Raw Material Cost</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography>{formatCurrency(total)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} my={2} display="flex" gap={2}>
              <LoadingButton loading={isSubmitting} handleSubmit={() => handleSubmit()} disabled={isDisable} />
              <Button
                variant="contained"
                color="success"
                onClick={handleComplete}
                disabled={isCompleting}
                sx={{ color: "#fff" }}
              >
                {isCompleting ? "Completing..." : "Complete Production"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default EditProductionOrder;
