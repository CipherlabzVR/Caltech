import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Button,
    CircularProgress,
    Box,
    Modal,
    Pagination,
    TextField,
    Tabs,
    Tab } from "@mui/material";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import SaveIcon from "@mui/icons-material/Save";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExpandedStockView from "./ExpandedStockView";
import PriceEditHistoryView from "./PriceEditHistoryView";

const PAGE_SIZE = 10;
const TABLE_COL_SPAN = 9;
const SEARCH_DEBOUNCE_MS = 300;

const computeHasMore = (pageNumber, totalCount, pageSize) =>
    pageNumber * pageSize < totalCount;

/** Item code from API (camelCase or PascalCase); treat string "null" as empty. */
const getItemCodeSortString = (item) => {
    const raw = item?.code ?? item?.Code;
    if (raw === null || raw === undefined) return "";
    const s = String(raw).trim();
    if (s === "" || s === "null" || s === "undefined") return "";
    return s;
};

const compareItemCodeSort = (a, b, direction) => {
    const sa = getItemCodeSortString(a);
    const sb = getItemCodeSortString(b);
    const cmp = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
    return direction === "desc" ? -cmp : cmp;
};

export default function StockDetails() {
    const { data: IsCostPriceVisible } = IsAppSettingEnabled("IsCostPriceVisible");
    const { approve1: hasCostPricePermission, print, editStockPrice } = IsPermissionEnabled(156);
    const showCostPrice = IsCostPriceVisible && hasCostPricePermission;
    const canEditPrices = !!editStockPrice;
    const canEditCostPrice = canEditPrices && showCostPrice;
    const { data: IsExpireDateAvailable } = IsAppSettingEnabled("IsExpireDateAvailable");
    const { data: IsBatchNumberAvailable } = IsAppSettingEnabled("IsBatchNumberAvailable");

    // 0 = Stock Details, 1 = Expanded View, 2 = Price Edit History
    const [activeTab, setActiveTab] = useState(0);

    // ── Main list (infinite scroll) ──────────────────────────────────────────
    const [itemsList, setItemsList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const fetchingMoreRef = useRef(false);
    // Prevent cascade loads: only one page per scroll-to-bottom; re-arm after user scrolls up.
    const loadMoreArmedRef = useRef(true);
    const tableContainerRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchPage = useCallback(async (pageNumber, { append = false, term = debouncedSearch } = {}) => {
        if (typeof window === "undefined") return { items: [], totalCount: 0 };

        const token = localStorage.getItem("token");
        const skip = (pageNumber - 1) * PAGE_SIZE;
        const searchParam = term ? encodeURIComponent(term) : "null";
        const url =
            `${BASE_URL}/Items/GetAllItemWithZeroQuantityPage` +
            `?SkipCount=${skip}&MaxResultCount=${PAGE_SIZE}&Search=${searchParam}&Filter=null`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json" } });

        if (!response.ok) {
            throw new Error("Failed to load stock details.");
        }

        const json = await response.json();
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

        if (append) {
            setItemsList((prev) => [...prev, ...items]);
        } else {
            setItemsList(items);
        }

        setTotalCount(count);
        setPage(pageNumber);
        setHasMore(computeHasMore(pageNumber, count, PAGE_SIZE));

        return { items, totalCount: count };
    }, [debouncedSearch]);

    useEffect(() => {
        if (activeTab !== 0) return;

        let cancelled = false;

        const loadFirstPage = async () => {
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
                    console.error("Error fetching stock details:", error);
                    toast.error(error.message || "Failed to load stock details.");
                    setItemsList([]);
                    setTotalCount(0);
                    setHasMore(false);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadFirstPage();
        return () => {
            cancelled = true;
        };
    }, [activeTab, debouncedSearch, fetchPage]);

    const loadMore = useCallback(async () => {
        if (
            activeTab !== 0 ||
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
            console.error("Error loading more stock details:", error);
            toast.error(error.message || "Failed to load more products.");
            loadMoreArmedRef.current = true;
        } finally {
            setLoadingMore(false);
            fetchingMoreRef.current = false;
        }
    }, [activeTab, debouncedSearch, fetchPage, hasMore, loading, loadingMore, page]);

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

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const handleTabChange = (_event, value) => {
        setActiveTab(value);
    };

    // ── Sort ────────────────────────────────────────────────────────────────
    const [sortBy, setSortBy] = useState("code-asc");

    const sortedItems = useMemo(() => {
        if (!itemsList.length) return [];
        const sorted = [...itemsList];
        switch (sortBy) {
            case "price-low-high":
                sorted.sort((a, b) => Number(a.salingPrice ?? 0) - Number(b.salingPrice ?? 0));
                break;
            case "price-high-low":
                sorted.sort((a, b) => Number(b.salingPrice ?? 0) - Number(a.salingPrice ?? 0));
                break;
            case "a-z":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case "z-a":
                sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
                break;
            case "code-asc":
                sorted.sort((a, b) => compareItemCodeSort(a, b, "asc"));
                break;
            case "code-desc":
                sorted.sort((a, b) => compareItemCodeSort(a, b, "desc"));
                break;
            default:
                break;
        }
        return sorted;
    }, [itemsList, sortBy]);

    // ── Modal / stock-line detail (paginated) ────────────────────────────────
    const [open, setOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // We control the modal's paginated fetch manually so we can pass productId + warehouseId
    const [stockLines, setStockLines] = useState([]);
    const [isStockLoading, setIsStockLoading] = useState(false);
    const [modalPage, setModalPage] = useState(1);
    const [modalPageSize, setModalPageSize] = useState(10);
    const [modalTotalCount, setModalTotalCount] = useState(0);
    const [priceDrafts, setPriceDrafts] = useState({});
    const [savingPriceId, setSavingPriceId] = useState(null);

    const initPriceDrafts = (lines) => {
        const drafts = {};
        (lines || []).forEach((line) => {
            if (line?.id == null) return;
            drafts[line.id] = {
                sellingPrice:
                    line.sellingPrice != null && line.sellingPrice !== ""
                        ? String(line.sellingPrice)
                        : "",
                costPrice:
                    line.costPrice != null && line.costPrice !== ""
                        ? String(line.costPrice)
                        : "" };
        });
        setPriceDrafts(drafts);
    };

    const fetchProductStockLine = async (productId, pageNum = 1, size = 10) => {
        setIsStockLoading(true);
        try {
            const warehouseId = localStorage.getItem("warehouse");
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=${warehouseId}&productId=${productId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            if (!response.ok) throw new Error("Failed to fetch stock lines");
            const data = await response.json();
            // Handle both paginated shape and plain array fallback
            const result = data?.result;
            if (result && result.items) {
                setStockLines(result.items);
                setModalTotalCount(result.totalCount ?? result.items.length);
                initPriceDrafts(result.items);
            } else if (Array.isArray(result)) {
                setStockLines(result);
                setModalTotalCount(result.length);
                initPriceDrafts(result);
            } else {
                setStockLines([]);
                setModalTotalCount(0);
                setPriceDrafts({});
            }
        } catch (error) {
            console.error("Error fetching product stock line:", error);
            setStockLines([]);
            setModalTotalCount(0);
            setPriceDrafts({});
        } finally {
            setIsStockLoading(false);
        }
    };

    const handleViewAction = (item) => {
        setSelectedProduct(item);
        setModalPage(1);
        setModalPageSize(10);
        setPriceDrafts({});
        setOpen(true);
        fetchProductStockLine(item.id, 1, 10);
    };

    const handleClose = () => {
        setOpen(false);
        setStockLines([]);
        setSelectedProduct(null);
        setModalPage(1);
        setModalTotalCount(0);
        setPriceDrafts({});
        setSavingPriceId(null);
    };

    const handlePriceDraftChange = (lineId, field, value) => {
        setPriceDrafts((prev) => ({
            ...prev,
            [lineId]: {
                ...(prev[lineId] || {}),
                [field]: value } }));
    };

    const isPriceDirty = (line) => {
        if (!line?.id) return false;
        const draft = priceDrafts[line.id];
        if (!draft) return false;
        const currentSelling = Number(line.sellingPrice ?? 0);
        const draftSelling = Number(draft.sellingPrice);
        if (Number.isNaN(draftSelling)) return true;
        if (currentSelling !== draftSelling) return true;
        if (canEditCostPrice) {
            const currentCost = Number(line.costPrice ?? 0);
            const draftCost = Number(draft.costPrice);
            if (Number.isNaN(draftCost)) return true;
            if (currentCost !== draftCost) return true;
        }
        return false;
    };

    const handleSavePrices = async (line) => {
        if (!line?.id || !canEditPrices) return;
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
                    "Content-Type": "application/json" },
                body: JSON.stringify({
                    stockBalanceId: line.id,
                    sellingPrice,
                    costPrice,
                    updateCostPrice: canEditCostPrice }) });

            const data = await response.json();
            if (!response.ok || data?.statusCode === -99) {
                toast.error(data?.message || "Failed to update prices.");
                return;
            }

            toast.success(data?.message || "Stock prices updated successfully.");
            setStockLines((prev) =>
                prev.map((row) =>
                    row.id === line.id
                        ? {
                              ...row,
                              sellingPrice,
                              ...(canEditCostPrice ? { costPrice } : {}) }
                        : row
                )
            );
            setPriceDrafts((prev) => ({
                ...prev,
                [line.id]: {
                    sellingPrice: String(sellingPrice),
                    costPrice: String(canEditCostPrice ? costPrice : line.costPrice ?? 0) } }));
        } catch (error) {
            console.error("Error updating stock prices:", error);
            toast.error("Failed to update prices.");
        } finally {
            setSavingPriceId(null);
        }
    };

    const handleModalPageChange = (event, value) => {
        setModalPage(value);
        fetchProductStockLine(selectedProduct.id, value, modalPageSize);
    };

    const handleModalPageSizeChange = (event) => {
        const size = event.target.value;
        setModalPageSize(size);
        setModalPage(1);
        fetchProductStockLine(selectedProduct.id, 1, size);
    };

    const modalDetailColCount =
        1 + // #
        (IsBatchNumberAvailable ? 1 : 0) +
        (IsExpireDateAvailable ? 1 : 0) +
        1 + // stock balance
        1 + // selling price
        1 + // category
        1 + // sub category
        1 + // UOM
        (showCostPrice ? 1 : 0) + // cost price (after requested order)
        (canEditPrices ? 1 : 0); // save action

    const lineBookQty = (line) => line.bookBalanceQuantity ?? line.BookBalanceQuantity;
    const lineCategory = (line) =>
        line.categoryName ?? line.CategoryName ?? selectedProduct?.categoryName ?? "–";
    const lineSubCategory = (line) =>
        line.subCategoryName ?? line.SubCategoryName ?? selectedProduct?.subCategoryName ?? "–";
    const lineUom = (line) => line.uom ?? line.UOM ?? selectedProduct?.uomName ?? "–";

    const openStockDetailsPrintPopup = () => {
        const query = new URLSearchParams({
            search: search || "",
            sortBy: sortBy || "code-asc",
            includeDetails: "1",
            showBatch: IsBatchNumberAvailable ? "1" : "0",
            showExpiry: IsExpireDateAvailable ? "1" : "0",
            showCostPrice: showCostPrice ? "1" : "0"
        });

        window.open(
            `/inventory/stock-details/print?${query.toString()}`,
            "stock-details-print",
            "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
        );
    };

    const openItemStockPrintPopup = (item) => {
        const query = new URLSearchParams({
            productId: String(item.id ?? ""),
            itemCode: item.code ?? item.Code ?? "",
            itemName: item.name ?? "",
            categoryName: item.categoryName ?? "",
            subCategoryName: item.subCategoryName ?? "",
            supplierName: item.supplierName ?? "",
            uomName: item.uomName ?? "",
            stockLevel: String(item.qty ?? 0),
            showBatch: IsBatchNumberAvailable ? "1" : "0",
            showExpiry: IsExpireDateAvailable ? "1" : "0",
            showCostPrice: showCostPrice ? "1" : "0"
        });

        window.open(
            `/inventory/stock-details/print?${query.toString()}`,
            `stock-details-item-print-${item.id}`,
            "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
        );
    };

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Stock Details</h1>
                <ul>
                    <li>
                        <Link href="/inventory/stock-details/">Stock Details</Link>
                    </li>
                </ul>
            </div>

            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="stock details views"
                    variant="scrollable"
                    allowScrollButtonsMobile
                >
                    <Tab label="Stock Details" />
                    <Tab label="Expanded View" />
                    <Tab label="Price Edit History" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
                {/* Search bar */}
                <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search here.."
                            inputProps={{ "aria-label": "search" }}
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </Search>
                </Grid>

                <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" gap={1} order={{ xs: 1, lg: 2 }}>
                    {print ? (
                        <Button
                            variant="outlined"
                            startIcon={<LocalPrintshopIcon />}
                            onClick={openStockDetailsPrintPopup}
                        >
                            Print
                        </Button>
                    ) : null}
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            label="Sort By"
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <MenuItem value="default">Default (API order)</MenuItem>
                            <MenuItem value="price-low-high">Price: Low to High</MenuItem>
                            <MenuItem value="price-high-low">Price: High to Low</MenuItem>
                            <MenuItem value="a-z">Name: A - Z</MenuItem>
                            <MenuItem value="z-a">Name: Z - A</MenuItem>
                            <MenuItem value="code-asc">Item Code: Low → High</MenuItem>
                            <MenuItem value="code-desc">Item Code: High → Low</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* Table */}
                <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                            {loading
                                ? "Loading products..."
                                : `${totalCount} product(s)${hasMore ? " • scroll for more" : ""}`}
                        </Typography>
                    </Box>
                    <TableContainer
                        component={Paper}
                        ref={tableContainerRef}
                        onScroll={handleTableScroll}
                        sx={{ maxHeight: 560, overflow: "auto" }}
                    >
                        <Table stickyHeader aria-label="stock details table" className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Item Code</TableCell>
                                    <TableCell>Item Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Sub Category</TableCell>
                                    <TableCell>Supplier</TableCell>
                                    <TableCell>UOM</TableCell>
                                    <TableCell align="right">Stock Level</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COL_SPAN} align="center" sx={{ py: 4 }}>
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : itemsList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COL_SPAN} align="center" sx={{ py: 4 }}>
                                            <Typography color="error">No items found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedItems.map((item, index) => (
                                        <TableRow key={item.stockBalanceId ?? item.id ?? index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{item.code ?? item.Code ?? "–"}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.categoryName ?? "–"}</TableCell>
                                            <TableCell>{item.subCategoryName ?? "–"}</TableCell>
                                            <TableCell>{item.supplierName ?? "–"}</TableCell>
                                            <TableCell>{item.uomName ?? "–"}</TableCell>
                                            <TableCell align="right">{item.qty ?? 0}</TableCell>
                                            <TableCell align="right">
                                                {print ? (
                                                    <Tooltip title="Print Item Stock">
                                                        <IconButton
                                                            onClick={() => openItemStockPrintPopup(item)}
                                                            size="small"
                                                        >
                                                            <LocalPrintshopIcon color="primary" fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : null}
                                                <Tooltip title="View Details">
                                                    <IconButton onClick={() => handleViewAction(item)} size="small">
                                                        <VisibilityIcon color="primary" fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
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
            </Grid>
            )}

            {activeTab === 1 && (
                <ExpandedStockView
                    showCostPrice={showCostPrice}
                    showBatch={!!IsBatchNumberAvailable}
                    showExpiry={!!IsExpireDateAvailable}
                    canEditPrices={canEditPrices}
                    canEditCostPrice={canEditCostPrice}
                />
            )}

            {activeTab === 2 && (
                <PriceEditHistoryView showCostPrice={showCostPrice} />
            )}

            {/* ── View Modal ─────────────────────────────────────────────────────── */}
            <Modal open={open} onClose={handleClose}>
                <Box sx={modalStyle} className="bg-black">
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" component="div">
                            Stock Balance Details
                        </Typography>
                        {selectedProduct && (
                            <Typography variant="subtitle1" component="div" sx={{ mt: 0.5, color: "text.secondary" }}>
                                {[selectedProduct.code ?? selectedProduct.Code, selectedProduct.name]
                                    .filter(Boolean)
                                    .join(" — ")}
                            </Typography>
                        )}
                    </Box>
                    <Box>
                        {isStockLoading ? (
                            <Box display="flex" justifyContent="center" p={3}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <TableContainer component={Paper} className="dark-table" sx={{ maxHeight: "50vh" }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                {IsBatchNumberAvailable && <TableCell>Batch No</TableCell>}
                                                {IsExpireDateAvailable && <TableCell>EXP Date</TableCell>}
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
                                            {stockLines.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={modalDetailColCount} align="center">
                                                        No details found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                stockLines.map((line, index) => (
                                                    <TableRow key={line.id ?? index}>
                                                        <TableCell>{(modalPage - 1) * modalPageSize + index + 1}</TableCell>
                                                        {IsBatchNumberAvailable && <TableCell>{line.batchNumber ?? "–"}</TableCell>}
                                                        {IsExpireDateAvailable && (
                                                            <TableCell>{line.expiryDate ? formatDate(line.expiryDate) : "–"}</TableCell>
                                                        )}
                                                        <TableCell align="right">
                                                            {lineBookQty(line) != null ? lineBookQty(line) : "–"}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ minWidth: canEditPrices ? 120 : undefined }}>
                                                            {canEditPrices ? (
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
                                                            ) : line.sellingPrice != null ? (
                                                                formatCurrency(line.sellingPrice)
                                                            ) : (
                                                                "–"
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{lineCategory(line)}</TableCell>
                                                        <TableCell>{lineSubCategory(line)}</TableCell>
                                                        <TableCell>{lineUom(line)}</TableCell>
                                                        {showCostPrice && (
                                                            <TableCell align="right" sx={{ minWidth: canEditCostPrice ? 120 : undefined }}>
                                                                {canEditCostPrice ? (
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
                                                                ) : line.costPrice != null ? (
                                                                    formatCurrency(line.costPrice)
                                                                ) : (
                                                                    "–"
                                                                )}
                                                            </TableCell>
                                                        )}
                                                        {canEditPrices && (
                                                            <TableCell align="right">
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
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Modal pagination */}
                                {modalTotalCount > modalPageSize && (
                                    <Grid container justifyContent="space-between" mt={1}>
                                        <Pagination
                                            count={Math.ceil(modalTotalCount / modalPageSize)}
                                            page={modalPage}
                                            onChange={handleModalPageChange}
                                            color="primary"
                                            shape="rounded"
                                            size="small"
                                        />
                                        <FormControl size="small" sx={{ width: "90px" }}>
                                            <InputLabel>Page Size</InputLabel>
                                            <Select value={modalPageSize} label="Page Size" onChange={handleModalPageSizeChange}>
                                                <MenuItem value={5}>5</MenuItem>
                                                <MenuItem value={10}>10</MenuItem>
                                                <MenuItem value={25}>25</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                )}
                            </>
                        )}
                    </Box>
                    <Box display="flex" mt={2} justifyContent="flex-end" gap={1}>
                        {print && selectedProduct ? (
                            <Button
                                variant="contained"
                                startIcon={<LocalPrintshopIcon />}
                                onClick={() => openItemStockPrintPopup(selectedProduct)}
                            >
                                Print
                            </Button>
                        ) : null}
                        <Button onClick={handleClose} variant="outlined" color="primary">
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
}

const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 980, xs: 350 },
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 3
};
