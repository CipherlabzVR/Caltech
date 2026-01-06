import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Grid, Typography, Button, ButtonGroup, Box, IconButton, TextField, CircularProgress, Menu, MenuItem } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { formatCurrency } from "@/components/utils/formatHelper";

const FilteredItems = forwardRef(({ itemList, onAddItems, billUpdatedItems }, ref) => {
    const [cart, setCart] = useState([]);
    const [loadingId, setLoadingId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [dropdownItem, setDropdownItem] = useState(null);

    useImperativeHandle(ref, () => ({
        clean() {
            setCartItems([]);
        }
    }));

    useEffect(() => {
        if (billUpdatedItems) setCartItems(billUpdatedItems);
    }, []);

    useEffect(() => {
        const mapped = itemList.map(item => ({
            id: item.id,
            name: item.name,
            img: item.productImage,
            pricing: item.pricing,
            size: item.pricing[0]?.portionName || "",
            portionId: item.pricing[0]?.portionId || null,
            price: item.pricing[0]?.sellingPrice || 0,
            qty: 1,
            kitchenId: item.kitchenId
        }));
        setCart(mapped);
    }, [itemList]);

    useEffect(() => {
        if (onAddItems) onAddItems(cartItems);
    }, [cartItems]);

    const handleSizeChange = (id, newSize) => {
        setCart(prevCart =>
            prevCart.map(item => {
                if (item.id === id) {
                    const portion = item.pricing.find(p => p.portionName === newSize);
                    return {
                        ...item,
                        size: newSize,
                        portionId: portion?.portionId || item.portionId,
                        price: portion ? portion.sellingPrice : item.price
                    };
                }
                return item;
            })
        );
    };

    const handleQtyChange = (id, delta) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === id
                    ? { ...item, qty: Math.max(1, item.qty + delta) }
                    : item
            )
        );
    };

    const handleAddItem = async (item) => {
        setLoadingId(item.id);
        const current = cart.find(i => i.id === item.id && i.portionId === item.portionId);

        setCartItems(prevItems => {
            const existingIndex = prevItems.findIndex(
                i => i.id === current.id && i.portionId === current.portionId
            );
            let updatedItems = [...prevItems];
            if (existingIndex >= 0) {
                if (billUpdatedItems && billUpdatedItems.length > 0) {
                    updatedItems = [...billUpdatedItems];
                    if (updatedItems[existingIndex]) {
                        updatedItems[existingIndex] = {
                            ...updatedItems[existingIndex],
                            qty: updatedItems[existingIndex].qty + current.qty,
                            total: (updatedItems[existingIndex].qty + current.qty) * current.price
                        };
                    } else {
                        updatedItems.push({
                            id: current.id,
                            name: current.name,
                            portionName: current.size,
                            portionId: current.portionId,
                            image: current.img,
                            price: current.price,
                            qty: current.qty,
                            total: current.price * current.qty,
                            kitchenId: current.kitchenId
                        });
                    }
                }
            } else {
                updatedItems.push({
                    id: current.id,
                    name: current.name,
                    portionName: current.size,
                    portionId: current.portionId,
                    image: current.img,
                    price: current.price,
                    qty: current.qty,
                    total: current.price * current.qty,
                    kitchenId: current.kitchenId
                });
            }
            return updatedItems;
        });

        await new Promise(resolve => setTimeout(resolve, 800));
        setLoadingId(null);
    };

    const handleMenuOpen = (event, item) => {
        setAnchorEl(event.currentTarget);
        setDropdownItem(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setDropdownItem(null);
    };

    return (
        <Grid container spacing={2} mt={2}>
            {cart.length === 0 ? (
                <Grid item xs={12}>
                    <Box px={2}>
                        <Typography color="error">No Items Available</Typography>
                    </Box>
                </Grid>
            ) : (
                cart.map((item) => {
                    const maxVisible = 3;
                    const visible = item.pricing.slice(0, maxVisible);
                    const hidden = item.pricing.slice(maxVisible);

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                            <Box p={2} sx={{ background: '#fff' }} borderRadius={2}>
                                <img src={item.img ? item.img : '/images/no-image.jpg'} alt={item.name} style={{ width: "100%", height: 150, borderRadius: "8px" }} />
                                <Typography textAlign="center" variant="h6" mt={1}>{item.name}</Typography>
                                <Typography textAlign="center" variant="h6" sx={{ fontWeight: 'bold', color: '#fe6564' }}>
                                    Rs.{formatCurrency(item.price)}
                                </Typography>
                                <Box display="flex" justifyContent="center">
                                    <ButtonGroup size="small">
                                        {visible.map((p) => (
                                            <Button
                                                key={p.portionId}
                                                variant={item.size === p.portionName ? "contained" : "outlined"}
                                                onClick={() => handleSizeChange(item.id, p.portionName)}
                                                sx={{
                                                    color: item.size === p.portionName ? "white" : "#fe6564",
                                                    backgroundColor: item.size === p.portionName ? "#fe6564" : "transparent",
                                                    borderColor: "#fe6564",
                                                    "&:hover": {
                                                        backgroundColor: item.size === p.portionName ? "#fe6564" : "rgba(255,0,0,0.08)"
                                                    }
                                                }}
                                            >
                                                {p.portionName}
                                            </Button>
                                        ))}
                                        {hidden.length > 0 && (
                                            <>
                                                <Button
                                                    variant="outlined"
                                                    onClick={(e) => handleMenuOpen(e, item)}
                                                    sx={{
                                                        color: "#fe6564",
                                                        borderColor: "#fe6564",
                                                        "&:hover": { backgroundColor: "rgba(255,0,0,0.08)" }
                                                    }}
                                                >
                                                 ▼
                                                </Button>
                                                <Menu
                                                    anchorEl={anchorEl}
                                                    open={dropdownItem?.id === item.id}
                                                    onClose={handleMenuClose}
                                                >
                                                    {hidden.map((p) => (
                                                        <MenuItem
                                                            key={p.portionId}
                                                            onClick={() => {
                                                                handleSizeChange(item.id, p.portionName);
                                                                handleMenuClose();
                                                            }}
                                                        >
                                                            {p.portionName}
                                                        </MenuItem>
                                                    ))}
                                                </Menu>
                                            </>
                                        )}
                                    </ButtonGroup>
                                </Box>
                                <Box display="flex" my={1} alignItems="center" justifyContent="center" borderRadius={1} overflow="hidden">
                                    <IconButton
                                        onClick={() => handleQtyChange(item.id, -1)}
                                        size="small"
                                        sx={{ p: 0.5, color: "#fe6564", border: '1px solid #fe6564' }}
                                    >
                                        <RemoveIcon fontSize="small" />
                                    </IconButton>
                                    <TextField
                                        value={item.qty}
                                        size="small"
                                        sx={{
                                            width: 32,
                                            mx: 0,
                                            "& .MuiInputBase-input": { textAlign: "center", padding: "4px 0" },
                                            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                                        }}
                                        inputProps={{ readOnly: true }}
                                    />
                                    <IconButton
                                        onClick={() => handleQtyChange(item.id, 1)}
                                        size="small"
                                        sx={{ p: 0.5, color: "#fe6564", border: '1px solid #fe6564' }}
                                    >
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    disabled={loadingId === item.id}
                                    onClick={() => handleAddItem(item)}
                                    sx={{
                                        backgroundColor: '#fe6564',
                                        '&:hover': { backgroundColor: '#fe6564' },
                                    }}
                                >
                                    {loadingId === item.id ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Add"}
                                </Button>
                            </Box>
                        </Grid>
                    );
                })
            )}
        </Grid>
    );
});

export default FilteredItems;
