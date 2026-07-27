import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
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
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import DeleteIcon from "@mui/icons-material/Delete";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import SearchDropdown from "@/components/utils/SearchDropdown";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import BatchPickerModal from "@/components/Inventory/BatchPickerModal";
import GrnLinePickerModal from "@/components/Inventory/GrnLinePickerModal";
import {
  authHeaders,
  batchLineToRow,
  fetchGrnsBySupplier,
  filterGrnDropdownOptions,
  getApiMessage,
  isApiSuccess,
  mapGrnsToDropdownOptions,
  mergeRows,
} from "@/components/Inventory/stockMovementHelpers";

const STOCK_DISPATCH_CATEGORY_ID = "21";

const formatQty = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
};

export default function StockDispatchCreate() {
  const router = useRouter();
  const today = new Date();
  const { create, permissionsLoading } = IsPermissionEnabled(STOCK_DISPATCH_CATEGORY_ID);

  const [supplier, setSupplier] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [dispatchDate, setDispatchDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [grnNumber, setGrnNumber] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGrn, setLoadingGrn] = useState(false);
  const [grnOptions, setGrnOptions] = useState([]);
  const [batchPickerItem, setBatchPickerItem] = useState(null);
  const [grnPickerGrn, setGrnPickerGrn] = useState(null);

  const { data: supplierList } = useApi("/Supplier/GetAllSupplier");
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled("IsExpireDateAvailable");
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled("IsBatchNumberAvailable");

  useEffect(() => {
    if (supplierList) {
      setSuppliers(supplierList);
    }
  }, [supplierList]);

  useEffect(() => {
    if (!supplier?.id) {
      setGrnOptions([]);
      return;
    }

    const loadGrnOptions = async () => {
      const grns = await fetchGrnsBySupplier(supplier.id);
      setGrnOptions(mapGrnsToDropdownOptions(grns));
    };

    loadGrnOptions();
  }, [supplier?.id]);

  const navigateToBack = () => {
    router.push("/inventory/stock-dispatch/");
  };

  const handleSupplierChange = (event, newValue) => {
    setSupplier(newValue || "");
    setSelectedRows([]);
    setGrnNumber("");
  };

  const handleAddItem = (item) => {
    if (!supplier?.id) {
      toast.error("Please select a supplier first.");
      return;
    }

    const warehouseId = item.warehouseId;
    const productId = item.id ?? item.productId;

    if (!warehouseId || !productId) {
      toast.error("Item warehouse information is missing.");
      return;
    }

    setBatchPickerItem(item);
  };

  const handleBatchSelect = (batch) => {
    const incomingRow = batchLineToRow(batch, supplier);
    const { merged, skipped } = mergeRows(selectedRows, [incomingRow]);
    setSelectedRows(merged);

    if (skipped > 0) {
      toast.info("This batch line is already added.");
    } else {
      toast.success("Batch line added to the table.");
    }
    setBatchPickerItem(null);
  };

  const handleGrnLineSelect = (row) => {
    const { merged, skipped } = mergeRows(selectedRows, [row]);
    setSelectedRows(merged);

    if (skipped > 0) {
      toast.info("This GRN line is already added.");
    } else {
      toast.success("GRN line added to the table.");
    }
  };

  const handleLoadGrn = async () => {
    if (!supplier?.id) {
      toast.error("Please select a supplier first.");
      return;
    }

    const searchNo = (grnNumber || "").trim();
    if (!searchNo) {
      toast.error("Please enter or select a GRN number.");
      return;
    }

    setLoadingGrn(true);
    try {
      const grns = await fetchGrnsBySupplier(supplier.id);
      const matchedGrn = grns.find(
        (grn) =>
          (grn.documentNo || "").trim().toLowerCase() === searchNo.toLowerCase()
      );

      if (!matchedGrn) {
        toast.error("GRN not found for the selected supplier.");
        return;
      }

      setGrnPickerGrn(matchedGrn);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load GRN lines.");
    } finally {
      setLoadingGrn(false);
    }
  };

  const handleDispatchQtyChange = (index, value) => {
    const updatedRows = [...selectedRows];
    updatedRows[index].dispatchQty = value;
    setSelectedRows(updatedRows);
  };

  const handleRemarkChange = (index, value) => {
    const updatedRows = [...selectedRows];
    updatedRows[index].remark = value;
    setSelectedRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    setSelectedRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const buildDispatchPayload = (row) => ({
    ProductId: row.productId,
    ProductCode: row.productCode,
    ProductName: row.productName,
    WarehouseId: row.warehouseId,
    BatchNumber: row.batchNumber,
    ExpiryDate: row.expiryDate,
    BookBalanceQuantity: Number(row.currentQty),
    UnitPrice: row.unitPrice,
    CostPrice: row.costPrice,
    SellingPrice: row.sellingPrice,
    SupplierID: row.supplierId,
    SupplierName: row.supplierName,
    DispatchQuantity: Number(row.dispatchQty),
    StockBalanceId: row.stockBalanceId,
    Remark: row.remark || remark || "",
  });

  const handleSubmit = async () => {
    if (!supplier?.id) {
      toast.error("Please select a supplier.");
      return;
    }

    if (!selectedRows.length) {
      toast.error("Please add at least one item to the table.");
      return;
    }

    const validRows = [];
    const invalidMessages = [];

    selectedRows.forEach((row, index) => {
      const dispatchQty =
        row.dispatchQty === "" || row.dispatchQty === null
          ? NaN
          : Number(row.dispatchQty);
      const availableQty = Number(row.currentQty);

      if (!Number.isFinite(dispatchQty) || dispatchQty <= 0) {
        invalidMessages.push(`Row ${index + 1}: dispatch quantity must be greater than 0.`);
        return;
      }

      if (availableQty <= 0) {
        invalidMessages.push(`Row ${index + 1}: no stock available to dispatch.`);
        return;
      }

      if (dispatchQty > availableQty) {
        invalidMessages.push(
          `Row ${index + 1}: dispatch quantity cannot exceed available quantity.`
        );
        return;
      }

      if (!row.stockBalanceId) {
        invalidMessages.push(`Row ${index + 1}: stock line not found.`);
        return;
      }

      validRows.push(row);
    });

    if (!validRows.length) {
      toast.error(invalidMessages[0] || "No valid lines to save.");
      return;
    }

    if (invalidMessages.length) {
      toast.warning(`${invalidMessages.length} row(s) will be skipped.`);
    }

    setIsSubmitting(true);
    try {
      const results = await Promise.allSettled(
        validRows.map(async (row) => {
          const response = await fetch(
            `${BASE_URL}/StockBalance/StockDispatchStockBalanceUpdate`,
            {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(buildDispatchPayload(row)),
            }
          );
          const json = await response.json();
          if (!response.ok || !isApiSuccess(json)) {
            throw new Error(getApiMessage(json));
          }
          return json;
        })
      );

      const succeeded = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - succeeded;

      if (succeeded === results.length) {
        toast.success(`All ${succeeded} dispatch(es) saved successfully.`);
        router.push("/inventory/stock-dispatch/");
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} of ${results.length} saved. ${failed} failed.`);
      } else {
        toast.error("Failed to save dispatches.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save dispatches.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (permissionsLoading) {
    return (
      <>
        <ToastContainer />
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (!create) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Dispatch Create</h1>
        <ul>
          <li>
            <Link href="/inventory/stock-dispatch/">Stock Dispatch</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" justifyContent="end" gap={2}>
              <Button variant="outlined" onClick={navigateToBack}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography
                component="label"
                sx={{ fontWeight: "500", p: 1, fontSize: "14px", width: "35%" }}
              >
                Supplier
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                options={suppliers}
                getOptionLabel={(option) => option.name || ""}
                value={supplier}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={handleSupplierChange}
                renderInput={(params) => (
                  <TextField {...params} size="small" fullWidth placeholder="Search Supplier" />
                )}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography
                component="label"
                sx={{ fontWeight: "500", p: 1, fontSize: "14px", width: "35%" }}
              >
                Dispatch Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography
                component="label"
                sx={{ fontWeight: "500", p: 1, fontSize: "14px", width: "35%" }}
              >
                GRN Number
              </Typography>
              <Box sx={{ width: "60%", display: "flex", gap: 1 }}>
                <Autocomplete
                  freeSolo
                  options={grnOptions}
                  filterOptions={filterGrnDropdownOptions}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.label || option.documentNo || ""
                  }
                  inputValue={grnNumber}
                  onInputChange={(event, value) => setGrnNumber(value)}
                  onChange={(event, value) => {
                    if (typeof value === "string") {
                      setGrnNumber(value);
                    } else if (value?.documentNo) {
                      setGrnNumber(value.documentNo);
                    }
                  }}
                  sx={{ flex: 1 }}
                  ListboxProps={{ sx: { maxHeight: 280 } }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="GRN Number" />
                  )}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLoadGrn}
                  disabled={loadingGrn || !supplier?.id}
                >
                  {loadingGrn ? "Loading..." : "Load"}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" mt={1}>
              <Typography
                component="label"
                sx={{ fontWeight: "500", p: 1, fontSize: "14px", width: "35%" }}
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

            <Grid item xs={12} mt={3} mb={1}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <SearchDropdown
                    label="Search"
                    placeholder="Search Items by name"
                    fetchUrl={`${BASE_URL}/Items/GetAllItemsBySupplierIdAndName`}
                    queryParams={{ supplierId: supplier?.id }}
                    onSelect={handleAddItem}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ overflowX: "auto" }}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="stock dispatch lines" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }} />
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Code</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      {IsBatchNumberAvailable && (
                        <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      )}
                      {IsExpireDateAvailable && (
                        <TableCell sx={{ color: "#fff" }}>Exp Date</TableCell>
                      )}
                      <TableCell sx={{ color: "#fff" }}>Available Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Dispatch Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Unit Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Selling Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} align="center">
                          <Typography color="error">No items added</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedRows.map((row, index) => (
                        <TableRow key={row.rowId}>
                          <TableCell sx={{ p: 1 }}>
                            <Tooltip title="Delete" placement="top">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteRow(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.productCode}</TableCell>
                          <TableCell>{row.productName}</TableCell>
                          {IsBatchNumberAvailable && <TableCell>{row.batchNumber || "-"}</TableCell>}
                          {IsExpireDateAvailable && (
                            <TableCell>{formatDate(row.expiryDate) || "-"}</TableCell>
                          )}
                          <TableCell>{formatQty(row.currentQty)}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={row.dispatchQty}
                              inputProps={{
                                min: 1,
                                max: row.currentQty,
                                step: "any",
                              }}
                              onChange={(e) => handleDispatchQtyChange(index, e.target.value)}
                              onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(row.costPrice)}</TableCell>
                          <TableCell>{formatCurrency(row.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(row.sellingPrice)}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={row.remark}
                              onChange={(e) => handleRemarkChange(index, e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} mt={2} mb={2}>
              <LoadingButton
                loading={isSubmitting}
                disabled={isSubmitting}
                handleSubmit={handleSubmit}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <BatchPickerModal
        open={Boolean(batchPickerItem)}
        onClose={() => setBatchPickerItem(null)}
        item={batchPickerItem}
        supplier={supplier}
        mode="dispatch"
        onSelect={handleBatchSelect}
      />

      <GrnLinePickerModal
        open={Boolean(grnPickerGrn)}
        onClose={() => setGrnPickerGrn(null)}
        grn={grnPickerGrn}
        supplier={supplier}
        mode="dispatch"
        onSelect={handleGrnLineSelect}
      />
    </>
  );
}
