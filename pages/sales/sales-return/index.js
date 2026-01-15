import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import useShiftCheck from "@/components/utils/useShiftCheck";
import { getPaymentMethods } from "@/components/types/types";

export default function SalesReturn() {
    const cId = sessionStorage.getItem("category")
    const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
    const [salesReturnList, setSalesReturnList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const router = useRouter();
    const { result: shiftResult, message: shiftMessage } = useShiftCheck();

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(1);
        fetchSalesReturnList(1, value, pageSize);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        fetchSalesReturnList(value, searchTerm, pageSize);
    };

    const handlePageSizeChange = (event) => {
        const newSize = event.target.value;
        setPageSize(newSize);
        setPage(1);
        fetchSalesReturnList(1, searchTerm, newSize);
    };

    const fetchSalesReturnList = async (page = 1, search = "", size = pageSize) => {
        try {
            const token = localStorage.getItem("token");
            const skip = (page - 1) * size;
            const searchParam = search ? encodeURIComponent(search) : "null";
            const query = `${BASE_URL}/SalesReturn/GetAllSalesReturnSkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}`;

            const response = await fetch(query, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch items");

            const data = await response.json();
            setSalesReturnList(data.result.items);
            setTotalCount(data.result.totalCount || 0);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        fetchSalesReturnList();
    }, []);

    const navigateToCreate = () => {
        if (shiftResult) {
            toast.warning(shiftMessage);
            return;
        }
        router.push("/sales/sales-return/create");
    };

    if (!navigate) {
        return <AccessDenied />;
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Sales Returns</h1>
                <ul>
                    <li>
                        <Link href="/sales/sales-return/">Sales Returns</Link>
                    </li>
                </ul>
            </div>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
                <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search by Return No, Customer or Invoice No.."
                            inputProps={{ "aria-label": "search" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </Search>
                </Grid>
                <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
                    {create ? <Button variant="outlined" onClick={navigateToCreate}>
                        + Add New
                    </Button> : ""}
                </Grid>
                <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
                    <TableContainer component={Paper}>
                        <Table aria-label="simple table" className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Return Date</TableCell>
                                    <TableCell>Return No</TableCell>
                                    <TableCell>Customer Name</TableCell>
                                    <TableCell>Invoice No</TableCell>
                                    <TableCell>Payment Type</TableCell>
                                    <TableCell>Return Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {salesReturnList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Typography color="error">No Sales Returns Available</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    salesReturnList.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{formatDate(item.salesReturnDate)}</TableCell>
                                            <TableCell>{item.documentNo}</TableCell>
                                            <TableCell>{item.customerName}</TableCell>
                                            <TableCell>{item.invoiceNo}</TableCell>
                                            <TableCell>{getPaymentMethods(item.paymentType)}</TableCell>
                                            <TableCell>{formatCurrency(item.returnAmount)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Grid container justifyContent="space-between" mt={2} mb={2}>
                            <Pagination
                                count={Math.ceil(totalCount / pageSize)}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                            />
                            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                                <InputLabel>Page Size</InputLabel>
                                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                                    <MenuItem value={5}>5</MenuItem>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </TableContainer>
                </Grid>
            </Grid>
        </>
    );
}
