import { Grid, Typography, Box } from "@mui/material";
import BASE_URL from "Base/api";
import React, { useEffect, useState } from "react";

const tables = [
    { id: 1, capacity: 2, occupied: false, billNo: null },
    { id: 2, capacity: 4, occupied: true, billNo: "B102" },
    { id: 3, capacity: 6, occupied: false, billNo: null },
    { id: 4, capacity: 3, occupied: true, billNo: "B205" },
    { id: 5, capacity: 4, occupied: false, billNo: null }
];

export default function DineIn() {
    const [tableData] = useState(tables);
    const [tableList, setTableList] = useState([]);

    const fetchTables = async () => {
        try {
            const response = await fetch(`${BASE_URL}/RestaurantPOS/GetAllTables`, {
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
            setTableList(data.result);
        } catch (error) {
            console.error("Error fetching:", error);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const renderChairs = (capacity, occupied) => {
        const chairs = [];
        const perSide = Math.ceil(capacity / 4);
        const chairColor = occupied ? "#fe6564" : "#e9eced";

        for (let i = 0; i < capacity; i++) {
            let style = { width: 16, height: 16, bgcolor: chairColor, position: "absolute", borderRadius: 1 };

            if (i < perSide) {
                style = { ...style, top: 4, left: `${(100 / (perSide + 1)) * (i + 1)}%`, transform: "translateX(-50%)" };
            } else if (i < perSide * 2) {
                style = { ...style, right: 4, top: `${(100 / (perSide + 1)) * ((i - perSide) + 1)}%`, transform: "translateY(-50%)" };
            } else if (i < perSide * 3) {
                style = { ...style, bottom: 4, left: `${(100 / (perSide + 1)) * ((i - perSide * 2) + 1)}%`, transform: "translateX(-50%)" };
            } else {
                style = { ...style, left: 4, top: `${(100 / (perSide + 1)) * ((i - perSide * 3) + 1)}%`, transform: "translateY(-50%)" };
            }

            chairs.push(<Box key={i} sx={style} />);
        }
        return chairs;
    };

    return (
        <Grid container spacing={1}>
            <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ borderBottom: "1px solid #e5e5e5", pb: 1 }}
            >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Dine In
                </Typography>
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                    {tableList.map((table) => (
                        <Grid item lg={2} key={table.id}>
                            <Box
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: "3px solid",
                                    borderColor: table.isAvailable ? "#fe6564" : "#9e9e9e",
                                    bgcolor: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    position: "relative",
                                    cursor: "pointer",
                                    borderRadius: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 70,
                                        height: 70,
                                        bgcolor: table.isAvailable ? "#ffcdd2" : "#f5f5f5",
                                        border: "2px solid",
                                        borderColor: table.isAvailable ? "#fe6564" : "#9e9e9e",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: 1,
                                        textAlign: "center"
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{ transform: "rotate(45deg)" }}
                                    >
                                        {table.isAvailable ? table.name : table.billNo}
                                    </Typography>
                                </Box>

                                {renderChairs(table.capacity, table.isAvailable)}
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Grid>
        </Grid>
    );
}
