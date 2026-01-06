import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { Grid, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import usePaginatedFetch from "../usePaginatedFetch";
import PaginationUI from "../pagination";


export default function History() {
    const today = new Date();
    const [dateFilter, setDateFilter] = useState(formatDate(today));

    const {
        data: orderList,
        totalCount,
        page,
        pageSize,
        setPage,
        setPageSize,
        setSearch,
        fetchData: fetchOrderList,
    } = usePaginatedFetch(`RestaurantPOS/GetAllOrderHistoryByUser?date=${dateFilter}`);



    const handlePageChange = (event, value) => {
        setPage(value);
        fetchOrderList(value, searchText, pageSize);
    };

    const handlePageSizeChange = (event) => {
        const size = event.target.value;
        setPageSize(size);
        setPage(1);
        fetchOrderList(1, searchText, size);
    };

    useEffect(() => {
        fetchOrderList(1, "", pageSize);
    }, [dateFilter]);

    return (
        <Grid container spacing={1}>
            <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ borderBottom: '1px solid #e5e5e5', mb: 1 }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Order History
                </Typography>
            </Grid>

            <Grid item xs={12} sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    size="small"
                    sx={{ maxWidth: 200 }}
                />
            </Grid>

            <Grid item xs={12}>
                <TableContainer
                    component={Paper}
                    sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Bill No</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Order Type</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Steward</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Table</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Pick Up Type</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Items</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Service Charge</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Total Amount</TableCell>

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orderList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9}><Typography color="error">No Orders Available</Typography></TableCell>
                                </TableRow>
                            ) : (
                                orderList.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: 'rgba(254,101,100,0.1)' }
                                        }}
                                    >
                                        <TableCell>{item.orderNo}</TableCell>
                                        <TableCell>{item.orderTypeName}</TableCell>
                                        <TableCell>{item.stewardDetails ? item.stewardDetails.firstName : ""}</TableCell>
                                        <TableCell>{item.tableDetails ? item.tableDetails.code : ""}</TableCell>
                                        <TableCell>{item.pickupTypeName}</TableCell>
                                        <TableCell>
                                            {item.orderItems.map((x, idx) => <Box key={idx}>{x.name} x {x.qty} - Rs.{x.price * x.qty}</Box>)}
                                        </TableCell>
                                        <TableCell>{formatCurrency(item.serviceCharge)}</TableCell>
                                        <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ mt: 1 }}>
                    <PaginationUI totalCount={totalCount} pageSize={pageSize} page={page} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
                </Box>
            </Grid>
        </Grid>
    );
}
