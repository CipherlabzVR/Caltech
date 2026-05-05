import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { v4 as uuidv4 } from "uuid";
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
import AddCustomerDialog from "@/components/UIElements/Modal/AddCustomerDialog";
import GetAllSalesPersons from "@/components/utils/GetAllSalesPerson";
import useShiftCheck from "@/components/utils/useShiftCheck";

const SalesOrderCreate = () => {
  const today = new Date();
  const [customers, setCustomers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [orderDate, setOrderDate] = useState(formatDate(today));
  const [orderNo, setOrderNo] = useState("");
  const [remark, setRemark] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const [salesPerson, setSalesPerson] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grossTotal, setGrossTotal] = useState(0);
  const guidRef = useRef(uuidv4());
  const searchRef = useRef(null);
  const qtyRefs = useRef([]);
  const router = useRouter();
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();

  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { data: salesPersonList } = GetAllSalesPersons();

  const handleQtyRef = (el, index) => {
    qtyRefs.current[index] = el;
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Customer/GetAllCustomer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      const customersData = Array.isArray(data) ? data : data?.result || [];
      setCustomers(customersData);
    } catch (error) {
      toast.error("Failed to refresh customer list");
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/sales/sales-order",
    });
  };

  const handleSearchItemSelect = (item) => {
    if (!customer) {
      toast.error("Please select customer first.");
      return;
    }

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

  const updateOrderNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=6`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setOrderNo(result.result);
    } catch (err) {
      console.error("Error fetching next document number:", err);
    }
  };

  const handleSubmit = async () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }

    if (!customer || !orderDate) {
      if (!customer) toast.error("Please Select Customer.");
      if (!orderDate) toast.error("Please Select Order Date.");
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
      StockBalanceId: null,
    }));

    const data = {
      CustomerID: customer.id,
      CustomerCode: customer.code || "",
      CustomerName: customer.firstName || "N/A",
      DocumentNo: orderNo || "",
      DocumentDate: orderDate,
      Remark: remark,
      BillToline1: address1,
      BillToline2: address2,
      BillToline3: address3,
      BillToline4: address4,
      WarehouseId: 1,
      WarehouseCode: "WH001",
      WarehouseName: "Main Warehouse",
      GrossTotal: parseFloat(grossTotal),
      NetTotal: parseFloat(grossTotal),
      SalesPersonId: salesPerson?.id || null,
      SalesPersonCode: salesPerson?.code || "",
      SalesPersonName: salesPerson?.name || "",
      FormSubmitId: guidRef.current,
      SalesOrderLineDetails: salesOrderLines,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/SalesOrder/CreateSalesOrder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json.result.result !== "") {
        toast.success(json.result.message);
        updateOrderNo();
        setSelectedRows([]);
        setCustomer(null);
        setAddress1("");
        setAddress2("");
        setAddress3("");
        setAddress4("");
        setRemark("");
        setSalesPerson(null);
      } else {
        toast.error(json.result.message || "Please fill all required fields");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
    updateOrderNo();
  }, [customerList]);

  useEffect(() => {
    const total = selectedRows.reduce((sum, row) => sum + (Number(row.totalPrice) || 0), 0);
    setGrossTotal(total.toFixed(2));
  }, [selectedRows]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sales Order Create</h1>
        <ul>
          <li>
            <Link href="/sales/sales-order">Sales Order</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>Order No: {orderNo}</Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
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
                    onChange={(event, newValue) => {
                      setCustomer(newValue);
                      if (newValue) {
                        setAddress1(newValue.addressLine1 || "");
                        setAddress2(newValue.addressLine2 || "");
                        setAddress3(newValue.addressLine3 || "");
                      } else {
                        setAddress1("");
                        setAddress2("");
                        setAddress3("");
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} size="small" fullWidth placeholder="Search Customer" />
                    )}
                  />
                  <AddCustomerDialog fetchItems={fetchCustomers} showIconOnly={true} />
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
                  <TextField sx={{ width: "60%" }} size="small" type="date" fullWidth value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
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

            <Grid item xs={12} my={3}>
              <LoadingButton loading={isSubmitting} handleSubmit={() => handleSubmit()} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default SalesOrderCreate;
