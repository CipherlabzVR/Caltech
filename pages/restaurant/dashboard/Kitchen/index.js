import { Grid, Typography, Button, ButtonGroup, Card, CardContent, Box, Select, MenuItem } from "@mui/material";
import BASE_URL from "Base/api";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const THEME_COLOR = "#fe6564";

export default function Kitchen({ searchText }) {
    const [filter, setFilter] = useState("All");
    const [orders, setOrders] = useState([]);
    const [sortBy, setSortBy] = useState("order");

    const fetchOrders = async () => {
        try {
            const response = await fetch(`${BASE_URL}/RestaurantPOS/GetAllKitchenOrders`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setOrders(data.result);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusClick = (order) => {
        Swal.fire({
            title: "Update Order Status",
            html: `
        <p>Order #<strong>${order.orderNo}</strong></p>
        <p>Item: <strong>${order.name} X ${order.qty}</strong></p>
        <div style="margin-top:15px; display:flex; gap:5px; justify-content:center;">
            <button id="btnPreparing" class="swal2-confirm swal2-styled">Preparing</button>
            <button id="btnReady" class="swal2-deny swal2-styled">Ready</button>
            <button id="btnServed" class="swal2-confirm swal2-styled" style="background:#28a745;">Served</button>
            <button id="btnClose" class="swal2-cancel swal2-styled">Close</button>
        </div>
    `,
            showConfirmButton: false,
            showDenyButton: false,
            showCancelButton: false,
            didOpen: () => {
                const popup = Swal.getPopup();
                popup.querySelector("#btnPreparing").addEventListener("click", () => {
                    updateOrderStatus(order, 2);
                    Swal.close();
                });
                popup.querySelector("#btnReady").addEventListener("click", () => {
                    updateOrderStatus(order, 3);
                    Swal.close();
                });
                popup.querySelector("#btnServed").addEventListener("click", () => {
                    updateOrderStatus(order, 4);
                    Swal.close();
                });
                popup.querySelector("#btnClose").addEventListener("click", () => {
                    Swal.close();
                });
            }
        });
    };

    const updateOrderStatus = async (order, status) => {
        try {
            const response = await fetch(`${BASE_URL}/RestaurantPOS/UpdateMealStatus?orderId=${order.orderId}&mealId=${order.id}&status=${status}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            fetchOrders();
            Swal.fire("Success", data.result.message, "success");
        } catch (error) {
            console.error(error);
        }
    };

    const getCardStyles = (status) => {
        switch (status) {
            case 1:
                return { border: `2px solid ${THEME_COLOR}`, backgroundColor: '#fff', opacity: 1, cursor: 'pointer' };
            case 2:
                return { border: `2px solid orange`, backgroundColor: '#fff3e0', opacity: 1, cursor: 'pointer' };
            case 3:
                return { border: `2px solid green`, backgroundColor: '#e0f7fa', opacity: 0.6, cursor: 'pointer' };
            case 4:
                return { border: `2px solid dodgerblue`, backgroundColor: '#e0f7fa', opacity: 0.6, cursor: 'not-allowed' };
            default:
                return { border: `2px solid ${THEME_COLOR}`, backgroundColor: '#fff', opacity: 1, cursor: 'pointer' };
        }
    };

    const filteredOrders = orders
        .filter(order => order.status !== 4)
        .filter(order => filter === "All" || order.kitchenType === filter)
        .filter(order => {
            if (!searchText) return true;
            const lowerSearch = searchText.toLowerCase();
            return (
                (order.orderNo && order.orderNo.toString().toLowerCase().includes(lowerSearch)) ||
                (order.name && order.name.toLowerCase().includes(lowerSearch))
            );
        });

    let groupedOrders = {};
    if (sortBy === "order") {
        groupedOrders = filteredOrders.reduce((acc, item) => {
            if (!acc[item.orderNo]) acc[item.orderNo] = [];
            acc[item.orderNo].push(item);
            return acc;
        }, {});
    } else if (sortBy === "meal") {
        groupedOrders = filteredOrders.reduce((acc, item) => {
            const key = item.name;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: '1px solid #e5e5e5', pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Kitchen</Typography>
                <Box display="flex" gap={1}>
                    <ButtonGroup variant="outlined">
                        {["All", "KOT", "BOT"].map(type => (
                            <Button
                                key={type}
                                onClick={() => setFilter(type)}
                                sx={{
                                    borderColor: THEME_COLOR,
                                    color: filter === type ? '#fff' : THEME_COLOR,
                                    backgroundColor: filter === type ? THEME_COLOR : 'transparent',
                                    '&:hover': { backgroundColor: THEME_COLOR, color: '#fff' }
                                }}
                            >
                                {type}
                            </Button>
                        ))}
                    </ButtonGroup>
                    <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        size="small"
                        sx={{ ml: 1, borderColor: THEME_COLOR, color: THEME_COLOR, '& .MuiOutlinedInput-notchedOutline': { borderColor: THEME_COLOR } }}
                    >
                        <MenuItem value="order">Sort by Orders</MenuItem>
                        <MenuItem value="meal">Sort by Meals</MenuItem>
                    </Select>
                </Box>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, maxHeight: "70vh", overflowY: "scroll", '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', paddingBottom: '100px' }}>
                <Grid container spacing={2}>
                    {Object.entries(groupedOrders).map(([groupKey, items]) => (
                        <Grid item xs={12} key={groupKey}>
                            {sortBy === "order" && (
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: THEME_COLOR }}>
                                    Order: {groupKey}
                                </Typography>
                            )}
                            <Grid container spacing={2}>
                                {items.map((order) => (
                                    <Grid item xs={12} sm={6} md={3} key={order.id}>
                                        <Card
                                            onClick={() => order.status !== 4 && handleStatusClick(order)}
                                            sx={{
                                                ...getCardStyles(order.status),
                                                position: 'relative',
                                                height: '100%',
                                            }}
                                        >
                                            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">{order.name}</Typography>

                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Box
                                                        sx={{
                                                            width: 56,
                                                            height: 56,
                                                            borderRadius: 2,
                                                            backgroundImage: `url(${order.image})`,
                                                            backgroundSize: "cover",
                                                            backgroundPosition: "center",
                                                            backgroundRepeat: "no-repeat",
                                                            bgcolor: "#f0f0f0",
                                                        }}
                                                    />

                                                    <Box display="flex" flexDirection="column" justifyContent="center" flexGrow={1} gap={0.5}>
                                                        <Typography variant="body2">{order.portionName}</Typography>
                                                        <Typography variant="body2">
                                                            Ordered: {order.qty}
                                                        </Typography>
                                                        <Typography variant="body2" color={THEME_COLOR}>
                                                            To Serve: {order.toBeServedQty}
                                                        </Typography>
                                                        <Typography variant="body2" color={THEME_COLOR}>
                                                            {order.orderMealStatus}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {order.status === 2 && (
                                                    <Typography
                                                        variant="body2"
                                                        color="orange"
                                                        fontWeight="bold"
                                                        sx={{ position: 'absolute', top: 8, right: 8 }}
                                                    >
                                                        Preparing
                                                    </Typography>
                                                )}
                                                {order.status === 3 && (
                                                    <Typography
                                                        variant="body2"
                                                        color="green"
                                                        fontWeight="bold"
                                                        sx={{ position: 'absolute', top: 8, right: 8 }}
                                                    >
                                                        Ready
                                                    </Typography>
                                                )}
                                                {order.status === 4 && (
                                                    <Typography
                                                        variant="body2"
                                                        color="dodgerblue"
                                                        fontWeight="bold"
                                                        sx={{ position: 'absolute', top: 8, right: 8 }}
                                                    >
                                                        Served
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}

                            </Grid>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Grid>
    );
}
