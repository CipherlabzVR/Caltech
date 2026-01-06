import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import {
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 800, xs: 350 },
    bgcolor: "background.paper",
    maxHeight: "80vh",
    overflowY: "hidden",
    boxShadow: 24,
    p: 3,
};

export default function ViewOutstanding({ item }) {
    const [open, setOpen] = React.useState(false);
    const [result, setResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const name = localStorage.getItem("name");
    const { data: InvoiceReportName } = GetReportSettingValueByName("Invoice");
    const { data: POSInvoiceReportName } = GetReportSettingValueByName("POSInvoice");

    const handleClose = () => {
        setOpen(false);
    };

    const fetchOutstandingBalance = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${BASE_URL}/Outstanding/GetAllCustomerwiseOutstandings?customerId=${item.customerId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch");
            }

            const data = await response.json();
            setResult(data.result);
        } catch (error) {
            console.error("Error fetching", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setOpen(true);
        fetchOutstandingBalance();
    };

    return (
        <>
            <Tooltip title="View" placement="top">
                <IconButton onClick={handleOpen} aria-label="View" size="small">
                    <VisibilityIcon color="primary" fontSize="medium" />
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
                        Customer Outstanding Details {item.customerName ? `- ${item.customerName}` : ""}
                    </Typography>
                    <Box>
                        {loading ? (
                            <Box display="flex" justifyContent="center" my={2}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{ maxHeight: "50vh", overflowY: "auto" }}>
                                <Table aria-label="simple table" className="dark-table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Invoice Date</TableCell>
                                            <TableCell>Invoice No</TableCell>
                                            <TableCell>Invoice Amount</TableCell>
                                            <TableCell>Outstanding Amount</TableCell>
                                            <TableCell>Invoice</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {result.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <Typography color="error">
                                                        No Outstanding Available
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            result.map((outstanding, index) => {
                                                const invoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${outstanding.invoiceNumber}&reportName=${InvoiceReportName}&warehouseId=${outstanding.warehouseId}&currentUser=${name}`;
                                                const POSInvoiceReportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${outstanding.invoiceNumber}&reportName=${POSInvoiceReportName}&warehouseId=${outstanding.warehouseId}&currentUser=${name}`;

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>{formatDate(outstanding.invoiceDate)}</TableCell>
                                                        <TableCell>{outstanding.invoiceNumber}</TableCell>
                                                        <TableCell>{formatCurrency(outstanding.totalInvoiceAmount)}</TableCell>
                                                        <TableCell>{formatCurrency(outstanding.outstandingAmount)}</TableCell>
                                                        <TableCell>
                                                            <Tooltip title="Print" placement="top">
                                                                <a href={`${Report}` + invoiceReportLink} target="_blank">
                                                                    <IconButton aria-label="print" size="small">
                                                                        <LocalPrintshopIcon color="primary" fontSize="medium" />
                                                                    </IconButton>
                                                                </a>
                                                            </Tooltip>
                                                            <Tooltip title="Print" placement="top">
                                                                <a href={`${Report}` + POSInvoiceReportLink} target="_blank">
                                                                    <IconButton aria-label="print" size="small">
                                                                        <ReceiptIcon color="primary" fontSize="medium" />
                                                                    </IconButton>
                                                                </a>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell colSpan={3}>Total</TableCell>
                                            <TableCell>{formatCurrency(item.totalInvoiceAmount)}</TableCell>
                                            <TableCell>{formatCurrency(item.outstandingAmount)}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                </Table>
                            </TableContainer>
                        )}
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
                    </Box>
                </Box>
            </Modal>
        </>
    );
}
