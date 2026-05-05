import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";

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
    const { data: IsExpireDateAvailable } = IsAppSettingEnabled("IsExpireDateAvailable");
    const { data: IsBatchNumberAvailable } = IsAppSettingEnabled("IsBatchNumberAvailable");

    // ── Main list (paginated) ────────────────────────────────────────────────
    const {
        data: itemsList,
        totalCount,
        page,
        pageSize,
        search,
        setPage,
        setPageSize,
        setSearch,
        fetchData: fetchItemsList,
        loading,
    } = usePaginatedFetch(
        "Items/GetAllItemWithZeroQuantityPage",
        "",   // initialSearch
        10,   // initialPageSize
        false, // initialIsCurrentDate — not needed here
        false  // shouldIncludeIsCurrentDateParam
    );

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
        fetchItemsList(1, event.target.value, pageSize);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        fetchItemsList(value, search, pageSize);
    };

    const handlePageSizeChange = (event) => {
        const size = event.target.value;
        setPageSize(size);
        setPage(1);
        fetchItemsList(1, search, size);
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

    const fetchProductStockLine = async (productId, pageNum = 1, size = 10) => {
        setIsStockLoading(true);
        try {
            const warehouseId = localStorage.getItem("warehouse");
            const token = localStorage.getItem("token");
            const skip = (pageNum - 1) * size;
            const response = await fetch(
                `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=${warehouseId}&productId=${productId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch stock lines");
            const data = await response.json();
            // Handle both paginated shape and plain array fallback
            const result = data?.result;
            if (result && result.items) {
                setStockLines(result.items);
                setModalTotalCount(result.totalCount ?? result.items.length);
            } else if (Array.isArray(result)) {
                setStockLines(result);
                setModalTotalCount(result.length);
            } else {
                setStockLines([]);
                setModalTotalCount(0);
            }
        } catch (error) {
            console.error("Error fetching product stock line:", error);
            setStockLines([]);
            setModalTotalCount(0);
        } finally {
            setIsStockLoading(false);
        }
    };

    const handleViewAction = (item) => {
        setSelectedProduct(item);
        setModalPage(1);
        setModalPageSize(10);
        setOpen(true);
        fetchProductStockLine(item.id, 1, 10);
    };

    const handleClose = () => {
        setOpen(false);
        setStockLines([]);
        setSelectedProduct(null);
        setModalPage(1);
        setModalTotalCount(0);
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
        (IsCostPriceVisible ? 1 : 0); // cost price (after requested order)

    const lineBookQty = (line) => line.bookBalanceQuantity ?? line.BookBalanceQuantity;
    const lineCategory = (line) =>
        line.categoryName ?? line.CategoryName ?? selectedProduct?.categoryName ?? "–";
    const lineSubCategory = (line) =>
        line.subCategoryName ?? line.SubCategoryName ?? selectedProduct?.subCategoryName ?? "–";
    const lineUom = (line) => line.uom ?? line.UOM ?? selectedProduct?.uomName ?? "–";

    return (
        <>
            <div className={styles.pageTitle}>
                <h1>Stock Details</h1>
                <ul>
                    <li>
                        <Link href="/inventory/stock-details/">Stock Details</Link>
                    </li>
                </ul>
            </div>

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

                <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
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
                    <TableContainer component={Paper}>
                        <Table aria-label="stock details table" className="dark-table">
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
                                        <TableCell colSpan={9} align="center">
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : itemsList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <Typography color="error">No items found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedItems.map((item, index) => (
                                        <TableRow key={item.stockBalanceId ?? item.id ?? index}>
                                            <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                                            <TableCell>{item.code ?? item.Code ?? "–"}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>{item.categoryName ?? "–"}</TableCell>
                                            <TableCell>{item.subCategoryName ?? "–"}</TableCell>
                                            <TableCell>{item.supplierName ?? "–"}</TableCell>
                                            <TableCell>{item.uomName ?? "–"}</TableCell>
                                            <TableCell align="right">{item.qty ?? 0}</TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="View Details">
                                                    <IconButton onClick={() => handleViewAction(item)} size="small">
                                                        <VisibilityIcon color="primary" fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination row */}
                        <Grid container justifyContent="space-between" mt={2} mb={2}>
                            <Pagination
                                count={Math.ceil(totalCount / pageSize)}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                            />
                            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                                <InputLabel>Page Size</InputLabel>
                                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                                    <MenuItem value={5}>5</MenuItem>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </TableContainer>
                </Grid>
            </Grid>

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
                                                {IsCostPriceVisible && <TableCell align="right">Cost Price</TableCell>}
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
                                                        <TableCell align="right">
                                                            {line.sellingPrice != null ? formatCurrency(line.sellingPrice) : "–"}
                                                        </TableCell>
                                                        <TableCell>{lineCategory(line)}</TableCell>
                                                        <TableCell>{lineSubCategory(line)}</TableCell>
                                                        <TableCell>{lineUom(line)}</TableCell>
                                                        {IsCostPriceVisible && (
                                                            <TableCell align="right">
                                                                {line.costPrice != null ? formatCurrency(line.costPrice) : "–"}
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
                    <Box display="flex" mt={2} justifyContent="flex-end">
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
    width: { lg: 800, xs: 350 },
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 3,
};
