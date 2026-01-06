import {
    Grid,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
} from "@mui/material";
import React, { useState } from "react";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import BASE_URL from "Base/api";
import getPOSShiftDetails from "@/components/utils/getPOSShiftDetails";
import { toast } from "react-toastify";

const menuItems = [
    { key: "cash-in", label: "Cash In", icon: <ArrowCircleDownIcon sx={{ fontSize: "2rem", my: 1 }} /> },
    { key: "cash-out", label: "Cash Out", icon: <ArrowCircleUpIcon sx={{ fontSize: "2rem", my: 1 }} /> },
];

export default function Other() {
    const [activeTab, setActiveTab] = useState("");
    const [open, setOpen] = useState(false);
    const [cashFlowType, setCashFlowType] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [cashFlowTypes, setCashFlowTypes] = useState([]);
    const { data: shift } = getPOSShiftDetails();

    const handleOpen = async (key) => {
        setActiveTab(key);
        setOpen(true);
        const typeValue = key === "cash-in" ? 1 : 2;
        await handleGetCashFlowType(typeValue);
    };

    const handleClose = () => {
        setOpen(false);
        setActiveTab("");
        setCashFlowType("");
        setDescription("");
        setAmount("");
        setCashFlowTypes([]);
    };

    const handleSave = () => {
        const typeValue = activeTab === "cash-in" ? 1 : 2;

        const data = {
            ShiftId: shift.shiftId,
            Description: description,
            Amount: amount,
            CashType: parseInt(typeValue),
            CashFlowType: parseInt(cashFlowType),
            Date: null
        };
        fetch(`${BASE_URL}/POSShift/CreateCashInOut`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.statusCode === 200) {
                    toast.success(data.message);
                    setOpen(false);
                } else {
                    toast.error(data.message);
                }
            })
            .catch((err) => toast.error(err.message || ""));
        handleClose();
    };


    const handleGetCashFlowType = async (type) => {
        try {
            const token = localStorage.getItem("token");
            const query = `${BASE_URL}/CashFlowType/GetCashFlowTypesByType?cashType=${type}`;
            const response = await fetch(query, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch");

            const data = await response.json();
            setCashFlowTypes(data.result || []);
        } catch (error) {
            console.error("Error fetching cash flow types:", error);
            setCashFlowTypes([]);
        }
    };

    return (
        <Grid container spacing={1}>
            <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ borderBottom: "1px solid #e5e5e5" }}
            >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Other
                </Typography>
            </Grid>

            <Grid item xs={10} sx={{ mt: 1 }}>
                <Grid container spacing={1}>
                    {menuItems.map((menu, i) => (
                        <Grid key={i} item xs={12} lg={3}>
                            <Button
                                onClick={() => handleOpen(menu.key)}
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "10px",
                                    backgroundColor: activeTab === menu.key ? "#fe6564" : "#e9eced",
                                    color: activeTab === menu.key ? "#fff" : "#bdbebe",
                                    "&:hover": {
                                        backgroundColor: activeTab === menu.key ? "#fe6564" : "#d1d5d8",
                                        color: "#fff",
                                        "& svg": { color: "#fff" },
                                    },
                                }}
                            >
                                {menu.icon}
                                {menu.label}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </Grid>

            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        p: 3,
                        width: "100%",
                        maxWidth: 450,
                        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: "bold",
                        fontSize: "1.25rem",
                        textAlign: "center",
                        color: "#fe6564",
                        pb: 1,
                    }}
                >
                    {activeTab === "cash-in" && "Cash In"}
                    {activeTab === "cash-out" && "Cash Out"}
                </DialogTitle>

                <DialogContent sx={{ textAlign: "center", py: 2 }}>
                    <TextField
                        select
                        label="Cash Flow Type"
                        value={cashFlowType}
                        onChange={(e) => setCashFlowType(e.target.value)}
                        fullWidth
                        margin="dense"
                    >
                        {cashFlowTypes.length > 0 ? (
                            cashFlowTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.name}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>No cash flow types found</MenuItem>
                        )}
                    </TextField>

                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        margin="dense"
                    />

                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        margin="dense"
                    />
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        sx={{
                            backgroundColor: "#fe6564",
                            color: "#fff",
                            borderRadius: "8px",
                            px: 4,
                            "&:hover": { backgroundColor: "#e15555" },
                        }}
                    >
                        Save
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        sx={{
                            borderRadius: "8px",
                            borderColor: "#fe6564",
                            color: "#fe6564",
                            px: 3,
                            "&:hover": { borderColor: "#e15555", color: "#e15555" },
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
}
