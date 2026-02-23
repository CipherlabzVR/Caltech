import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import { Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";

export default function StockDetails() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsList, setItemsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState("default");
    const debounceRef = useRef(null);

    const fetchItems = useCallback(async (keyword) => {
        if (!keyword || keyword.trim() === "") {
            setItemsList([]);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${BASE_URL}/Items/GetAllItemWithZeroQuantity?keyword=${encodeURIComponent(keyword)}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (!response.ok) throw new Error("Failed to fetch items");
            const data = await response.json();
            const result = data.result ?? data.data ?? data;
            setItemsList(Array.isArray(result) ? result : []);
        } catch (error) {
            console.error("Error fetching stock details:", error);
            setItemsList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            fetchItems(value);
        }, 400);
    };

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const sortedItems = useMemo(() => {
        if (!itemsList.length) return [];
        const sorted = [...itemsList];
        switch (sortBy) {
            case "price-low-high":
                sorted.sort((a, b) => (a.salingPrice ?? 0) - (b.salingPrice ?? 0));
                break;
            case "price-high-low":
                sorted.sort((a, b) => (b.salingPrice ?? 0) - (a.salingPrice ?? 0));
                break;
            case "a-z":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case "z-a":
                sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
                break;
            default:
                break;
        }
        return sorted;
    }, [itemsList, sortBy]);

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

            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }} alignItems="center">
                <Grid item xs={12} lg={4}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search by item code or name.."
                            inputProps={{ "aria-label": "search" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            autoFocus
                        />
                    </Search>
                </Grid>
                <Grid item xs={12} lg={8} display="flex" justifyContent="end">
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            label="Sort By"
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <MenuItem value="default">Default</MenuItem>
                            <MenuItem value="price-low-high">Price: Low to High</MenuItem>
                            <MenuItem value="price-high-low">Price: High to Low</MenuItem>
                            <MenuItem value="a-z">Name: A - Z</MenuItem>
                            <MenuItem value="z-a">Name: Z - A</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} mt={1}>
                    <TableContainer component={Paper}>
                        <Table aria-label="stock details table" className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item Code</TableCell>
                                    <TableCell>Item Name</TableCell>
                                    <TableCell align="right">Stock Level</TableCell>
                                    <TableCell align="right">Cost Price</TableCell>
                                    <TableCell align="right">Selling Price</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {searchTerm.trim() === "" ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Typography color="textSecondary">
                                                Type in the search bar to find items
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Typography color="textSecondary">Searching...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5}>
                                            <Typography color="error">No items found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedItems.map((item, index) => (
                                        <TableRow key={item.stockBalanceId ?? item.id ?? index}>
                                            <TableCell>{item.code}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell align="right">{item.qty ?? 0}</TableCell>
                                            <TableCell align="right">
                                                {item.costPrice != null ? formatCurrency(item.costPrice) : "-"}
                                            </TableCell>
                                            <TableCell align="right">
                                                {item.salingPrice != null ? formatCurrency(item.salingPrice) : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </>
    );
}
