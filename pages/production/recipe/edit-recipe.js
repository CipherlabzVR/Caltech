"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";
import SearchItems from "@/components/utils/SearchItems";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const EditRecipe = () => {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState({});
  const [docNo, setDocNo] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [outputQty, setOutputQty] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [total, setTotal] = useState(0);
  const [addedRows, setAddedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Recipe/GetRecipeById?id=${id}`,
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
      setRecipe(result);
      setDocNo(result.documentNo);
      setRecipeName(result.name);
      setDescription(result.description || "");
      setOutputQty(result.outputQuantity);
      setIsActive(result.isActive);
      setTotal(result.totalRawMaterialCost);

      setAddedRows(
        result.recipeLineDetails.map((item) => ({
          ...item,
          id: item.productId,
          name: item.productName,
          code: item.productCode,
          averagePrice: item.costPrice,
          totalCost: item.lineTotal,
          quantity: item.quantity,
          wastage: item.wastage,
        }))
      );
    } catch (error) {
      console.error("Error fetching recipe:", error);
    }
  };

  useEffect(() => {
    if (id) fetchRecipe();
  }, [id]);

  const handleAddRow = (item) => {
    const isDuplicate = addedRows.some((row) => row.id === item.id);
    if (isDuplicate) {
      toast.warning("This item is already added.");
      return;
    }

    const newRow = {
      ...item,
      quantity: "",
      wastage: "",
      totalCost: item.averagePrice || 0,
    };

    setAddedRows((prev) => [...prev, newRow]);
    setTotal((prev) => prev + parseFloat(newRow.totalCost));
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...addedRows];
    const row = updatedRows[index];
    const oldTotal = row.totalCost;

    row[name] = value;

    if (name === "quantity") {
      row.totalCost = parseFloat(row.averagePrice || 0) * parseFloat(value || 0);
    }
    if (name === "averagePrice") {
      row.totalCost = parseFloat(value || 0) * parseFloat(row.quantity || 0);
    }

    setAddedRows(updatedRows);
    setTotal((prev) => prev - oldTotal + (row.totalCost || 0));
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...addedRows];
    const row = updatedRows.splice(index, 1)[0];
    setAddedRows(updatedRows);
    setTotal((prev) => prev - row.totalCost);
  };

  const handleSubmit = async () => {
    if (!recipeName) return toast.warning("Please enter recipe name");
    if (!outputQty || +outputQty <= 0) return toast.warning("Please enter output quantity");
    if (addedRows.length === 0) return toast.error("At least one raw material must be added");
    if (addedRows.some((r) => !r.averagePrice || !r.quantity))
      return toast.error("All rows must have cost price and quantity");

    const data = {
      Id: recipe.id,
      DocumentNo: recipe.documentNo,
      Name: recipeName,
      Description: description,
      ProductId: recipe.productId,
      ProductCode: recipe.productCode,
      ProductName: recipe.productName,
      OutputQuantity: parseFloat(outputQty),
      TotalRawMaterialCost: parseFloat(total),
      IsActive: isActive,
      RecipeLineDetails: addedRows.map((row) => ({
        RecipeHeaderId: recipe.id,
        ProductId: row.id,
        ProductCode: row.code,
        ProductName: row.name,
        CostPrice: parseFloat(row.averagePrice),
        Quantity: parseFloat(row.quantity),
        LineTotal: parseFloat(row.totalCost),
        Wastage: parseFloat(row.wastage) || 0,
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(`${BASE_URL}/Recipe/UpdateRecipe`, {
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
          window.location.href = "/production/recipe/";
        }, 1500);
      } else {
        toast.error(jsonResponse.message || "Failed to update recipe");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBack = () => {
    router.push({ pathname: "/production/recipe/" });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Edit Recipe</h1>
        <ul>
          <li>
            <Link href="/production/recipe/">Recipe</Link>
          </li>
          <li>Edit</li>
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
                Recipe Name
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Finished Product
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={recipe.productName || ""}
                disabled
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Output Quantity (per batch)
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                type="number"
                value={outputQty}
                onChange={(e) => setOutputQty(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Description
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                Active
              </Typography>
              <Box sx={{ width: "60%" }}>
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                  label={isActive ? "Active" : "Inactive"}
                />
              </Box>
            </Grid>

            <Grid item xs={12} mt={3} mb={2}>
              <SearchItems
                label="Search"
                placeholder="Search raw materials by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                main={false}
                mainItem={recipe.productId}
                onSelect={(item) => handleAddRow(item)}
              />
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="recipe-lines" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Raw Material</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Quantity</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Wastage</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">Total Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedRows.length === 0
                      ? ""
                      : addedRows.map((item, index) => (
                          <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                            <TableCell align="right">
                              <Tooltip title="Delete" placement="top">
                                <IconButton onClick={() => handleDeleteRow(index)} aria-label="delete" size="small">
                                  <DeleteIcon color="error" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <TextField size="small" value={item.quantity} onChange={(e) => handleChange(index, e.target.value, "quantity")} />
                            </TableCell>
                            <TableCell>
                              <TextField size="small" value={item.wastage} onChange={(e) => handleChange(index, e.target.value, "wastage")} />
                            </TableCell>
                            <TableCell>
                              <TextField size="small" value={item.averagePrice} onChange={(e) => handleChange(index, e.target.value, "averagePrice")} />
                            </TableCell>
                            <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                          </TableRow>
                        ))}
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

export default EditRecipe;
