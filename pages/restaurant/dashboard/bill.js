import React, { useEffect, useRef, useState } from "react";
import { Grid, Typography, Box, Button, IconButton, Tooltip, Modal } from "@mui/material";
import { formatCurrency } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import Swal from "sweetalert2";
import ReplayIcon from '@mui/icons-material/Replay';
import getSettingValueByName from "@/components/utils/getSettingValueByName";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";

export default function Bill({
    billItems,
    onUpdateFromBill,
    steward,
    table,
    pickupType,
    onCleanBill,
    shift,
    orderId,
    isOffer,
    offerTotal }) {
    const [items, setItems] = useState([]);
    const audioRef = useRef(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportUrl, setReportUrl] = useState("");
    const [lastOrderNo, setLastOrderNo] = useState(null);

    const { data: restaurantServiceChargeValue } = getSettingValueByName("RestaurantServiceCharge");
    const { data: restaurantServiceCharge } = IsAppSettingEnabled("RestaurantServiceCharge");
    const { data: reportName } = GetReportSettingValueByName("RestaurantGuestCheck");
    const { data: kotBotReportName } = GetReportSettingValueByName("RestaurantKOT");

    const [serveCharge, setServeCharge] = useState(0);

    const getPickupTypeName = (typeId) => {
        const pickupTypes = {
            1: "Customer",
            2: "Uber",
            3: "Pick Me"
        };
        return pickupTypes[typeId] || "-";
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
    };

    const handleQtyChange = (id, delta) => {
        setItems(prevItems => {
            const updated = prevItems.map(item =>
                item.id === id
                    ? { ...item, qty: Math.max(1, item.qty + delta) }
                    : item
            );
            if (onUpdateFromBill) {
                onUpdateFromBill(updated);
            }
            return updated;
        });
    };

    const handleRemove = (id) => {
        const updatedItems = items.filter(item => item.id !== id);
        setItems(updatedItems);
        if (onUpdateFromBill) {
            onUpdateFromBill(updatedItems);
        }
    };

    const subtotal = (() => {
        if (!isOffer) {
            return items.reduce((acc, item) => acc + item.price * item.qty, 0);
        }
        const base = offerTotal || 0;
        const extraFromOfferItems = items
            .filter(it => it.isOfferItem)
            .reduce((sum, it) => {
                const included = it.offerIncludedQty || 0;
                const extraQty = Math.max(0, (it.qty || 0) - included);
                return sum + (it.price || 0) * extraQty;
            }, 0);
        const addedNonOfferItems = items
            .filter(it => !it.isOfferItem)
            .reduce((sum, it) => sum + (it.price || 0) * (it.qty || 0), 0);
        return base + extraFromOfferItems + addedNonOfferItems;
    })();
    const charge = subtotal * (serveCharge / 100);
    const total = subtotal + charge;

    useEffect(() => {
        if (billItems) {
            setItems(billItems);
        }
        if (restaurantServiceCharge) {
            const value = parseFloat(restaurantServiceChargeValue);
            setServeCharge(isNaN(value) ? 0 : value);
        }

    }, [billItems, restaurantServiceCharge, restaurantServiceChargeValue]);

    const openPdfModal = (documentNumber, reportNameToUse) => {
        if (!documentNumber) {
            Swal.fire("Error", "Order number is missing.", "error");
            return;
        }

        if (!reportNameToUse) {
            Swal.fire("Error", "Report setting is not configured.", "error");
           return;
        }

        const warehouseId = localStorage.getItem("warehouse");
        const currentUser = localStorage.getItem("name");
        
        if (!warehouseId) {
            Swal.fire("Error", "Warehouse information not found.", "error");
            return;
        }

        const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${documentNumber}&reportName=${reportNameToUse}&warehouseId=${warehouseId}&currentUser=${currentUser || ""}`;
        const fullUrl = `${Report}${reportLink}`;
        
        setReportUrl(fullUrl);
        setReportModalOpen(true);
    };

    const printGuestCheck = (documentNumber) => {
        openPdfModal(documentNumber, reportName);
    };

    const printKotBot = (documentNumber) => {
        openPdfModal(documentNumber, kotBotReportName);
    };

    const handleCloseReportModal = (event) => {
        if (event) {
            event.stopPropagation();
        }
        setReportModalOpen(false);
        setReportUrl("");
    };

    const handleSubmit = async () => {
        if (!pickupType) {
            if (!table) {
                Swal.fire("Warning", "Please select a table", "warning");
                return;
            }
            if (!steward) {
                Swal.fire("Warning", "Please select a steward", "warning");
                return;
            }
        }
        if (items.length === 0 && orderId === null) {
            Swal.fire("Warning", "Please add items to place order", "warning");
            return;
        }

        var payload = {
            OrderId: orderId,
            OrderType: pickupType ? 1 : 2,
            TotalAmount: total,
            LineAmount: subtotal,
            ServiceCharge: charge,
            StewardId: steward ? steward.id : null,
            TableId: table ? table.id : null,
            PickUpType: pickupType,
            ShiftId: shift ? shift.shiftId : null,
            IsOffer: isOffer,
            OrderLineDetails: items.map((row) => ({
                MenuId: row.id,
                PortionId: row.portionId,
                UnitPrice: row.price,
                Quantity: row.qty,
                KitchenId: row.kitchenId
            })),
        };

        try {
            const response = await fetch(
                `${BASE_URL}/RestaurantPOS/CreateOrUpdateRestaurantOrder`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (response.ok) {
                const jsonResponse = await response.json();
                if (jsonResponse.result && jsonResponse.result.result) {
                    let orderNo = "";
                    if (typeof jsonResponse.result.result === 'object') {
                        orderNo = jsonResponse.result.result.orderNo || jsonResponse.result.result.orderId || "";
                    } else {
                        orderNo = jsonResponse.result.result;
                    }
                    
                    setLastOrderNo(orderNo);
                    Swal.fire({
                        title: "Success",
                        html: `
                            <p style="margin-bottom: 20px;">${jsonResponse.result.message}</p>
                            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
                                <button id="btnPrintKOT" class="swal2-confirm swal2-styled" style="background: #3085d6; margin: 0;">Print KOT/BOT</button>
                                <button id="btnPrintGuest" class="swal2-deny swal2-styled" style="background: #fe6564; margin: 0;">Print Guest Check</button>
                            </div>
                        `,
                        icon: "success",
                        showCancelButton: true,
                        cancelButtonText: "Close",
                        showConfirmButton: false,
                        showDenyButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        focusCancel: true,
                        didOpen: () => {
                            const popup = Swal.getPopup();
                            const btnPrintKOT = popup.querySelector("#btnPrintKOT");
                            const btnPrintGuest = popup.querySelector("#btnPrintGuest");
                            
                            if (btnPrintKOT) {
                                btnPrintKOT.addEventListener("click", () => {
                                    setTimeout(() => {
                                        printKotBot(orderNo);
                                    }, 300);
                                });
                            }
                            
                            if (btnPrintGuest) {
                                btnPrintGuest.addEventListener("click", () => {
                                    setTimeout(() => {
                                        printGuestCheck(orderNo);
                                    }, 300);
                                });
                            }
                        }
                    })



                    onCleanBill();
                    // audioRef.current.play();
                } else {
                    Swal.fire("Error", jsonResponse.result.message, "error");
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    return (
        <Box>
            <Grid container mb={2} pb={2} sx={{ borderBottom: "1px dashed #ccc" }}>
                <Grid item xs={6} display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Order Bill</Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                    <Tooltip title="Reset" placement="top">
                        <IconButton onClick={onCleanBill} aria-label="edit" size="small">
                            <ReplayIcon sx={{ color: '#fe6564' }} fontSize="medium" />
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>

            <Box sx={{ maxHeight: 300, overflowY: "auto", mb: 2 }}>
                {items.map(item => (
                    <Box key={item.id} sx={{ display: "flex", alignItems: "center", mb: 1, background: '#f1f6fa', p: 1, borderRadius: '5px', pb: 1 }}>
                        <img src={item.image} alt={item.name} style={{ width: 40, height: 40, borderRadius: 4, marginRight: 10 }} />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography sx={{ fontWeight: 'bold' }}>{item.name}</Typography>
                            <Typography variant="body2" color="text.secondary">Rs.{formatCurrency(item.price)}</Typography>
                            <Typography
                                color="error"
                                sx={{ cursor: "pointer" }}
                                onClick={() => handleRemove(item.id)}
                            >
                                Remove
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                            <IconButton sx={{ width: 25, height: 25 }} size="small" onClick={() => handleQtyChange(item.id, -1)}>-</IconButton>
                            <Typography mx={1}>{item.qty}</Typography>
                            <IconButton sx={{ width: 25, height: 25 }} size="small" onClick={() => handleQtyChange(item.id, 1)}>+</IconButton>
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box mb={2} sx={{ borderBottom: "1px dashed #ccc" }}>
                <Grid container justifyContent="space-between">
                    <Typography>Subtotal</Typography>
                    <Typography>Rs.{formatCurrency(subtotal)}</Typography>
                </Grid>
                <Grid container justifyContent="space-between">
                    <Typography>Service Charge ({serveCharge}%)</Typography>
                    <Typography>Rs.{formatCurrency(charge)}</Typography>
                </Grid>
                <Grid container justifyContent="space-between" mt={1}>
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">Rs.{formatCurrency(total)}</Typography>
                </Grid>
            </Box>
            <Box mb={2} sx={{ borderBottom: "1px dashed #ccc" }}>
                {pickupType ? (
                    <Grid container justifyContent="space-between">
                        <Typography>Pickup Type</Typography>
                        <Typography>
                            {getPickupTypeName(pickupType)}
                        </Typography>
                    </Grid>
                ) : (
                    <>
                        <Grid container justifyContent="space-between">
                            <Typography>Steward</Typography>
                            <Typography>
                                {steward ? `${steward.firstName} ${steward.lastName}` : "-"}
                            </Typography>
                        </Grid>
                        <Grid container justifyContent="space-between">
                            <Typography>Table</Typography>
                            <Typography>
                                {table ? table.code : "-"}
                            </Typography>
                        </Grid>
                    </>
                )}
            </Box>
            <Button
                onClick={() => handleSubmit()}
                variant="contained"
                fullWidth
                sx={{
                    backgroundColor: '#fe6564',
                    '&:hover': { backgroundColor: '#fe6564' },
                }}
            >
                {orderId ? "Update Order" : "Place order"}
            </Button>
            <audio ref={audioRef} src="/images/restaurant/audio/bell.wav" />

            <Modal
                open={reportModalOpen}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                        event?.stopPropagation();
                    }
                    handleCloseReportModal(event);
                }}
                aria-labelledby="report-modal-title"
                aria-describedby="report-modal-description"
                disableEscapeKeyDown={false}
            >
                <Box sx={modalStyle} onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography id="report-modal-title" variant="h6" component="h2">
                            Report
                        </Typography>
                        <Button onClick={(e) => {
                            e.stopPropagation();
                            handleCloseReportModal(e);
                        }} variant="outlined" size="small">
                            Close
                        </Button>
                    </Box>
                    <Box
                        id="report-modal-description"
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            bgcolor: '#fff'
                        }}
                    >
                        <iframe
                            src={reportUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '600px',
                                border: 'none'
                            }}
                            title="Report Viewer"
                        />
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
}
