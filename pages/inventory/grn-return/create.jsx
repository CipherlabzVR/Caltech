import React, { useCallback, useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import useApi from "@/components/utils/useApi";
import { Textarea } from "@mantine/core";
import SearchDropdown from "@/components/utils/SearchDropdown";

const FormField = ({ label, children }) => (
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
      sx={{ fontWeight: "500", p: 1, fontSize: "14px", width: "35%" }}
    >
      {label}
    </Typography>
    {children}
  </Grid>
);

const GrnReturn = () => {
  const today = new Date();
  const [grossTotal, setGrossTotal] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [grnProducts, setGrnProducts] = useState([]);
  const [selectedGrnProduct, setSelectedGrnProduct] = useState(null);
  const [grnDate, setGrnDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [editRows, setEditRows] = useState([]);
  const [returnType, setReturnType] = useState("grn");
  const router = useRouter();
  const [currentUserWarehouse, setCurrentUserWarehouse] = useState(null);
  const [open, setOpen] = useState(false);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [stockBalances, setStockBalances] = useState([]);
  const [allCategories, setAllCategories] = useState(new Map());
  const [allSubCategories, setAllSubCategories] = useState(new Map());
  const [allUoms, setAllUoms] = useState(new Map());

  const {
    data: supplierList,
    error: supplierListError,
  } = useApi("/Supplier/GetAllSupplier");

  useEffect(() => {
    if (supplierList) {
      const activeSuppliers = supplierList.filter(supplier => supplier.isActive);
      setSuppliers(activeSuppliers);
    }
  }, [supplierList]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const apiUrl = `${BASE_URL}/Category/GetAllCategory`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        const categoryMap = new Map();
        const categoryList = data.result || [];

        categoryList.forEach(category => {
          categoryMap.set(category.id, category.name);
        });

        setAllCategories(categoryMap);
      } catch (error) {
        console.error("Could not load categories:", error);
        toast.error("Could not load item categories.");
      }
    };

    fetchAllCategories();
  }, []);

  useEffect(() => {
    const fetchAllSubCategories = async () => {
      try {
        const apiUrl = `${BASE_URL}/SubCategory/GetAllSubCategory`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch subcategories");
        }
        const data = await response.json();
        const subCategoryMap = new Map();
        const subCategoryList = data.result || [];

        subCategoryList.forEach(subCategory => {
          subCategoryMap.set(subCategory.id, subCategory.name);
        });

        setAllSubCategories(subCategoryMap);
      } catch (error) {
        console.error("Could not load subcategories:", error);
        toast.error("Could not load item subcategories.");
      }
    };

    fetchAllSubCategories();
  }, []);

  useEffect(() => {
    const fetchAllUoms = async () => {
      try {
        const apiUrl = `${BASE_URL}/UnitOfMeasure/GetAllUnitOfMeasure`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch Units of Measure");
        }
        const data = await response.json();
        const uomMap = new Map();
        const uomList = data.result || [];

        uomList.forEach(uom => {
          uomMap.set(uom.id, uom.name);
        });

        setAllUoms(uomMap);
      } catch (error) {
        console.error("Could not load UOMs:", error);
        toast.error("Could not load item Units of Measure.");
      }
    };

    fetchAllUoms();
  }, []);


  useEffect(() => {
    const fetchUserWarehouse = async () => {
      try {
        const userIdentifier = localStorage.getItem("user")?.replaceAll('"', '');

        if (userIdentifier) {
          const userResponse = await fetch(`${BASE_URL}/User/GetUserDetailByEmail?email=${userIdentifier}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (!userResponse.ok) throw new Error("Failed to fetch user details");
          const userData = await userResponse.json();
          const userResult = userData.result;
          const userWarehouseId = userResult?.warehouseId;

          if (userWarehouseId) {
            const warehouseResponse = await fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            if (!warehouseResponse.ok) throw new Error("Failed to fetch warehouses");
            const warehouseData = await warehouseResponse.json();
            const allWarehouses = warehouseData.result || [];

            const foundWarehouse = allWarehouses.find(wh => wh.id === userWarehouseId);

            if (foundWarehouse) {
              setCurrentUserWarehouse(foundWarehouse);
            } else {
              toast.error(`Warehouse with ID ${userWarehouseId} not found.`);
            }
          } else {
            toast.error("No assigned warehouse found for the current user.");
          }
        }
      } catch (error) {
        console.error("Could not get user warehouse data", error);
        toast.error("Could not retrieve user warehouse information.");
      }
    };

    fetchUserWarehouse();
  }, []);

  const fetchStockBalances = useCallback(async () => {
    if (currentUserWarehouse) {
      try {
        const apiUrl = `${BASE_URL}/StockBalance/GetAllStockBalanceByWarehouseId?warehouseId=${currentUserWarehouse.id}`;
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch stock balances");
        const data = await response.json();
        setStockBalances(data.result || []);
      } catch (error) {
        console.error("Error fetching stock balances:", error);
        toast.error("Could not load item stock levels.");
      }
    }
  }, [currentUserWarehouse]);

  useEffect(() => {
    fetchStockBalances();
  }, [fetchStockBalances]);

  useEffect(() => {
    if (selectedRows.length > 0 && stockBalances.length > 0) {
      const updatedRows = selectedRows.map(row => {
        const latestStockInfo = stockBalances.find(balance => balance.productId === row.productId);
        const newQty = latestStockInfo ? latestStockInfo.bookBalanceQuantity : row.qty;
        return { ...row, qty: newQty };
      });
      setSelectedRows(updatedRows);
    }
  }, [stockBalances]);

  useEffect(() => {
    const gross = selectedRows.reduce(
      (gross, row) => gross + (Number(row.returnAmount) || 0),
      0
    );
    setGrossTotal(gross);
  }, [selectedRows]);

  useEffect(() => {
    let active = true;

    if (!open || !supplier) {
      setSearchedProducts([]);
      return undefined;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      const apiUrl = searchTerm
        ? `${BASE_URL}/Items/GetAllItemsBySupplierIdAndName?supplierId=${supplier.id}&keyword=${searchTerm}`
        : `${BASE_URL}/Items/GetAllItemsBySupplierId?supplierId=${supplier.id}`;

      try {
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        if (active) {
          const rawProducts = data.result || [];
          const enrichedProducts = rawProducts.map(product => ({
            ...product,
            categoryName: allCategories.get(product.categoryId) || 'Uncategorized',
            subcategoryName: allSubCategories.get(product.subCategoryId) || '',
            uomName: allUoms.get(product.uom) || 'N/A'
          }));

          setSearchedProducts(enrichedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setSearchedProducts([]);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, searchTerm ? 500 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, supplier, open, allCategories, allSubCategories, allUoms]);

  useEffect(() => {
    const rowsToEdit = selectedRows.filter(row => row.isSelected);
    setEditRows(rowsToEdit);
  }, [selectedRows]);

  const handleReset = () => {
    setReturnType("grn");
    setSupplier(null);
    setSelectedGrnProduct(null);
    setGrnProducts([]);
    setSelectedRows([]);
    setGrossTotal(0);
    setRemark("");
  };

  const handleDeleteRow = (idToDelete) => {
    setSelectedRows((prevRows) =>
      prevRows.filter((row) => row.id !== idToDelete)
    );
    //toast.success("Item removed from the list.");
  };

  const handleSubmit = async () => {
    if (editRows.length === 0) {
      toast.warning("Please select at least one product to return.");
      return;
    }

    const hasErrors = editRows.some(row => !!row.returnQtyError);
    if (hasErrors) {
      toast.error("Please fix the errors in return quantities before submitting.");
      return;
    }

    const hasZeroStock = editRows.some(row => parseFloat(row.qty || 0) <= 0);
    if (hasZeroStock) {
      toast.error("Cannot return an item with zero stock. Please uncheck the item.");
      return;
    }

    const hasZeroReturnQty = editRows.some(row => parseFloat(row.returnedQty || 0) <= 0);
    if (hasZeroReturnQty) {
      toast.error("Return quantity for a selected item cannot be zero. Please update or uncheck the item.");
      return;
    }

    if (supplier == null) {
      toast.warning("Please Select Supplier");
      return;
    }

    if (returnType === "non-grn" && !currentUserWarehouse) {
      toast.error("Cannot submit: User's warehouse is not defined.");
      return;
    }

    if (returnType === "grn" && selectedGrnProduct == null) {
      toast.warning("Please Select GRN");
      return;
    }

    const postData = {
      DocumentNo: returnType === 'grn' ? "001" : null,
      SupplierId: parseInt(supplier.id),
      SupplierCode: "001",
      SupplierName: supplier.name,
      GRNDate: grnDate,
      Remark: remark,
      TotalAmount: parseFloat(grossTotal || 0),
      IsCredit: returnType === "grn" ? selectedGrnProduct.isCredit : true,

      GRNHeaderId: returnType === "grn" ? parseInt(selectedGrnProduct.id) : null,
      GRNDocumentNo: returnType === "grn" ? selectedGrnProduct.documentNo : null,
      ReferanceNo: returnType === 'grn' ? selectedGrnProduct.referanceNo : null,
      WarehouseId: returnType === "grn" ? parseInt(selectedGrnProduct.warehouseId) : parseInt(currentUserWarehouse.id),
      WarehouseCode: returnType === "grn" ? selectedGrnProduct.warehouseCode : currentUserWarehouse.code,
      WarehouseName: returnType === "grn" ? selectedGrnProduct.warehouseName : currentUserWarehouse.name,
      InventoryPeriodId: returnType === "grn" ? selectedGrnProduct.inventoryPeriodId : null,
      Discount: returnType === "grn" ? parseFloat(selectedGrnProduct.discount || 0) : 0,
      SalesPerson: returnType === "grn" ? selectedGrnProduct.salesPerson : null,

      GoodReturnNoteLineDetails: editRows.map((row) => ({
        GoodReturnHeaderID: 0,
        GoodReceivedLineId: row.isNonGrn ? null : parseInt(row.id),
        DocumentNo: returnType === 'grn' ? "001" : null,
        SequenceNumber: parseInt(row.sequenceNumber),
        WarehouseId: parseInt(row.warehouseId),
        WarehouseCode: row.warehouseCode,
        WarehouseName: row.warehouseName,
        ProductId: parseInt(row.productId),
        ProductCode: row.productCode,
        ProductName: row.productName,
        Batch: row.batch,
        ExpDate: row.expDate,
        UnitPrice: row.unitPrice ? parseFloat(row.unitPrice) : null,
        CostPrice: row.costPrice ? parseFloat(row.costPrice) : null,
        SellingPrice: row.sellingPrice ? parseFloat(row.sellingPrice) : null,
        MaximumSellingPrice: row.maximumSellingPrice ? parseFloat(row.maximumSellingPrice) : null,
        ReturnQty: parseFloat(row.returnedQty || 0),
        GRNQty: row.isNonGrn ? 0 : parseFloat(row.qty || 0),
        DiscountRate: row.discountRate ? parseFloat(row.discountRate) : null,
        DiscountAmount: row.discountAmount ? parseFloat(row.discountAmount) : null,
        Status: "Active",
        Remark: row.remark,
        LineTotal: parseFloat(row.returnAmount || 0),
        AverageCostPrice: row.averageCostPrice ? parseFloat(row.averageCostPrice) : null,
        AdditionalCost: parseFloat(row.additionalCost || 0),
        IsNonInventoryItem: row.isNonInventoryItem,
      })),
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/CreateGoodReturnNote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create GRN return.");
      }

      const data = await response.json();

      if (data.statusCode === 200) {
        toast.success(data.result.message || "GRN Return created successfully!");
        handleReset();
        fetchStockBalances();
      } else {
        toast.error(data.message || "An error occurred.");
      }
    } catch (error) {
      console.error("Error creating GRN return:", error);
      toast.error(error.message || "Error creating GRN return.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRow = (index) => {
    const updatedRows = selectedRows.map((row, i) => {
      if (i === index) {
        const newRow = { ...row, isSelected: !row.isSelected };
        if (!newRow.isSelected) {
          newRow.returnedQty = 0;
          newRow.returnAmount = 0;
          newRow.returnQtyError = null;
        }
        return newRow;
      }
      return row;
    });
    setSelectedRows(updatedRows);
  };

  const handleAddRow = (item) => {
    setSearchedProducts([]);
    setSearchTerm("");
    if (!item) return;
    if (selectedRows.some((row) => row.productId === item.id)) {
      toast.info("Product is already in the list.");
      return;
    }
    const stockInfo = stockBalances.find(b => b.productId === item.id);

    const stockQuantity = stockInfo ? stockInfo.bookBalanceQuantity : 0;

    const price = parseFloat(item.averagePrice) || 0;

    const newRow = {
      id: `new-${item.id}-${Date.now()}`,
      productId: item.id,
      productCode: item.code,
      productName: item.name,
      qty: stockQuantity,
      stockQty: stockQuantity,
      returnedQty: 0,
      unitPrice: price,
      returnAmount: 0,
      isSelected: true,
      remark: "",
      isNonGrn: true,
      sequenceNumber: selectedRows.length + 1,
      warehouseId: currentUserWarehouse.id,
      warehouseCode: currentUserWarehouse.code,
      warehouseName: currentUserWarehouse.name,
      batch: "",
      expDate: null,
      costPrice: price,
      sellingPrice: item.sellingPrice || 0,
      maximumSellingPrice: item.maximumSellingPrice || 0,
      discountRate: 0,
      discountAmount: 0,
      status: true,
      averageCostPrice: price,
      additionalCost: 0,
      isNonInventoryItem: item.isNonInventoryItem || false,
      returnQtyError: null,
    };

    setSelectedRows((prevRows) => [...prevRows, newRow]);
  };

  const handleRowValueChange = (index, field, value) => {
    const updatedRows = selectedRows.map((row, i) => {
      if (i === index) {
        const newRow = { ...row };
        if (field === "returnedQty") {
          const qty = parseFloat(value);
          newRow[field] = isNaN(qty) ? 0 : qty;

          const stockQty = newRow.qty;

          if (qty > stockQty) {
            newRow.returnQtyError = `Max return is ${stockQty}`;
          } else {
            newRow.returnQtyError = null;
          }

          const returnTotal = parseFloat(newRow.unitPrice) * qty;
          newRow.returnAmount = returnTotal;
        } else {
          newRow[field] = value;
        }
        return newRow;
      }
      return row;
    });
    setSelectedRows(updatedRows);
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/grn-return",
    });
  };

  const handleSelectSupplier = async (supplierId) => {
    if (returnType !== 'grn') return;
    try {
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/GetAllGRNBySupplierId?supplierId=${supplierId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GRNs for the supplier.");
      }

      const data = await response.json();
      setGrnProducts(data.result || []);
    } catch (error) {
      console.error("Error fetching GRNs:", error);
      toast.error("Failed to load GRNs.");
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Goods Return Note Create</h1>
        <ul>
          <li>
            <Link href="/inventory/grn-return">GRN Return</Link>
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
          <Grid container p={1}>
            <Grid item gap={2} xs={12} display="flex" justifyContent="end">
              <Button variant="outlined" onClick={() => navigateToBack()}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <FormField label="Return Type">
              <Autocomplete
                sx={{ width: "60%" }}
                options={["GRN Return", "Non-GRN Return"]}
                value={returnType === 'grn' ? 'GRN Return' : 'Non-GRN Return'}
                disableClearable
                // disabled={!!selectedGrnProduct}
                onChange={(event, newValue) => {
                  const newType = newValue === "GRN Return" ? "grn" : "non-grn";
                  setReturnType(newType);
                  setSupplier(null);
                  setSelectedRows([]);
                  setSelectedGrnProduct(null);
                  setGrnProducts([]);
                }}
                renderInput={(params) => <TextField {...params} size="small" />}
              />
            </FormField>

            <FormField label="Supplier">
              <Autocomplete
                sx={{ width: "60%" }}
                options={suppliers}
                getOptionLabel={(option) => option.name || ""}
                value={supplier}
                disableClearable
                isOptionEqualToValue={(option, value) => option.id === value.id}
                // disabled={!!selectedGrnProduct}
                onChange={(event, newValue) => {
                  setSupplier(newValue);
                  setSelectedRows([]);
                  setSelectedGrnProduct(null);
                  setGrnProducts([]);
                  if (newValue && returnType === 'grn') {
                    handleSelectSupplier(newValue.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    placeholder="Search Supplier"
                    error={!!supplierListError}
                    helperText={
                      supplierListError ? "Failed to load suppliers" : ""
                    }
                  />
                )}
              />
            </FormField>

            {returnType === 'grn' && (
              <FormField label="Select GRN">
                <Autocomplete
                  sx={{ width: "60%" }}
                  options={grnProducts}
                  getOptionLabel={(option) =>
                    option.documentNo || ""
                  }
                  value={selectedGrnProduct}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      const updatedList = newValue.goodReceivedNoteLineDetails.map(item => {
                        const stockInfo = stockBalances.find(balance => balance.productId === item.productId);
                        const currentStockQty = stockInfo ? stockInfo.bookBalanceQuantity : 0;

                        return {
                          ...item,
                          qty: item.qty,
                          stockQty: currentStockQty,
                          prevReturnedQty: item.returnedQty,
                          returnedQty: 0,
                          isSelected: false,
                          returnAmount: 0,
                          remark: '',
                          returnQtyError: null,
                        };
                      });
                      setSelectedGrnProduct(newValue);
                      setSelectedRows(updatedList);
                    } else {
                      setSelectedGrnProduct(null);
                      setSelectedRows([]);
                    }
                  }}
                  //  disabled={!supplier || !!selectedGrnProduct}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      placeholder={!supplier ? "Please select a supplier first" : "Search GRN by document no"}
                    />
                  )}
                />
              </FormField>
            )}

            <FormField label="GRN Return Date">
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={grnDate}
                onChange={(e) => setGrnDate(e.target.value)}
              />
            </FormField>

            <FormField label="Remark">
              <Textarea
                sx={{ width: "60%" }}
                size="small"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </FormField>

            {returnType === 'non-grn' && (
              <Grid item xs={12} mt={2} mb={1}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: 1 }}>
                  Search & Add Items
                </Typography>
                <Grid item xs={12} mt={1}>
                  <SearchDropdown
                    label="Search"
                    placeholder="Search Items by name"
                    fetchUrl={`${BASE_URL}/Items/GetAllItemsBySupplierIdAndName`}
                    queryParams={{ supplierId: supplier?.id }}
                    onSelect={(item) => handleAddRow(item)}
                  />
                </Grid>
              </Grid>
            )}

            <Grid item xs={12} mt={returnType != 'non-grn' ? 2 : 1}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      {returnType != 'non-grn' ? <TableCell sx={{ color: "#fff" }}>GRN&nbsp;Qty</TableCell> : ""}
                      <TableCell sx={{ color: "#fff" }}> Stock&nbsp;Qty </TableCell>
                      <TableCell sx={{ color: "#fff" }}> Return&nbsp;Qty </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Unit&nbsp;Price</TableCell>
                      {returnType != 'non-grn' ? <TableCell sx={{ color: "#fff" }}> Received&nbsp;Amount </TableCell> : ""}
                      <TableCell sx={{ color: "#fff" }}>Return&nbsp;Amount</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <Typography color="error">
                            No items available. Please select a GRN or add products to return.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedRows.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ p: 1 }}>
                            <Checkbox
                              checked={row.isSelected || false}
                              onChange={() => handleSelectRow(index)}
                            />
                            {row.isNonGrn && (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteRow(row.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                          <TableCell sx={{ p: 1 }}>
                            {row.productName}
                            {row.prevReturnedQty > 0 ?
                              <Typography color="error">(Returned : {row.prevReturnedQty})</Typography>
                              : ""}
                          </TableCell>
                          {returnType != 'non-grn' ?
                            <TableCell sx={{ p: 1 }}>
                              {row.qty}
                            </TableCell>
                            : ""}
                          <TableCell sx={{ p: 1 }}>{row.stockQty}</TableCell>
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={row.returnedQty || 0}
                              onChange={(e) =>
                                handleRowValueChange(index, "returnedQty", e.target.value)
                              }
                              fullWidth
                              error={!!row.returnQtyError}
                              helperText={row.returnQtyError || ""}
                              inputProps={{ min: 0 }}
                            />
                          </TableCell>
                          <TableCell sx={{ p: 1 }}>
                            {formatCurrency(row.unitPrice)}
                          </TableCell>
                          {returnType != 'non-grn' ? <TableCell sx={{ p: 1 }}>
                            {formatCurrency(row.qty * row.unitPrice)}
                          </TableCell>
                            : ""}
                          <TableCell sx={{ p: 1 }} align="right">
                            {formatCurrency(row.returnAmount)}
                          </TableCell>
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              value={row.remark || ''}
                              onChange={(e) => handleRowValueChange(index, 'remark', e.target.value)}
                              fullWidth
                              placeholder="Add remark"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell colSpan={returnType != 'non-grn' ? 8 : 6} align="right">
                        <Typography fontWeight="bold">Return Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {formatCurrency(grossTotal)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} my={3}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={handleSubmit}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default GrnReturn;