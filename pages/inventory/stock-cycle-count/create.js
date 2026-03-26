import React, { useState, useRef, useCallback, useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { formatDate } from "@/components/utils/formatHelper";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";

const ALL_OPTION = { id: null, name: "All" };

const SearchableSelectWithAll = ({
  label,
  placeholder,
  fetchOptions,
  value,
  onChange,
  getOptionLabel = (opt) => opt?.name || "All",
  disabled = false,
  includeAll = true,
}) => {
  const [options, setOptions] = useState(includeAll ? [ALL_OPTION] : []);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const loadOptions = useCallback(
    async (keyword) => {
      if (!fetchOptions) return;
      setLoading(true);
      try {
        const results = await fetchOptions(keyword || "");
        const prefix = includeAll ? [ALL_OPTION] : [];
        setOptions([...prefix, ...(results || [])]);
      } catch (err) {
        console.error(err);
        setOptions(includeAll ? [ALL_OPTION] : []);
      } finally {
        setLoading(false);
      }
    },
    [fetchOptions, includeAll]
  );

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadOptions(newInputValue);
    }, 400);
  };

  const handleOpen = () => {
    if (options.length <= (includeAll ? 1 : 0)) loadOptions("");
  };

  return (
    <Autocomplete
      options={options}
      value={value ?? (includeAll ? ALL_OPTION : null)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(opt, val) => (opt?.id ?? null) === (val?.id ?? null)}
      onInputChange={handleInputChange}
      onOpen={handleOpen}
      onChange={(e, newVal) => onChange(newVal?.id != null ? newVal : null)}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          fullWidth
        />
      )}
    />
  );
};

const StockCycleCountCreate = () => {
  const today = new Date();
  const router = useRouter();
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);
  const { categories, subCategories, uoms } = GetAllItemDetails();
  const { data: supplierList } = GetAllSuppliers();

  if (!navigate) {
    return <AccessDenied />;
  }

  const [startDate, setStartDate] = useState(formatDate(today));
  const [status, setStatus] = useState(0);
  const [statusOptions, setStatusOptions] = useState([]);
  const [remark, setRemark] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [tableItems, setTableItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uomMap = (uoms || []).reduce((acc, u) => {
    acc[u.id] = u.name;
    return acc;
  }, {});
  const categoryMap = (categories || []).reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {});
  const subCategoryMap = (subCategories || []).reduce((acc, sc) => {
    acc[sc.id] = sc.name;
    return acc;
  }, {});
  const supplierMap = (supplierList || []).reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {});

  const fetchSuppliers = async (keyword) => {
    const token = localStorage.getItem("token");
    const url = `${BASE_URL}/Supplier/GetSuppliersByName?keyword=${encodeURIComponent(keyword || "")}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.result || data?.data || [];
    return list.map((s) => ({ id: s.id, name: s.name || String(s.id) }));
  };

  const fetchCategories = async (keyword) => {
    const token = localStorage.getItem("token");
    const url = `${BASE_URL}/Category/GetCategoriesByName?keyword=${encodeURIComponent(keyword || "")}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data?.result || data?.data || [];
    return list.map((c) => ({ id: c.id, name: c.name || String(c.id) }));
  };

  const fetchSubCategories = useCallback(
    async (keyword) => {
      if (!category?.id) return [];
      const token = localStorage.getItem("token");
      const url = `${BASE_URL}/SubCategory/GetAllSubCategoriesByCategoryId?categoryId=${category.id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      let list = Array.isArray(data) ? data : data?.result || data?.data || [];
      if (keyword?.trim()) {
        const lower = keyword.trim().toLowerCase();
        list = list.filter((sc) => (sc.name || "").toLowerCase().includes(lower));
      }
      return list.map((sc) => ({ id: sc.id, name: sc.name || String(sc.id) }));
    },
    [category?.id]
  );

  const mapItemToRow = useCallback(
    (item) => {
      const catId = item.categoryId ?? item.CategoryId ?? 0;
      const subCatId = item.subCategoryId ?? item.SubCategoryId ?? 0;
      const supId = item.supplierId ?? item.Supplier ?? item.SupplierId ?? 0;
      return {
        id: item.id,
        code: item.code || "",
        name: item.name || "",
        uomId: item.uom || item.uomId,
        uomName: uomMap[item.uom || item.uomId] || "-",
        supplierId: supId,
        categoryId: catId,
        subCategoryId: subCatId,
        supplierName: supplier?.name ?? item.supplierName ?? supplierMap[supId] ?? "-",
        categoryName: category?.name ?? item.categoryName ?? categoryMap[catId] ?? "-",
        subCategoryName: subCategory?.name ?? item.subCategoryName ?? subCategoryMap[subCatId] ?? "-",
        stockForStartDay: "",
      };
    },
    [supplier, category, subCategory, uomMap, supplierMap, categoryMap, subCategoryMap]
  );

  const handleAdd = async () => {
    if (!supplier) {
      toast.error("Please select a supplier.");
      return;
    }
    setLoadingItems(true);
    try {
      const supplierId = supplier.id;
      const categoryId = category?.id ?? 0;
      const subCategoryId = subCategory?.id ?? 0;
      const token = localStorage.getItem("token");
      const warehouse = localStorage.getItem("warehouse");
      const url = `${BASE_URL}/Items/GetFilteredItems?supplier=${supplierId}&category=${categoryId}&subCategory=${subCategoryId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.result || data?.data || [];
      const newItems = list.filter((item) => !tableItems.some((p) => p.id === item.id));
      const mapped = newItems.map(mapItemToRow);

      if (mapped.length > 0 && warehouse && warehouse !== "null") {
        const productIds = mapped.map((m) => m.id).join(",");
        const stockRes = await fetch(
          `${BASE_URL}/StockBalance/GetStockBalanceForProductsByWarehouse?warehouseId=${warehouse}&productIds=${productIds}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (stockRes.ok) {
          const stockData = await stockRes.json();
          const stockMap = stockData?.result ?? stockData?.data ?? {};
          mapped.forEach((row) => {
            const qty = stockMap[row.id];
            row.stockForStartDay = qty != null ? String(qty) : "";
          });
        }
      }

      setTableItems((prev) => [...prev, ...mapped]);
      setSupplier(null);
      setCategory(null);
      setSubCategory(null);
      if (list.length === 0) {
        toast.info("No items found for the selected filters.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load items.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStockChange = (index, value) => {
    const updated = [...tableItems];
    updated[index] = { ...updated[index], stockForStartDay: value };
    setTableItems(updated);
  };

  const handleRemoveRow = (index) => {
    setTableItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    router.push("/inventory/stock-cycle-count");
  };

  const handleSubmit = async () => {
    if (!startDate || startDate.trim() === "") {
      toast.error("Start Date is required.");
      return;
    }
    if (tableItems.length === 0) {
      toast.error("At least one line item is required.");
      return;
    }
    const invalidStock = tableItems.some((row) => {
      const val = row.stockForStartDay;
      if (val === "" || val == null) return true;
      const num = Number(val);
      return isNaN(num) || num < 0;
    });
    if (invalidStock) {
      toast.error("Stock for Start Date quantity is required for all line items.");
      return;
    }

    const payload = {
      StartDate: startDate,
      Status: status,
      Remark: remark || "",
      StockCycleCountLineDetails: tableItems.map((row, idx) => ({
        ProductCode: row.code,
        ProductId: row.id,
        ProductName: row.name,
        SupplierId: row.supplierId ?? 0,
        CategoryId: row.categoryId ?? 0,
        SubCategoryId: row.subCategoryId ?? 0,
        StockForStartDate: Number(row.stockForStartDay) || 0,
      })),
    };

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/StockCycleCount/CreateStockCycleCount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.statusCode !== -99) {
        toast.success(data?.message || "Stock Cycle Count created successfully.");
        setTimeout(() => {
          router.push("/inventory/stock-cycle-count");
        }, 1000);
      } else {
        toast.error(data?.message || "Failed to create Stock Cycle Count.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Stock Cycle Count.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setSubCategory(null);
  }, [category]);

  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/EnumLookup/ActivityStatuses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const options = data?.result
          ? Object.entries(data.result).map(([value, label]) => ({
              value: Number(value),
              label,
            }))
          : [];
        setStatusOptions(options);
      } catch (err) {
        console.error("Failed to load status options:", err);
      }
    };
    fetchStatusOptions();
  }, []);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Cycle Count Create</h1>
        <ul>
          <li>
            <Link href="/inventory/stock-cycle-count">Stock Cycle Count</Link>
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
                Start Date <span style={{ color: "#d32f2f" }}>*</span>
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled
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
                Status
              </Typography>
              <FormControl sx={{ width: "60%" }} size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(Number(e.target.value))}
                  disabled
                >
                  {statusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                placeholder="Enter remark"
              />
            </Grid>

            <Grid item xs={12} mt={2} mb={1}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: 180, flex: "1 1 180px" }}>
                  <Typography
                    component="label"
                    sx={{ fontWeight: "500", fontSize: "12px", display: "block", mb: 0.5 }}
                  >
                    Supplier
                  </Typography>
                  <SearchableSelectWithAll
                    label=""
                    placeholder="Search Supplier"
                    fetchOptions={fetchSuppliers}
                    value={supplier}
                    onChange={setSupplier}
                    includeAll={false}
                  />
                </Box>
                <Box sx={{ minWidth: 180, flex: "1 1 180px" }}>
                  <Typography
                    component="label"
                    sx={{ fontWeight: "500", fontSize: "12px", display: "block", mb: 0.5 }}
                  >
                    Category
                  </Typography>
                  <SearchableSelectWithAll
                    label=""
                    placeholder="All"
                    fetchOptions={fetchCategories}
                    value={category}
                    onChange={setCategory}
                  />
                </Box>
                <Box sx={{ minWidth: 180, flex: "1 1 180px" }}>
                  <Typography
                    component="label"
                    sx={{ fontWeight: "500", fontSize: "12px", display: "block", mb: 0.5 }}
                  >
                    Sub Category
                  </Typography>
                  <SearchableSelectWithAll
                    label=""
                    placeholder={category ? "All" : "Select Category first"}
                    fetchOptions={fetchSubCategories}
                    value={subCategory}
                    onChange={setSubCategory}
                    disabled={!category}
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAdd}
                  disabled={loadingItems || !supplier}
                  sx={{ alignSelf: "flex-end", flexShrink: 0 }}
                >
                  {loadingItems ? "Loading..." : "Add"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setTableItems([])}
                  disabled={tableItems.length === 0}
                  sx={{ alignSelf: "flex-end", flexShrink: 0 }}
                >
                  Clear
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="stock cycle count items" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Code</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Supplier</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Category</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Sub Category</TableCell>
                      <TableCell sx={{ color: "#fff" }}>UOM</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Stock for Start Date <span style={{ color: "#ffcdd2" }}>*</span>
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }} align="center">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="textSecondary">
                            Click &quot;Add&quot; to load items based on filters
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tableItems.map((row, index) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.supplierName}</TableCell>
                          <TableCell>{row.categoryName}</TableCell>
                          <TableCell>{row.subCategoryName}</TableCell>
                          <TableCell>{row.uomName}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={row.stockForStartDay}
                              onChange={(e) =>
                                handleStockChange(index, e.target.value)
                              }
                              inputProps={{ min: 0 }}
                              sx={{ maxWidth: 120 }}
                              disabled={Number(row.stockForStartDay) > 0}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveRow(index)}
                              aria-label="delete"
                            >
                              <DeleteIcon color="error" fontSize="inherit" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} mt={3} display="flex" justifyContent="end" sx={{ gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                <Typography sx={{ fontWeight: "bold" }}>Cancel</Typography>
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || tableItems.length === 0}
              >
                <Typography sx={{ fontWeight: "bold" }}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default StockCycleCountCreate;
