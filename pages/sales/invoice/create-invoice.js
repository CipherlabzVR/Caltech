import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { v4 as uuidv4 } from 'uuid';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  Modal,
  Paper,
  Radio,
  Select,
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
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchItemByName from "@/components/utils/SearchItemByName";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import AddOutletItem from "./add-outlet";
import AddCustomColorItem from "./add-custom-color";
import useShiftCheck from "@/components/utils/useShiftCheck";
import SearchPackageByName from "@/components/utils/SearchPackageByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import AddCustomerDialog from "@/components/UIElements/Modal/AddCustomerDialog";
import GetAllSalesPersons from "@/components/utils/GetAllSalesPerson";

const InvoiceCreate = () => {
  const today = new Date();
  const [customers, setCustomers] = useState([]);
  const [isOutlet, setIsOutlet] = useState(false);
  const [isItemSearch, setIsItemSearch] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [stock, setStock] = useState([]);
  const [total, setTotal] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(formatDate(today));
  const [invNo, setInvNo] = useState("");
  const [selectedItem, setSelectedItem] = useState();
  const [remark, setRemark] = useState("");
  const [regNo, setRegNo] = useState("");
  const [productId, setProductId] = useState();
  const [stockBalance, setStockBalance] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [grossTotal, setGrossTotal] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [salesPerson, setSalesPerson] = useState(null);
  const [isDisable, setIsDisable] = useState(false);
  const [rows, setRows] = useState([]);
  const [rowsCC, setRowsCC] = useState([]);
  const [paymentType, setPaymentType] = useState(null);
  const guidRef = useRef(uuidv4());
  const { result: shiftResult, message: shiftMessage } = useShiftCheck(); 
  const { data: POSInvoiceReportName } = GetReportSettingValueByName("POSInvoice");
  const name = localStorage.getItem("name");
  const warehouseId = localStorage.getItem("warehouse"); 
  const { data: IsCostPriceVisible } = IsAppSettingEnabled(
    "IsCostPriceVisible"
  );
  // --- OLD APP SETTING REMOVED ---
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled(
    "IsExpireDateAvailable"
  );
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled(
    "IsBatchNumberAvailable"
  );
  const { data: IsOutletAvailable } = IsAppSettingEnabled(
    "IsOutletAvailable"
  );
  const { data: IsCustomColorMachineAvailable } = IsAppSettingEnabled(
    "IsCustomColorMachineAvailable"
  );
  const { data: AllowCostLessThanSelling } = IsAppSettingEnabled(
    "AllowCostLessThanSelling"
  );

  const { data: isBookingSystem } = IsAppSettingEnabled(
    "IsBookingSystem"
  );

  const { data: isDoctorInvolved } = IsAppSettingEnabled(
    "IsDoctorInvolved"
  );

  const { data: isAllowProfitMessageDisplay } = IsAppSettingEnabled(
    "IsAllowProfitMessageDisplay"
  );

  // --- NEW APP SETTING ---
  const { data: paymentTypeEnableforCustomersIninvoiceView } = IsAppSettingEnabled(
    "paymentTypeEnableforCustomersIninvoiceView"
  );

  const {
    data: customerList,
    loading: customerLoading,
    error: customerError,
  } = useApi("/Customer/GetAllCustomer");

  const { data: doctorsList } = useApi("/Doctors/GetAll");

  // Function to refetch customers after creating a new one
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
      console.error("Error fetching customers:", error);
      toast.error("Failed to refresh customer list");
    }
  };


  const fetchStockList = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=1&productId=${id}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setStockBalance(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const { data: salesPersonList } = GetAllSalesPersons();
  
  // Debug: Log salesperson data
  useEffect(() => {
    console.log("SalesPerson List:", salesPersonList);
  }, [salesPersonList]);


  const searchRef = useRef(null);
  const qtyRefs = useRef([]);

  const handleQtyRef = (el, index) => {
    qtyRefs.current[index] = el;
  };

  useEffect(() => {
    if (customer) {
      if (customer.firstName && customer.firstName.trim().toLowerCase() === "cash") {
        setPaymentType(null);
      } else {
        setPaymentType(7);
      }
    } else {
      setPaymentType(null);
    }
  }, [customer]);

  useEffect(() => {
    const sum = (arr, key) =>
      arr.reduce((total, row) => total + (Number(row[key]) || 0), 0);

    const gross = sum(selectedRows, 'totalPrice');
    const gross1 = sum(rows, 'sellingPrice');
    const gross2 = sum(rowsCC, 'totalAmount');

    const calc = gross + gross1 + gross2;
    setGrossTotal(calc.toFixed(2));
  }, [selectedRows, rows, rowsCC]);


  const navigateToBack = () => {
    router.push({
      pathname: "/sales/invoice",
    });
  };

  const handleSelect = (item, index) => {
    setSelectedItem(item);
    setSelectedIndex(index);
  };


  const handleAddCustomColor = () => {
    setRowsCC((prev) => [
      ...prev,
      {
        machine: null,
        code: "",
        name: "",
        qty: "",
        costPrice: "",
        sellingPrice: "",
        total: "0.00",
      },
    ]);
  };
  const handleChangeCC = (updatedRows) => {
    setRowsCC(updatedRows);
  };

  const handleDeleteCC = (index) => {
    const newRows = [...rowsCC];
    newRows.splice(index, 1);
    setRowsCC(newRows);
  };

  const handleAddOutlet = (item) => {
    if (!item) {
      item = stock[0];
    }

    const baseCostPrice = parseFloat(item.costPrice || 0);
    const uomValue = parseFloat(item.uomValue || 0);
    const updatedCostPrice = (parseFloat(baseCostPrice) / uomValue);
    const newItem = {
      ...item,
      costPrice: updatedCostPrice.toFixed(2),
      prevCost: parseFloat(item.costPrice || 0),
    };

    setRows(prevRows => [...prevRows, newItem]);
    setOpen(false);
    setSelectedItem();
  };


  const handleChangeOutlet = (updatedRows) => {
    setRows(updatedRows);
  };
  const handleDeleteOutlet = (index) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleItemStock = async (item) => {
    if (!customer) {
      toast.error("Customer information is missing!");
      return;
    }
    try {
      const query = `${BASE_URL}/Items/GetAllItemsByNameWithStockDetails?itemId=${item.id}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setStock(data.result);
      setOpen(true);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }

    // --- UPDATED THIS LINE ---
    if (paymentTypeEnableforCustomersIninvoiceView && !paymentType) {
      toast.warning("Please Select Payment Type");
      return;
    }

    if (rowsCC.length > 0 && rowsCC.some(row => row.machine === null)) {
      toast.info('Please select machine');
      return;
    }

    const outletRows = rows.map((row, i) => ({
      DocumentNo: invNo,
      ProductId: row.productId,
      ProductName: row.name,
      ProductCode: row.productCode,
      WarehouseId: row.warehouseId,
      WarehouseCode: "WH001",
      WarehouseName: "Main Warehouse",
      UnitPrice: row.sellingPrice,
      CostPrice: row.costPrice,
      Qty: parseFloat(row.value),
      DiscountAmount: 0.0,
      DiscountPercentage: 0.0,
      LineTotal: row.sellingPrice,
      SequanceNo: i + 1,
      StockBalanceId: row.id,
      Machine: null,
      ItemType: 2,
    }));

    const CCRows = rowsCC.map((row, i) => ({
      DocumentNo: invNo,
      ProductId: row.id,
      ProductName: "custom color",
      ProductCode: row.code,
      WarehouseId: row.warehouse,
      WarehouseCode: "WH001",
      WarehouseName: "Main Warehouse",
      UnitPrice: row.sellingPrice,
      CostPrice: row.costPrice,
      Qty: parseFloat(row.value),
      DiscountAmount: 0.0,
      DiscountPercentage: 0.0,
      LineTotal: row.sellingPrice,
      SequanceNo: i + 1,
      StockBalanceId: 0,
      Machine: row.machine,
      ItemType: 3,
    }));

    if (!customer || invoiceDate === "") {
      if (!customer) toast.error("Please Select Customer.");
      if (!invoiceDate) toast.error("Please Select Invoice Date.");
      return;
    }


    const invalidOutlet = outletRows.some(r => !r.Qty || r.Qty <= 0);
    const invalidCCQty = rowsCC.some(r => !r.value || r.value <= 0);
    const invalidCCCost = rowsCC.some(r => !r.costPrice || r.costPrice <= 0);
    const invalidCCSell = rowsCC.some(r => !r.sellingPrice || r.sellingPrice <= 0);
    const invalidCCCode = rowsCC.some(r => !r.code || r.code <= 0);

    if (invalidOutlet) return toast.error("Please Add Value for All Outlet Lines.");
    if (invalidCCCode) return toast.error("Please Add Code for All Custom Color Items.");
    if (invalidCCQty) return toast.error("Please Add Qty for All Custom Color Items.");
    if (invalidCCCost) return toast.error("Please Add Cost Price for All Custom Color Items.");
    if (invalidCCSell) return toast.error("Please Add Selling Price for All Custom Color Items.");

    const invoiceLines = [
      ...selectedRows.map((row, i) => ({
        DocumentNo: invNo,
        ProductId: isBookingSystem ? row.id : row.productId,
        ProductName: isBookingSystem ? row.packageName : row.productName,
        ProductCode: isBookingSystem ? row.documentNo : row.productCode,
        WarehouseId: 1,
        WarehouseCode: "WH001",
        WarehouseName: "Main Warehouse",
        UnitPrice: isBookingSystem ? row.rate : row.sellingPrice,
        CostPrice: isBookingSystem ? row.rate : row.costPrice,
        Qty: row.quantity,
        DiscountAmount: 0.0,
        DiscountPercentage: 0.0,
        LineTotal: row.totalPrice,
        SequanceNo: i + 1,
        StockBalanceId: row.id,
        Machine: null,
        ItemType: 1,
      })),
      ...outletRows,
      ...CCRows,
    ];

    if (invoiceLines.length === 0) {
      return toast.error("At least one item must be added to the table.");
    }

    const underCostMessages = invoiceLines
      .map((line) => {
        if (parseFloat(line.UnitPrice) <= parseFloat(line.CostPrice)) {
          return `Please enter selling price greater than cost price for product "${line.ProductName}".`;
        }
        return null;
      })
      .filter(msg => msg !== null);

    if (underCostMessages.length > 0 && !AllowCostLessThanSelling) {
      toast.warning(
        <div>
          {underCostMessages.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      );
      return;
    }

    const data = {
      CustomerID: customer.id,
      CustomerCode: "CUST001",
      CustomerName: customer.firstName || "N/A",
      DocumentNo: invNo || "",
      DocumentDate: invoiceDate,
      Remark: remark,
      BillToline1: address1,
      BillToline2: address2,
      BillToline3: address3,
      BillToline4: address4,
      WarehouseId: 1,
      WarehouseCode: "WH001",
      WarehouseName: "Main Warehouse",
      Discountamount: 0.0,
      DiscountPercentage: 0.0,
      IsPaid: false,
      GrossTotal: parseFloat(grossTotal),
      NetTotal: parseFloat(grossTotal),
      SalesPerson: salesPerson?.name || "",
      FormSubmitId: guidRef.current,
      RegNo: regNo || "",
      DoctorId: selectedDoctor ? selectedDoctor.id : null,
      DoctorName: selectedDoctor ? selectedDoctor.firstName + " " + selectedDoctor.lastName : "",
      InvoiceLineDetails: invoiceLines,
      PaymentType: paymentType
    };

    const invalidItem = invoiceLines.some(r => !r.Qty || r.Qty <= 0);
    if (invalidItem) {
      toast.error("Please Add Qty for All Items");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/SalesInvoice/CreateSalesInvoice`, {
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
        //router.push("/sales/invoice/");
        updateInvNo();
        setSelectedRows([]);
        setCustomer(null);
        setAddress1("");
        setAddress2("");
        setAddress3("");
        setRemark("");
        setSalesPerson(null);
        setRows([]);
        setRowsCC([]);

        var printURL = `${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${invNo}&reportName=${POSInvoiceReportName}&warehouseId=${warehouseId}&currentUser=${name}`;

        window.open(printURL, '_blank');

      } else {
        toast.error(json.result.message || "Please fill all required fields");
      }
    } catch (err) {
      //console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCheckStockBalance = (item) => {
    if (!customer) {
      toast.error("Customer information is missing!");
      return;
    }
    setOpen(true);
    setProductId(item.id);
    fetchStockList(item.id);
    setProductName(item.name);
    setProductCode(item.code);
    setSelectedIndex(0);
  };

  const handleAddRow = (item) => {
    const x = parseFloat(item.costPrice) / 2;
    const y = parseFloat(item.sellingPrice) - parseFloat(item.costPrice);

    if ((y > x) && isAllowProfitMessageDisplay) {
      toast.info("Profit exceeds 50% of the cost price.");
    }

    item = stockBalance[selectedIndex];

    const existingItem = selectedRows.find((row) => row.id === item.id);
    if (existingItem) {
      toast.error("This item already exists in the table. Cannot add duplicate items.");
      return;
    }

    const newRow = {
      ...item,
      quantity: "",
      totalPrice: item.sellingPrice || 0,
      rate: item.sellingPrice || 0,
      stockBalanceId: item.id,
      batchNumber: item.batchNumber || "",
      productName: item.productName || "",
      packageName: item.productName || "",
    };

    setSelectedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      setTimeout(() => {
        qtyRefs.current[updatedRows.length - 1]?.focus();
      }, 0);
      return updatedRows;
    });

    setTotal((prevTotal) => prevTotal + newRow.totalPrice);
    setOpen(false);
  };

  const handleAddPackage = (item) => {
    // Check if item with same id already exists
    const existingItem = selectedRows.find((row) => row.id === item.id);
    if (existingItem) {
      toast.error("This item already exists in the table. Cannot add duplicate items.");
      return;
    }

    const newRow = {
      ...item,
      quantity: 1,
      totalPrice: item.rate
    };

    setSelectedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      setTimeout(() => {
        qtyRefs.current[updatedRows.length - 1]?.focus();
      }, 0);
      return updatedRows;
    });
    setTotal((prevTotal) => prevTotal + newRow.totalPrice);
    setOpen(false);
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    const oldTotalPrice = row.totalPrice;

    row.quantity = newQuantity;
    row.totalPrice = isBookingSystem ? parseFloat(row.rate) * newQuantity : parseFloat(row.sellingPrice) * newQuantity;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);
  };


  const handleSellingPriceChange = (index, newPrice) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];

    const x = parseFloat(row.costPrice) / 2;
    const y = parseFloat(newPrice) - parseFloat(row.costPrice);

    if ((y > x) && isAllowProfitMessageDisplay) {
      toast.info("Profit exceeds 50% of the cost price.");
    }
    const oldTotalPrice = row.totalPrice;
    if (isBookingSystem) {
      row.rate = newPrice;
    } else {
      row.sellingPrice = newPrice;
    }

    row.totalPrice = parseFloat(row.quantity) * newPrice;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - row.rowTotal);
  };


  const updateInvNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=5`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setInvNo(result.result);
    } catch (err) {
      console.error('Error fetching next document number:', err);
    }
  };

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
    if (doctorsList) {
      setDoctors(doctorsList);
    }
    updateInvNo();
    if (stockBalance) {
      setStock(stockBalance);
      setSelectedItem(stockBalance[0]);
    }
  }, [stockBalance, customerList, doctorsList]);

  const isCashCustomer = customer && customer.firstName && customer.firstName.trim().toLowerCase() === "cash";
  const isCreditCustomer = customer && customer.firstName && customer.firstName.trim().toLowerCase() !== "cash";

  // --- THIS SECTION IS UPDATED ---
  const paymentOptions = !customer
    ? [] // No customer, no options
    : isCashCustomer
      ? [ // Is a cash customer
        { value: 1, label: "Cash" },
        { value: 2, label: "Card" },
        { value: 4, label: "Bank Transfer" },
      ]
      : paymentTypeEnableforCustomersIninvoiceView // Is NOT a cash customer, so check the app setting
        ? [ // App setting is ON: show all options
          { value: 1, label: "Cash" },
          { value: 2, label: "Card" },
          { value: 4, label: "Bank Transfer" },
          { value: 7, label: "Credit" },
        ]
        : [ // App setting is OFF: show only credit
          { value: 7, label: "Credit" },
        ];
  // --- END OF UPDATED SECTION ---

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Invoice Create</h1>
        <ul>
          <li>
            <Link href="/sales/invoice">Invoice</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Invoice No: {invNo}
                </Typography>
              </Button>
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
                mt={1}
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
                      <TextField
                        {...params}
                        size="small"
                        fullWidth
                        placeholder="Search Customer"
                      />
                    )}
                  />
                  <AddCustomerDialog fetchItems={fetchCustomers} showIconOnly={true} />
                </Box>
              </Grid>
              <Grid item xs={12} display="flex" flexDirection="column" mt={1}>
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
                    Bill to
                  </Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 1"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 2"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 3"
                    value={address3}
                    onChange={(e) => setAddress3(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="end" mt={1}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 4"
                    value={address4}
                    onChange={(e) => setAddress4(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid container>
                <Grid
                  item
                  xs={12}
                  display="flex"
                  justifyContent="space-between"
                  mt={1}
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
                    Date
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
                  mt={1}
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
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </Grid>

                {isBookingSystem ? "" :
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mt={0.5}
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
                      getOptionLabel={(option) => option?.name || option?.Name || ""}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      value={salesPerson}
                      onChange={(event, newValue) => {
                        setSalesPerson(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          fullWidth
                          placeholder="Select Salesperson"
                        />
                      )}
                    />
                  </Grid>
                }

                {paymentTypeEnableforCustomersIninvoiceView ?
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mt={0.5}
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
                      Payment Type
                    </Typography>
                    <Select
                      value={paymentType || ""}
                      onChange={(e) => setPaymentType(e.target.value)}
                      sx={{ width: "60%" }}
                      size="small"
                      // --- UPDATED THIS LINE ---
                      disabled={!customer || (isCreditCustomer && !paymentTypeEnableforCustomersIninvoiceView)}
                    >
                      {paymentOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid> : ""
                }

                {isDoctorInvolved && (
                  <>
                    <Grid
                      item
                      xs={12}
                      display="flex"
                      justifyContent="space-between"
                      mt={1}
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
                        Doctor
                      </Typography>
                      <Autocomplete
                        sx={{ width: "60%" }}
                        options={doctors || []}
                        getOptionLabel={(option) => option.firstName + " " + option.lastName || ""}
                        value={selectedDoctor}
                        onChange={(event, newValue) => {
                          setSelectedDoctor(newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            fullWidth
                            placeholder="Search Doctor"
                          />
                        )}
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                      display="flex"
                      justifyContent="space-between"
                      mt={1}
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
                        Patient Reg. No.
                      </Typography>
                      <TextField
                        sx={{ width: "60%" }}
                        size="small"
                        fullWidth
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>

            <Grid item xs={12} mt={3}>
              <Grid item xs={12} gap={1} mt={3} mb={1} display="flex">
                {isBookingSystem ?
                  (!isItemSearch ?
                    <SearchPackageByName
                      ref={searchRef}
                      label="Search"
                      placeholder="Search Items by name"
                      fetchUrl={`${BASE_URL}/Package/GetPackagesByname`}
                      onSelect={(item) => {
                        handleAddPackage(item);
                        setTimeout(() => {
                          const newIndex = selectedRows.length;
                          qtyRefs.current[newIndex]?.focus();
                        }, 100);
                      }}
                    /> :
                    <SearchItemByName
                      ref={searchRef}
                      label="Search"
                      placeholder="Search Items by name"
                      fetchUrl={`${BASE_URL}/Items/GetAllItemsWithoutZeroQty`}
                      onSelect={(item) => {
                        isOutlet ? handleItemStock(item) : handleCheckStockBalance(item);
                        setTimeout(() => {
                          const newIndex = selectedRows.length;
                          qtyRefs.current[newIndex]?.focus();
                        }, 100);
                      }}
                    />
                  ) : <SearchItemByName
                    ref={searchRef}
                    label="Search"
                    placeholder="Search Items by name"
                    fetchUrl={isOutlet ? `${BASE_URL}/Outlet/GetAllOutletByProductName` : `${BASE_URL}/Items/GetAllItemsWithoutZeroQty`}
                    onSelect={(item) => {
                      isOutlet ? handleItemStock(item) : handleCheckStockBalance(item);
                      setTimeout(() => {
                        const newIndex = selectedRows.length;
                        qtyRefs.current[newIndex]?.focus();
                      }, 100);
                    }}
                  />}
                {isBookingSystem && (
                  <Button variant={isItemSearch ? "contained" : "outlined"} size="small" color={isItemSearch ? "warning" : "secondary"} onClick={() => { setIsItemSearch(prev => !prev); setStock([]); setSelectedItem(); }}>
                    Items
                  </Button>
                )}
                {IsOutletAvailable && (
                  <Button variant={isOutlet ? "contained" : "outlined"} size="small" color={isOutlet ? "warning" : "secondary"} onClick={() => { setIsOutlet(prev => !prev); setStock([]); setSelectedItem(); }}>
                    Outlet
                  </Button>
                )}
                {IsCustomColorMachineAvailable && (
                  <Button variant="contained" size="small" color="success" onClick={handleAddCustomColor}>
                    Custom
                  </Button>
                )}

              </Grid>
            </Grid>
            <Grid item xs={12}>
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
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product Name
                      </TableCell>
                      {IsBatchNumberAvailable && (
                        <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      )}
                      {IsExpireDateAvailable && (
                        <TableCell sx={{ color: "#fff" }}>Exp Date</TableCell>
                      )}
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      {IsCostPriceVisible && (<TableCell sx={{ color: "#fff" }}>
                        Cost Price
                      </TableCell>)}
                      <TableCell sx={{ color: "#fff" }}>
                        Selling Price
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>
                        Total Price
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <Tooltip title="Delete" placement="top">
                            <IconButton
                              onClick={() => handleDeleteRow(index)}
                              aria-label="delete"
                              size="small"
                            >
                              <DeleteIcon color="error" fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {isBookingSystem ? row.packageName : row.productName}
                        </TableCell>
                        {IsBatchNumberAvailable && (
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              type="text"
                              sx={{ width: "150px" }}
                              fullWidth
                              value={row.batchNumber}
                              disabled
                            />
                          </TableCell>
                        )}
                        {IsExpireDateAvailable && (
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              sx={{ width: "150px" }}
                              size="small"
                              type="date"
                              fullWidth
                              name=""
                              value={formatDate(row.expiryDate)}
                              disabled
                            />
                          </TableCell>
                        )}

                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            inputRef={(el) => handleQtyRef(el, index)}
                            sx={{ width: "100px" }}
                            type="number"
                            size="small"
                            value={row.quantity}
                            inputProps={{
                              min: 1,
                              max: row.bookBalanceQuantity,
                            }}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === "") {
                                handleQuantityChange(index, "");
                                return;
                              }

                              let newValue = Number(inputValue);

                              if (newValue > row.bookBalanceQuantity) {
                                newValue = row.bookBalanceQuantity;
                              }

                              if (newValue <= 0) {
                                newValue = 1;
                              }

                              handleQuantityChange(index, newValue);
                            }}
                            onBlur={(e) => {
                              const value = Number(e.target.value);
                              if (!value || value <= 0) {
                                handleQuantityChange(index, null);
                              }
                            }}
                          />


                        </TableCell>
                        {IsCostPriceVisible && (<TableCell>
                          {formatCurrency(row.costPrice)}
                        </TableCell>)}
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "100px" }}
                            type="number"
                            size="small"
                            value={isBookingSystem ? row.rate : row.sellingPrice}
                            onChange={(e) => handleSellingPriceChange(index, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && index === selectedRows.length - 1) {
                                setTimeout(() => {
                                  searchRef.current?.focus();
                                }, 0);
                              }
                            }}
                            inputProps={{
                              min: row.costPrice,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {(Number(row.totalPrice) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell align="right" colSpan={
                        5 +
                        (IsBatchNumberAvailable ? 1 : 0) +
                        (IsExpireDateAvailable ? 1 : 0)
                      }>
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
            <Grid item xs={12} my={1}>
              <AddOutletItem rows={rows} onChange={handleChangeOutlet} onDelete={handleDeleteOutlet} />
            </Grid>
            <Grid item xs={12} my={1}>
              <AddCustomColorItem rows={rowsCC} onChange={handleChangeCC} onDelete={handleDeleteCC} />
            </Grid>
            <Grid item xs={12} my={3}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            {isOutlet && stock.length > 0 ?
              <>
                <Typography sx={{ fontWeight: "bold", my: 2, fontSize: "1.2rem" }}>
                  {stock[0].name}
                </Typography>
                <Typography sx={{ fontWeight: "500", my: 1, fontSize: "1rem" }}>
                  Cat. - {stock[0].category} / Sb. Cat. - {stock[0].subCategory}
                </Typography>
                <Typography sx={{ fontWeight: "500", my: 1, mb: 2, fontSize: "1rem" }}>
                  UOM - {stock[0].uom} / UOM Val. {stock[0].uomValue}
                </Typography>
              </> :
              <Typography sx={{ fontWeight: "bold", my: 2, fontSize: "1.2rem" }}>
                {productName} - {productCode}
              </Typography>
            }
            <TableContainer component={Paper} sx={{ height: '50vh', overflowY: 'scroll' }}>
              <Table
                size="small"
                aria-label="simple table"
                className="dark-table"
              >
                <TableHead>
                  <TableRow>
                    {IsBatchNumberAvailable && (
                      <TableCell>Batch No</TableCell>
                    )}
                    {IsExpireDateAvailable && (
                      <TableCell>EXP Date</TableCell>
                    )}
                    <TableCell>{isOutlet ? "Available Value" : "Stock Balance"}</TableCell>

                    {IsCostPriceVisible && (
                      <TableCell>Cost Price</TableCell>
                    )}

                    <TableCell>Selling Price</TableCell>
                    {isOutlet ? "" :
                      <>
                        <TableCell>Category</TableCell>
                        <TableCell>Sub Category</TableCell>
                        <TableCell>UOM</TableCell>
                      </>}

                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography color="error">No stock available</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stock
                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                      .map((item, index) => (
                        <TableRow key={item.id}>
                          {IsBatchNumberAvailable && (
                            <TableCell>{item.batchNumber}</TableCell>
                          )}
                          {IsExpireDateAvailable && (
                            <TableCell>{formatDate(item.expiryDate)}</TableCell>
                          )}
                          {isOutlet ? (
                            <TableCell>{item.currentQuantityValue}</TableCell>
                          ) : (
                            <TableCell>{item.bookBalanceQuantity}</TableCell>
                          )}
                          {IsCostPriceVisible && (
                            <TableCell>Rs. {formatCurrency(item.costPrice)}</TableCell>
                          )}

                          <TableCell>Rs. {formatCurrency(item.sellingPrice)}</TableCell>
                          {isOutlet ? "" :
                            <>
                              <TableCell>{item.categoryName}</TableCell>
                              <TableCell>{item.subCategoryName}</TableCell>
                              <TableCell>{item.uom}</TableCell>
                            </>}
                          <TableCell>
                            <Radio
                              name="stockSelection"
                              onChange={() => handleSelect(item, index)}
                              value={item.id}
                              checked={selectedIndex === index}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box display="flex" mt={3} justifyContent="space-between">
            <Button variant="outlined" onClick={handleClose}>
              <Typography sx={{ fontWeight: "bold" }}>Cancel</Typography>
            </Button>
            <Button
              variant="contained"
              disabled={stock.length === 0}
              onClick={() => isOutlet ? handleAddOutlet(selectedItem) : handleAddRow(selectedItem)}
            >
              <Typography sx={{ fontWeight: "bold" }}>Add</Typography>
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default InvoiceCreate;

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 800, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};