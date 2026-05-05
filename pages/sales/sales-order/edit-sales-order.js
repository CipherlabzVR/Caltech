import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchItemByName from "@/components/utils/SearchItemByName";
import { formatDate } from "@/components/utils/formatHelper";
import GetAllSalesPersons from "@/components/utils/GetAllSalesPerson";

const SalesOrderEdit = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [orderDate, setOrderDate] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [remark, setRemark] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const [salesPerson, setSalesPerson] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grossTotal, setGrossTotal] = useState(0);
  const [orderId, setOrderId] = useState(null);
  const [receiptId, setReceiptId] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const searchRef = useRef(null);
  const qtyRefs = useRef([]);
  const router = useRouter();

  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { data: salesPersonList } = GetAllSalesPersons();

  const handleQtyRef = (el, index) => {
    qtyRefs.current[index] = el;
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/sales/sales-order",
    });
  };

  const handleSearchItemSelect = (item) => {
    const existingItem = selectedRows.find((row) => row.productId === item.id);
    if (existingItem) {
      toast.error("This item already exists in the table.");
      return;
    }

    const newRow = {
      lineKey: `sales-order-${item.id}-${Date.now()}`,
      productId: item.id,
      productName: item.name,
      productCode: item.code,
      quantity: 1,
      sellingPrice: parseFloat(item.averagePrice) || 0,
      totalPrice: parseFloat(item.averagePrice) || 0,
      stockBalanceId: item.stockBalanceId || null,
    };

    setSelectedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      setTimeout(() => {
        qtyRefs.current[updatedRows.length - 1]?.focus();
      }, 0);
      return updatedRows;
    });
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    row.quantity = newQuantity;
    row.totalPrice = parseFloat(newQuantity || 0) * parseFloat(row.sellingPrice || 0);
    setSelectedRows(updatedRows);
  };

  const handleSellingPriceChange = (index, newPrice) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    row.sellingPrice = newPrice;
    row.totalPrice = parseFloat(newPrice || 0) * parseFloat(row.quantity || 0);
    setSelectedRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    updatedRows.splice(index, 1);
    setSelectedRows(updatedRows);
  };

  const fetchSalesOrder = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/SalesOrder/GetSalesOrderById?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok || !data?.result) {
        toast.error(data?.message || "Failed to load sales order.");
        navigateToBack();
        return;
      }

      const order = data.result;
      if (order.receiptId != null) {
        toast.warning("This sales order cannot be edited because receipt is already linked.");
        navigateToBack();
        return;
      }

      setOrderId(order.id);
      setReceiptId(order.receiptId ?? null);
      setInvoiceId(order.invoiceId ?? null);
      setOrderNo(order.documentNo || "");
      setOrderDate(formatDate(order.documentDate));
      setRemark(order.remark || "");
      setAddress1(order.billToline1 || "");
      setAddress2(order.billToline2 || "");
      setAddress3(order.billToline3 || "");
      setAddress4(order.billToline4 || "");
      setGrossTotal(order.grossTotal || 0);

      const matchedCustomer = (customerList || []).find((c) => c.id === order.customerID || c.id === order.customerId);
      if (matchedCustomer) {
        setCustomer(matchedCustomer);
      } else {
        setCustomer({
          id: order.customerID || order.customerId,
          firstName: order.customerName || "",
        });
      }

      const matchedSalesPerson = (salesPersonList || []).find((s) => s.id === order.salesPersonId);
      setSalesPerson(matchedSalesPerson || null);

      const rows = (order.salesOrderLineDetails || [])
        .filter((line) => !line.isDeleted)
        .map((line, index) => ({
          lineKey: `line-${line.id || index}`,
          id: line.id,
          productId: line.productId,
          productName: line.productName,
          productCode: line.productCode,
          quantity: Number(line.qty || 0),
          sellingPrice: Number(line.unitPrice || 0),
          totalPrice: Number(line.lineTotal || 0),
          stockBalanceId: line.stockBalanceId ?? null,
          sequanceNo: line.sequanceNo || index + 1,
        }));

      setSelectedRows(rows);
    } catch (error) {
      toast.error("Failed to load sales order.");
      navigateToBack();
    }
  };

  const handleSubmit = async () => {
    if (!orderId) {
      toast.error("Sales order not found.");
      return;
    }

    if (selectedRows.length === 0) {
      toast.error("At least one item must be added.");
      return;
    }

    const invalidItem = selectedRows.some((r) => !r.quantity || r.quantity <= 0);
    if (invalidItem) {
      toast.error("Please add valid quantity for all items.");
      return;
    }

    const invalidPrice = selectedRows.some((r) => !r.sellingPrice || Number(r.sellingPrice) <= 0);
    if (invalidPrice) {
      toast.error("Please add selling price greater than 0 for all items.");
      return;
    }

    const salesOrderLines = selectedRows.map((row, i) => ({
      DocumentNo: orderNo,
      ProductId: row.productId,
      ProductName: row.productName,
      ProductCode: row.productCode,
      WarehouseId: 1,
      WarehouseCode: "WH001",
      WarehouseName: "Main Warehouse",
      UnitPrice: parseFloat(row.sellingPrice),
      Qty: parseFloat(row.quantity),
      LineTotal: parseFloat(row.totalPrice),
      SequanceNo: i + 1,
      StockBalanceId: row.stockBalanceId,
    }));

    const data = {
      Id: orderId,
      CustomerID: customer?.id || 0,
      CustomerCode: customer?.code || "",
      CustomerName: customer?.firstName || "",
      DocumentNo: orderNo,
      DocumentDate: orderDate,
      Remark: remark,
      BillToline1: address1,
      BillToline2: address2,
      BillToline3: address3,
      BillToline4: address4,
      GrossTotal: parseFloat(grossTotal),
      NetTotal: parseFloat(grossTotal),
      SalesPersonId: salesPerson?.id || null,
      SalesPersonCode: salesPerson?.code || "",
      SalesPersonName: salesPerson?.name || "",
      ReceiptId: receiptId,
      InvoiceId: invoiceId,
      SalesOrderLineDetails: salesOrderLines,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/SalesOrder/UpdateSalesOrder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Sales order updated successfully.");
        navigateToBack();
      } else {
        toast.error(json.message || "Failed to update sales order.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
  }, [customerList]);

  useEffect(() => {
    const id = router.query.id;
    if (router.isReady && id && customerList && salesPersonList) {
      fetchSalesOrder(id);
    }
  }, [router.isReady, router.query.id, customerList, salesPersonList]);

  useEffect(() => {
    const total = selectedRows.reduce((sum, row) => sum + (Number(row.totalPrice) || 0), 0);
    setGrossTotal(total.toFixed(2));
  }, [selectedRows]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sales Order Edit</h1>
        <ul>
          <li>
            <Link href="/sales/sales-order">Sales Order</Link>
          </li>
          <li>Edit</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>Order No: {orderNo}</Typography>
              </Button>
              <Button variant="outlined" onClick={navigateToBack}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                  Customer
                </Typography>
                <Box sx={{ width: "60%", display: "flex", gap: 1 }}>
                  <Autocomplete
                    sx={{ flex: 1 }}
                    options={customers || []}
                    getOptionLabel={(option) => option.firstName || ""}
                    value={customer}
                    disabled
                    onChange={(event, newValue) => {
                      setCustomer(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth placeholder="Search Customer" />
                    )}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} display="flex" flexDirection="column" mt={1}>
                <Grid item xs={12} display="flex" justifyContent="space-between">
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                    Bill to
                  </Typography>
                  <TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 2" value={address2} onChange={(e) => setAddress2(e.target.value)} />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 3" value={address3} onChange={(e) => setAddress3(e.target.value)} />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField sx={{ width: "60%" }} size="small" fullWidth placeholder="Address Line 4" value={address4} onChange={(e) => setAddress4(e.target.value)} />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid container>
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                    Date
                  </Typography>
                  <TextField sx={{ width: "60%" }} size="small" type="date" fullWidth value={orderDate} disabled onChange={(e) => setOrderDate(e.target.value)} />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                    Remark
                  </Typography>
                  <TextField sx={{ width: "60%" }} size="small" fullWidth value={remark} onChange={(e) => setRemark(e.target.value)} />
                </Grid>
                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={{ fontWeight: "500", p: 1, fontSize: "14px", display: "block", width: "35%" }}>
                    Salesperson
                  </Typography>
                  <Autocomplete
                    sx={{ width: "60%" }}
                    options={salesPersonList || []}
                    getOptionLabel={(option) => option?.name || ""}
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    value={salesPerson}
                    onChange={(event, newValue) => {
                      setSalesPerson(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth placeholder="Select Salesperson" />}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} mt={3} mb={1}>
              <SearchItemByName
                ref={searchRef}
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsForSalesOrder`}
                onSelect={handleSearchItemSelect}
              />
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="simple table" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Selling Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Total Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.map((row, index) => (
                      <TableRow key={row.lineKey}>
                        <TableCell sx={{ p: 1 }}>
                          <Tooltip title="Delete" placement="top">
                            <IconButton onClick={() => handleDeleteRow(index)} aria-label="delete" size="small">
                              <DeleteIcon color="error" fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }}>{row.productName}</TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            inputRef={(el) => handleQtyRef(el, index)}
                            sx={{ width: "100px" }}
                            type="number"
                            size="small"
                            value={row.quantity}
                            inputProps={{ min: 1 }}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "120px" }}
                            type="number"
                            size="small"
                            value={row.sellingPrice}
                            inputProps={{ min: 0, step: "0.01" }}
                            onChange={(e) => handleSellingPriceChange(index, e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{(Number(row.totalPrice) || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell align="right" colSpan={5}>
                        <Typography fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell sx={{ p: 1 }}>
                        <Typography fontWeight="bold">{grossTotal}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} my={3} display="flex" justifyContent="flex-end" gap={1}>
              <Button variant="outlined" onClick={navigateToBack}>
                Cancel
              </Button>
              <LoadingButton loading={isSubmitting} handleSubmit={handleSubmit} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default SalesOrderEdit;
