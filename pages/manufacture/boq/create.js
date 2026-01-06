"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
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

const CreateBillOfQuantities = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [billNo, setBillNo] = useState("");
  const [mainItem, setMainItem] = useState(null);
  const [mainQty, setMainQty] = useState(null);
  const [mainSellingPrice, setMainSellingPrice] = useState(null);
  const [remark, setRemark] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [total, setTotal] = useState(0);
  const [addedRows, setAddedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const updateBillNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=54`, {
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
    fetchTemplates();
  }, []);

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


  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/BillOfQuantity/GetBillOfQuantityTemplates`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const templateList = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        setTemplates(templateList);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const handleTemplateSelect = (templateId) => {
    if (!templateId) {
      setSelectedTemplateId("");
      setAddedRows([]);
      return;
    }

    setSelectedTemplateId(templateId);

    // Find the selected template from the templates list
    const template = templates.find(t => t.id === Number(templateId));
    
    if (!template) {
      toast.error("Template not found");
      return;
    }

    // Only apply line data (billOfQuantityLines) to the table
    const lineDetails = template.billOfQuantityLines || [];
    const rows = lineDetails.map(item => ({
      id: item.productId,
      code: item.productCode || "",
      name: item.productName || "",
      quantity: item.quantity != null ? item.quantity : "",
      wastage: item.wastage != null ? item.wastage : "",
      averagePrice: item.costPrice != null ? item.costPrice : "",
      totalCost: item.lineTotal || 0,
      productId: item.productId,
    }));

    setAddedRows(rows);
  };

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
    if (!selectedCustomer) return toast.error("Please select customer");
    if (!selectedProject) return toast.error("Please select project");
    if (!mainItem) return toast.warning("Please select product");
    if (addedRows.length === 0) return toast.error("At least one item must be added");
    if (addedRows.some((r, i) => !r.averagePrice || !r.quantity))
      return toast.error("All rows must have cost price and quantity");
    if (!mainSellingPrice) return toast.warning("Please enter selling price");
    if (+mainSellingPrice < +total)
      return toast.warning("Selling price should be greater than total cost");
    if (!mainQty) return toast.warning("Please enter quantity");
    if (isTemplate && !templateName?.trim()) return toast.error("Please enter template name");

    const data = {
      ProjectId: Number(selectedProject.id),
      CustomerId: Number(selectedCustomer.id),
      ProductId: mainItem.id,
      Date: date ? new Date(date).toISOString() : null,
      Quantity: parseFloat(mainQty),
      SellingPrice: parseFloat(mainSellingPrice),
      IsTemplate: isTemplate,
      Remark: remark || "",
      TotalCostPrice: parseFloat(total),
      ParentTemplateId: selectedTemplateId ? Number(selectedTemplateId) : null,
      TemplateName: isTemplate ? (templateName || "") : "",
      BillOfQuantityLines: addedRows.map((row) => ({
        ProductId: row.id,
        ProductCode: row.code || "",
        ProductName: row.name || "",
        CostPrice: row.averagePrice ? parseFloat(row.averagePrice) : null,
        Quantity: parseFloat(row.quantity),
        LineTotal: parseFloat(row.totalCost),
        Wastage: parseFloat(row.wastage) || 0
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/BillOfQuantity/CreateBillOfQuantity`,
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
            window.location.href = "/manufacture/boq/";
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
      pathname: "/manufacture/boq/",
    });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Bill Of Quantity</h1>
        <ul>
          <li>
            <Link href="/manufacture/boq">Bill Of Quantity</Link>
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
                    setSelectedProjectId("");
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
                Project
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchProject
                  label="Project"
                  placeholder="Search projects by name"
                  main={true}
                  mainItem={selectedProject?.id || null}
                  billType={2}
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
                Select Template
              </Typography>
              <Box sx={{ width: "60%" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={selectedTemplateId}
                    label="Template"
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.documentNo} - {template.templateName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                Is Template
              </Typography>
              <Box sx={{ width: "60%" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isTemplate}
                      onChange={(e) => setIsTemplate(e.target.checked)}
                    />
                  }
                  label=""
                />
              </Box>
            </Grid>
            {isTemplate && (
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
                  Template Name
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  error={isTemplate && !templateName?.trim()}
                  helperText={isTemplate && !templateName?.trim() ? "Template name is required" : ""}
                />
              </Grid>
            )}
            <Grid item xs={12} mt={3} mb={1}>
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

export default CreateBillOfQuantities;

