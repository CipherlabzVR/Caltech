"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import SearchCustomer from "@/components/utils/SearchCustomer";
import SearchProject from "@/components/utils/SearchProject";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const CreateBillOfMaterials = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [billNo, setBillNo] = useState("");
  const [mainItem, setMainItem] = useState(null);
  const [bom, setBom] = useState({});
  const [mainQty, setMainQty] = useState(null);
  const [mainSellingPrice, setMainSellingPrice] = useState(null);
  const [remark, setRemark] = useState("");
  const [total, setTotal] = useState(0);
  const [addedRows, setAddedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const { id } = router.query;

  const fetchBom = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/BillOfMaterial/GetBillOfMaterialById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      const result = data.result;
      setBom(result);
      setDate(formatDate(result.bomDate));
      setMainQty(result.quantity);
      setRemark(result.remark);
      setMainSellingPrice(result.sellingPrice);
      setBillNo(result.documentNo);
      setTotal(result.totalCost);
      
      // Set customer and project IDs from response
      if (result.customerId) {
        // Create customer object from BOM data
        const customerName = result.customerName || "";
        const nameParts = customerName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        setSelectedCustomer({
          id: result.customerId,
          firstName: firstName,
          lastName: lastName,
          displayName: customerName,
        });
      }
      if (result.projectId) {
        // Create project object from BOM data
        setSelectedProject({
          id: result.projectId,
          name: result.projectName || "",
          code: result.projectCode || "",
        });
      }

      setAddedRows(
        result.billOfMaterialLineDetails.map(item => ({
          ...item,
          name: item.productName,
          averagePrice: item.costPrice,
          totalCost: item.lineTotal,
          productId: item.productId,
          code: item.productCode
        }))
      );
    } catch (error) {
      console.error("Error fetching :", error);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchBom();
    }
  }, [id]);

  // Clear project when customer changes
  useEffect(() => {
    if (!selectedCustomer?.id) {
      setSelectedProject(null);
    }
  }, [selectedCustomer]);

  // Recalculate total whenever addedRows changes
  useEffect(() => {
    const calculatedTotal = addedRows.reduce((sum, row) => {
      const rowTotal = parseFloat(row.totalCost) || 0;
      return sum + (isNaN(rowTotal) ? 0 : rowTotal);
    }, 0);
    setTotal(calculatedTotal);
  }, [addedRows]);

  const handleAddRow = (item) => {
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
      productId: item.id,
      totalCost: item.averagePrice != null ? (item.averagePrice || 0) : 0,
    };

    setAddedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      return updatedRows;
    });
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...addedRows];
    const row = updatedRows[index];

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
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...addedRows];
    updatedRows.splice(index, 1);
    setAddedRows(updatedRows);
  };

  const handleSubmit = async () => {
    if (addedRows.length === 0) return toast.error("At least one item must be added");
    if (addedRows.some((r, i) => !r.averagePrice || !r.quantity))
      return toast.error("All rows must have cost price and quantity");
    if (!mainSellingPrice) return toast.warning("Please enter selling price");
    if (+mainSellingPrice < +total)
      return toast.warning("Selling price should be greater than total cost");
    if (!mainQty) return toast.warning("Please enter quantity");

    const data =
    {
      Id: bom.id,
      DocumentNo: bom.documentNo,
      BOMDate: date,
      Remark: remark || "",
      WarehouseId: 1,
      TotalCost: parseFloat(total),
      SellingPrice: parseFloat(mainSellingPrice),
      Quantity: parseFloat(mainQty),
      ProductId: bom.productId,
      ProductCode: bom.productCode,
      ProductName: bom.productName,
      InventoryPeriodId: 1,
      BillOfMaterialLineDetails: addedRows.map((row, index) => ({
        BomHeaderId: 1,
        DocumentNo: billNo,
        WarehouseId: 1,
        ProductId: row.productId,
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
        `${BASE_URL}/BillOfMaterial/UpdateBillOfMaterial`,
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
            window.location.href = "/manufacture/bom/";
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
      pathname: "/manufacture/bom/",
    });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Edit Bill Of Material</h1>
        <ul>
          <li>
            <Link href="/manufacture/bom">Bill Of Material</Link>
          </li>
          <li> Edit</li>
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
                Customer
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchCustomer
                  label="Customer"
                  placeholder="Search customers by name"
                  main={true}
                  mainItem={selectedCustomer?.id || null}
                  displayValue={selectedCustomer 
                    ? (selectedCustomer.firstName && selectedCustomer.lastName
                        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                        : selectedCustomer.displayName || selectedCustomer.firstName || "")
                    : ""}
                  onSelect={(customer) => {
                    setSelectedCustomer(customer);
                  }}
                  onClear={() => {
                    setSelectedCustomer(null);
                    setSelectedProject(null);
                  }}
                  disabled={true}
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
                Project
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchProject
                  label="Project"
                  placeholder="Search projects by name"
                  main={true}
                  mainItem={selectedProject?.id || null}
                  billType={1}
                  customerId={selectedCustomer?.id || null}
                  displayValue={selectedProject 
                    ? (selectedProject.code && selectedProject.name
                        ? `${selectedProject.name} - ${selectedProject.code}`
                        : selectedProject.code || selectedProject.name || "")
                    : ""}
                  onSelect={(project) => {
                    setSelectedProject(project);
                  }}
                  onClear={() => {
                    setSelectedProject(null);
                  }}
                  disabled={true}
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
                Product
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="text"
                value={bom ? bom.productName : ""}
                disabled
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
            <Grid item xs={12} mt={3} mb={1}>
              <SearchItems
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                main={false}
                mainItem={bom.productId}
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

