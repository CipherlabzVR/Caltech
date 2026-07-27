"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
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
import SearchItems from "@/components/utils/SearchItems";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";

const CreateProductionOrder = () => {
  const router = useRouter();
  const today = new Date();
  const [docNo, setDocNo] = useState("");
  const [productionDate, setProductionDate] = useState(formatDate(today));
  const [mainItem, setMainItem] = useState(null);
  const [plannedQty, setPlannedQty] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [remark, setRemark] = useState("");
  const [sourceWarehouse, setSourceWarehouse] = useState(null);
  const [targetWarehouse, setTargetWarehouse] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [addedRows, setAddedRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stockMap, setStockMap] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);

  const { data: warehouses } = GetAllWarehouse();

  const updateDocNo = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=64`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Fetch failed");
      const result = await response.json();
      setDocNo(result.result);
    } catch (err) {
      console.error("Error fetching next document number:", err);
    }
  };

  useEffect(() => {
    updateDocNo();
  }, []);

  const fetchRecipesForProduct = async (productId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Recipe/GetActiveRecipesByProductId?productId=${productId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch recipes");
      const data = await response.json();
      setRecipes(data.result || []);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setRecipes([]);
    }
  };

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

  const handleProductSelect = (item) => {
    setMainItem(item);
    setSelectedRecipe(null);
    setAddedRows([]);
    setTotal(0);
    setRecipes([]);
    if (item) {
      fetchRecipesForProduct(item.id);
    }
  };

  const handleRecipeSelect = (event, recipe) => {
    setSelectedRecipe(recipe);
    if (recipe && recipe.recipeLineDetails) {
      const rows = recipe.recipeLineDetails.map((line) => ({
        id: line.productId,
        name: line.productName,
        code: line.productCode,
        costPrice: line.costPrice,
        recipeQty: line.quantity,
        requiredQty: line.quantity,
        lineTotal: line.lineTotal,
        wastage: line.wastage,
      }));
      setAddedRows(rows);
      const totalCost = rows.reduce((sum, r) => sum + (r.lineTotal || 0), 0);
      setTotal(totalCost);

      if (sourceWarehouse) {
        fetchStockForWarehouse(
          sourceWarehouse.id,
          rows.map((r) => r.id)
        );
      }
    } else {
      setAddedRows([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    if (plannedQty && selectedRecipe && selectedRecipe.outputQuantity > 0) {
      const multiplier = parseFloat(plannedQty) / selectedRecipe.outputQuantity;
      const updated = addedRows.map((row) => {
        const reqQty = row.recipeQty * multiplier;
        return {
          ...row,
          requiredQty: Math.round(reqQty * 10000) / 10000,
          lineTotal: Math.round(reqQty * row.costPrice * 100) / 100,
        };
      });
      setAddedRows(updated);
      setTotal(updated.reduce((sum, r) => sum + (r.lineTotal || 0), 0));
    }
  }, [plannedQty]);

  useEffect(() => {
    if (sourceWarehouse && addedRows.length > 0) {
      fetchStockForWarehouse(
        sourceWarehouse.id,
        addedRows.map((r) => r.id)
      );
    }
  }, [sourceWarehouse]);

  const handleSubmit = async () => {
    if (!mainItem) return toast.warning("Please select finished product");
    if (!selectedRecipe) return toast.warning("Please select a recipe");
    if (!plannedQty || +plannedQty <= 0) return toast.warning("Please enter planned quantity");
    if (!sourceWarehouse) return toast.warning("Please select source warehouse");
    if (!targetWarehouse) return toast.warning("Please select target warehouse");
    if (addedRows.length === 0) return toast.error("No raw materials found");
    if (!sellingPrice) return toast.warning("Please enter selling price");

    const costPerUnit = +plannedQty > 0 ? total / +plannedQty : 0;

    const data = {
      DocumentNo: docNo,
      ProductionDate: productionDate,
      RecipeId: selectedRecipe.id,
      BOMId: null,
      ProductId: mainItem.id,
      ProductCode: mainItem.code,
      ProductName: mainItem.name,
      PlannedQuantity: parseFloat(plannedQty),
      SourceWarehouseId: sourceWarehouse.id,
      TargetWarehouseId: targetWarehouse.id,
      TotalRawMaterialCost: parseFloat(total),
      CostPerUnit: Math.round(costPerUnit * 100) / 100,
      SellingPrice: parseFloat(sellingPrice),
      Remark: remark,
      ProductionOrderLineDetails: addedRows.map((row) => ({
        ProductionOrderHeaderId: 0,
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
      const response = await fetch(`${BASE_URL}/ProductionOrder/CreateProductionOrder`, {
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
        toast.error(jsonResponse.message || "Failed to create production order");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBack = () => {
    router.push({ pathname: "/production/production-order/" });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Production Order</h1>
        <ul>
          <li>
            <Link href="/production/production-order/">Production Order</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" gap={1} justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>Doc No: {docNo}</Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Go Back
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Finished Product
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchItems
                  label="Search"
                  placeholder="Search finished product"
                  fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                  main={true}
                  mainItem={null}
                  onSelect={(item) => handleProductSelect(item)}
                />
              </Box>
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
                Recipe
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                size="small"
                options={recipes}
                getOptionLabel={(option) => option.name || ""}
                value={selectedRecipe}
                onChange={handleRecipeSelect}
                renderInput={(params) => <TextField {...params} placeholder="Select Recipe" />}
                noOptionsText={mainItem ? "No recipes found" : "Select a product first"}
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
                Source Warehouse (Raw Materials)
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                size="small"
                options={warehouses || []}
                getOptionLabel={(option) => option.name || ""}
                value={sourceWarehouse}
                onChange={(e, val) => setSourceWarehouse(val)}
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
                renderInput={(params) => <TextField {...params} placeholder="Select Target Warehouse" />}
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
                      <TableCell sx={{ color: "#fff" }}>Recipe Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Required Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Available Stock</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="textSecondary">Select a recipe to load raw materials</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      addedRows.map((item, index) => {
                        const available = stockMap[item.id] || 0;
                        const isInsufficient = item.requiredQty > available && sourceWarehouse;
                        return (
                          <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.recipeQty}</TableCell>
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
                      })
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell align="right" colSpan={5}>
                        <Typography>Total Raw Material Cost</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography>{formatCurrency(total)}</Typography>
                      </TableCell>
                    </TableRow>
                    {plannedQty > 0 && total > 0 && (
                      <TableRow>
                        <TableCell align="right" colSpan={5}>
                          <Typography>Cost Per Unit</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography>{formatCurrency(total / parseFloat(plannedQty))}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} my={2}>
              <LoadingButton loading={isSubmitting} handleSubmit={() => handleSubmit()} disabled={isDisable} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CreateProductionOrder;
