import React, { useState } from "react";
import { Box, Button, Grid, Modal, Typography } from "@mui/material";
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import BASE_URL from "Base/api";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 600, xs: 350 },
    bgcolor: "background.paper",
    boxShadow: 24,
};

export default function Tables({ onSelectTable }) {
    const [open, setOpen] = useState(false);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedTableId, setSelectedTableId] = useState(null);

    const handleOpen = () => {
        setOpen(true);
        fetchTables();
    };
    const handleClose = () => {
        setOpen(false);
        setSelectedTableId(null);
    };

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
            setTables(data.result);
        } catch (error) {
            console.error("Error fetching:", error);
        }
    };

    const handleSelectTable = (item) => {
        setSelectedTableId(item.id);
        setSelectedTable(item);
    };

    const handleConfirm = () => {
        if (selectedTable) {
            onSelectTable(selectedTable);
        }
        handleClose();
    };
    return (
        <>
            <Button
                variant="outlined"
                onClick={handleOpen}
                sx={{
                    borderColor: "#fe6564",
                    color: "#fe6564",
                    "&:hover": {
                        borderColor: "#fe6564",
                        backgroundColor: "rgba(254, 101, 100, 0.1)"
                    },
                    textTransform: "none",
                    fontSize: "0.75rem",
                    minWidth: 64,
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 1
                }}
            >
                <TableRestaurantIcon sx={{ fontSize: 20 }} />
                Tables
            </Button>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="bg-black">

                    <Grid container>
                        <Grid item xs={12}>
                            <Box sx={{ background: '#fe6564', p: 2 }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>Select Table</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box p={2}>
                                <Grid container spacing={1}>
                                    {tables.length === 0 ? (
                                        <Typography>No Data Available</Typography>
                                    ) : (
                                        tables.map((item, i) => (
                                            <Grid
                                                key={i}
                                                item
                                                xs={6}
                                                lg={3}
                                                display="flex"
                                                justifyContent="center"
                                            >
                                                <Box
                                                    onClick={() =>
                                                        item.isAvailable && handleSelectTable(item)
                                                    }
                                                    sx={{
                                                        border:
                                                            selectedTableId === item.id
                                                                ? "3px solid #fe6564"
                                                                : item.isAvailable
                                                                    ? "2px solid #fe6564"
                                                                    : "2px solid #e5e5e5",
                                                        borderRadius: "5px",
                                                        p: 2,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        cursor: item.isAvailable ? "pointer" : "not-allowed",
                                                        backgroundColor:
                                                            selectedTableId === item.id
                                                                ? "rgba(254, 101, 100, 0.1)"
                                                                : "transparent",
                                                    }}
                                                >
                                                    <Box sx={{
                                                        width: 50,
                                                        height: 50,
                                                        backgroundSize: 'contain',
                                                        backgroundImage: `url(${item.isAvailable
                                                            ? "/images/restaurant/table.png"
                                                            : "/images/restaurant/table2.png"})`
                                                    }}>
                                                    </Box>
                                                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ color: '#fff', fontWeight: 'bold', width: 30, height: 30, borderRadius: '50%', background: item.isAvailable ?'#fe6564' : '#e5e5e5' }}>
                                                        {item.capacity}
                                                    </Box>
                                                    <Typography mt={1}>{item.code}</Typography>
                                                </Box>
                                            </Grid>
                                        ))
                                    )}
                                </Grid>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box px={2} mt={1} pb={1} display="flex" sx={{ width: '100%' }} justifyContent="space-between">
                                <Button onClick={handleClose} variant="outlined" color="error">
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#fe6564',
                                        '&:hover': { backgroundColor: '#fe6564' },
                                    }}
                                    disabled={!selectedTableId}
                                    onClick={handleConfirm}
                                >
                                    Select
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>

        </>
    );
}
