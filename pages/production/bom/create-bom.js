"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  IconButton,
  Paper,
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
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import SearchItems from "@/components/utils/SearchItems";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const CreateBillOfMaterials = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [billNo, setBillNo] = useState("");
  const [mainItem, setMainItem] = useState(null);
  const [mainQty, setMainQty] = useState(null);
  const [mainSellingPrice, setMainSellingPrice] = useState(null);
  const [remark, setRemark] = useState("");
  const [total, setTotal] = useState(0);
  const [addedRows, setAddedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);

  const updateBillNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=30`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setBillNo(result.result);
    } catch (err) {
      console.error('Error fetching next document number:', err);
    }
  };

  useEffect(() => {
    updateBillNo();
  }, []);

  const handleAddRow = (item) => {
    if (!mainItem) {
      toast.warning("Please Select Product");
      return;
    }

    const isDuplicate = addedRows.some(row => row.id === item.id);
    if (isDuplicate) {
      toast.warning("This Item is already added.");
      return;
    }

    const newRow = {
      ...item,
      quantity: "",
      wastage: "",
      averagePrice: item.averagePrice != null ? item.averagePrice : "",
      totalCost: item.averagePrice != null ? (item.averagePrice || 0) : 0,
    };

    setAddedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      return updatedRows;
    });

    setTotal((prevTotal) => prevTotal + parseFloat(newRow.totalCost));
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...addedRows];
    const row = updatedRows[index];
    const oldTotalPrice = row.totalCost || 0;

    // Ensure value is never null - convert to empty string if needed
    row[name] = value != null ? value : "";

    if (name === "quantity") {
      const avgPrice = parseFloat(row.averagePrice || 0);
      const qty = parseFloat(value || 0);
      row.totalCost = avgPrice * qty;
    }

    if (name === "averagePrice") {
      const avgPrice = parseFloat(value || 0);
      const qty = parseFloat(row.quantity || 0);
      row.totalCost = avgPrice * qty;
    }

    setAddedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + (row.totalCost || 0));
  };


  const handleDeleteRow = (index) => {
    const updatedRows = [...addedRows];
    const row = updatedRows.splice(index, 1)[0];

    setAddedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - row.totalCost);
  };

  const handleSubmit = async () => {
    if (!mainItem) return toast.warning("Please select product");
    if (addedRows.length === 0) return toast.error("At least one item must be added");
    if (addedRows.some((r, i) => !r.averagePrice || !r.quantity))
      return toast.error("All rows must have cost price and quantity");
    if (!mainSellingPrice) return toast.warning("Please enter selling price");
    if (+mainSellingPrice < +total)
      return toast.warning("Selling price should be greater than total cost");
    if (!mainQty) return toast.warning("Please enter quantity");

    const data =
    {
      DocumentNo: billNo,
      BOMDate: date,
      Remark: remark,
      WarehouseId: 1,
      TotalCost: parseFloat(total),
      SellingPrice: parseFloat(mainSellingPrice),
      Quantity: parseFloat(mainQty),
      ProductId: mainItem.id,
      ProductCode: mainItem.code,
      ProductName: mainItem.name,
      InventoryPeriodId: 1,
      BillOfMaterialLineDetails: addedRows.map((row, index) => ({
        BomHeaderId: 1,
        DocumentNo: billNo,
        WarehouseId: 1,
        ProductId: row.id,
        ProductCode: row.code,
        ProductName: row.name,
        CostPrice: parseFloat(row.averagePrice),
        Quantity: parseFloat(row.quantity),
        LineTotal: parseFloat(row.totalCost),
        Wastage: parseFloat(row.wastage) || 0
      })),
    };


    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/BillOfMaterial/CreateBillOfMaterial`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.statusCode === 200) {
          toast.success(jsonResponse.message);
          setTimeout(() => {
            window.location.href = "/production/bom/";
          }, 1500);
        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/production/bom/",
    });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Bill Of Material</h1>
        <ul>
          <li>
            <Link href="/production/bom">Bill Of Material</Link>
          </li>
          <li> Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" gap={1} justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Bill No: {billNo}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Go Back
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Product
              </Typography>
              <Box sx={{ width: "60%", }}>
                <SearchItems
                  label="Search"
                  placeholder="Search Items by name"
                  fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                  main={true}
                  mainItem={null}
                  onSelect={(item) => {
                    setMainItem(item)
                  }}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Quantity
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={mainQty}
                onChange={(e) => setMainQty(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
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
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Selling Price
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={mainSellingPrice}
                onChange={(e) => setMainSellingPrice(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} mt={3} mb={2}>
              <SearchItems
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                main={false}
                mainItem={mainItem ? mainItem.id : null}
                onSelect={(item) => {
                  handleAddRow(item)
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Quantity</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Wastage</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">Total Cost Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedRows.length === 0 ? "" :
                      (addedRows.map((item, index) => {
                        // Ensure no null values are displayed
                        const safeItem = {
                          ...item,
                          quantity: item.quantity != null ? item.quantity : "",
                          wastage: item.wastage != null ? item.wastage : "",
                          averagePrice: item.averagePrice != null && item.averagePrice !== "null" ? String(item.averagePrice) : "",
                          totalCost: item.totalCost != null ? item.totalCost : 0,
                          name: item.name || "-"
                        };
                        return (
                          <TableRow key={index}
                            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                          >
                            <TableCell align="right">
                              <Tooltip title="Delete" placement="top">
                                <IconButton onClick={() => handleDeleteRow(index)} aria-label="delete" size="small">
                                  <DeleteIcon color="error" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                            <TableCell component="th" scope="row">
                              {safeItem.name}
                            </TableCell>
                            <TableCell>
                              <TextField size="small" value={safeItem.quantity} onChange={(e) => handleChange(index, e.target.value, "quantity")} />
                            </TableCell>
                            <TableCell>
                              <TextField size="small" value={safeItem.wastage} onChange={(e) => handleChange(index, e.target.value, "wastage")} />
                            </TableCell>
                            <TableCell>
                              <TextField 
                                size="small" 
                                value={safeItem.averagePrice} 
                                onChange={(e) => handleChange(index, e.target.value, "averagePrice")} 
                              />
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(safeItem.totalCost)}
                            </TableCell>
                          </TableRow>
                        );
                      }))}

                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell align="right" colSpan={5}>
                        <Typography>Total Cost</Typography>
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
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CreateBillOfMaterials;
