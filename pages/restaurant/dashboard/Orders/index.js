import { Grid, Switch, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal, Button } from "@mui/material";
import React, { useState, useEffect } from "react";
import usePaginatedFetch from "../usePaginatedFetch";
import PaginationUI from "../pagination";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import Swal from "sweetalert2";
import BASE_URL from "Base/api";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";

export default function Orders({ searchText, onOrderClick }) {
    const [isPickup, setIsPickup] = useState(false);
    const [orderType, setOrderType] = useState(2);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportUrl, setReportUrl] = useState("");

    const { data: reportName } = GetReportSettingValueByName("RestaurantGuestCheck");
    const { data: kotBotReportName } = GetReportSettingValueByName("RestaurantKOT");

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

    const {
        data: orderList,
        totalCount,
        page,
        pageSize,
        setPage,
        setPageSize,
        setSearch,
        fetchData: fetchOrderList,
    } = usePaginatedFetch(`RestaurantPOS/GetAllOrdersByShiftAsync?type=${orderType}`);

    useEffect(() => {
        setPage(1);
        setSearch(searchText);
        fetchOrderList(1, searchText, pageSize);
    }, [orderType, searchText, pageSize]);

    const handleChange = () => {
        const newPickup = !isPickup;
        setIsPickup(newPickup);
        setOrderType(newPickup ? 1 : 2);
    };

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

    const openPdfModal = (documentNumber, reportNameToUse) => {
        if (!documentNumber || !reportNameToUse) {
            Swal.fire("Error", "Unable to print. Missing information.", "error");
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

    const handleCloseReportModal = () => {
        setReportModalOpen(false);
        setReportUrl("");
    };

    const handleRowClick = (item) => {
        const orderInfo = {
            orderId: item.orderId,
            orderNo: item.orderNo,
            orderType: item.orderType,
            orderTypeName: item.orderTypeName,
            status: item.status,
            orderStatus: item.orderStatus,
            totalAmount: item.totalAmount,
            serviceCharge: item.serviceCharge,
            lineAmount: item.lineAmount || (item.totalAmount - (item.serviceCharge || 0)),
            stewardDetails: item.stewardDetails,
            tableDetails: item.tableDetails,
            pickUpType: item.pickUpType || item.pickupType,
            pickupTypeName: item.pickupTypeName,
            orderItems: item.orderItems || [],
            isOffer: item.isOffer || false,
            subTotal: item.subTotal,
            sellingPrice: item.sellingPrice,
            createdOn: item.createdOn,
            shiftId: item.shiftId
        };

        if (item.status != 4) {
            Swal.fire({
                title: "Choose Action",
                html: `
                    <p style="margin-bottom: 20px;">What do you want to do with this order?</p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button id="btnPrintKOT" class="swal2-confirm swal2-styled" style="background: #3085d6;">Print KOT/BOT</button>
                        <button id="btnPrintGuest" class="swal2-deny swal2-styled" style="background: #fe6564;">Print Guest Check</button>
                    </div>
                `,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Pay Order",
                denyButtonText: "Update Order",
                showDenyButton: true,
                showCloseButton: true,
                didOpen: () => {
                    const popup = Swal.getPopup();
                    const btnPrintKOT = popup.querySelector("#btnPrintKOT");
                    const btnPrintGuest = popup.querySelector("#btnPrintGuest");
                    
                    if (btnPrintKOT) {
                        btnPrintKOT.addEventListener("click", () => {
                            Swal.close();
                            setTimeout(() => {
                                printKotBot(orderInfo.orderNo);
                            }, 300);
                        });
                    }
                    
                    if (btnPrintGuest) {
                        btnPrintGuest.addEventListener("click", () => {
                            Swal.close();
                            setTimeout(() => {
                                printGuestCheck(orderInfo.orderNo);
                            }, 300);
                        });
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: "Payment",
                        html: `
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 20px;">
            <div class="payment-tile" data-method="1">💵 Cash</div>
            <div class="payment-tile" data-method="2">💳 Card</div>
            <div class="payment-tile" data-method="4">🏦 Bank</div>
          </div>
        `,
                        showCancelButton: true,
                        confirmButtonText: "Done",
                        cancelButtonText: "Close",
                        showConfirmButton: true,
                        showCloseButton: false,
                        preConfirm: () => {
                            return selectedPayment;
                        },
                        didOpen: () => {
                            window.selectedPayment = null;

                            document.querySelectorAll(".payment-tile").forEach(tile => {
                                tile.style.cssText = `
              border: 2px solid #ccc;
              padding: 15px 25px;
              border-radius: 10px;
              cursor: pointer;
              text-align: center;
              font-weight: bold;
            `;
                                tile.addEventListener("click", () => {
                                    document.querySelectorAll(".payment-tile").forEach(t => t.style.borderColor = "#ccc");
                                    tile.style.borderColor = "#3085d6";
                                    window.selectedPayment = tile.getAttribute("data-method");
                                });
                            });
                        }
                    }).then((res) => {
                        if (res.isConfirmed) {
                            if (!window.selectedPayment) {
                                Swal.fire("Warning", "Please select a payment method", "warning").then(() => {
                                    handleRowClick(item, onOrderClick, onPaymentDone);
                                });
                                return;
                            }
                            if (onPaymentDone) {
                                onPaymentDone(item, window.selectedPayment);
                            }
                        }
                    });

                } else if (result.isDenied) {
                    if (onOrderClick) {
                        onOrderClick(orderInfo);
                    }
                }
            });
        } else {
            Swal.fire({
                title: 'Print Bill?',
                html: `
                    <p style="margin-bottom: 20px;">Do you want to print the bill?</p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button id="btnPrintKOT" class="swal2-confirm swal2-styled" style="background: #3085d6;">Print KOT/BOT</button>
                        <button id="btnPrintGuest" class="swal2-deny swal2-styled" style="background: #fe6564;">Print Guest Check</button>
                    </div>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Close',
                cancelButtonText: 'Close',
                reverseButtons: true,
                didOpen: () => {
                    const popup = Swal.getPopup();
                    const btnPrintKOT = popup.querySelector("#btnPrintKOT");
                    const btnPrintGuest = popup.querySelector("#btnPrintGuest");
                    
                    if (btnPrintKOT) {
                        btnPrintKOT.addEventListener("click", () => {
                            Swal.close();
                            setTimeout(() => {
                                printKotBot(orderInfo.orderNo);
                            }, 300);
                        });
                    }
                    
                    if (btnPrintGuest) {
                        btnPrintGuest.addEventListener("click", () => {
                            Swal.close();
                            setTimeout(() => {
                                printGuestCheck(orderInfo.orderNo);
                            }, 300);
                        });
                    }
                }
            }).then((result) => {
                // Modal closed
            });
        }
    };


    const onPaymentDone = async (item) => {
        try {
            const response = await fetch(`${BASE_URL}/RestaurantPOS/CreateOrderPayment?orderId=${item.orderId}&paymentType=${selectedPayment}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            fetchOrderList();
            if (data.result.statusCode === 200) {
                Swal.fire("Success", data.result.message, "success");
            } else {
                Swal.fire("Error", data.result.message, "error");
            }

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Grid container spacing={2}>
            <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ borderBottom: '1px solid #e5e5e5', pb: 1 }}
            >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Orders</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ color: isPickup ? '#fe6564' : 'gray', fontWeight: isPickup ? 'bold' : 'normal' }}>Pickup</Typography>
                    <Switch
                        checked={isPickup}
                        onChange={handleChange}
                        color="error"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: 'white', '&:hover': { backgroundColor: 'rgba(255,0,0,0.1)' } },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#fe6564' },
                            '& .MuiSwitch-track': { borderRadius: 20, backgroundColor: '#ccc' }
                        }}
                    />
                    <Typography sx={{ color: !isPickup ? '#fe6564' : 'gray', fontWeight: !isPickup ? 'bold' : 'normal' }}>Dine In</Typography>
                </Box>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', flexDirection: 'column', height: '75vh' }}>
                <TableContainer
                    component={Paper}
                    sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Bill No</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Order Type</TableCell>
                                {!isPickup ? <>
                                    <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Steward</TableCell>
                                    <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Table</TableCell>
                                </> : <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Pick Up Type</TableCell>}
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Items</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Service Charge</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Total Amount</TableCell>
                                <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Status</TableCell>
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
                                        onClick={() => handleRowClick(item)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: 'rgba(254,101,100,0.1)' }
                                        }}
                                    >
                                        <TableCell>{item.orderNo}</TableCell>
                                        <TableCell>{item.orderTypeName}</TableCell>
                                        {!isPickup ? <>
                                            <TableCell>{item.stewardDetails ? item.stewardDetails.firstName : ""}</TableCell>
                                            <TableCell>{item.tableDetails ? item.tableDetails.code : ""}</TableCell>
                                        </> : <TableCell>{item.pickupTypeName}</TableCell>}
                                        <TableCell>
                                            {item.orderItems.map((x, idx) => <Box key={idx}>{x.name} x {x.qty} - Rs.{x.price * x.qty}</Box>)}
                                        </TableCell>
                                        <TableCell>{formatCurrency(item.serviceCharge)}</TableCell>
                                        <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                                        <TableCell>
                                            <span className={item.status === 1 ? "dangerBadge" : (item.status === 2 ? "primaryBadge" : "successBadge")}>{item.orderStatus}</span>
                                        </TableCell>
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

            <Modal
                open={reportModalOpen}
                onClose={handleCloseReportModal}
                aria-labelledby="report-modal-title"
                aria-describedby="report-modal-description"
            >
                <Box sx={modalStyle}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography id="report-modal-title" variant="h6" component="h2">
                            Report
                        </Typography>
                        <Button onClick={handleCloseReportModal} variant="outlined" size="small">
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
        </Grid>
    );
}
