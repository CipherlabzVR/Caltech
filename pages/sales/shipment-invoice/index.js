import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Button,
  Typography,
  Chip,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { ToastContainer } from "react-toastify";
import styles from "@/styles/PageTitle.module.css";
import useApi from "@/components/utils/useApi";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import ShipmentInvoiceDeleteConfirmation from "./ShipmentInvoiceDeleteConfirmation";

export default function ShipmentInvoiceList() {
  const cId = sessionStorage.getItem("category");
  const { remove } = IsPermissionEnabled(cId);
  const router = useRouter();
  const [listVersion, setListVersion] = useState(0);
  const { data, loading, error } = useApi(`/ShipmentInvoice/GetAll?_=${listVersion}`);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [isCurrentDate, setIsCurrentDate] = useState(false);

  const allInvoices = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : [];
  }, [data]);

  const filteredInvoices = useMemo(() => {
    let list = allInvoices;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const doc = (item.documentNo ?? "").toString().toLowerCase();
        const sup = (item.supplierName ?? item.SupplierName ?? "").toString().toLowerCase();
        const ref = (item.referenceNo ?? "").toString().toLowerCase();
        const remark = (item.remark ?? "").toString().toLowerCase();
        return doc.includes(q) || sup.includes(q) || ref.includes(q) || remark.includes(q);
      });
    }
    if (isCurrentDate) {
      const today = new Date();
      list = list.filter((item) => {
        if (!item.invoiceDate) return false;
        const d = new Date(item.invoiceDate);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      });
    }
    return list;
  }, [allInvoices, search, isCurrentDate]);

  const totalCount = filteredInvoices.length;

  const pagedInvoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, page, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, pageSize, page]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    const searchValue = event.target.value;
    setSearch(searchValue);
    setPage(1);
  };

  const handleToggleCurrentDate = (event) => {
    const checked = event.target.checked;
    setIsCurrentDate(checked);
    setPage(1);
  };

  const navigateToCreate = () => {
    router.push({ pathname: "/sales/shipment-invoice/create-shipment-invoice/" });
  };

  const navigateToView = (id) => {
    router.push({ pathname: `/sales/shipment-invoice/${id}/view/` });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shipment Invoice</h1>
        <ul>
          <li>
            <Link href="/sales/shipment-invoice/">Shipment Invoice</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by Document No, Supplier or Reference No.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="space-between" order={{ xs: 1, lg: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isCurrentDate}
                onChange={handleToggleCurrentDate}
                color="primary"
              />
            }
            label="Today Invoices"
          />
          <Button variant="outlined" onClick={navigateToCreate}>
            + Add New
          </Button>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="shipment invoice table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Invoice Date</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Grand Total (Rs)</TableCell>
                  <TableCell>Is Paid</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">{error}</Typography>
                    </TableCell>
                  </TableRow>
                ) : allInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">No shipment invoices available</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">No shipment invoices match your search or filters</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedInvoices.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>
                        {item.supplierName ?? item.SupplierName ?? item.supplierId ?? "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(item.grandTotal)}</TableCell>
                      <TableCell>
                        {item.isPaid ? (
                          <Chip label="Paid" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="Unpaid" size="small" color="error" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          gap={1}
                          alignItems="center"
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigateToView(item.id)}
                          >
                            View
                          </Button>
                          {remove ? (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {!item.isPaid ? (
                                <ShipmentInvoiceDeleteConfirmation
                                  shipmentInvoiceId={item.id}
                                  fetchItems={() => setListVersion((v) => v + 1)}
                                />
                              ) : null}
                            </Box>
                          ) : null}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
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
