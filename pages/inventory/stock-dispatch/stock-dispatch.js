import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import {
    Grid,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 450, xs: 350 },
    bgcolor: "background.paper",
    maxHeight: "80vh",
    overflowY: "hidden",
    boxShadow: 24,
    p: 2,
};

export default function StockDispatch({ fetchItems, item, isExp, isBatch,resetState }) {
    const [open, setOpen] = useState(false);
    const [dispatchQty, setDispatchQty] = useState(null);
    const [remark, setRemark] = useState("");

    const handleClose = () => setOpen(false);

    const handleOpen = () => {
        setOpen(true);
    };
    const handleSubmit = async () => {
        if (!dispatchQty) {
            toast.info("Please Enter Value");
            return;
        }
        const data = {
            ProductId: item.productId,
            ProductCode: item.productCode,
            ProductName: item.productName,
            WarehouseId: item.warehouseId,
            BatchNumber: item.batchNumber,
            ExpiryDate: item.expiryDate,
            BookBalanceQuantity: item.bookBalanceQuantity,
            UnitPrice: item.unitPrice,
            CostPrice: item.costPrice,
            SellingPrice: item.sellingPrice,
            SupplierID: item.supplierID,
            SupplierName: item.supplierName,
            DispatchQuantity: parseFloat(dispatchQty),
            StockBalanceId: item.id,
            Remark: remark,
        }

        try {
            const res = await fetch(`${BASE_URL}/StockBalance/StockDispatchStockBalanceUpdate`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (res.ok && json.result !== "") {
                toast.success(json.result.message);
                fetchItems();
                resetState();
            } else {
                toast.error(json.message || "Please fill all required fields");
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <>
            <Tooltip title="View" placement="top">
                <IconButton onClick={handleOpen} aria-label="View" size="small">
                    <RemoveCircleOutlineIcon color="primary" fontSize="medium" />
                </IconButton>
            </Tooltip>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="bg-black">
                    <Typography variant="h6" my={2}>
                        Stock Dispatch
                    </Typography>
                    <Box sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                        <Grid container spacing={1}>
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Supplier</Typography>
                                <Typography>{item.supplierName}</Typography>
                            </Grid>
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Product Code</Typography>
                                <Typography>{item.productCode}</Typography>
                            </Grid>
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Product Name</Typography>
                                <Typography>{item.productName}</Typography>
                            </Grid>
                            {isExp && (<Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Exp Date</Typography>
                                <Typography>{formatDate(item.expiryDate)}</Typography>
                            </Grid>)}
                            {isBatch && (<Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Batch No</Typography>
                                <Typography>{item.batchNumber}</Typography>
                            </Grid>)}
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Cost Price</Typography>
                                <Typography>{formatCurrency(item.costPrice)}</Typography>
                            </Grid>
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Selling Price</Typography>
                                <Typography>{formatCurrency(item.sellingPrice)}</Typography>
                            </Grid>
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Unit Price</Typography>
                                <Typography>{formatCurrency(item.unitPrice)}</Typography>
                            </Grid>
                            <Grid item xs={12} display="flex">
                                <Typography color="primary" sx={{ width: '150px' }}>Available Qty</Typography>
                                <Typography>{item.bookBalanceQuantity}</Typography>
                            </Grid>
                            <Grid item xs={12} mt={2}>
                                <Typography>Dispatch Qty</Typography>
                                <TextField
                                    size="small"
                                    value={dispatchQty}
                                    type="number"
                                    inputProps={{ min: 1, max: item.bookBalanceQuantity }}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        if (value <= item.bookBalanceQuantity) {
                                            setDispatchQty(e.target.value);
                                        }
                                    }}
                                    placeholder="Please Enter"
                                    fullWidth
                                    helperText={`Enter a value less than or equal to available quantity`}

                                />
                            </Grid>
                            <Grid item xs={12} mb={2}>
                                <Typography>Remark</Typography>
                                <TextField
                                    size="small"
                                    value={remark}
                                    type="text"
                                    onChange={(e) => setRemark(e.target.value)}
                                    placeholder="Remark"
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box display="flex" my={2} justifyContent="space-between">
                        <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={handleClose}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
}
