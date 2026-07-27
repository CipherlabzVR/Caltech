import React, { useCallback, useRef, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Typography,
  Box,
  Button,
  TextField,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import { ToastContainer, toast } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import SearchItems from "@/components/utils/SearchItems";

const PAGE_SIZE = 30;
const EXPORT_PAGE_SIZE = 500;
const DAILY_STOCK_CATEGORY_ID = 223;
const TABLE_COL_SPAN = 8;

const formatDisplayDateTime = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy hh:mm a");
  } catch (error) {
    return "-";
  }
};

const formatDisplayDate = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch (error) {
    return "-";
  }
};

const formatQty = (value) => {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(number);
};

const computeHasMore = (pageNumber, totalCount, pageSize) =>
  pageNumber * pageSize < totalCount;

export default function DailyStock() {
  const cId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("category") || DAILY_STOCK_CATEGORY_ID
      : DAILY_STOCK_CATEGORY_ID;
  const { navigate } = IsPermissionEnabled(cId);

  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date();
  defaultFrom.setMonth(defaultFrom.getMonth() - 1);
  const defaultFromStr = defaultFrom.toISOString().slice(0, 10);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [fromDate, setFromDate] = useState(defaultFromStr);
  const [toDate, setToDate] = useState(today);
  const [asOfDate, setAsOfDate] = useState(false);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searched, setSearched] = useState(false);

  const tableContainerRef = useRef(null);
  const fetchingMoreRef = useRef(false);

  const buildHistoryUrl = useCallback(
    (pageNumber, pageSize) => {
      let url = `${BASE_URL}/StockBalance/GetDailyStockByProductRange?productId=${selectedProduct.id}&asOfDate=${asOfDate}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
      if (!asOfDate) {
        url += `&fromDate=${fromDate}&toDate=${toDate}`;
      }
      return url;
    },
    [selectedProduct, asOfDate, fromDate, toDate]
  );

  const mapRowToExcelEntry = (row) => ({
    "Product Code": row.productCode,
    "Product Name": row.productName,
    "Created On": formatDisplayDateTime(row.createdOn),
    "Updated On": formatDisplayDateTime(row.updatedOn),
    "Process Date": formatDisplayDate(row.processDate),
    "Opening Qty": Number(row.openingQty ?? 0),
    "Closing Qty":
      row.closingQty === null || row.closingQty === undefined
        ? ""
        : Number(row.closingQty),
  });

  const fetchPage = useCallback(
    async (pageNumber, { append = false, pageSize = PAGE_SIZE } = {}) => {
      const token = localStorage.getItem("token");
      const response = await fetch(buildHistoryUrl(pageNumber, pageSize), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null);

      if (data?.statusCode === -99 || data?.status === "FAILED") {
        throw new Error(data?.message || "Failed to load stock transaction history.");
      }

      const items = Array.isArray(data?.result?.items) ? data.result.items : [];
      const count = Number(data?.result?.totalCount ?? 0);

      if (append) {
        setRows((prev) => [...prev, ...items]);
      } else {
        setRows(items);
      }

      setTotalCount(count);
      setPage(pageNumber);
      setHasMore(computeHasMore(pageNumber, count, pageSize));

      return { items, totalCount: count };
    },
    [buildHistoryUrl]
  );

  const handleSearch = async () => {
    if (!selectedProduct?.id) {
      toast.error("Please select a product.");
      return;
    }
    if (!asOfDate && (!fromDate || !toDate)) {
      toast.error("Please select a date range.");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setPage(1);
      setHasMore(false);
      fetchingMoreRef.current = false;
      await fetchPage(1, { append: false, pageSize: PAGE_SIZE });
    } catch (error) {
      console.error("Error fetching stock transaction history:", error);
      toast.error(error.message || "Failed to load stock transaction history.");
      setRows([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (fetchingMoreRef.current || loading || loadingMore || !hasMore || !searched) {
      return;
    }

    fetchingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      await fetchPage(nextPage, { append: true, pageSize: PAGE_SIZE });
    } catch (error) {
      console.error("Error loading more stock transaction history:", error);
      toast.error(error.message || "Failed to load more records.");
    } finally {
      setLoadingMore(false);
      fetchingMoreRef.current = false;
    }
  }, [hasMore, loading, loadingMore, page, searched, fetchPage]);

  const handleTableScroll = (event) => {
    const container = event.currentTarget;
    const nearBottom =
      container.scrollTop + container.clientHeight >= container.scrollHeight - 80;
    if (nearBottom) {
      loadMore();
    }
  };

  const exportToExcel = async () => {
    if (!selectedProduct?.id) {
      toast.error("Please select a product.");
      return;
    }
    if (!asOfDate && (!fromDate || !toDate)) {
      toast.error("Please select a date range.");
      return;
    }
    if (!searched || totalCount === 0) {
      toast.error("Nothing to export.");
      return;
    }

    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      const allRows = [];
      let pageNumber = 1;
      let total = totalCount;

      while (true) {
        const response = await fetch(buildHistoryUrl(pageNumber, EXPORT_PAGE_SIZE), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json().catch(() => null);

        if (data?.statusCode === -99 || data?.status === "FAILED") {
          throw new Error(data?.message || "Failed to export stock transaction history.");
        }

        const items = Array.isArray(data?.result?.items) ? data.result.items : [];
        total = Number(data?.result?.totalCount ?? total);
        allRows.push(...items);

        if (!computeHasMore(pageNumber, total, EXPORT_PAGE_SIZE)) {
          break;
        }
        pageNumber += 1;
      }

      if (allRows.length === 0) {
        toast.error("Nothing to export.");
        return;
      }

      const exportRows = allRows.map((row) => mapRowToExcelEntry(row));
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Transaction History");
      const productLabel = (selectedProduct?.code || selectedProduct?.name || "Product")
        .replace(/[^\w\-]+/g, "_")
        .slice(0, 40);
      const filename = asOfDate
        ? `Stock_Transaction_History_${productLabel}_All.xlsx`
        : `Stock_Transaction_History_${productLabel}_${fromDate}_to_${toDate}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${exportRows.length} row(s)`);
    } catch (error) {
      console.error("Error exporting stock transaction history:", error);
      toast.error(error.message || "Failed to export.");
    } finally {
      setExporting(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const productLabel = selectedProduct
    ? `${selectedProduct.code || ""} ${selectedProduct.name || ""}`.trim()
    : "";

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Transaction History</h1>
        <ul>
          <li>
            <Link href="/inventory/daily-stock/">Stock Transaction History</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 2 }}>
        <Grid item xs={12} sx={{ position: "relative", zIndex: 20 }}>
          <Paper sx={{ p: 2, overflow: "visible" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography
                  component="label"
                  sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5, display: "block" }}
                >
                  Product
                </Typography>
                <Box sx={{ position: "relative", zIndex: 1 }}>
                  <SearchItems
                    label="Search Product"
                    placeholder="Search items by name"
                    fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                    main
                    mainItem={null}
                    getResultLabel={(item) =>
                      item.code ? `${item.code} - ${item.name}` : item.name
                    }
                    onSelect={(item) => setSelectedProduct(item)}
                  />
                </Box>
              </Grid>
              {!asOfDate && (
                <>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography
                      component="label"
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5, display: "block" }}
                    >
                      From Date
                    </Typography>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <Typography
                      component="label"
                      sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5, display: "block" }}
                    >
                      To Date
                    </Typography>
                    <TextField
                      size="small"
                      type="date"
                      fullWidth
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} sm={6} md={asOfDate ? 4 : 2}>
                <FormControlLabel
                  sx={{ mt: { xs: 0, md: 2.5 } }}
                  control={
                    <Checkbox
                      checked={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.checked)}
                    />
                  }
                  label="As of Date"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box display="flex" gap={1} mt={{ xs: 0, md: 2.5 }}>
                  <Button
                    variant="contained"
                    startIcon={
                      loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />
                    }
                    onClick={handleSearch}
                    disabled={loading || exporting}
                    fullWidth
                  >
                    Search
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          {!searched && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {asOfDate
                ? "Select a product, then search."
                : "Select a product and date range, then search."}
            </Typography>
          )}
        </Grid>

        {searched && (
        <Grid item xs={12} sx={{ position: "relative", zIndex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              {`${totalCount} record(s) found${productLabel ? ` for ${productLabel}` : ""}`}
            </Typography>
            {totalCount > 0 && (
              <Tooltip title="Export to Excel">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    exporting ? <CircularProgress size={16} /> : <DownloadIcon />
                  }
                  onClick={exportToExcel}
                  disabled={exporting || loading}
                >
                  Export Excel
                </Button>
              </Tooltip>
            )}
          </Box>

          <TableContainer
            component={Paper}
            ref={tableContainerRef}
            onScroll={handleTableScroll}
            sx={{ maxHeight: 480, overflow: "auto" }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Product Code</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Updated On</TableCell>
                  <TableCell>Process Date</TableCell>
                  <TableCell align="right">Opening Qty</TableCell>
                  <TableCell align="right">Closing Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COL_SPAN} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COL_SPAN} align="center" sx={{ py: 4 }}>
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={row.id ?? index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.productCode || "-"}</TableCell>
                      <TableCell>{row.productName || "-"}</TableCell>
                      <TableCell>{formatDisplayDateTime(row.createdOn)}</TableCell>
                      <TableCell>{formatDisplayDateTime(row.updatedOn)}</TableCell>
                      <TableCell>{formatDisplayDate(row.processDate)}</TableCell>
                      <TableCell align="right">{formatQty(row.openingQty)}</TableCell>
                      <TableCell align="right">{formatQty(row.closingQty)}</TableCell>
                    </TableRow>
                  ))
                )}
                {loadingMore && (
                  <TableRow>
                    <TableCell colSpan={TABLE_COL_SPAN} align="center" sx={{ py: 2 }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        )}
      </Grid>
    </>
  );
}
