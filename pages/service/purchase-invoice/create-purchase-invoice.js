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
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Chip,
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
import AddOutletItem from "../../sales/invoice/add-outlet";
import AddCustomColorItem from "../../sales/invoice/add-custom-color";
import useShiftCheck from "@/components/utils/useShiftCheck";
import SearchPackageByName from "@/components/utils/SearchPackageByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import AddCustomerDialog from "@/components/UIElements/Modal/AddCustomerDialog";
import GetAllSalesPersons from "@/components/utils/GetAllSalesPerson";

const createDefaultLineDetails = (todayStr) => ({
  deviceType: "",
  deviceBrand: "",
  deviceModel: "",
  deviceSerial: "",
  warrantyType: "Manufacturer",
  warrantyStart: todayStr,
  warrantyMonths: "12",
  warrantyExpiry: "",
  warrantyTerms: "",
  selectedWarrantyType: null,
});

const calcWarrantyExpiry = (startDate, months) => {
  if (!startDate || !months) return "";
  const parsedMonths = parseInt(months, 10);
  if (Number.isNaN(parsedMonths)) return "";
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";
  start.setMonth(start.getMonth() + parsedMonths);
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildLineExtrasPayload = (details) => {
  const d = details || createDefaultLineDetails(formatDate(new Date()));
  return {
    Device: {
      DeviceType: d.deviceType || null,
      Brand: d.deviceBrand || null,
      Model: d.deviceModel || null,
      SerialNumber: d.deviceSerial || null,
    },
    Warranty: {
      WarrantyTypeId: d.selectedWarrantyType?.id ?? null,
      WarrantyTypeCode: d.selectedWarrantyType?.code ?? null,
      WarrantyType: d.warrantyType,
      StartDate: d.warrantyStart || null,
      PeriodMonths: d.warrantyMonths ? parseInt(d.warrantyMonths, 10) : null,
      ExpiryDate: d.warrantyExpiry || null,
      Terms: d.warrantyTerms || null,
    },
  };
};

const PurchaseInvoiceCreate = () => {
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
  const [finalDiscountPercent, setFinalDiscountPercent] = useState(0);
  const [finalDiscountAmount, setFinalDiscountAmount] = useState(0);
  const [netTotal, setNetTotal] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [salesPerson, setSalesPerson] = useState(null);
  const [isDisable, setIsDisable] = useState(false);
  const [rows, setRows] = useState([]);
  const [rowsCC, setRowsCC] = useState([]);
  const [paymentType, setPaymentType] = useState(null);
  const [salesOrderModalOpen, setSalesOrderModalOpen] = useState(false);
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [salesOrderList, setSalesOrderList] = useState([]);
  const [loadingSalesOrders, setLoadingSalesOrders] = useState(false);
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [lineDetailsMap, setLineDetailsMap] = useState({});
  const [activeLineKey, setActiveLineKey] = useState(null);
  const [warrantyTypeList, setWarrantyTypeList] = useState([]);
  const [deviceTypeList, setDeviceTypeList] = useState([]);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyOnCreate, setNotifyOnCreate] = useState(true);
  const [notifyTemplate, setNotifyTemplate] = useState(
    "Dear customer, your purchase document {{docNo}} has been created."
  );
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

  const { data: isCustomerCreditLimit } = IsAppSettingEnabled(
    "IsCustomerCreditLimit"
  );

  const initLineDetails = (lineKey) => {
    if (!lineKey) return;
    setLineDetailsMap((prev) => {
      if (prev[lineKey]) return prev;
      return {
        ...prev,
        [lineKey]: createDefaultLineDetails(formatDate(today)),
      };
    });
  };

  const updateLineDetails = (lineKey, patch) => {
    if (!lineKey) return;
    setLineDetailsMap((prev) => ({
      ...prev,
      [lineKey]: {
        ...(prev[lineKey] || createDefaultLineDetails(formatDate(today))),
        ...patch,
      },
    }));
  };

  const removeLineDetails = (lineKey) => {
    if (!lineKey) return;
    setLineDetailsMap((prev) => {
      const next = { ...prev };
      delete next[lineKey];
      return next;
    });
  };

  const ensureRowLineKey = (row, prefix) => {
    if (row?.lineKey) return row.lineKey;
    return `${prefix}-${row?.id ?? "row"}-${Date.now()}`;
  };

  const activeDetails = activeLineKey ? lineDetailsMap[activeLineKey] : null;
  const activeRowLabel = (() => {
    const mainRow = selectedRows.find((row) => row.lineKey === activeLineKey);
    if (mainRow) {
      return isBookingSystem ? mainRow.packageName : mainRow.productName;
    }
    const outletRow = rows.find((row) => row.lineKey === activeLineKey);
    if (outletRow) return outletRow.name || outletRow.productName || "Outlet item";
    const ccRow = rowsCC.find((row) => row.lineKey === activeLineKey);
    if (ccRow) return ccRow.code || ccRow.name || "Custom color item";
    return "";
  })();

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
        setPaymentType(1);
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
    const orderDiscount = (calc * (Number(finalDiscountPercent) || 0)) / 100;
    setGrossTotal(calc.toFixed(2));
    setFinalDiscountAmount(orderDiscount);
    setNetTotal((calc - orderDiscount).toFixed(2));
  }, [selectedRows, rows, rowsCC, finalDiscountPercent]);


  const navigateToBack = () => {
    router.push({
      pathname: "/service/purchase-invoice",
    });
  };

  const handleSelect = (item, index) => {
    setSelectedItem(item);
    setSelectedIndex(index);
  };


  const handleAddCustomColor = () => {
    const lineKey = `cc-${Date.now()}`;
    initLineDetails(lineKey);
    setActiveLineKey(lineKey);
    setRowsCC((prev) => [
      ...prev,
      {
        lineKey,
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
    const removed = newRows[index];
    if (removed?.lineKey) {
      removeLineDetails(removed.lineKey);
      if (activeLineKey === removed.lineKey) {
        setActiveLineKey(null);
      }
    }
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
    const lineKey = `outlet-${item?.id ?? Date.now()}`;
    initLineDetails(lineKey);
    setActiveLineKey(lineKey);
    const newItem = {
      ...item,
      lineKey,
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
    const removed = newRows[index];
    if (removed?.lineKey) {
      removeLineDetails(removed.lineKey);
      if (activeLineKey === removed.lineKey) {
        setActiveLineKey(null);
      }
    }
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

  const loadSalesOrderList = async (keyword = "") => {
    try {
      setLoadingSalesOrders(true);
      const response = await fetch(`${BASE_URL}/SalesOrder/SearchSalesOrdersForInvoice?keyword=${encodeURIComponent(keyword)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load sales orders");
      }

      const data = await response.json();
      setSalesOrderList(data?.result || []);
    } catch (error) {
      toast.error(error.message || "Failed to load sales orders");
      setSalesOrderList([]);
    } finally {
      setLoadingSalesOrders(false);
    }
  };

  const handleOpenSalesOrderModal = () => {
    setSalesOrderSearch("");
    setSalesOrderModalOpen(true);
    loadSalesOrderList("");
  };

  const handleSelectSalesOrder = async (salesOrderId) => {
    try {
      const response = await fetch(`${BASE_URL}/SalesOrder/GetSalesOrderById?id=${salesOrderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load sales order details");
      }

      const data = await response.json();
      const salesOrder = data?.result;
      if (!salesOrder) {
        throw new Error("Sales order not found");
      }

      const matchedCustomer = (customers || []).find((c) => c.id === salesOrder.customerID || c.id === salesOrder.customerId);
      setCustomer(matchedCustomer || {
        id: salesOrder.customerID || salesOrder.customerId,
        firstName: salesOrder.customerName || "",
        addressLine1: salesOrder.billToline1 || "",
        addressLine2: salesOrder.billToline2 || "",
        addressLine3: salesOrder.billToline3 || "",
      });
      setAddress1(salesOrder.billToline1 || "");
      setAddress2(salesOrder.billToline2 || "");
      setAddress3(salesOrder.billToline3 || "");
      setAddress4(salesOrder.billToline4 || "");
      setRemark(salesOrder.remark || "");

      const matchedSalesPerson = (salesPersonList || []).find((s) => s.id === salesOrder.salesPersonId);
      setSalesPerson(matchedSalesPerson || null);

      const mappedRows = (salesOrder.salesOrderLineDetails || [])
        .filter((line) => !line.isDeleted)
        .map((line, index) => {
          const lineKey = `sales-order-line-${line.id || index}-${Date.now()}-${index}`;
          return {
            lineKey,
            id: line.stockBalanceId ?? 0,
            productId: line.productId,
            productName: line.productName || "",
            productCode: line.productCode || "",
            quantity: Number(line.qty || 0),
            totalPrice: Number(line.lineTotal || 0),
            sellingPrice: Number(line.unitPrice || 0),
            costPrice: 0,
            discountType: "percentage",
            discount: Number(line.discountPercentage || 0),
            discountAmount: Number(line.discountAmount || 0),
            discountPercent: Number(line.discountPercentage || 0),
            stockBalanceId: line.stockBalanceId ?? 0,
            batchNumber: "",
            packageName: line.productName || "",
            isNonInventory: !line.stockBalanceId || line.stockBalanceId === 0,
            bookBalanceQuantity: Number.MAX_SAFE_INTEGER,
          };
        });

      const seededDetails = mappedRows.reduce((acc, row) => {
        acc[row.lineKey] = createDefaultLineDetails(formatDate(today));
        return acc;
      }, {});
      setLineDetailsMap((prev) => ({ ...prev, ...seededDetails }));

      setRows([]);
      setRowsCC([]);
      setSelectedRows(mappedRows);
      if (mappedRows.length > 0) {
        setActiveLineKey(mappedRows[0].lineKey);
      }
      setSelectedSalesOrderId(salesOrder.id);
      setSalesOrderModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to load sales order details");
    }
  };

  const handleClearSalesOrderSelection = () => {
    setCustomer(null);
    setAddress1("");
    setAddress2("");
    setAddress3("");
    setAddress4("");
    setRemark("");
    setSalesPerson(null);
    setSelectedRows([]);
    setRows([]);
    setRowsCC([]);
    setSelectedSalesOrderId(null);
    setLineDetailsMap({});
    setActiveLineKey(null);
  };

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

    // Credit limit validation for credit payments only (PaymentType = 7)
    if (isCustomerCreditLimit && paymentType === 7 && customer) {
      const creditLimit = customer.creditLimit || 0;
      
      // Check if customer has a valid credit limit set
      if (creditLimit <= 0) {
        toast.error("Cannot create invoice. Customer must have a Credit Limit set. Please update customer details.");
        return;
      }

      // Check if invoice amount exceeds available credit balance
      const outstandingAmount = customer.outstandingAmount || 0;
      const availableBalance = creditLimit - outstandingAmount;
      
      if (parseFloat(netTotal) > availableBalance) {
        toast.error(`Credit Limit Exceeded. Available Balance: ${availableBalance.toLocaleString()}`);
        return;
      }
    }

    if (rowsCC.length > 0 && rowsCC.some(row => row.machine === null)) {
      toast.info('Please select machine');
      return;
    }

    const outletRows = rows.map((row, i) => {
      const lineKey = ensureRowLineKey(row, "outlet");
      return {
        lineKey,
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
      };
    });

    const CCRows = rowsCC.map((row, i) => {
      const lineKey = ensureRowLineKey(row, "cc");
      return {
        lineKey,
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
      };
    });

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
      ...selectedRows.map((row, i) => {
        const lineKey = ensureRowLineKey(row, "item");
        return {
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
          DiscountAmount: Number(row.discountAmount) || 0,
          DiscountPercentage: Number(row.discountPercent) || 0,
          LineTotal: row.totalPrice,
          SequanceNo: i + 1,
          StockBalanceId: row.isNonInventory ? 0 : row.id,
          Machine: null,
          ItemType: 1,
          ...buildLineExtrasPayload(lineDetailsMap[lineKey] || createDefaultLineDetails(formatDate(today))),
        };
      }),
      ...outletRows.map(({ lineKey, ...line }) => ({
        ...line,
        ...buildLineExtrasPayload(lineDetailsMap[lineKey] || createDefaultLineDetails(formatDate(today))),
      })),
      ...CCRows.map(({ lineKey, ...line }) => ({
        ...line,
        ...buildLineExtrasPayload(lineDetailsMap[lineKey] || createDefaultLineDetails(formatDate(today))),
      })),
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
      Discountamount: Number(finalDiscountAmount) || 0,
      DiscountPercentage: Number(finalDiscountPercent) || 0,
      IsPaid: false,
      GrossTotal: parseFloat(grossTotal),
      NetTotal: parseFloat(netTotal),
      SalesPersonId: salesPerson?.id ?? null,
      SalesPersonCode: salesPerson?.code ?? "",
      SalesPersonName: salesPerson?.name || salesPerson?.Name || "",
      FormSubmitId: guidRef.current,
      RegNo: regNo || "",
      DoctorId: selectedDoctor ? selectedDoctor.id : null,
      DoctorName: selectedDoctor ? selectedDoctor.firstName + " " + selectedDoctor.lastName : "",
      InvoiceLineDetails: invoiceLines,
      PaymentType: paymentType,
      Notification: {
        NotifyByEmail: notifyEmail,
        NotifyBySms: notifySms,
        NotifyOnCreate: notifyOnCreate,
        MessageTemplate: notifyTemplate || null,
      },
    };

    const invalidItem = invoiceLines.some(r => !r.Qty || r.Qty <= 0);
    if (invalidItem) {
      toast.error("Please Add Qty for All Items");
      return;
    }

    try {
      setIsSubmitting(true);
      const createInvoiceUrl = `${BASE_URL}/PurchaseInvoice/CreatePurchaseInvoice`;

      const res = await fetch(createInvoiceUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      const payload = json?.result;
      const headerObj =
        payload?.result && typeof payload.result === "object" ? payload.result : null;
      const isSuccess =
        res.ok &&
        headerObj &&
        (payload?.statusCode === 200 || payload?.statusCode === "SUCCESS");

      if (isSuccess) {
        toast.success(payload?.message || "Purchase invoice created successfully.");
        updateInvNo();
        guidRef.current = uuidv4();
        setSelectedRows([]);
        setCustomer(null);
        setAddress1("");
        setAddress2("");
        setAddress3("");
        setRemark("");
        setSalesPerson(null);
        setSelectedSalesOrderId(null);
        setRows([]);
        setRowsCC([]);
        setFinalDiscountPercent(0);
        setLineDetailsMap({});
        setActiveLineKey(null);
        setNotifyEmail(false);
        setNotifySms(false);
        setNotifyOnCreate(true);
        setNotifyTemplate("Dear customer, your purchase document {{docNo}} has been created.");

        const savedDoc = headerObj?.documentNo || invNo;
        const savedId = headerObj?.id;

        if (savedId) {
          const query = new URLSearchParams({
            id: String(savedId),
            documentNumber: savedDoc ?? "",
          });
          window.open(
            `/service/purchase-invoice/print?${query.toString()}`,
            `purchase-invoice-print-${savedId}`,
            "popup=yes,width=900,height=900,scrollbars=yes,resizable=yes"
          );
        } else {
          const printURL = `${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${savedDoc}&reportName=${POSInvoiceReportName}&warehouseId=${warehouseId}&currentUser=${name}`;
          window.open(printURL, "_blank");
        }

        setTimeout(() => {
          router.push("/service/purchase-invoice/");
        }, 1200);
      } else {
        toast.error(payload?.message || json?.message || "Please fill all required fields");
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

  const handleAddNonInventoryLine = (item) => {
    if (!customer) {
      toast.error("Customer information is missing!");
      return;
    }
    const unitPrice = parseFloat(item.averagePrice) || 0;
    const existingItem = selectedRows.find(
      (row) => row.isNonInventory && row.productId === item.id
    );
    if (existingItem) {
      toast.error("This item already exists in the table. Cannot add duplicate items.");
      return;
    }

    const lineKey = `noninv-${item.id}-${Date.now()}`;
    initLineDetails(lineKey);
    setActiveLineKey(lineKey);

    const newRow = {
      lineKey,
      id: 0,
      productId: item.id,
      productName: item.name,
      productCode: item.code,
      quantity: "",
      totalPrice: 0,
      discountType: "percentage",
      discount: 0,
      discountAmount: 0,
      discountPercent: 0,
      sellingPrice: unitPrice,
      costPrice: unitPrice,
      stockBalanceId: null,
      batchNumber: "",
      packageName: item.name,
      isNonInventory: true,
      bookBalanceQuantity: Number.MAX_SAFE_INTEGER,
    };

    setSelectedRows((prevRows) => [...prevRows, newRow]);
  };

  const handleSearchItemSelect = (item) => {
    if (isOutlet) {
      handleItemStock(item);
    } else if (item.stockBalanceId == null) {
      handleAddNonInventoryLine(item);
    } else {
      handleCheckStockBalance(item);
    }
    setTimeout(() => {
      const newIndex = selectedRows.length;
      qtyRefs.current[newIndex]?.focus();
    }, 100);
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

    const lineKey = `item-${item.id}-${Date.now()}`;
    initLineDetails(lineKey);
    setActiveLineKey(lineKey);

    const newRow = {
      ...item,
      lineKey,
      quantity: "",
      totalPrice: item.sellingPrice || 0,
      discountType: "percentage",
      discount: 0,
      discountAmount: 0,
      discountPercent: 0,
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

    const lineKey = `pkg-${item.id}-${Date.now()}`;
    initLineDetails(lineKey);
    setActiveLineKey(lineKey);

    const newRow = {
      ...item,
      lineKey,
      quantity: 1,
      totalPrice: item.rate,
      discountType: "percentage",
      discount: 0,
      discountAmount: 0,
      discountPercent: 0,
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

  // Per-line discount supports two modes:
  //  - "percentage": the entered value is a % of the line gross
  //  - "value": the entered value is a fixed money amount (capped at the line gross)
  const computeLineTotal = (qty, price, discountType, discountInput) => {
    const q = Number(qty) || 0;
    const p = Number(price) || 0;
    const input = Number(discountInput) || 0;
    const gross = q * p;
    let discountAmount;
    if (discountType === "value") {
      discountAmount = Math.min(Math.max(0, input), gross);
    } else {
      const pct = Math.min(Math.max(0, input), 100);
      discountAmount = (gross * pct) / 100;
    }
    const discountPercent = gross > 0 ? (discountAmount / gross) * 100 : 0;
    return { discountAmount, discountPercent, total: gross - discountAmount };
  };

  const handleLineDiscountChange = (index, rawValue) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    const type = row.discountType || "percentage";
    let value = rawValue === "" ? "" : Math.max(0, parseFloat(rawValue));
    if (rawValue !== "" && Number.isNaN(value)) value = 0;
    if (type === "percentage" && value !== "" && value > 100) value = 100;
    row.discount = value;
    const price = isBookingSystem ? row.rate : row.sellingPrice;
    const { discountAmount, discountPercent, total } = computeLineTotal(
      row.quantity,
      price,
      type,
      value === "" ? 0 : value
    );
    row.discountAmount = discountAmount.toFixed(2);
    row.discountPercent = discountPercent;
    row.totalPrice = total;
    setSelectedRows(updatedRows);
  };

  const handleLineDiscountTypeChange = (index, type) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    row.discountType = type;
    // Reset the entered discount when switching type so a "50%" doesn't silently become "Rs. 50".
    row.discount = 0;
    const price = isBookingSystem ? row.rate : row.sellingPrice;
    const { discountAmount, discountPercent, total } = computeLineTotal(
      row.quantity,
      price,
      type,
      0
    );
    row.discountAmount = discountAmount.toFixed(2);
    row.discountPercent = discountPercent;
    row.totalPrice = total;
    setSelectedRows(updatedRows);
  };

  const handleOrderDiscountChange = (e) => {
    const raw = e.target.value;
    let value = parseFloat(raw);
    if (Number.isNaN(value)) value = 0;
    if (value > 100) value = 100;
    if (value < 0) value = 0;
    setFinalDiscountPercent(value);
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    const oldTotalPrice = Number(row.totalPrice) || 0;

    row.quantity = newQuantity;
    const price = isBookingSystem ? row.rate : row.sellingPrice;
    const { discountAmount, discountPercent, total } = computeLineTotal(
      newQuantity,
      price,
      row.discountType || "percentage",
      row.discount
    );
    row.discountAmount = discountAmount.toFixed(2);
    row.discountPercent = discountPercent;
    row.totalPrice = total;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + total);
  };


  const handleSellingPriceChange = (index, newPrice) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];

    const x = parseFloat(row.costPrice) / 2;
    const y = parseFloat(newPrice) - parseFloat(row.costPrice);

    if ((y > x) && isAllowProfitMessageDisplay) {
      toast.info("Profit exceeds 50% of the cost price.");
    }
    const oldTotalPrice = Number(row.totalPrice) || 0;
    if (isBookingSystem) {
      row.rate = newPrice;
    } else {
      row.sellingPrice = newPrice;
    }

    const { discountAmount, discountPercent, total } = computeLineTotal(
      row.quantity,
      newPrice,
      row.discountType || "percentage",
      row.discount
    );
    row.discountAmount = discountAmount.toFixed(2);
    row.discountPercent = discountPercent;
    row.totalPrice = total;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + total);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    if (row?.lineKey) {
      removeLineDetails(row.lineKey);
      if (activeLineKey === row.lineKey) {
        setActiveLineKey(updatedRows[0]?.lineKey ?? null);
      }
    }

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - (row.rowTotal || row.totalPrice || 0));
  };


  const updateInvNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=63`, {
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

  useEffect(() => {
    const loadWarrantyTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/WarrantyType/GetAllWarrantyType`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const inner = json?.result?.result ?? json?.result ?? json;
        const list = Array.isArray(inner) ? inner : [];
        setWarrantyTypeList(list.filter((w) => w.isActive !== false));
      } catch (e) {
        // silent fail; warranty section still usable as free text fallback
      }
    };
    loadWarrantyTypes();
  }, []);

  useEffect(() => {
    const loadDeviceTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/DeviceType/GetAllDeviceType`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const inner = json?.result?.result ?? json?.result ?? json;
        const list = Array.isArray(inner) ? inner : [];
        setDeviceTypeList(list.filter((d) => d.isActive !== false));
      } catch (e) {
        // silent fail
      }
    };
    loadDeviceTypes();
  }, []);

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
  const servicePaymentOptions = (() => {
    const noCredit = paymentOptions.filter((o) => o.value !== 7);
    if (noCredit.length > 0) return noCredit;
    return [
      { value: 1, label: "Cash" },
      { value: 2, label: "Card" },
      { value: 4, label: "Bank Transfer" },
    ];
  })();
  // --- END OF UPDATED SECTION ---
  const isSalesOrderSelected = Boolean(selectedSalesOrderId);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Purchase invoice</h1>
        <ul>
          <li>
            <Link href="/service/purchase-invoice">Purchase Invoice</Link>
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
            <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" gap={2} alignItems="center">
                <Button variant="outlined" disabled>
                  <Typography sx={{ fontWeight: "bold" }}>
                    Document No: {invNo}
                  </Typography>
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Stock items post to Purchase schema; use Cash / Card / Bank only.
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Button variant="outlined" onClick={() => navigateToBack()}>
                  <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
                </Button>
              </Box>
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
                    disabled={isSalesOrderSelected}
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
                  {!isSalesOrderSelected ? <AddCustomerDialog fetchItems={fetchCustomers} showIconOnly={true} /> : ""}
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
                    disabled={isSalesOrderSelected}
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
                    disabled={isSalesOrderSelected}
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
                    disabled={isSalesOrderSelected}
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
                    disabled={isSalesOrderSelected}
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
                    disabled={isSalesOrderSelected}
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
                      disabled={!customer}
                    >
                      {servicePaymentOptions.map((option) => (
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
                <Box sx={isSalesOrderSelected ? { pointerEvents: "none", opacity: 0.6, width: "100%" } : { width: "100%" }}>
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
                        onSelect={handleSearchItemSelect}
                      />
                    ) : <SearchItemByName
                      ref={searchRef}
                      label="Search"
                      placeholder="Search Items by name"
                      fetchUrl={isOutlet ? `${BASE_URL}/Outlet/GetAllOutletByProductName` : `${BASE_URL}/Items/GetAllItemsWithoutZeroQty`}
                      onSelect={handleSearchItemSelect}
                    />}
                </Box>
                {isBookingSystem && (
                  <Button disabled={isSalesOrderSelected} variant={isItemSearch ? "contained" : "outlined"} size="small" color={isItemSearch ? "warning" : "secondary"} onClick={() => { setIsItemSearch(prev => !prev); setStock([]); setSelectedItem(); }}>
                    Items
                  </Button>
                )}
                {IsOutletAvailable && (
                  <Button disabled={isSalesOrderSelected} variant={isOutlet ? "contained" : "outlined"} size="small" color={isOutlet ? "warning" : "secondary"} onClick={() => { setIsOutlet(prev => !prev); setStock([]); setSelectedItem(); }}>
                    Outlet
                  </Button>
                )}
                {IsCustomColorMachineAvailable && (
                  <Button disabled={isSalesOrderSelected} variant="contained" size="small" color="success" onClick={handleAddCustomColor}>
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
                      <TableCell sx={{ color: "#fff" }}>
                        Discount Type
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Discount
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Discount Amount
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Details
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>
                        Total Price
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.map((row, index) => {
                      const rowLineKey = ensureRowLineKey(row, "item");
                      const rowDetails = lineDetailsMap[rowLineKey];
                      const isActive = activeLineKey === rowLineKey;
                      return (
                      <TableRow
                        key={row.lineKey ?? row.id}
                        hover
                        selected={isActive}
                        onClick={() => {
                          if (!row.lineKey) {
                            row.lineKey = rowLineKey;
                          }
                          initLineDetails(rowLineKey);
                          setActiveLineKey(rowLineKey);
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <Tooltip title="Delete" placement="top">
                            <IconButton
                              disabled={isSalesOrderSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(index);
                            }}
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
                            disabled={isSalesOrderSelected}
                            value={row.quantity}
                            inputProps={{
                              min: 1,
                              max: row.isNonInventory ? undefined : row.bookBalanceQuantity,
                            }}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === "") {
                                handleQuantityChange(index, "");
                                return;
                              }

                              let newValue = Number(inputValue);

                              if (!row.isNonInventory && newValue > row.bookBalanceQuantity) {
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
                            disabled={isSalesOrderSelected}
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
                        <TableCell sx={{ p: 1 }}>
                          <Select
                            size="small"
                            sx={{ width: "120px" }}
                            disabled={isSalesOrderSelected}
                            value={row.discountType || "percentage"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleLineDiscountTypeChange(index, e.target.value)}
                          >
                            <MenuItem value="percentage">Percentage (%)</MenuItem>
                            <MenuItem value="value">Value</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "100px" }}
                            type="number"
                            size="small"
                            disabled={isSalesOrderSelected}
                            value={row.discount === 0 ? 0 : row.discount || ""}
                            onClick={(e) => e.stopPropagation()}
                            inputProps={
                              (row.discountType || "percentage") === "value"
                                ? { min: 0 }
                                : { min: 0, max: 100 }
                            }
                            onChange={(e) => handleLineDiscountChange(index, e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          {(Number(row.discountAmount) || 0).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          {rowDetails?.deviceSerial ? (
                            <Chip size="small" color="success" label={rowDetails.deviceType || "Device"} />
                          ) : (
                            <Chip size="small" variant="outlined" label="Add details" />
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {(Number(row.totalPrice) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );})}

                    <TableRow>
                      <TableCell align="right" colSpan={
                        9 +
                        (IsBatchNumberAvailable ? 1 : 0) +
                        (IsExpireDateAvailable ? 1 : 0) +
                        (IsCostPriceVisible ? 1 : 0)
                      }>
                        <Typography fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {grossTotal}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" colSpan={
                        9 +
                        (IsBatchNumberAvailable ? 1 : 0) +
                        (IsExpireDateAvailable ? 1 : 0) +
                        (IsCostPriceVisible ? 1 : 0)
                      }>
                        <Typography fontWeight="bold">Order Discount (%)</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          sx={{ width: "100px" }}
                          value={finalDiscountPercent}
                          onChange={handleOrderDiscountChange}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" colSpan={
                        9 +
                        (IsBatchNumberAvailable ? 1 : 0) +
                        (IsExpireDateAvailable ? 1 : 0) +
                        (IsCostPriceVisible ? 1 : 0)
                      }>
                        <Typography fontWeight="bold">Total Discount</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {formatCurrency(finalDiscountAmount)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right" colSpan={
                        9 +
                        (IsBatchNumberAvailable ? 1 : 0) +
                        (IsExpireDateAvailable ? 1 : 0) +
                        (IsCostPriceVisible ? 1 : 0)
                      }>
                        <Typography fontWeight="bold">Net Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {netTotal}
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
            <Grid item xs={12} sx={{ px: 1, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                Line item details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {activeLineKey
                  ? `Editing: ${activeRowLabel || "Selected line"}`
                  : "Select a product row above to enter device and warranty details for that item."}
              </Typography>
              {activeLineKey && activeDetails && (
                <>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Device
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        select
                        label="Device Type"
                        size="small"
                        fullWidth
                    value={activeDetails.deviceType}
                    onChange={(e) => updateLineDetails(activeLineKey, { deviceType: e.target.value })}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select device type</em>
                    </MenuItem>
                    {deviceTypeList.map((opt) => (
                      <MenuItem key={opt.id ?? opt.code} value={opt.name}>
                        {opt.name}
                      </MenuItem>
                    ))}
                  </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Brand"
                        size="small"
                        fullWidth
                        value={activeDetails.deviceBrand}
                        onChange={(e) => updateLineDetails(activeLineKey, { deviceBrand: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Model"
                        size="small"
                        fullWidth
                        value={activeDetails.deviceModel}
                        onChange={(e) => updateLineDetails(activeLineKey, { deviceModel: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        label="Serial / IMEI"
                        size="small"
                        fullWidth
                        value={activeDetails.deviceSerial}
                        onChange={(e) => updateLineDetails(activeLineKey, { deviceSerial: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Grid>
            <Grid item xs={12} sx={{ px: 1 }}>
              <Tabs
                value={tabIndex}
                onChange={(e, v) => setTabIndex(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Warranty" disabled={!activeLineKey} />
                <Tab label="Customer notification" />
              </Tabs>
              <Box sx={{ py: 2 }}>
                {tabIndex === 0 && activeLineKey && activeDetails && (
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={warrantyTypeList || []}
                        getOptionLabel={(o) => o?.name ? `${o.code ? o.code + " - " : ""}${o.name}` : ""}
                        isOptionEqualToValue={(o, v) => o?.id === v?.id}
                        value={activeDetails.selectedWarrantyType}
                        onChange={(e, v) => {
                          const patch = { selectedWarrantyType: v };
                          if (v) {
                            patch.warrantyType = v.name || "";
                            if (v.durationMonths != null) {
                              patch.warrantyMonths = String(v.durationMonths);
                              patch.warrantyExpiry = calcWarrantyExpiry(
                                activeDetails.warrantyStart,
                                String(v.durationMonths)
                              );
                            }
                            patch.warrantyTerms = v.terms || "";
                          }
                          updateLineDetails(activeLineKey, patch);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            label="Warranty type"
                            placeholder="Select pre-defined warranty"
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Start date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={activeDetails.warrantyStart}
                        onChange={(e) => {
                          const warrantyStart = e.target.value;
                          updateLineDetails(activeLineKey, {
                            warrantyStart,
                            warrantyExpiry: calcWarrantyExpiry(warrantyStart, activeDetails.warrantyMonths),
                          });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Period (months)"
                        size="small"
                        fullWidth
                        value={activeDetails.warrantyMonths}
                        onChange={(e) => {
                          const warrantyMonths = e.target.value;
                          updateLineDetails(activeLineKey, {
                            warrantyMonths,
                            warrantyExpiry: calcWarrantyExpiry(activeDetails.warrantyStart, warrantyMonths),
                          });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Expiry date"
                        type="date"
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={activeDetails.warrantyExpiry}
                        onChange={(e) => updateLineDetails(activeLineKey, { warrantyExpiry: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Terms"
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        value={activeDetails.warrantyTerms}
                        onChange={(e) => updateLineDetails(activeLineKey, { warrantyTerms: e.target.value })}
                        InputProps={{ readOnly: Boolean(activeDetails.selectedWarrantyType) }}
                      />
                    </Grid>
                  </Grid>
                )}
                {tabIndex === 0 && !activeLineKey && (
                  <Typography variant="body2" color="text.secondary">
                    Select a line item to configure its warranty.
                  </Typography>
                )}
                {tabIndex === 1 && (
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <FormControlLabel control={<Checkbox checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />} label="Notify by email (when integration is available)" />
                      <FormControlLabel control={<Checkbox checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />} label="Notify by SMS (when integration is available)" />
                      <FormControlLabel control={<Checkbox checked={notifyOnCreate} onChange={(e) => setNotifyOnCreate(e.target.checked)} />} label="Flag notification on create" />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Message template" size="small" fullWidth multiline minRows={3} value={notifyTemplate} onChange={(e) => setNotifyTemplate(e.target.value)} />
                    </Grid>
                  </Grid>
                )}
              </Box>
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

export default PurchaseInvoiceCreate;

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