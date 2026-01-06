import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Button,
  TextField,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Select,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import getNext from "@/components/utils/getNext";
import { formatDate } from "@/components/utils/formatHelper";
import { debounce } from "lodash";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import useShiftCheck from "@/components/utils/useShiftCheck";
import SearchItemByName from "@/components/utils/SearchItemByName";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';


const Salesreturn = () => {
  const today = new Date();
  const [customers, setCustomers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const router = useRouter();
  const [grossTotal, setGrossTotal] = useState(0);
  const [salesPerson, setSalesPerson] = useState("");
  const [outstandingAmounts, setOutstandingAmounts] = useState("");
  const [invoice, setInvoice] = useState("");
  const [invoicesForCustomer, setInvoicesForCustomer] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceFocused, setInvoiceFocused] = useState(false);
  const [returnAmount, setReturnAmount] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedRows, setCheckedRows] = useState({});
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const [returnType, setReturnType] = useState("invoice");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [bankId, setBankId] = useState(null);
  const [banks, setBanks] = useState([]);

  const fetchProducts = debounce(async (query) => {
    if (!query) {
      setProducts([]);
      return;
    }
    setIsProductLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/item/SearchProduct?keyWord=${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.result || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsProductLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (productSearchQuery) {
      fetchProducts(productSearchQuery);
    } else {
      setProducts([]);
    }
    return () => fetchProducts.cancel();
  }, [productSearchQuery]);

  const {
    data: customerList,
    loading: customerLoading,
    error: customerError,
  } = useApi("/Customer/GetAllCustomer");

  const {
    data: salesPersonList,
    loading: salesPersonLoading,
    error: salesPersonError,
  } = useApi("/SalesPerson/GetAllSalesPerson");

  const { data: bankList } = useApi("/Bank/GetAllBanks");

  const { data: invoiceNo } = getNext(`10`);

  const navigateToBack = () => {
    router.push({
      pathname: "/sales/sales-return",
    });
  };

  const fetchInvoices = debounce(async (query, customerId) => {
    if (!query || !customerId) {
      setFilteredInvoices([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/SalesInvoice/GetInvoicesByCustomerId?customerId=${customerId}&keyWord=${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setFilteredInvoices(data.result || []);
      } else {
        setFilteredInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setFilteredInvoices([]);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    if (customerId && searchQuery) {
      fetchInvoices(searchQuery, customerId);
    } else {
      setFilteredInvoices([]);
    }
    return () => {
      fetchInvoices.cancel();
    };
  }, [searchQuery, customerId]);

  const fetchInvoiceDetails = async (documentNo) => {
    if (!documentNo) {
      toast.error("Document No is required.");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/SalesInvoice/GetSalesInvoiceBySalesInvoiceIdSearch?DocumentNo=${documentNo}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.result && jsonResponse.result.length > 0) {
          const updatedData = jsonResponse.result.map((item) => ({
            ...item,
            balanceQty: item.qty - item.returnQty,
          }));
          setSelectedRows(updatedData);
        }
      } else {
        // toast.error("Failed to fetch invoice details.");
      }
    } catch (error) {
      // toast.error("Error fetching invoice details.");
    }
  };
const handleDeleteRow = (index) => {
  const updatedRows = [...selectedRows];
  const updatedChecked = Array.isArray(checkedRows)
    ? [...checkedRows]
    : []; // Fallback to empty array to avoid crash

  updatedRows.splice(index, 1);
  updatedChecked.splice(index, 1);

  setSelectedRows(updatedRows);
  setCheckedRows(updatedChecked);

  const newGrossTotal = updatedRows.reduce(
    (total, row) => total + (row.returnAmount || 0),
    0
  );
  setGrossTotal(newGrossTotal);
};

  const handleSubmit = async () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    // Check if customer is selected for invoice return
    if ( !customer) {
      toast.error("Please select a customer.");
      return;
    }


     if ( !salesPerson) {
      toast.error("Please select a salesPerson.");
      return;
    }

    if (!paymentType) {
      toast.error("Please select a payment type.");
      return;
    }

    // Validate bank selection for Card (2) or Bank Transfer (4)
    if ((paymentType === 2 || paymentType === 4) && !bankId) {
      toast.error("Please select a bank.");
      return;
    }
    // // Validate return quantity only when the return type is Invoice
    
   
    // Validate return quantity only when the return type is Invoice
    if (returnType === "invoice") {
      const hasTooMuchReturn = selectedRows.some(
        (row, index) =>
          checkedRows[index] &&
          (row.returnQuantity || 0) > (row.balanceQty || 0)
      );
      if (hasTooMuchReturn) {
        toast.error(
          "Return quantity cannot be greater than the remaining invoice quantity."
        );
        return;
      }
    }

    if (returnType === "invoice")
      if (!selectedInvoice || !selectedInvoice.documentNo) {
        toast.error("Please select an invoice.");
        return;
      }

    if (isNaN(returnAmount) || returnAmount <= 0) {
      toast.error("Return Amount must be a positive number.");
      return;
    }

    if (!selectedRows || selectedRows.length === 0) {
      toast.error("Please select at least one item to return.");
      return;
    }
    //returnQuantity <= 0
    const invalidReturnQuantityRows = selectedRows.filter(
      (row, index) => checkedRows[index] && row.returnQuantity <= 0
    );
    if (invalidReturnQuantityRows.length > 0) {
      toast.error(
        "Return quantity must be greater than 0 for all selected items."
      );
      return;
    }
    //returnAmount <= 0
    const invalidReturnAmountRows = selectedRows.filter(
      (row, index) => checkedRows[index] && row.returnAmount <= 0
    );

    if (invalidReturnAmountRows.length > 0) {
      toast.error(
        "Return amount must be greater than 0 for all selected items."
      );
      return;
    }

    const salesReturnData = {
      CustomerId: customer.id ?? null,
      CustomerName: customer.firstName ?? "",
      AddressLine1: address1 ?? "",
      AddressLine2: address2 ?? "",
      AddressLine3: address3 ?? "",
      SalespersonId: salesPerson.id ?? null,
      SalespersonCode: salesPerson.code ?? "",
      SalespersonName: salesPerson.name ?? "",
      SalesReturnDate: invoiceDate,
      DocumentNo: invoiceNo ?? "",
      InvoiceId: returnType === "invoice" ? selectedInvoice.id : 0,
      InvoiceNo:
        returnType === "invoice" ? selectedInvoice.documentNo : "NONINV-0001",
      ReturnAmount: returnAmount ? parseFloat(returnAmount) : 0,
      OutstandingAmount: returnType === "invoice" ? parseFloat(grossTotal) : 0,
      TotalInvoiceAmount:
        returnType === "invoice" ? selectedInvoice.grossTotal : 0,
      FiscalPeriodId: 202501,
      InvoiceType: returnType === "invoice" ? 1 : 2,
      PaymentType: paymentType,
      BankId: (paymentType === 2 || paymentType === 4) ? bankId : null,
      SalesReturnLineDetails: selectedRows.map((row) => ({
        DocumentNo: returnType === "invoice" ? invoiceNo : "NONINV-0001",
        Reason: remark,
        ProductId: row.productId,
        ProductCode: row.productCode,
        ProductName: row.productName,
        InvoiceQuantity: returnType === "invoice" ? row.qty : 0,
        ReturnQuantity: row.returnQuantity ?? 0,
        SoldUnitPrice:
        returnType === "invoice" ? row.soldUnitPrice : row.unitPrice,
        ReturnAmount: returnAmount ? parseFloat(returnAmount) : 0,
        FiscalPeriodId: 202501,
        StockbalanceId: row.stockBalanceId,
      })),
    };
    
    // return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/SalesReturn/CreateSalesReturn`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(salesReturnData),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Error Response:", errorResponse);
        toast.error(
          "Error: " +
            (errorResponse.message || "Please fill all required fields")
        );
        return;
      }

      const jsonResponse = await response.json();

      if (jsonResponse && jsonResponse.result) {
        toast.success("Sales Return Submitted Successfully!");
        setTimeout(() => {
          window.location.href = "/sales/sales-return";
        }, 100);
      } else if (jsonResponse && jsonResponse.message) {
        toast.success(jsonResponse.message);
        setTimeout(() => {
          window.location.href = "/sales/sales-return";
        }, 100);
      } else {
        toast.error("Unexpected response from the server");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while submitting the data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOutstandingAmount = async (customerId) => {
    if (!customerId) {
      toast.error("Customer ID is required.");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetCustomerWiseTotalOutstandingAmount?customerId=${customerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse && jsonResponse.result) {
          setOutstandingAmounts(jsonResponse.result || 0);
        } else {
          setOutstandingAmounts("");
        }
      } else {
        // toast.error("Failed to fetch outstanding amount.");
        setOutstandingAmounts("");
      }
    } catch (error) {
      console.error("Error fetching outstanding amount:", error);
      toast.error("Error fetching outstanding amount.");
      setOutstandingAmounts("");
    }
  };

  const fetchInvoicesForCustomer = async (customerId) => {
    if (!customerId) {
      toast.error("Customer ID is required.");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetAllCustomerwiseOustandingsByIsSettled?customerId=${customerId}&isSettled=false`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.result && jsonResponse.result.length > 0) {
          setInvoicesForCustomer(
            jsonResponse.result.map((item) => ({
              invoiceId: item.invoiceId,
              invoiceNumber: item.invoiceNumber,
              totalInvoiceAmount: item.totalInvoiceAmount,
            }))
          );
        }
      } else {
        // toast.error("Failed to fetch invoices.");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Error fetching invoices.");
    }
  };

  const handleAddItem = (item) => {
    // Check if the product already exists in the table
    const existingIndex = selectedRows.findIndex((row) => row.id === item.id);

    if (existingIndex !== -1) {
      // If product exists, update the row (e.g., reset return quantity, update balance)
      const updatedRows = [...selectedRows];
      updatedRows[existingIndex] = {
        ...updatedRows[existingIndex],
        balanceQty: item.qty, // Update balance/available quantity
        unitPrice: item.unitPrice, // Update price if needed

        returnQuantity: 0,
        returnAmount: 0,
        totalPrice: item.qty * item.unitPrice,
      };
      setSelectedRows(updatedRows);
    } else {
      // Add new product to the table
      const newRow = {
        id: item.id,
        productId: item.id,
        productCode: item.code,
        productName: item.name,
        balanceQty: item.qty, // Invoice quantity or stock quantity
        qty: item.qty,
        returnQuantity: 0,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.qty * (item.unitPrice || 0),
        returnAmount: 0,
        itemType: item.itemType || 1, // default item type
        costprice: 0,
        stockBalanceId: item.stockBalanceId,
        costPrice: item.costPrice|| 0,
        salingPrice:item.salingPrice || 0,
      };
      setSelectedRows([...selectedRows, newRow]);
      setCheckedRows({ ...checkedRows, [selectedRows.length]: false });
    }
  };


  const calculateReturnAmount = (index, returnQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    row.returnQuantity = returnQuantity;
    row.returnAmount = returnQuantity * row.unitPrice;
    row.totalPrice = row.qty * row.unitPrice;
    setSelectedRows(updatedRows);

    const newGrossTotal = updatedRows.reduce(
      (total, row) => total + (row.returnAmount || 0),
      0
    );
    setGrossTotal(newGrossTotal);
  };

  useEffect(() => {
    if (customerId) {
      fetchInvoicesForCustomer(customerId);
    } else {
      setInvoicesForCustomer([]);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId && invoiceFocused) {
      fetchInvoicesForCustomer(customerId);
    }
  }, [invoiceFocused, customerId]);

  const handleInvoiceFocus = () => {
    setInvoiceFocused(true);
  };

  const handleInvoiceBlur = () => {
    setInvoiceFocused(false);
  };

  const handleCheckboxChange = (index) => {
    setCheckedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    setReturnAmount(grossTotal);
  }, [grossTotal]);

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
  }, [invoiceNo, customerList]);

  useEffect(() => {
    if (bankList) {
      setBanks(bankList);
    }
  }, [bankList]);

  // Reset bank selection when payment type changes
  useEffect(() => {
    if (paymentType !== 2 && paymentType !== 4) {
      setBankId(null);
    }
  }, [paymentType]);


  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Sales Return</h1>
        <ul>
        
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid
              item
              xs={12}
              gap={2}
              display="flex"
              justifyContent="end"
              mb={1}
            >
              <Button variant="outlined" onClick={() => navigateToBack()}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                mt={0}
                mb={1}
              >
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Type
                </Typography>
                <TextField
                  select
                  sx={{ width: "60%" }}
                  size="small"
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="invoice">Invoice Return</option>
                  <option value="non-invoice">Non-Invoice Return</option>
                </TextField>
              </Grid>

              {/* Invoice Return: Customer + Invoice selection */}

              <>
                {/* Customer Selection */}
                <Grid
                  item
                  xs={12}
                  display="flex"
                  justifyContent="space-between"
                  mt={0}
                  mb={1}
                >
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                      width: "35%",
                    }}
                  >
                    Customer Name
                  </Typography>
                  <Autocomplete
                    sx={{ width: "60%" }}
                    options={customers}
                    getOptionLabel={(option) => option.firstName || ""}
                    value={customer}
                    onChange={(event, newValue) => {
                      setCustomer(newValue);
                      setCustomerId(newValue?.id || null);
                      setInvoice("");
                      setSelectedInvoice(null);
                      setInvoicesForCustomer([]);
                      if (newValue) fetchOutstandingAmount(newValue.id);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        placeholder="Customer Name"
                      />
                    )}
                  />
                </Grid>
              </>

              <Grid
                item
                xs={12}
                display="flex"
                flexDirection="column"
                mt={0}
                mb={1}
              >
                <Grid
                  item
                  xs={12}
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                      width: "35%",
                    }}
                  >
                    Address
                  </Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 1"
                    value={address1}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 2"
                    value={address2}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 3"
                    value={address3}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 4"
                    value={address4}
                    disabled
                  />
                </Grid>
              </Grid>

              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                mt={0}
                mb={1}
              >
                <Typography
                  component="label"
                  sx={{
                    fontWeight: "500",
                    p: 1,
                    fontSize: "14px",
                    display: "block",
                    width: "35%",
                  }}
                >
                  Remark
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={remark}
                  placeholder="Remark"
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Grid>

              {/* Invoice Return: Customer + Invoice selection */}
              {returnType === "invoice" && (
                <>
                  {/* Invoice Selection */}
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    justifyContent="space-between"
                    mt={0}
                    mb={1}
                  >
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        p: 1,
                        fontSize: "14px",
                        display: "block",
                        width: "35%",
                      }}
                    >
                      Invoice
                    </Typography>
                    <Autocomplete
                      sx={{ width: "60%" }}
                      options={filteredInvoices}
                      getOptionLabel={(option) => option.documentNo || ""}
                      isLoading={isLoading}
                      onInputChange={(event, newInputValue) =>
                        setSearchQuery(newInputValue)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          fullWidth
                          placeholder="Search Invoice"
                        />
                      )}
                      onChange={(event, newValue) => {
                        setSelectedInvoice(newValue);
                        if (newValue && newValue.documentNo)
                          fetchInvoiceDetails(newValue.documentNo);
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid container>
                <Grid
                  item
                  xs={12}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mt={0}
                  mb={1}
                >
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                      width: "35%",
                    }}
                  >
                    Salesperson
                  </Typography>
                  <Autocomplete
                    sx={{ width: "60%" }}
                    options={salesPersonList || []}
                    getOptionLabel={(option) => option.name || ""}
                    value={salesPerson}
                    onChange={(event, newValue) => {
                      setSalesPerson(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        placeholder="Salesperson"
                        error={salesPersonError}
                      />
                    )}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  display="flex"
                  justifyContent="space-between"
                  mt={0}
                  mb={1}
                >
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                      width: "35%",
                    }}
                  >
                    Sales Return Date
                  </Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    type="date"
                    fullWidth
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  display="flex"
                  justifyContent="space-between"
                  mt={0}
                  mb={1}
                >
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                      width: "35%",
                    }}
                  >
                    Return Amount
                  </Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    value={returnAmount}
                    placeholder="Return Amount"
                    onChange={(e) => setReturnAmount(e.target.value)}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mt={0}
                  mb={1}
                >
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                      width: "35%",
                    }}
                  >
                    Payment Type <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Select
                    value={paymentType || ""}
                    onChange={(e) => setPaymentType(e.target.value)}
                    sx={{ width: "60%" }}
                    size="small"
                    disabled={!customer}
                    error={!paymentType && customer ? true : false}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Payment Type
                    </MenuItem>
                    <MenuItem value={1}>Cash</MenuItem>
                    <MenuItem value={2}>Card</MenuItem>
                    <MenuItem value={4}>Bank Transfer</MenuItem>
                    <MenuItem value={7}>Credit</MenuItem>
                  </Select>
                </Grid>

                {(paymentType === 2 || paymentType === 4) && (
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mt={0}
                    mb={1}
                  >
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        p: 1,
                        fontSize: "14px",
                        display: "block",
                        width: "35%",
                      }}
                    >
                      Bank <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Select
                      value={bankId || ""}
                      onChange={(e) => setBankId(e.target.value)}
                      sx={{ width: "60%" }}
                      size="small"
                      error={!bankId ? true : false}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        Select Bank
                      </MenuItem>
                      {banks.length === 0 ? (
                        <MenuItem value="" disabled>
                          No Banks Available
                        </MenuItem>
                      ) : (
                        banks.map((bank) => (
                          <MenuItem key={bank.id} value={bank.id}>
                            {bank.name} - {bank.accountNo}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </Grid>
                )}

                {returnType === "invoice" && (
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mt={0}
                    mb={1}
                  >
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        p: 1,
                        fontSize: "14px",
                        display: "block",
                        width: "35%",
                      }}
                    >
                      Total Invoice Amount
                    </Typography>
                    <TextField
                      sx={{ width: "60%" }}
                      size="small"
                      fullWidth
                      value={selectedInvoice ? `${selectedInvoice.grossTotal}` : ""}
                      placeholder="Total Invoice Amount"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                  </Grid>
                )}

              </Grid>
            </Grid>

            {/* Non-Invoice Return: Product Search */}
            {returnType === "non-invoice" && (
              <>
                <Grid item xs={12} my={1}>
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: "500",
                      p: 1,
                      fontSize: "14px",
                      display: "block",
                    }}
                  >
                    Search Product
                  </Typography>
                </Grid>

                <Grid
                  item
                  xs={12}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mt={0}
                  mb={1}
                >
                  <SearchItemByName
                    label="Search"
                    placeholder="Search Items by name"
                    fetchUrl={`${BASE_URL}/Items/GetAllItemWithZeroQuantity`}
                    onSelect={(item) => {
                      handleAddItem(item);
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} mt={1}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell
                        sx={{ color: "#fff" }}
                        align="right"
                      ></TableCell>
                       <TableCell
                        sx={{ color: "#fff" }}
                        align="right"
                      ></TableCell>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Code
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name
                      </TableCell>
                      {returnType === "invoice" && (
                        <TableCell sx={{ color: "#fff" }}>
                          Invoice&nbsp;Quantity
                        </TableCell>
                      )}
                      <TableCell sx={{ color: "#fff" }}>
                        Return&nbsp;Quantity
                      </TableCell>
                      
                      <TableCell sx={{ color: "#fff" }}>
                        Selling Price
                      </TableCell>
                      {returnType === "invoice" && (
                        <TableCell sx={{ color: "#fff" }}>
                          Total&nbsp;Price
                        </TableCell>
                      )}
                      {/* {returnType === "non-invoice" && (
                        <TableCell sx={{ color: "#fff" }}>
                          unit&nbsp;cost&nbsp;price
                        </TableCell>
                      )} */}

                      {returnType === "non-invoice" && (
                        <TableCell sx={{ color: "#fff" }}>
                          Cost Price
                        </TableCell>
                      )}

                      <TableCell sx={{ color: "#fff" }}>
                        Return&nbsp;Amount
                      </TableCell>

                     

                      {/* {returnType === "invoice" && (
                        <TableCell sx={{ color: "#fff" }}>
                          Unit&nbsp;Price
                        </TableCell>
                      )} */}
                    </TableRow>
                  </TableHead>
                    <TableBody>
        {selectedRows.map((row, index) => (
          <TableRow key={row.id}>
            {/* 🔴 Delete button per row */}
            <TableCell sx={{ p: 1 }}>
              {(returnType|| checkedRows[index]) && (
               //  eslint-disable-next-line react/jsx-no-undef
                <Tooltip title="Delete" placement="top">
                  <IconButton
                    onClick={() => handleDeleteRow(index)}
                    aria-label="delete"
                    size="small"
                  >
                    <DeleteIcon color="error" fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <Checkbox
                            checked={checkedRows[index] || false}
                            onChange={() => handleCheckboxChange(index)}
                            aria-label="select row"
                            disabled={row.itemType != 1}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }}>{row.productCode}</TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="text"
                            sx={{ width: "150px" }}
                            fullWidth
                            value={row.productName}
                            disabled
                          />
                        </TableCell>
                        {returnType === "invoice" && (
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              sx={{ width: "150px" }}
                              size="small"
                              type="text"
                              fullWidth
                              name=""
                              value={row.balanceQty}
                              disabled
                            />
                          </TableCell>
                        )}

                       <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "150px" }}
                            size="small"
                            type="number"
                            fullWidth
                            value={row.returnQuantity}
                            disabled={!checkedRows[index]}
                            onChange={(e) => {
                              const returnQuantity = parseFloat(e.target.value) || 0;

                              // 🔹 Validation only for invoice
                              if (returnType === "invoice" && returnQuantity > row.balanceQty) {
                                toast.error("Return quantity cannot be greater than invoice quantity.");
                                return;
                              }

                              // 🔹 Update row data
                              const updatedRows = [...selectedRows];
                              updatedRows[index].returnQuantity = returnQuantity;

                              // 🔹 If invoice → use unitPrice, else use salingPrice
                              updatedRows[index].returnAmount =
                                returnQuantity *
                                (returnType === "invoice"
                                  ? updatedRows[index].unitPrice
                                  : updatedRows[index].salingPrice);

                              setSelectedRows(updatedRows);

                              // 🔹 Update gross total
                              const newGrossTotal = updatedRows.reduce(
                                (total, row) => total + (row.returnAmount || 0),
                                0
                              );
                              setGrossTotal(newGrossTotal);
                            }}
                            inputProps={{
                              max: returnType === "invoice" ? row.qty : undefined, // Limit only for invoice
                            }}
                          />
                        </TableCell>
                       

                       {returnType === "non-invoice" && (
  <TableCell sx={{ p: 1 }}>
    <TextField
      sx={{ width: "150px" }}
      size="small"
      type="number"
      fullWidth
      value={row.salingPrice}
      onChange={(e) => {
        const newPrice = parseFloat(e.target.value) || 0;

        const updatedRows = [...selectedRows];
        updatedRows[index].salingPrice = newPrice;

        // Recalculate returnAmount if returnQuantity exists
        const returnQty = updatedRows[index].returnQuantity || 0;
        updatedRows[index].returnAmount = returnQty * newPrice;

        setSelectedRows(updatedRows);

        // Update gross total
        const newGrossTotal = updatedRows.reduce(
          (total, row) => total + (row.returnAmount || 0),
          0
        );
        setGrossTotal(newGrossTotal);
      }}
    />
  </TableCell>
)}

{/* // <TableCell sx={{ p: 1 }}>{row.salingPrice}</TableCell> */}
 <TableCell sx={{ p: 1 }}>{row.costPrice}</TableCell>
                        

                   

                        {returnType === "invoice" && (
                          <TableCell align="right" sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              name="totalPrice"
                              sx={{ width: "150px" }}
                              value={(row.qty * row.unitPrice).toFixed(2)}
                              disabled
                            />
                          </TableCell>
                        )}

                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            name=""
                            sx={{ width: "150px" }}
                            value={row.returnAmount}
                            disabled
                          />
                        </TableCell>

                        {/* <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            name=""
                            sx={{ width: "150px" }}
                            value={row.free}
                            disabled
                          />
                        </TableCell> */}
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell align="right" colSpan="8">
                        <Typography fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {grossTotal}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid
              item
              xs={12}
              my={2}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default Salesreturn;
