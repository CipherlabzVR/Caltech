import { Grid, Typography, Box, Button } from "@mui/material";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import FilteredItems from "./filteredItems";
import SwitchDesign from "../switch";
import Steward from "../steward";
import Tables from "../table";
import BASE_URL from "Base/api";


const Home = forwardRef(({ searchText, onUpdateItems, billUpdatedItems, onChangeSteward, onChangeTable, onSetPickupType, pickupType }, ref) => {
    const filteredItemsRef = useRef();

    useImperativeHandle(ref, () => ({
        clean() {
            if (filteredItemsRef.current) {
                filteredItemsRef.current.clean();
            }
        }
    }));

    const [activeCategory, setActiveCategory] = useState(0);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cartItems, setCartItems] = useState([]);

    const handleAddItems = (items) => {
        setCartItems(items);
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${BASE_URL}/RestaurantPOS/GetAllActiveCategories`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch");
            }

            const data = await response.json();
            const result = data.result;
            const newItem = {
                id: 0,
                name: "All Items",
                categoryImage: "/images/restaurant/all.jpg",
            };
            setCategories([newItem, ...result]);
        } catch (error) {
            console.error("Error fetching List:", error);
        }
    };

    const fetchProducts = async (catId, keyword) => {
        try {
            const response = await fetch(`${BASE_URL}/RestaurantPOS/GetAllMenuItems?categoryId=${catId}&keyword=${keyword}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch");
            }

            const data = await response.json();
            setItems(data.result);
        } catch (error) {
            console.error("Error fetching List:", error);
        }
    };

    useEffect(() => {
        fetchProducts(activeCategory, searchText);
        fetchCategories();
        if (onUpdateItems) {
            onUpdateItems(cartItems);
        }
    }, [searchText, cartItems]);

    useEffect(() => {
        if(billUpdatedItems){
            setCartItems(billUpdatedItems);
        }
    }, []);

    const handleFilter = (id) => {
        fetchProducts(id, searchText);
    };

    const handleChangeSwitch = (type) => {
        if (onSetPickupType) {
            onSetPickupType(type);
        }
    }

    const handleSelectSteward = (steward) => {
        onChangeSteward(steward);
    };

    const handleSelectTable = (table) => {
        onChangeTable(table);
    };

    return (
        <Grid container spacing={1}>
            <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ borderBottom: '1px solid #e5e5e5' }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Choose Category
                </Typography>
                <SwitchDesign onChangeSwitch={handleChangeSwitch} />
            </Grid>

            <Grid item xs={12} lg={10} sx={{ mt: 1 }}>
                <Box
                    sx={{
                        display: "flex",
                        overflowX: "auto",
                        gap: 1,
                        py: 1,
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        "&::-webkit-scrollbar": { display: "none" }
                    }}
                >
                    {categories.map((cat) => (
                        <Box
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                handleFilter(cat.id);
                            }}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                borderRadius: 10,
                                p: 1,
                                border:
                                    activeCategory === cat.id ? "2px solid #fe6564" : "2px solid #fff",
                                backgroundColor:
                                    activeCategory === cat.id ? "rgba(254,101,100,0.1)" : "transparent",
                                transition: "all 0.2s",
                            }}
                        >
                            <Box
                                sx={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    mr: 1,
                                    border:
                                        activeCategory === cat.id
                                            ? "2px solid #fe6564"
                                            : "2px solid transparent",
                                }}
                            >
                                <img
                                    src={cat.categoryImage ? cat.categoryImage : '/images/restaurant/no-image.jpg'}
                                    alt={cat.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: activeCategory === cat.id ? "bold" : "normal",
                                    color: activeCategory === cat.id ? "#fe6564" : "gray",
                                }}
                            >
                                {cat.name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Grid>
            {!pickupType && (
                <Grid item xs={12} lg={2} sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Steward onSelectSteward={handleSelectSteward} />
                    <Tables onSelectTable={handleSelectTable} />
                </Grid>
            )}
            <Grid item xs={12}>
                <Box
                    sx={{
                        maxHeight: '70vh',
                        overflowY: 'scroll',
                        '&::-webkit-scrollbar': {
                            display: 'none',
                        },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        paddingBottom: "100px"
                    }}
                >
                    <FilteredItems
                        ref={filteredItemsRef}
                        itemList={items}
                        onAddItems={handleAddItems}
                        billUpdatedItems={billUpdatedItems} />
                </Box>

            </Grid>
        </Grid>
    );
});
export default Home;