import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
    Pagination,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Tabs,
    Tab,
    Typography,
    Box,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import {
    Search,
    StyledInputBase,
} from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";
import DeleteConfirmationWithReasonById from "@/components/UIElements/Modal/DeleteConfirmationWithReasonById";
import EditNote from "@/components/UIElements/Modal/EditNote";
import { getBridal, getEventType, getLocation, getPreferedTime } from "@/components/types/types";

export default function PencilNotes() {
    const cId = sessionStorage.getItem("category");
    const { navigate, update, remove } = IsPermissionEnabled(cId);
    const controller = "Reservation/DeletePencilNote";
    const [resList, setResList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
        setPage(1);
        fetchResList(1, searchTerm, pageSize);
    };

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(1);
        fetchResList(1, value, pageSize);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        fetchResList(value, searchTerm, pageSize);
    };

    const handlePageSizeChange = (event) => {
        const newSize = event.target.value;
        setPageSize(newSize);
        setPage(1);
        fetchResList(1, searchTerm, newSize);
    };

    const fetchResList = async (pg = 1, search = "", size = pageSize) => {
        try {
            const token = localStorage.getItem("token");
            const skip = (pg - 1) * size;
            const query = `${BASE_URL}/Reservation/GetAllNotes?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

            const response = await fetch(query, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch items");

            const data = await response.json();
            setResList(data.result.items || []);
            setTotalCount(data.result.totalCount || 0);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        fetchResList(page, searchTerm, pageSize);
    }, []);

    const filteredData = resList.filter((item) => {
        if (tabIndex === 0) return !item.isDeleted && !item.isExpired;
        if (tabIndex === 1) return !item.isDeleted && item.isExpired;
        if (tabIndex === 2) return item.isDeleted && !item.isExpired;
        return false;
    });    

    if (!navigate) return <AccessDenied />;

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Notes</h1>
            </div>
            <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Pencil Notes" />
                <Tab label="Expired Notes" />
                <Tab label="Deleted Notes" />
            </Tabs>
            <Grid container spacing={1}>
                <Grid item xs={12} lg={4}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search here.."
                            inputProps={{ "aria-label": "search" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </Search>
                </Grid>
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Wedding Date</TableCell>
                                    <TableCell>Customer Name</TableCell>
                                    <TableCell>Event Type</TableCell>
                                    <TableCell>Bridal Type</TableCell>
                                    <TableCell>Preferd Time</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Mobile No</TableCell>
                                    <TableCell>NIC/Passport</TableCell>
                                    <TableCell>Description</TableCell>
                                    {tabIndex === 2 ? <TableCell>Deleted Reason</TableCell> : ""}
                                    {tabIndex === 0 ? <TableCell align="right">Action</TableCell> : ""}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <Typography color="error">No Notes Available</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <TableRow
                                            key={index}
                                            sx={{
                                                background: item.isFinalPaymentDone ? "#F8F8E1" : "",
                                            }}
                                        >
                                            <TableCell>{formatDate(item.reservationDate)}</TableCell>
                                            <TableCell>{item.customerName}</TableCell>
                                            <TableCell>{getEventType(item.reservationFunctionType)}</TableCell>
                                            <TableCell>{getBridal(item.bridleType)}</TableCell>
                                            <TableCell>{getPreferedTime(item.preferdTime)}</TableCell>
                                            <TableCell>{getLocation(item.location)}</TableCell>
                                            <TableCell>{item.mobileNo}</TableCell>
                                            <TableCell>{item.nic}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            {tabIndex === 2 ? <TableCell>{item.deletedReason}</TableCell> : ""}
                                            {tabIndex === 0 ? <TableCell align="right">
                                                <Box display="flex" justifyContent="end" gap={1}>
                                                    {update ? <EditNote note={item} fetchItems={fetchResList} /> : ""}
                                                    {remove ? <DeleteConfirmationWithReasonById id={item.id} controller={controller} fetchItems={fetchResList} /> : ""}
                                                </Box>
                                            </TableCell> : ""}
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
                                <Select
                                    value={pageSize}
                                    label="Page Size"
                                    onChange={handlePageSizeChange}
                                >
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
