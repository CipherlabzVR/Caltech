import React, { useEffect, useState } from "react";
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
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import StockDispatch from "./stock-dispatch";

const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { lg: 1000, xs: 350 },
    bgcolor: "background.paper",
    maxHeight: "80vh",
    overflowY: "hidden",
    boxShadow: 24,
    p: 3,
};

export default function ViewStock({ item,reset }) {
    const [open, setOpen] = React.useState(true);

    const handleClose = () => {
        setOpen(false);
        reset();
    };
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [stockDetails, setStockDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const { data: IsExpireDateAvailable } = IsAppSettingEnabled(
        "IsExpireDateAvailable"
    );
    const { data: IsBatchNumberAvailable } = IsAppSettingEnabled(
        "IsBatchNumberAvailable"
    );

    const fetchStockBalance = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=${item.warehouseId}&productId=${item.id}`,
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
            setStockDetails(data.result);
        } catch (error) {
            console.error("Error fetching", error);
        } finally {
            setLoading(false);
        }
    };

     useEffect(() => {
        fetchStockBalance();
      }, []);

    const paginatedData = stockDetails.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="bg-black">
                    <Typography variant="h6" my={2}>
                        Stock Balance Details
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
                                            <TableCell>Supplier</TableCell>
                                            <TableCell>Product Code</TableCell>
                                            <TableCell>Product Name</TableCell>
                                            <TableCell>Stock Quantity</TableCell>
                                            {IsExpireDateAvailable && <TableCell>Exp Date</TableCell>}
                                            {IsBatchNumberAvailable && <TableCell>Batch No</TableCell>}
                                            <TableCell>Unit Price (Rs)</TableCell>
                                            <TableCell>Cost Price (Rs)</TableCell>
                                            <TableCell>Selling Price (Rs)</TableCell>
                                            <TableCell>Remark</TableCell>
                                            <TableCell>Stock Dispatch</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={12} align="center">
                                                    <Typography color="error">
                                                        No Stock Available
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map((item, index) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                                    <TableCell>{item.supplierName}</TableCell>
                                                    <TableCell>{item.productCode}</TableCell>
                                                    <TableCell>{item.productName}</TableCell>
                                                    <TableCell>{item.bookBalanceQuantity}</TableCell>
                                                    {IsExpireDateAvailable && <TableCell>{formatDate(item.expiryDate)}</TableCell>}
                                                    {IsBatchNumberAvailable && <TableCell>{item.batchNumber}</TableCell>}
                                                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                    <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                                                    <TableCell>
                                                        {formatCurrency(item.sellingPrice)}
                                                    </TableCell>
                                                    <TableCell>{item.remark}</TableCell>
                                                    <TableCell>
                                                        <StockDispatch fetchItems={fetchStockBalance} item={item} isExp={IsExpireDateAvailable} isBatch={IsBatchNumberAvailable} resetState={reset}/>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={paginatedData.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
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
