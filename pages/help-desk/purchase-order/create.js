import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PurchasingOrderType, { PurchasingOrderTypeLabels } from "@/components/utils/enums/PurchasingOrderType";

const HelpDeskPOCreate = () => {
  const today = new Date();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [poDate, setPODate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [poType, setPOType] = useState("");
  const [poNo, setPONo] = useState("0000000001"); // Will be generated from backend
  const [productRows, setProductRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem("category", "18"); // Purchase Order category
  }, []);

  const navigateToBack = () => {
    router.push({
      pathname: "/help-desk/purchase-order",
    });
  };

  // Fetch suppliers from master data (Supplier/GetAll)
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/Supplier/GetAll?SkipCount=0&MaxResultCount=10000&Search=null`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          // Handle paginated response structure
          if (result.result && result.result.items) {
            setSuppliers(result.result.items);
          } else if (Array.isArray(result.result)) {
            setSuppliers(result.result);
          } else if (Array.isArray(result)) {
            setSuppliers(result);
          }
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch items from master data (Items/GetAllItemsSkipAndTake) - same as master items page
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem("token");
        const skip = 0;
        const size = 10000;
        const search = "null";
        const query = `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${search}`;

        const response = await fetch(query, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch items. Status:", response.status, errorText);
          setItems([]);
          return;
        }

        const data = await response.json();
        console.log("Items API Response:", data);
        
        // Handle response structure - exactly like master items page: data.result.items
        if (data && data.result && data.result.items) {
          console.log("Found items in data.result.items:", data.result.items.length);
          setItems(data.result.items);
        } else {
          console.warn("Unexpected response structure:", data);
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      }
    };

    fetchItems();
  }, []);

  const handleAddProduct = () => {
    if (!supplier) {
      toast.error("Please select a supplier first");
      return;
    }
    // For now, just add an empty row - you can enhance this with item selection
    const newRow = {
      id: productRows.length + 1,
      productName: "",
      batch: "",
      expDate: "",
      qty: 1,
      remark: "",
    };
    setProductRows([...productRows, newRow]);
  };

  const handleDeleteProduct = (index) => {
    const updatedRows = productRows.filter((_, i) => i !== index);
    setProductRows(updatedRows);
  };

  const handleProductChange = (index, field, value) => {
    const updatedRows = [...productRows];
    updatedRows[index][field] = value;
    setProductRows(updatedRows);
  };

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug: Log items state
  useEffect(() => {
    console.log("Items state updated:", items.length, "items");
    if (items.length > 0) {
      console.log("Sample item:", items[0]);
    }
  }, [items]);

  const handleSubmit = async () => {
    if (!supplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (!poDate) {
      toast.error("Please select PO Date");
      return;
    }

    if (!poType) {
      toast.error("Please select PO Type");
      return;
    }

    const data = {
      PODate: poDate,
      SupplierId: supplier.id,
      ReferenceNo: referenceNo || null,
      Remark: remark || null,
      PurchasingOrderType: parseInt(poType),
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/HelpDesk/CreatePurchaseOrder`,
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
        console.log("Create Purchase Order Response:", jsonResponse);
        
        // Handle different response structures
        if (jsonResponse.result) {
          // Check if statusCode is 1 (SUCCESS)
          const statusCode = jsonResponse.result.statusCode;
          if (statusCode === 1 || statusCode === "SUCCESS") {
            toast.success(
              jsonResponse.result.message || "Purchase Order created successfully"
            );
            setTimeout(() => {
              router.push("/help-desk/purchase-order");
            }, 1500);
          } else {
            // Check if result contains the purchase order object directly (success case)
            if (jsonResponse.result.poNo || jsonResponse.result.id) {
              // Purchase order object returned directly - this is success
              toast.success("Purchase Order created successfully");
              setTimeout(() => {
                router.push("/help-desk/purchase-order");
              }, 1500);
            } else {
              // Show error message from response
              const errorMessage = jsonResponse.result.message || jsonResponse.result.result || "Failed to create Purchase Order";
              toast.error(errorMessage);
              console.error("Error response:", jsonResponse.result);
            }
          }
        } else if (jsonResponse.statusCode === 1 || jsonResponse.statusCode === "SUCCESS") {
          // Direct statusCode on response
          toast.success(
            jsonResponse.message || "Purchase Order created successfully"
          );
          setTimeout(() => {
            router.push("/help-desk/purchase-order");
          }, 1500);
        } else if (jsonResponse.poNo || jsonResponse.id) {
          // Purchase order object returned directly without wrapper - this is success
          toast.success("Purchase Order created successfully");
          setTimeout(() => {
            router.push("/help-desk/purchase-order");
          }, 1500);
        } else {
          // Unknown response structure
          toast.error(
            jsonResponse.message || jsonResponse.result?.message || "Failed to create Purchase Order"
          );
          console.error("Unexpected response structure:", jsonResponse);
        }
      } else {
        // HTTP error status
        const errorText = await response.text();
        console.error("HTTP Error:", response.status, errorText);
        let errorMessage = "Failed to create Purchase Order";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.result?.message || errorMessage;
        } catch (e) {
          // If not JSON, use the text
          errorMessage = errorText || errorMessage;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while creating Purchase Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Purchase Order Create</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/help-desk/help-desk">Help Desk</Link>
          </li>
          <li>
            <Link href="/help-desk/purchase-order">Purchase Order</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={3} spacing={2}>
            <Grid item gap={2} xs={12} display="flex" justifyContent="space-between" alignItems="center">
              <Box></Box>
              <Box display="flex" gap={2}>
                <Button variant="outlined" disabled>
                  <Typography sx={{ fontWeight: "bold" }}>
                    PO No: {poNo}
                  </Typography>
                </Button>
                <Button variant="outlined" onClick={() => navigateToBack()}>
                  <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
                </Button>
              </Box>
            </Grid>

            {/* Left Column */}
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                Supplier <span style={{ color: "red" }}>*</span>
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                options={suppliers}
                getOptionLabel={(option) => option.name || ""}
                value={supplier}
                onChange={(event, newValue) => setSupplier(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    placeholder="Search Supplier"
                    required
                  />
                )}
              />
            </Grid>

            {/* Right Column - Reference No */}
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                Reference No
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Enter Reference No"
              />
            </Grid>

            {/* Left Column - PO Date */}
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                PO Date <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={poDate}
                onChange={(e) => setPODate(e.target.value)}
                required
              />
            </Grid>

            {/* Right Column - Remark */}
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
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
                placeholder="Enter Remark"
              />
            </Grid>

            {/* Left Column - PO Type */}
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  fontSize: "14px",
                  width: "35%",
                }}
              >
                PO Type <span style={{ color: "red" }}>*</span>
              </Typography>
              <Select
                sx={{ width: "60%" }}
                size="small"
                value={poType}
                onChange={(e) => setPOType(e.target.value)}
                displayEmpty
                required
              >
                <MenuItem value="" disabled>
                  Select PO Type
                </MenuItem>
                <MenuItem value={PurchasingOrderType.Local}>
                  {PurchasingOrderTypeLabels[PurchasingOrderType.Local]}
                </MenuItem>
                <MenuItem value={PurchasingOrderType.Import}>
                  {PurchasingOrderTypeLabels[PurchasingOrderType.Import]}
                </MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* Search Bar */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>

            {/* Product Table */}
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "primary.main" }}>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Batch</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Exp Date</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Remark</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary">
                            No products added. Click the + button to add products.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      productRows.map((row, index) => (
                        <TableRow key={row.id || index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Autocomplete
                              size="small"
                              options={filteredItems}
                              getOptionLabel={(option) => option.name || ""}
                              value={items.find((item) => item.id === row.productId) || null}
                              onChange={(event, newValue) => {
                                handleProductChange(index, "productId", newValue?.id);
                                handleProductChange(index, "productName", newValue?.name || "");
                              }}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Select Product" />
                              )}
                              sx={{ minWidth: 200 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.batch}
                              onChange={(e) => handleProductChange(index, "batch", e.target.value)}
                              placeholder="Batch"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="date"
                              value={row.expDate}
                              onChange={(e) => handleProductChange(index, "expDate", e.target.value)}
                              InputLabelProps={{ shrink: true }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row.qty}
                              onChange={(e) => handleProductChange(index, "qty", parseInt(e.target.value) || 0)}
                              inputProps={{ min: 1 }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.remark}
                              onChange={(e) => handleProductChange(index, "remark", e.target.value)}
                              placeholder="Remark"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteProduct(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={1} display="flex" justifyContent="flex-start">
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  size="small"
                >
                  Add Product
                </Button>
              </Box>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} display="flex" justifyContent="flex-start" mt={2}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default HelpDeskPOCreate;
