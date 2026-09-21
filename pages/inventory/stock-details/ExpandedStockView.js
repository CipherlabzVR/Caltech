import React, { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
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
  CircularProgress,
  Box,
  Button,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const PAGE_SIZE = 10;
const EXPORT_PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_ALL = "all";
const FILTER_SUPPLIER = "supplier";
const FILTER_CATEGORY = "category";

const computeHasMore = (pageNumber, totalCount, pageSize) =>
  pageNumber * pageSize < totalCount;

const parseExpandedItems = (json) => {
  let items = [];
  let count = 0;

  if (Array.isArray(json?.result)) {
    items = json.result;
    count = json.result.length;
  } else if (json?.result?.result?.items) {
    items = json.result.result.items || [];
    count = Number(json.result.result.totalCount ?? items.length);
  } else if (json?.result?.items) {
    items = json.result.items || [];
    count = Number(json.result.totalCount ?? items.length);
  }

  return { items, count };
};

const buildDraftsFromProducts = (productList) => {
  const drafts = {};
  (productList || []).forEach((product) => {
    (product.lines || []).forEach((line) => {
      if (line?.id == null || line.sequenceNumber === 0) return;
      drafts[line.id] = {
        sellingPrice:
          line.sellingPrice != null && line.sellingPrice !== ""
            ? String(line.sellingPrice)
            : "",
        costPrice:
          line.costPrice != null && line.costPrice !== ""
            ? String(line.costPrice)
            : "",
      };
    });
  });
  return drafts;
};

const isEditableLine = (line) =>
  !!line?.id && line.sequenceNumber !== 0 && line.sequenceNumber !== "0";

export default function ExpandedStockView({
  showCostPrice,
  showBatch,
  showExpiry,
  canEditPrices = false,
  canEditCostPrice = false,
}) {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterBy, setFilterBy] = useState(FILTER_ALL);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [editingLineId, setEditingLineId] = useState(null);
  const [savingPriceId, setSavingPriceId] = useState(null);
  const fetchingMoreRef = useRef(false);
  // Prevent cascade loads: only one page per scroll-to-bottom; re-arm after user scrolls up.
  const loadMoreArmedRef = useRef(true);
  const tableContainerRef = useRef(null);

  const { data: supplierList } = GetAllSuppliers();
  const { categories } = GetAllItemDetails();

  const supplierId =
    filterBy === FILTER_SUPPLIER && selectedSupplier?.id ? Number(selectedSupplier.id) : 0;
  const categoryId =
    filterBy === FILTER_CATEGORY && selectedCategory?.id ? Number(selectedCategory.id) : 0;

  const colSpan =
    1 + // #
    1 + // item code
    1 + // item name
    (showBatch ? 1 : 0) +
    (showExpiry ? 1 : 0) +
    1 + // stock balance
    1 + // selling price
    1 + // category
    1 + // sub category
    1 + // uom
    (showCostPrice ? 1 : 0) +
    (canEditPrices ? 1 : 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const buildExpandedUrl = useCallback(
    (pageNumber, { term = debouncedSearch, pageSize = PAGE_SIZE } = {}) => {
      const skip = (pageNumber - 1) * pageSize;
      const searchParam = term ? encodeURIComponent(term) : "null";
      let url =
        `${BASE_URL}/StockBalance/GetExpandedStockDetailsPage` +
        `?SkipCount=${skip}&MaxResultCount=${pageSize}&Search=${searchParam}&Filter=null`;

      if (supplierId > 0) {
        url += `&SupplierId=${supplierId}`;
      }
      if (categoryId > 0) {
        url += `&CategoryId=${categoryId}`;
      }
      return url;
    },
    [categoryId, debouncedSearch, supplierId]
  );

  const fetchPage = useCallback(
    async (pageNumber, { append = false, term = debouncedSearch, pageSize = PAGE_SIZE } = {}) => {
      if (typeof window === "undefined") return { items: [], totalCount: 0 };

      const token = localStorage.getItem("token");
      const url = buildExpandedUrl(pageNumber, { term, pageSize });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load expanded stock details.");
      }

      const json = await response.json();
      const { items, count } = parseExpandedItems(json);

      if (append) {
        setProducts((prev) => {
          const next = [...prev, ...items];
          setPriceDrafts((prevDrafts) => ({
            ...prevDrafts,
            ...buildDraftsFromProducts(items),
          }));
          return next;
        });
      } else {
        setProducts(items);
        setPriceDrafts(buildDraftsFromProducts(items));
      }

      setTotalCount(count);
      setPage(pageNumber);
      setHasMore(computeHasMore(pageNumber, count, pageSize));

      return { items, totalCount: count };
    },
    [buildExpandedUrl, debouncedSearch]
  );

  useEffect(() => {
    let cancelled = false;

    const loadFirstPage = async () => {
      // Supplier/Category filter selected but value not chosen yet — wait.
      if (filterBy === FILTER_SUPPLIER && !selectedSupplier?.id) {
        setProducts([]);
        setTotalCount(0);
        setHasMore(false);
        setLoading(false);
        return;
      }
      if (filterBy === FILTER_CATEGORY && !selectedCategory?.id) {
        setProducts([]);
        setTotalCount(0);
        setHasMore(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setHasMore(false);
        fetchingMoreRef.current = false;
        loadMoreArmedRef.current = true;
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
        await fetchPage(1, { append: false, term: debouncedSearch });
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching expanded stock details:", error);
          toast.error(error.message || "Failed to load expanded stock details.");
          setProducts([]);
          setTotalCount(0);
          setHasMore(false);
          setPriceDrafts({});
          setEditingLineId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    setEditingLineId(null);
    loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    fetchPage,
    filterBy,
    selectedSupplier?.id,
    selectedCategory?.id,
  ]);

  const handleFilterByChange = (event) => {
    const next = event.target.value;
    setFilterBy(next);
    if (next !== FILTER_SUPPLIER) {
      setSelectedSupplier(null);
    }
    if (next !== FILTER_CATEGORY) {
      setSelectedCategory(null);
    }
  };

  const loadMore = useCallback(async () => {
    if (
      !loadMoreArmedRef.current ||
      fetchingMoreRef.current ||
      loading ||
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    loadMoreArmedRef.current = false;
    fetchingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      await fetchPage(nextPage, { append: true, term: debouncedSearch });
    } catch (error) {
      console.error("Error loading more expanded stock details:", error);
      toast.error(error.message || "Failed to load more products.");
      loadMoreArmedRef.current = true;
    } finally {
      setLoadingMore(false);
      fetchingMoreRef.current = false;
    }
  }, [debouncedSearch, fetchPage, hasMore, loading, loadingMore, page]);

  const handleTableScroll = (event) => {
    const container = event.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // Re-arm only after user scrolls away from the bottom, so we load 10 products per scroll.
    if (distanceFromBottom > 160) {
      loadMoreArmedRef.current = true;
    }

    if (distanceFromBottom <= 80) {
      loadMore();
    }
  };

  const handlePriceDraftChange = (lineId, field, value) => {
    setPriceDrafts((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || {}),
        [field]: value,
      },
    }));
  };

  const handleStartEdit = (line) => {
    if (!canEditPrices || !isEditableLine(line)) return;
    setPriceDrafts((prev) => ({
      ...prev,
      [line.id]: {
        sellingPrice:
          line.sellingPrice != null && line.sellingPrice !== ""
            ? String(line.sellingPrice)
            : "",
        costPrice:
          line.costPrice != null && line.costPrice !== ""
            ? String(line.costPrice)
            : "",
      },
    }));
    setEditingLineId(line.id);
  };

  const handleCancelEdit = (line) => {
    if (!line?.id) {
      setEditingLineId(null);
      return;
    }
    setPriceDrafts((prev) => ({
      ...prev,
      [line.id]: {
        sellingPrice:
          line.sellingPrice != null && line.sellingPrice !== ""
            ? String(line.sellingPrice)
            : "",
        costPrice:
          line.costPrice != null && line.costPrice !== ""
            ? String(line.costPrice)
            : "",
      },
    }));
    setEditingLineId(null);
  };

  const isPriceDirty = (line) => {
    if (!isEditableLine(line)) return false;
    const draft = priceDrafts[line.id];
    if (!draft) return false;

    const currentSelling = Number(line.sellingPrice ?? 0);
    const draftSelling = Number(draft.sellingPrice);
    if (Number.isNaN(draftSelling) || currentSelling !== draftSelling) return true;

    if (canEditCostPrice) {
      const currentCost = Number(line.costPrice ?? 0);
      const draftCost = Number(draft.costPrice);
      if (Number.isNaN(draftCost) || currentCost !== draftCost) return true;
    }

    return false;
  };

  const handleSavePrices = async (line) => {
    if (!canEditPrices || !isEditableLine(line)) return;
    const draft = priceDrafts[line.id];
    if (!draft) return;

    const sellingPrice = Number(draft.sellingPrice);
    if (draft.sellingPrice === "" || Number.isNaN(sellingPrice) || sellingPrice < 0) {
      toast.error("Enter a valid Selling Price.");
      return;
    }

    let costPrice = Number(line.costPrice ?? 0);
    if (canEditCostPrice) {
      costPrice = Number(draft.costPrice);
      if (draft.costPrice === "" || Number.isNaN(costPrice) || costPrice < 0) {
        toast.error("Enter a valid Cost Price.");
        return;
      }
    }

    setSavingPriceId(line.id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/StockBalance/UpdateStockBalancePrices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockBalanceId: line.id,
          sellingPrice,
          costPrice,
          updateCostPrice: canEditCostPrice,
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.statusCode === -99) {
        toast.error(data?.message || "Failed to update prices.");
        return;
      }

      toast.success(data?.message || "Stock prices updated successfully.");
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          lines: (product.lines || []).map((row) =>
            row.id === line.id
              ? {
                  ...row,
                  sellingPrice,
                  ...(canEditCostPrice ? { costPrice } : {}),
                }
              : row
          ),
        }))
      );
      setPriceDrafts((prev) => ({
        ...prev,
        [line.id]: {
          sellingPrice: String(sellingPrice),
          costPrice: String(canEditCostPrice ? costPrice : line.costPrice ?? 0),
        },
      }));
      setEditingLineId(null);
    } catch (error) {
      console.error("Error updating stock prices:", error);
      toast.error("Failed to update prices.");
    } finally {
      setSavingPriceId(null);
    }
  };

  const exportToExcel = async () => {
    if (totalCount === 0) {
      toast.error("Nothing to export.");
      return;
    }

    try {
      setExporting(true);
      const token = localStorage.getItem("token");
      const allProducts = [];
      let pageNumber = 1;
      let total = totalCount;

      while (true) {
        const url = buildExpandedUrl(pageNumber, {
          term: debouncedSearch,
          pageSize: EXPORT_PAGE_SIZE,
        });

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await response.json().catch(() => null);

        if (!response.ok || json?.statusCode === -99) {
          throw new Error(json?.message || "Failed to export expanded stock details.");
        }

        const { items, count } = parseExpandedItems(json);
        total = count || total;
        allProducts.push(...items);

        if (!computeHasMore(pageNumber, total, EXPORT_PAGE_SIZE)) {
          break;
        }
        pageNumber += 1;
      }

      const exportRows = [];
      allProducts.forEach((product) => {
        const lines = Array.isArray(product.lines) && product.lines.length > 0
          ? product.lines
          : [null];

        lines.forEach((line) => {
          const row = {
            "Item Code": product.productCode ?? "",
            "Item Name": product.productName ?? "",
          };

          if (showBatch) {
            row["Batch No"] = line?.batchNumber ?? "";
          }
          if (showExpiry) {
            row["EXP Date"] = line?.expiryDate ? formatDate(line.expiryDate) : "";
          }

          row["Stock Balance"] =
            line?.bookBalanceQuantity != null
              ? Number(line.bookBalanceQuantity)
              : Number(product.stockLevel ?? 0);
          row["Selling Price"] =
            line?.sellingPrice != null ? Number(line.sellingPrice) : "";
          row.Category = product.categoryName || line?.categoryName || "";
          row["Sub Category"] = product.subCategoryName || line?.subCategoryName || "";
          row.UOM = product.uom || line?.uom || "";

          if (showCostPrice) {
            row["Cost Price"] = line?.costPrice != null ? Number(line.costPrice) : "";
          }

          exportRows.push(row);
        });
      });

      if (exportRows.length === 0) {
        toast.error("Nothing to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expanded Stock");
      const dateStamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `StockDetails_Expanded_${dateStamp}.xlsx`);
      toast.success(`Exported ${exportRows.length} row(s)`);
    } catch (error) {
      console.error("Error exporting expanded stock details:", error);
      toast.error(error.message || "Failed to export.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
      <Grid item xs={12} md={4} lg={3}>
        <Search className="search-form">
          <StyledInputBase
            placeholder="Search item, code, batch..."
            inputProps={{ "aria-label": "search expanded stock" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Search>
      </Grid>

      <Grid item xs={12} sm={6} md={3} lg={2}>
        <FormControl size="small" fullWidth>
          <InputLabel>Filter By</InputLabel>
          <Select value={filterBy} label="Filter By" onChange={handleFilterByChange}>
            <MenuItem value={FILTER_ALL}>All</MenuItem>
            <MenuItem value={FILTER_SUPPLIER}>Supplier</MenuItem>
            <MenuItem value={FILTER_CATEGORY}>Category</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {filterBy === FILTER_SUPPLIER && (
        <Grid item xs={12} sm={6} md={3} lg={3}>
          <Autocomplete
            size="small"
            options={Array.isArray(supplierList) ? supplierList : []}
            getOptionLabel={(option) => option?.name || ""}
            value={selectedSupplier}
            onChange={(_e, value) => setSelectedSupplier(value)}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField {...params} label="Supplier" placeholder="Select supplier" />
            )}
          />
        </Grid>
      )}

      {filterBy === FILTER_CATEGORY && (
        <Grid item xs={12} sm={6} md={3} lg={3}>
          <Autocomplete
            size="small"
            options={Array.isArray(categories) ? categories : []}
            getOptionLabel={(option) => option?.name || ""}
            value={selectedCategory}
            onChange={(_e, value) => setSelectedCategory(value)}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField {...params} label="Category" placeholder="Select category" />
            )}
          />
        </Grid>
      )}

      <Grid
        item
        xs={12}
        md={filterBy === FILTER_ALL ? 5 : 2}
        lg={filterBy === FILTER_ALL ? 7 : 4}
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
      >
        <Tooltip title="Export to Excel">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={exportToExcel}
              disabled={exporting || loading || totalCount === 0}
            >
              Excel
            </Button>
          </span>
        </Tooltip>
      </Grid>

      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading products..."
              : filterBy === FILTER_SUPPLIER && !selectedSupplier?.id
                ? "Select a supplier to filter"
                : filterBy === FILTER_CATEGORY && !selectedCategory?.id
                  ? "Select a category to filter"
                  : `${totalCount} product(s)${hasMore ? " • scroll for more" : ""}`}
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          sx={{ maxHeight: 560, overflow: "auto" }}
        >
          <Table stickyHeader aria-label="expanded stock details table" className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Item Code</TableCell>
                <TableCell>Item Name</TableCell>
                {showBatch && <TableCell>Batch No</TableCell>}
                {showExpiry && <TableCell>EXP Date</TableCell>}
                <TableCell align="right">Stock Balance</TableCell>
                <TableCell align="right">Selling Price</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Sub Category</TableCell>
                <TableCell>UOM</TableCell>
                {showCostPrice && <TableCell align="right">Cost Price</TableCell>}
                {canEditPrices && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                    <Typography color="error">No products found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, productIndex) => {
                  const lines = Array.isArray(product.lines) ? product.lines : [];
                  const displayLines = lines.length > 0 ? lines : [null];

                  return displayLines.map((line, lineIndex) => {
                    const isFirstLine = lineIndex === 0;
                    const canEditRow = canEditPrices && isEditableLine(line);
                    const isEditing = canEditRow && editingLineId === line.id;

                    return (
                      <TableRow
                        key={`${product.productId ?? productIndex}-${line?.id ?? lineIndex}`}
                        sx={
                          isFirstLine && productIndex > 0
                            ? { "& > td": { borderTop: "2px solid", borderColor: "divider" } }
                            : undefined
                        }
                      >
                        <TableCell>{isFirstLine ? productIndex + 1 : ""}</TableCell>
                        <TableCell>{product.productCode ?? "–"}</TableCell>
                        <TableCell>{product.productName ?? "–"}</TableCell>
                        {showBatch && (
                          <TableCell>{line?.batchNumber ?? "–"}</TableCell>
                        )}
                        {showExpiry && (
                          <TableCell>
                            {line?.expiryDate ? formatDate(line.expiryDate) : "–"}
                          </TableCell>
                        )}
                        <TableCell align="right">
                          {line?.bookBalanceQuantity != null
                            ? line.bookBalanceQuantity
                            : product.stockLevel ?? "–"}
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: isEditing ? 120 : undefined }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={priceDrafts[line.id]?.sellingPrice ?? ""}
                              onChange={(e) =>
                                handlePriceDraftChange(line.id, "sellingPrice", e.target.value)
                              }
                              inputProps={{ min: 0, step: "0.01" }}
                              sx={{ width: 110 }}
                            />
                          ) : line?.sellingPrice != null ? (
                            formatCurrency(line.sellingPrice)
                          ) : (
                            "–"
                          )}
                        </TableCell>
                        <TableCell>
                          {product.categoryName || line?.categoryName || "–"}
                        </TableCell>
                        <TableCell>
                          {product.subCategoryName || line?.subCategoryName || "–"}
                        </TableCell>
                        <TableCell>{product.uom || line?.uom || "–"}</TableCell>
                        {showCostPrice && (
                          <TableCell
                            align="right"
                            sx={{ minWidth: isEditing && canEditCostPrice ? 120 : undefined }}
                          >
                            {isEditing && canEditCostPrice ? (
                              <TextField
                                size="small"
                                type="number"
                                value={priceDrafts[line.id]?.costPrice ?? ""}
                                onChange={(e) =>
                                  handlePriceDraftChange(line.id, "costPrice", e.target.value)
                                }
                                inputProps={{ min: 0, step: "0.01" }}
                                sx={{ width: 110 }}
                              />
                            ) : line?.costPrice != null ? (
                              formatCurrency(line.costPrice)
                            ) : (
                              "–"
                            )}
                          </TableCell>
                        )}
                        {canEditPrices && (
                          <TableCell align="right">
                            {canEditRow ? (
                              isEditing ? (
                                <Box display="inline-flex" alignItems="center" gap={0.25}>
                                  <Tooltip title="Save Prices">
                                    <span>
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        disabled={!isPriceDirty(line) || savingPriceId === line.id}
                                        onClick={() => handleSavePrices(line)}
                                      >
                                        {savingPriceId === line.id ? (
                                          <CircularProgress size={18} />
                                        ) : (
                                          <SaveIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={savingPriceId === line.id}
                                        onClick={() => handleCancelEdit(line)}
                                      >
                                        <CloseIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Tooltip title="Edit Prices">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleStartEdit(line)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )
                            ) : null}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  });
                })
              )}
              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 2 }}>
                    <CircularProgress size={22} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
