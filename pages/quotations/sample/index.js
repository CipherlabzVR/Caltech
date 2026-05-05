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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tabs, Tab } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatDate } from "@/components/utils/formatHelper";
import QuotationConfirmationById from "@/components/UIElements/Modal/QuotationConfirmationById";
import { projectStatusType } from "@/components/types/types";

export default function SampleList() {
    const cId = sessionStorage.getItem("category")
    const { navigate, create, update, remove } = IsPermissionEnabled(cId);
    const [quotationList, setQuotationList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
        fetchQuotationList(1, searchTerm, pageSize, newValue);
    };

    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(1);
        fetchQuotationList(1, value, pageSize);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        fetchQuotationList(value, searchTerm, pageSize);
    };

    const handlePageSizeChange = (event) => {
        const newSize = event.target.value;
        setPageSize(newSize);
        setPage(1);
        fetchQuotationList(1, searchTerm, newSize);
    };

    const fetchQuotationList = async (page = 1, search = "", size = pageSize, tab = tabValue) => {
        try {
            const token = localStorage.getItem("token");
            const skip = (page - 1) * size;
            const type = tab === 0 ? 4 : tab === 1 ? 5 : 8;
            const query = `${BASE_URL}/Inquiry/GetAllQuotationsByType?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&type=${type}`;

            const response = await fetch(query, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch items");

            const data = await response.json();
            setQuotationList(data.result.items);
            setTotalCount(data.result.totalCount || 0);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        fetchQuotationList();
    }, []);

    if (!navigate) {
        return <AccessDenied />;
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.pageTitle}>
                <h1>Sample List</h1>
                <ul>
                    <li>
                        <Link href="/quotations/tech-pack/">Sample List</Link>
                    </li>
                </ul>
            </div>
            <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Pending" />
                <Tab label="Confirmed" />
                <Tab label="Rejected" />
            </Tabs>
            <Grid mt={1} container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
                <Grid item xs={12} lg={4} order={{ xs: 1, lg: 1 }}>
                    <Search className="search-form">
                        <StyledInputBase
                            placeholder="Search here.."
                            inputProps={{ "aria-label": "search" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </Search>
                </Grid>
                <Grid item xs={12} order={{ xs: 2, lg: 2 }}>
                    <TableContainer component={Paper}>
                        <Table aria-label="simple table" className="dark-table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Document No</TableCell>
                                    <TableCell>Customer Name</TableCell>
                                    <TableCell>Inquiry Code</TableCell>
                                    <TableCell>Option Name</TableCell>
                                    <TableCell>Style Name</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>Working Days</TableCell>
                                    <TableCell>Selected Option</TableCell>
                                    <TableCell>Document</TableCell>
                                    <TableCell>Status</TableCell>
                                    {tabValue === 2 ? <TableCell align="right">Rejected Reason</TableCell> : <TableCell align="right">Action</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {quotationList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={12}>
                                            <Typography color="error">No Quotations Available</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    quotationList.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.documentNo}</TableCell>
                                            <TableCell>{item.customerName}</TableCell>
                                            <TableCell>{item.inquiryCode}</TableCell>
                                            <TableCell>{item.optionName}</TableCell>
                                            <TableCell>{item.styleName}</TableCell>
                                            <TableCell>{formatDate(item.startDate)}</TableCell>
                                            <TableCell>{item.workingDays}</TableCell>
                                            <TableCell>{item.selectedOption}</TableCell>
                                            <TableCell>
                                                <a href={`${item.documentURL}`} target="_blank">
                                                    view
                                                </a>
                                            </TableCell>
                                            <TableCell>{projectStatusType(item.projectStatusType)}</TableCell>

                                            {tabValue === 2 ? (
                                                <TableCell align="right">{item.rejectedReason}</TableCell>
                                            ) : (
                                                <TableCell align="right">
                                                    {tabValue === 0 && (
                                                        <QuotationConfirmationById
                                                            id={item.quotationId}
                                                            fetchItems={fetchQuotationList}
                                                            sentQuotId={item.id}
                                                        />
                                                    )}
                                                </TableCell>
                                            )}
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
