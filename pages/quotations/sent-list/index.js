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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Box, Tabs, Tab, Chip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import ViewSentQuotations from "./view";
import ConfirmInquiryByInquiryId from "./confirm";
import RejectInquiryByInquiryId from "./reject";

export default function SentQuotations() {
    const cId = sessionStorage.getItem("category");
    const { navigate, update } = IsPermissionEnabled(cId);

    const [quotationList, setQuotationList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [tab, setTab] = useState(0);

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(1);
        fetchQuotationList(1, value, pageSize, tab);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        fetchQuotationList(value, searchTerm, pageSize, tab);
    };

    const handlePageSizeChange = (event) => {
        const newSize = event.target.value;
        setPageSize(newSize);
        setPage(1);
        fetchQuotationList(1, searchTerm, newSize, tab);
    };

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
        setPage(1);
        fetchQuotationList(1, searchTerm, pageSize, newValue);
    };

    const fetchQuotationList = async (page = 1, search = "", size = pageSize, currentTab = tab) => {
        try {
            const token = localStorage.getItem("token");
            const skip = (page - 1) * size;
            // Map tab to confirmation status: 0 = Pending (1), 1 = Confirmed (2), 2 = Rejected (3)
            const confirmationStatus = currentTab === 0 ? 1 : currentTab === 1 ? 2 : currentTab === 2 ? 3 : null;
            const query = `${BASE_URL}/Inquiry/GetAllSentQuotationsByConfirmationStatus?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&confirmationStatus=${confirmationStatus || ""}`;

            const response = await fetch(query, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch items");

            const data = await response.json();
            setQuotationList(data.result.items || []);
            setTotalCount(data.result.totalCount || 0);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        fetchQuotationList(1, searchTerm, pageSize, tab);
    }, []);

    if (!navigate) {
        return <AccessDenied />;
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Sent Quotations</h1>
                <ul>
                    <li>
                        <Link href="/quotations/sent-list/">Sent Quotations</Link>
                    </li>
                </ul>
            </div>

            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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
                    <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
                        <Tab label="Pending" />
                        <Tab label="Confirmed" />
                        <Tab label="Rejected" />
                    </Tabs>

                    <TableContainer component={Paper}>
                        <Table aria-label="quotations table" className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Customer Name</TableCell>
                                    <TableCell>Inquiry Code</TableCell>
                                    <TableCell>Sent Whatsapp Number</TableCell>
                                    <TableCell>Style Name</TableCell>
                                    <TableCell>View Quotations</TableCell>
                                    {tab === 2 && <TableCell>Rejected Reason</TableCell>}
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {quotationList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={tab === 2 ? 7 : 6}>
                                            <Typography color="error">No Quotations Available</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotationList.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.customerName}</TableCell>
                                            <TableCell>{item.inquiryCode}</TableCell>
                                            <TableCell>{item.sentWhatsappNumber}</TableCell>
                                            <TableCell>{item.styleName}</TableCell>
                                            <TableCell>
                                                <ViewSentQuotations item={item} update={update} fetchItems={fetchQuotationList} parentTab={tab}/>                                                
                                            </TableCell>
                                            {tab === 2 ? <TableCell>{item.inquiryRejectReason}</TableCell> : ""}
                                            <TableCell align="right">
                                                {tab === 0 ?
                                                    <Box display="flex" justifyContent="end" gap={1}>
                                                        <ConfirmInquiryByInquiryId
                                                            id={item.inquiryId}
                                                            fetchItems={fetchQuotationList}
                                                            hasPending={item.isHasPendingQuotations}
                                                            hasConfirmed={item.isHasConfirmedQuotations}
                                                            onSuccess={() => {
                                                                setTab(1); // jump to Confirmed tab after confirming
                                                                // Add a small delay to ensure backend has committed the changes
                                                                setTimeout(() => {
                                                                    fetchQuotationList(1, searchTerm, pageSize, 1);
                                                                }, 500);
                                                            }}
                                                        />
                                                        <RejectInquiryByInquiryId
                                                            id={item.inquiryId}
                                                            controller="Inquiry/RejectInquiryInSentQuotation"
                                                            fetchItems={fetchQuotationList}
                                                            hasPending={item.isHasPendingQuotations}
                                                            hasConfirmed={item.isHasConfirmedQuotations}
                                                        />
                                                    </Box> :
                                                    <Chip
                                                        color={item.inquiryConfirmationStatus === 2 ? "success" : "error"}
                                                        label={item.inquiryConfirmationStatus === 2 ? "Confirmed" : "Rejected"}
                                                    />
                                                }
                                            </TableCell>
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
