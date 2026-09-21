import React, { useEffect, useState } from "react";
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
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Pagination,
    Typography,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
    IconButton,
    Box,
} from "@mui/material";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";

export default function StockAdjustment() {
    const cId = sessionStorage.getItem("category");
    const { navigate, create, print } = IsPermissionEnabled(cId);
    const [stockAdjustmentList, setStockAdjustmentList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [viewGroup, setViewGroup] = useState(null);

    const fetchStockAdjustmentList = async (page = 1, search = "", size = pageSize) => {
        try {
            const token = localStorage.getItem("token");
            const skip = (page - 1) * size;
            const query = `${BASE_URL}/StockAdjustment/GetAllStockAdjustmentGrouped?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

            const response = await fetch(query, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch items");

            const data = await response.json();
            setStockAdjustmentList(data.result.items || []);
            setTotalCount(data.result.totalCount || 0);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const {
        handleSearchChange,
        handlePageChange,
        handlePageSizeChange,
    } = usePaginationHandlers({
        page,
        pageSize,
        totalCount,
        search: searchTerm,
        setPage,
        setPageSize,
        onSearchValueChange: setSearchTerm,
        onFetch: fetchStockAdjustmentList,
    });

    useEffect(() => {
        fetchStockAdjustmentList();
    }, []);

    const openStockAdjustmentPrintPopup = (group) => {
        const firstLine = group?.lines?.[0];
        const query = new URLSearchParams({
            id: String(group?.firstLineId ?? firstLine?.id ?? ""),
            documentNumber: group?.documentNo ?? firstLine?.documentNo ?? "",
        });

        window.open(
            `/inventory/stock-adjustment/print?${query.toString()}`,
            `stock-adjustment-print-${group?.firstLineId ?? firstLine?.id ?? "group"}`,
            "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
        );
    };

    const handleOpenView = (group) => {
        setViewGroup(group);
    };

    const handleCloseView = () => {
        setViewGroup(null);
    };

    if (!navigate) {
        return <AccessDenied />;
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Stock Adjustment</h1>
                <ul>
                    <li>
                        <Link href="/inventory/stock-adjustment/">Stock Adjustment</Link>
                    </li>
                </ul>
            </div>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
                <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search here.."
                            inputProps={{ "aria-label": "search" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </Search>
                </Grid>
                <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
                    {create ? (
                        <Button
                            variant="outlined"
                            component={Link}
                            href="/inventory/stock-adjustment/create"
                        >
                            New Adjustment
                        </Button>
                    ) : ""}
                </Grid>
                <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
                    <TableContainer component={Paper}>
                        <Table aria-label="simple table" className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Supplier</TableCell>
                                    <TableCell>Warehouse Name</TableCell>
                                    <TableCell>Remark</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stockAdjustmentList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Typography color="error">No Adjustments Available</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockAdjustmentList.map((group) => (
                                        <TableRow key={group.groupKey || group.documentNo || group.firstLineId}>
                                            <TableCell>{formatDate(group.date)}</TableCell>
                                            <TableCell>{group.supplierName}</TableCell>
                                            <TableCell>{group.warehouseName || "—"}</TableCell>
                                            <TableCell>{group.remark || "—"}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                                    <Tooltip title="View">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenView(group)}
                                                        >
                                                            <VisibilityIcon color="primary" fontSize="medium" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {print ? (
                                                        <Tooltip title="Print">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => openStockAdjustmentPrintPopup(group)}
                                                            >
                                                                <LocalPrintshopIcon color="primary" fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : null}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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

            <Dialog
                open={Boolean(viewGroup)}
                onClose={handleCloseView}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Stock Adjustment Details</DialogTitle>
                <DialogContent dividers>
                    {viewGroup ? (
                        <>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Date</Typography>
                                    <Typography>{formatDate(viewGroup.date)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Supplier</Typography>
                                    <Typography>{viewGroup.supplierName || "—"}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Warehouse</Typography>
                                    <Typography>{viewGroup.warehouseName || "—"}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Document No</Typography>
                                    <Typography>{viewGroup.documentNo || "—"}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Remark</Typography>
                                    <Typography>{viewGroup.remark || "—"}</Typography>
                                </Grid>
                            </Grid>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small" className="dark-table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Product Code</TableCell>
                                            <TableCell>Product Name</TableCell>
                                            <TableCell align="right">Previous Qty</TableCell>
                                            <TableCell align="right">Updated Qty</TableCell>
                                            <TableCell>Remark</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(viewGroup.lines || []).map((line, index) => (
                                            <TableRow key={line.id || index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{line.productCode}</TableCell>
                                                <TableCell>{line.productName}</TableCell>
                                                <TableCell align="right">{line.availableQty}</TableCell>
                                                <TableCell align="right">{line.updatedQty}</TableCell>
                                                <TableCell>{line.remark || "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseView} color="error" variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
