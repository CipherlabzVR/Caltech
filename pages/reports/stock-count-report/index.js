import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { ToastContainer, toast } from "react-toastify";
import * as XLSX from "xlsx";
import styles from "@/styles/PageTitle.module.css";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const formatQty = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
};

const differenceLabel = (value) => {
  const num = Number(value || 0);
  if (num < 0) return `Short / ${num.toFixed(2)}`;
  if (num > 0) return `Excess / ${num.toFixed(2)}`;
  return "Matched";
};

const renderDifference = (value) => {
  const num = Number(value || 0);
  if (num < 0) {
    return <Chip label={`Short / ${num.toFixed(2)}`} color="error" size="small" />;
  }
  if (num > 0) {
    return <Chip label={`Excess / ${num.toFixed(2)}`} color="success" size="small" />;
  }
  return <Chip label="Matched" size="small" variant="outlined" />;
};

const StockCountReport = () => {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, print } = IsPermissionEnabled(cId);

  const { categories, subCategories } = GetAllItemDetails();
  const { data: supplierList } = GetAllSuppliers();
  const { data: warehouseList } = GetAllWarehouse();
  const [itemList, setItemList] = useState([]);

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    itemId: "",
    categoryId: "",
    subCategoryId: "",
    supplierId: "",
    warehouseId: "",
  });

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/Items/GetAllItems`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        setItemList(Array.isArray(data?.result) ? data.result : []);
      } catch (error) {
        setItemList([]);
      }
    };
    fetchItems();
  }, []);

  const itemOptions = useMemo(
    () =>
      itemList.map((item) => ({
        id: item.id ?? item.Id,
        label: `${item.code ?? item.Code ?? ""} - ${item.name ?? item.Name ?? ""}`.trim(),
      })),
    [itemList]
  );

  const buildQuery = (skip, take) => {
    const params = new URLSearchParams();
    if (filters.fromDate) params.append("FromDate", filters.fromDate);
    if (filters.toDate) params.append("ToDate", filters.toDate);
    if (filters.itemId) params.append("ItemId", filters.itemId);
    if (filters.categoryId) params.append("CategoryId", filters.categoryId);
    if (filters.subCategoryId) params.append("SubCategoryId", filters.subCategoryId);
    if (filters.supplierId) params.append("SupplierId", filters.supplierId);
    if (filters.warehouseId) params.append("WarehouseId", filters.warehouseId);
    params.append("SkipCount", skip);
    params.append("MaxResultCount", take);
    return `${BASE_URL}/Shift/GetStockCountReport?${params.toString()}`;
  };

  const fetchRows = async (skip, take) => {
    const response = await fetch(buildQuery(skip, take), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to load report");
    const data = await response.json();
    return data?.result || { items: [], totalCount: 0 };
  };

  const fetchReport = async (pageNum = 1, size = pageSize) => {
    setLoading(true);
    try {
      const skip = (pageNum - 1) * size;
      const result = await fetchRows(skip, size);
      setRows(result.items || []);
      setTotalCount(result.totalCount || 0);
    } catch (error) {
      toast.error(error.message || "Unable to load report");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    setPage(1);
    fetchReport(1, pageSize);
  };

  const handleReset = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      itemId: "",
      categoryId: "",
      subCategoryId: "",
      supplierId: "",
      warehouseId: "",
    });
    setPage(1);
    setRows([]);
    setTotalCount(0);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchReport(value, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchReport(1, size);
  };

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const getAllRowsForExport = async () => {
    const result = await fetchRows(0, 0);
    return result.items || [];
  };

  const exportColumns = [
    { header: "Date", get: (r) => (r.shiftDate ? formatDate(r.shiftDate) : "-") },
    { header: "Shift Code", get: (r) => r.shiftCode ?? "-" },
    { header: "Warehouse", get: (r) => r.warehouseName ?? "-" },
    { header: "Item Code", get: (r) => r.itemCode ?? "-" },
    { header: "Item Name", get: (r) => r.itemName ?? "-" },
    { header: "Category", get: (r) => r.categoryName ?? "-" },
    { header: "Sub Category", get: (r) => r.subCategoryName ?? "-" },
    { header: "Supplier", get: (r) => r.supplierName ?? "-" },
    { header: "Start Physical Qty", get: (r) => formatQty(r.startQty) },
    { header: "Start System Qty", get: (r) => formatQty(r.systemStartQty) },
    { header: "Start Difference", get: (r) => differenceLabel(r.startDifferenceQty) },
    { header: "End Physical Qty", get: (r) => formatQty(r.endQty) },
    { header: "End System Qty", get: (r) => formatQty(r.systemEndQty) },
    { header: "End Difference", get: (r) => differenceLabel(r.endDifferenceQty) },
  ];

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const data = await getAllRowsForExport();
      if (!data.length) {
        toast.info("No data to export");
        return;
      }
      const aoa = [
        exportColumns.map((c) => c.header),
        ...data.map((row) => exportColumns.map((c) => c.get(row))),
      ];
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Count Report");
      XLSX.writeFile(workbook, `stock-count-report-${Date.now()}.xlsx`);
    } catch (error) {
      toast.error(error.message || "Excel export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const data = await getAllRowsForExport();
      if (!data.length) {
        toast.info("No data to export");
        return;
      }
      const headerCells = exportColumns.map((c) => `<th style="padding:6px;border:1px solid #ccc;font-size:10px;text-align:left;">${c.header}</th>`).join("");
      const bodyRows = data
        .map(
          (row) =>
            `<tr>${exportColumns
              .map((c) => `<td style="padding:6px;border:1px solid #ccc;font-size:10px;">${c.get(row)}</td>`)
              .join("")}</tr>`
        )
        .join("");
      const html = `
        <div style="font-family:Arial, sans-serif;padding:16px;">
          <h3 style="margin:0 0 12px 0;">Stock Count Report</h3>
          <table style="border-collapse:collapse;width:100%;">
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
      const container = document.createElement("div");
      container.innerHTML = html;
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 8,
          filename: `stock-count-report-${Date.now()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a3", orientation: "landscape" },
        })
        .from(container)
        .save();
    } catch (error) {
      toast.error(error.message || "PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Count Report</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Reports</li>
          <li>Stock Count Report</li>
        </ul>
      </div>

      <Paper sx={{ p: 2, mb: 2 }} className="bg-black">
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Report Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date From"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate}
              onChange={(e) => setFilter("fromDate", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date To"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.toDate}
              onChange={(e) => setFilter("toDate", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              size="small"
              options={itemOptions}
              value={itemOptions.find((o) => String(o.id) === String(filters.itemId)) || null}
              onChange={(e, newValue) => setFilter("itemId", newValue ? newValue.id : "")}
              renderInput={(params) => <TextField {...params} label="Item" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={filters.categoryId}
                onChange={(e) => setFilter("categoryId", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(categories || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Sub Category</InputLabel>
              <Select
                label="Sub Category"
                value={filters.subCategoryId}
                onChange={(e) => setFilter("subCategoryId", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(subCategories || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select
                label="Supplier"
                value={filters.supplierId}
                onChange={(e) => setFilter("supplierId", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(supplierList || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Warehouse</InputLabel>
              <Select
                label="Warehouse"
                value={filters.warehouseId}
                onChange={(e) => setFilter("warehouseId", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {(warehouseList || []).map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center" gap={1}>
            <Button variant="contained" onClick={handleApply}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="flex-end" gap={1} mb={1}>
        <Button
          variant="contained"
          color="success"
          startIcon={<FileDownloadIcon />}
          onClick={handleExportExcel}
          disabled={exporting || loading}
        >
          Export to Excel
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleExportPdf}
          disabled={exporting || loading}
        >
          Export to PDF
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="stock count report table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Shift Code</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Item Code</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Start Physical Qty</TableCell>
              <TableCell align="right">Start System Qty</TableCell>
              <TableCell align="center">Start Difference</TableCell>
              <TableCell align="right">End Physical Qty</TableCell>
              <TableCell align="right">End System Qty</TableCell>
              <TableCell align="center">End Difference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography color="error">No records found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={`${row.shiftId}-${row.itemId}-${index}`}>
                  <TableCell>{row.shiftDate ? formatDate(row.shiftDate) : "-"}</TableCell>
                  <TableCell>{row.shiftCode}</TableCell>
                  <TableCell>{row.warehouseName || "-"}</TableCell>
                  <TableCell>{row.itemCode}</TableCell>
                  <TableCell>{row.itemName}</TableCell>
                  <TableCell>{row.categoryName || "-"}</TableCell>
                  <TableCell align="right">{formatQty(row.startQty)}</TableCell>
                  <TableCell align="right">{formatQty(row.systemStartQty)}</TableCell>
                  <TableCell align="center">{renderDifference(row.startDifferenceQty)}</TableCell>
                  <TableCell align="right">{formatQty(row.endQty)}</TableCell>
                  <TableCell align="right">{formatQty(row.systemEndQty)}</TableCell>
                  <TableCell align="center">{renderDifference(row.endDifferenceQty)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Grid container justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
          <Pagination
            count={Math.max(1, Math.ceil(totalCount / pageSize))}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
          <FormControl size="small" sx={{ mr: 2, width: "110px" }}>
            <InputLabel>Page Size</InputLabel>
            <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </TableContainer>
    </>
  );
};

export default StockCountReport;
