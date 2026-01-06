import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import useApi from "@/components/utils/useApi";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const reportConfigs = {
  SalesSummaryReport: {
    title: "Sales Summary Report",
    fields: {
      customer: { enabled: true, required: false, label: "Select Customer", paramName: "customer", allowAll: true },
      supplier: { enabled: true, required: false, label: "Select Supplier", paramName: "supplier", allowAll: true },
      category: { enabled: true, required: false, label: "Select Category", paramName: "category", allowAll: true },
      subCategory: { enabled: true, required: false, label: "Select Sub Category", paramName: "subCategory", allowAll: true },
      item: { enabled: true, required: false, label: "Select Item", paramName: "item", allowAll: true },
      paymentType: {
        enabled: true,
        required: false,
        label: "Select Payment Type",
        paramName: "paymentType",
        allowAll: true,
        options: [
          { value: 1, label: "Cash" },
          { value: 2, label: "Card" },
          { value: 3, label: "Cash & Card" },
          { value: 4, label: "Bank Transfer" },
          { value: 5, label: "Cheque" },
        ],
      },
    },
  },
  CashBookSummaryReport: {
    title: "Cash Book Summary Report",
    fields: {
      customer: { enabled: true, required: true, label: "Select Customer", paramName: "customerId", allowAll: false },
    },
  },
  CustomerPaymentSummaryReport: {
    title: "Customer Payment Summary Report",
    fields: {
      customer: { enabled: true, required: false, label: "Select Customer", paramName: "customerId", allowAll: true },
      invoice: { enabled: true, required: false, label: "Select Invoice", paramName: "invoiceId", allowAll: true },
      paymentType: {
        enabled: true,
        required: false,
        label: "Select Payment Type",
        paramName: "paymentType",
        allowAll: true,
        options: [
          { value: 1, label: "Cash" },
          { value: 2, label: "Card" },
          { value: 3, label: "Cash & Card" },
          { value: 4, label: "Bank Transfer" },
          { value: 5, label: "Cheque" },
        ],
      },
    },
  },
  ShipmentSummaryReport: {
    title: "Shipment Summary Report",
    fields: {
      supplier: { enabled: true, required: false, label: "Select Supplier", paramName: "supplier", allowAll: true },
      category: { enabled: true, required: false, label: "Select Category", paramName: "category", allowAll: true },
      subCategory: { enabled: true, required: false, label: "Select Sub Category", paramName: "subCategory", allowAll: true },
      item: { enabled: true, required: false, label: "Select Item", paramName: "item", allowAll: true },
      status: {
        enabled: true,
        required: false,
        label: "Select Status",
        paramName: "status",
        allowAll: true,
        options: [
          { value: 1, label: "Ordered" },
          { value: 2, label: "Invoiced" },
          { value: 3, label: "Warehouse Issued" },
          { value: 4, label: "Dispatched" },
          { value: 5, label: "Arrived" },
          { value: 6, label: "Customer Warehouse" },
          { value: 7, label: "Completed" },
        ],
      },
    },
  },
  GoodsReceivedNotesSummaryReport: {
    title: "Goods Received Notes Summary Report",
    fields: {
      supplier: { enabled: true, required: false, label: "Select Supplier", paramName: "supplier", allowAll: true },
      category: { enabled: true, required: false, label: "Select Category", paramName: "category", allowAll: true },
      subCategory: { enabled: true, required: false, label: "Select Sub Category", paramName: "subCategory", allowAll: true },
      item: { enabled: true, required: false, label: "Select Item", paramName: "item", allowAll: true },
    },
  },
  PurchaseOrderNotesSummaryReport: {
    title: "Purchase Order Notes Summary Report",
    fields: {
      supplier: { enabled: true, required: false, label: "Select Supplier", paramName: "supplier", allowAll: true },
      category: { enabled: true, required: false, label: "Select Category", paramName: "category", allowAll: true },
      subCategory: { enabled: true, required: false, label: "Select Sub Category", paramName: "subCategory", allowAll: true },
      item: { enabled: true, required: false, label: "Select Item", paramName: "item", allowAll: true },
      status: {
        enabled: true,
        required: false,
        label: "Select Status",
        paramName: "status",
        allowAll: true,
        options: [
          { value: 1, label: "Pending" },
          { value: 2, label: "GRN Completed" },
        ],
      },
    },
  },
  CashFlowSummaryReport: {
    title: "Cash Flow Summary Report",
    fields: {
      cashFlowType: { enabled: true, required: false, label: "Select Cash Flow Type", paramName: "cashFlowTypeId", allowAll: true },
      cashType: {
        enabled: true,
        required: false,
        label: "Select Cash Type",
        paramName: "cashType",
        allowAll: true,
        options: [
          { value: 1, label: "Cash In" },
          { value: 2, label: "Cash Out" },
        ],
      },
    },
  },
  DoctorWiseSalesSummaryReport: {
    title: "Doctor Wise Sales Summary Report",
    fields: {
      doctor: { enabled: true, required: false, label: "Select Doctor", paramName: "doctorId", allowAll: true },
    },
  },
  DailyDepositSummary: {
    title: "Daily Deposit Summary",
    fields: {
      bank: { enabled: true, required: false, label: "Select Bank", paramName: "bankId", allowAll: true },
    },
  },
  ReservationAppointmentTypeReport: {
    title: "Reservation Appointment Type Report",
    fields: {
      appointmentType: {
        enabled: true,
        required: false,
        label: "Select Appointment Type",
        paramName: "typeId",
        allowAll: false,
        options: [
          { value: "1", label: "First" },
          { value: "2", label: "Show Saree" },
          { value: "3", label: "Fabric and Design" },
          { value: "4", label: "Measurement" },
          { value: "5", label: "Fiton" },
          { value: "6", label: "Trial" },
          { value: "7", label: "Pending Inovice" },
          { value: "8", label: "Completed" },
        ],
      },
    },
  },
  ReservationTypeReport: {
    title: "Reservation Status Report",
    fields: {
      reservationType: {
        enabled: true,
        required: false,
        label: "Select Reservation Status",
        paramName: "reservationType",
        allowAll: false,
        options: [
          { value: "1", label: "Pencil Note" },
          { value: "2", label: "Other" },
          { value: "3", label: "Payment Process" },
          { value: "4", label: "Reservation" },
          { value: "5", label: "Ongoing" },
          { value: "6", label: "Wedding Day" },
          { value: "7", label: "Complete" },
          { value: "8", label: "Removed" },
          { value: "9", label: "Removed And Refund" },
          { value: "10", label: "Balance Payment" },
          { value: "11", label: "ChargeSheetPayment" },
        ],
      },
    },
  },
  ReservationSalesReport: {
    title: "Reservation Sales Report",
    fields: {
      reservation: { enabled: true, required: false, label: "Select Reservation", paramName: "reservationId", allowAll: true },
    },
  },
  FiscalPeriodReport: {
    title: "Fiscal Period Report",
    fields: {
      fiscalPeriod: { enabled: true, required: false, label: "Select Fiscal Period", paramName: "periodId", allowAll: true },
    },
  },
  BankHistoryReport: {
    title: "Bank History Report",
    fields: {
      bank: { enabled: true, required: true, label: "Select Bank", paramName: "bankId", allowAll: false },
      cashFlowType: { enabled: true, required: false, label: "Select Category", paramName: "cashFlowTypeId", allowAll: true, bankTypeOnly: true },
    },
  },
  ShiftSummaryReport: {
    title: "Shift Summary Report",
    fields: {
      user: { enabled: true, required: false, label: "Select User", paramName: "userId", allowAll: true },
      terminal: { enabled: true, required: false, label: "Select Terminal", paramName: "terminalId", allowAll: true },
    },
  },
  StockMovementReport: {
    title: "Stock Movement Summary Report",
    fields: {
      supplier: { enabled: true, required: false, label: "Select Supplier", paramName: "supplier", allowAll: true },
      category: { enabled: true, required: false, label: "Select Category", paramName: "category", allowAll: true },
      subCategory: { enabled: true, required: false, label: "Select Sub Category", paramName: "subCategory", allowAll: true },
      item: { enabled: true, required: false, label: "Select Item", paramName: "item", allowAll: true },
    },
  },
};

export default function UnifiedSummaryReportModal({ reportName, docName }) {
  const config = reportConfigs[reportName] || { title: "Report", fields: {} };
  const warehouseId = localStorage.getItem("warehouse");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data: reportSetting } = GetReportSettingValueByName(reportName);
  const name = localStorage.getItem("name");

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(config.fields.customer?.defaultValue || 0);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(config.fields.supplier?.defaultValue || 0);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(config.fields.category?.defaultValue || 0);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryId, setSubCategoryId] = useState(config.fields.subCategory?.defaultValue || 0);
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState(config.fields.item?.defaultValue || 0);
  const [invoices, setInvoices] = useState([]);
  const [invoiceId, setInvoiceId] = useState(config.fields.invoice?.defaultValue || 0);
  const [paymentType, setPaymentType] = useState(config.fields.paymentType?.defaultValue || 0);
  const [status, setStatus] = useState(config.fields.status?.defaultValue || 0);
  const [fiscalPeriod, setFiscalPeriod] = useState(config.fields.fiscalPeriod?.defaultValue || 0);
  const [fiscalPeriods, setFiscalPeriods] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(config.fields.doctor?.defaultValue || 0);
  const [banks, setBanks] = useState([]);
  const [bankId, setBankId] = useState(config.fields.bank?.defaultValue || 0);
  const [appointmentTypeId, setAppointmentTypeId] = useState(config.fields.appointmentType?.defaultValue || "");
  const [reservationTypeId, setReservationTypeId] = useState(config.fields.reservationType?.defaultValue || "");
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(config.fields.user?.defaultValue || 0);
  const [cashFlowTypes, setCashFlowTypes] = useState([]);
  const [cashFlowTypeId, setCashFlowTypeId] = useState(config.fields.cashFlowType?.defaultValue || 0);
  const [cashType, setCashType] = useState(config.fields.cashType?.defaultValue || 0);
  const [terminals, setTerminals] = useState([]);
  const [terminalId, setTerminalId] = useState(config.fields.terminal?.defaultValue || 0);
  const [reservations, setReservations] = useState([]);
  const [reservationId, setReservationId] = useState(config.fields.reservation?.defaultValue || 0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFromDate("");
    setToDate("");
    setCustomerId(config.fields.customer?.defaultValue || 0);
    setSupplierId(config.fields.supplier?.defaultValue || 0);
    setCategoryId(config.fields.category?.defaultValue || 0);
    setSubCategoryId(config.fields.subCategory?.defaultValue || 0);
    setItemId(config.fields.item?.defaultValue || 0);
    setInvoiceId(config.fields.invoice?.defaultValue || 0);
    setPaymentType(config.fields.paymentType?.defaultValue || 0);
    setStatus(config.fields.status?.defaultValue || 0);
    setFiscalPeriod(config.fields.fiscalPeriod?.defaultValue || 0);
    setDoctorId(config.fields.doctor?.defaultValue || 0);
    setBankId(config.fields.bank?.defaultValue || 0);
    setAppointmentTypeId(config.fields.appointmentType?.defaultValue || "");
    setReservationTypeId(config.fields.reservationType?.defaultValue || "");
    setUserId(config.fields.user?.defaultValue || 0);
    setCashFlowTypeId(config.fields.cashFlowType?.defaultValue || 0);
    setCashType(config.fields.cashType?.defaultValue || 0);
    setTerminalId(config.fields.terminal?.defaultValue || 0);
    setReservationId(config.fields.reservation?.defaultValue || 0);
  };

  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { data: itemList } = useApi("/Items/GetAllItems");
  const { data: supplierList } = useApi("/Supplier/GetAllSupplier");
  const { data: categoryList } = useApi("/Category/GetAllCategory");
  const { data: doctorList } = useApi("/Doctors/GetAll");
  const { data: bankList } = useApi("/Bank/GetAllBanks");
  const { data: fiscalPeriodList } = useApi("/Fiscal/GetAllFiscalPeriods");
  const { data: userList } = useApi("/User/GetAllUser");
  const { data: cashFlowTypeList } = useApi("/CashFlowType/GetCashFlowTypes");
  const { data: terminalList } = useApi("/Terminal/GetAllShiftNotEnabledTerminals");

  useEffect(() => {
    if (customerList && config.fields.customer?.enabled) {
      setCustomers(customerList);
    }
    if (itemList && config.fields.item?.enabled) {
      setItems(itemList);
    }
    if (supplierList && config.fields.supplier?.enabled) {
      setSuppliers(supplierList);
    }
    if (categoryList && config.fields.category?.enabled) {
      setCategories(categoryList);
    }
    if (doctorList && config.fields.doctor?.enabled) {
      setDoctors(doctorList);
    }
    if (bankList && config.fields.bank?.enabled) {
      setBanks(bankList);
    }
    if (fiscalPeriodList && config.fields.fiscalPeriod?.enabled) {
      setFiscalPeriods(fiscalPeriodList);
    }
    if (userList && config.fields.user?.enabled) {
      const allUsers = Array.isArray(userList) ? userList : userList?.result || [];
      const filteredUsers = allUsers.filter(
        (user) => user.email?.toLowerCase() !== "superadmin@gmail.com"
      );
      setUsers(filteredUsers);
    }
    if (config.fields.cashFlowType?.enabled) {
      if (config.fields.cashFlowType.bankTypeOnly) {
        fetchBankTypeCashFlowTypes();
      } else if (cashFlowTypeList) {
        setCashFlowTypes(Array.isArray(cashFlowTypeList) ? cashFlowTypeList : cashFlowTypeList?.result || []);
      }
    }
    if (terminalList && config.fields.terminal?.enabled) {
      setTerminals(terminalList);
    }
    if (config.fields.reservation?.enabled) {
      fetchReservations();
    }
  }, [terminalList, customerList, itemList, supplierList, categoryList, doctorList, bankList, fiscalPeriodList, userList, cashFlowTypeList, config]);

  const handleGetSupplierItems = async (id) => {
    setItemId(0);
    handleGetFilteredItems(id, categoryId, subCategoryId);
  };

  const handleGetSubCategories = async (id) => {
    setItemId(0);
    setSubCategoryId(0);
    handleGetFilteredItems(supplierId, id, subCategoryId);
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/SubCategory/GetAllSubCategoriesByCategoryId?categoryId=${id}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setSubCategories(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGetFilteredItems = async (supplier, category, subCategory) => {
    setItemId(0);
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Items/GetFilteredItems?supplier=${supplier}&category=${category}&subCategory=${subCategory}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setItems(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchInvoices = async (customerId) => {
    try {
      const response = await fetch(`${BASE_URL}/SalesInvoice/GetInvoicesByCustomerId?customerId=${customerId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      setInvoices(result.result);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Reservation/GetAllReservationSkipAndTake?SkipCount=0&MaxResultCount=1000&Search=null`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch reservations");

      const data = await response.json();
      setReservations(data.result?.items || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchBankTypeCashFlowTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/CashFlowType/GetCashFlowTypesByType?cashType=3`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch bank cash flow types");

      const data = await response.json();
      setCashFlowTypes(Array.isArray(data.result) ? data.result : []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSelectCustomer = (id) => {
    setCustomerId(id);
    if (config.fields.invoice?.enabled && id) {
      fetchInvoices(id);
    }
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("InitialCatalog", Catelogue);
    params.append("reportName", reportSetting);
    params.append("fromDate", fromDate);
    params.append("toDate", toDate);
    params.append("warehouseId", warehouseId);
    params.append("currentUser", name);

    if (config.fields.customer?.enabled) {
      params.append(config.fields.customer.paramName || "customer", customerId);
    }
    if (config.fields.supplier?.enabled) {
      params.append(config.fields.supplier.paramName || "supplier", supplierId);
    }
    if (config.fields.category?.enabled) {
      params.append(config.fields.category.paramName || "category", categoryId);
    }
    if (config.fields.subCategory?.enabled) {
      params.append(config.fields.subCategory.paramName || "subCategory", subCategoryId);
    }
    if (config.fields.item?.enabled) {
      params.append(config.fields.item.paramName || "item", itemId);
    }
    if (config.fields.invoice?.enabled) {
      params.append(config.fields.invoice.paramName || "invoiceId", invoiceId);
    }
    if (config.fields.paymentType?.enabled) {
      params.append(config.fields.paymentType.paramName || "paymentType", paymentType);
    }
    if (config.fields.status?.enabled) {
      params.append(config.fields.status.paramName || "status", status);
    }
    if (config.fields.fiscalPeriod?.enabled) {
      params.append(config.fields.fiscalPeriod.paramName || "fiscalPeriod", fiscalPeriod);
    }
    if (config.fields.doctor?.enabled) {
      params.append(config.fields.doctor.paramName || "doctorId", doctorId);
    }
    if (config.fields.bank?.enabled) {
      params.append(config.fields.bank.paramName || "bankId", bankId);
    }
    if (config.fields.appointmentType?.enabled && appointmentTypeId) {
      params.append(config.fields.appointmentType.paramName || "typeId", appointmentTypeId);
    }
    if (config.fields.reservationType?.enabled && reservationTypeId) {
      params.append(config.fields.reservationType.paramName || "reservationType", reservationTypeId);
    }
    if (config.fields.user?.enabled) {
      params.append(config.fields.user.paramName || "userId", userId);
    }
    if (config.fields.cashFlowType?.enabled) {
      params.append(config.fields.cashFlowType.paramName || "cashFlowTypeId", cashFlowTypeId);
    }
    if (config.fields.cashType?.enabled) {
      params.append(config.fields.cashType.paramName || "cashType", cashType);
    }
    if (config.fields.terminal?.enabled) {
      params.append(config.fields.terminal.paramName || "terminalId", terminalId);
    }
    if (config.fields.reservation?.enabled) {
      params.append(config.fields.reservation.paramName || "reservationId", reservationId);
    }

    return params.toString();
  };

  const isFormValid = () => {
    if (!fromDate || !toDate) return false;
    if (config.fields.customer?.enabled && config.fields.customer.required && !customerId) return false;
    if (config.fields.supplier?.enabled && config.fields.supplier.required && !supplierId) return false;
    if (config.fields.category?.enabled && config.fields.category.required && !categoryId) return false;
    if (config.fields.subCategory?.enabled && config.fields.subCategory.required && !subCategoryId) return false;
    if (config.fields.item?.enabled && config.fields.item.required && !itemId) return false;
    if (config.fields.invoice?.enabled && config.fields.invoice.required && !invoiceId) return false;
    if (config.fields.paymentType?.enabled && config.fields.paymentType.required && !paymentType) return false;
    if (config.fields.status?.enabled && config.fields.status.required && !status) return false;
    if (config.fields.fiscalPeriod?.enabled && config.fields.fiscalPeriod.required && !fiscalPeriod) return false;
    if (config.fields.doctor?.enabled && config.fields.doctor.required && !doctorId) return false;
    if (config.fields.bank?.enabled && config.fields.bank.required && !bankId) return false;
    if (config.fields.appointmentType?.enabled && config.fields.appointmentType.required && !appointmentTypeId) return false;
    if (config.fields.reservationType?.enabled && config.fields.reservationType.required && !reservationTypeId) return false;
    if (config.fields.user?.enabled && config.fields.user.required && !userId) return false;
    if (config.fields.cashFlowType?.enabled && config.fields.cashFlowType.required && !cashFlowTypeId) return false;
    if (config.fields.cashType?.enabled && config.fields.cashType.required && !cashType) return false;
    if (config.fields.terminal?.enabled && config.fields.terminal.required && !terminalId) return false;
    return true;
  };

  const renderField = (fieldName, fieldConfig) => {
    if (!fieldConfig?.enabled) return null;

    const gridSize = fieldConfig.gridSize || { xs: 12, lg: 12 };

    switch (fieldName) {
      case "customer":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Customer"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={customerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {customers.length === 0 ? (
                <MenuItem value="">No Customers Available</MenuItem>
              ) : (
                customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "supplier":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Supplier"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                if (config.fields.item?.enabled) {
                  handleGetSupplierItems(e.target.value);
                }
              }}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {suppliers.length === 0 ? (
                <MenuItem disabled value="">No Suppliers Available</MenuItem>
              ) : (
                suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "category":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Category"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (config.fields.subCategory?.enabled) {
                  handleGetSubCategories(e.target.value);
                }
                if (config.fields.item?.enabled) {
                  handleGetFilteredItems(supplierId, e.target.value, subCategoryId);
                }
              }}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {categories.length === 0 ? (
                <MenuItem disabled value="">No Categories Available</MenuItem>
              ) : (
                categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "subCategory":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Sub Category"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={subCategoryId}
              onChange={(e) => {
                setSubCategoryId(e.target.value);
                if (config.fields.item?.enabled) {
                  handleGetFilteredItems(supplierId, categoryId, e.target.value);
                }
              }}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {subCategories.length === 0 ? (
                <MenuItem disabled value="">No Sub Categories Available</MenuItem>
              ) : (
                subCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "item":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Item"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {items.length === 0 ? (
                <MenuItem value="">No Items Available</MenuItem>
              ) : (
                items.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "invoice":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Invoice"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {invoices.length === 0 ? (
                <MenuItem value="">No Invoices Available</MenuItem>
              ) : (
                invoices.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.documentNo} - {formatCurrency(item.grossTotal)}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "paymentType":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Payment Type"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {fieldConfig.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        );

      case "status":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Status"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {fieldConfig.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        );

      case "fiscalPeriod":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Fiscal Period"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={fiscalPeriod}
              onChange={(e) => setFiscalPeriod(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {fiscalPeriods.length === 0 ? (
                <MenuItem value="">No Fiscal Periods Available</MenuItem>
              ) : (
                fiscalPeriods.map((period) => (
                  <MenuItem key={period.id} value={period.id}>
                    {formatDate(period.startDate)} - {period.endDate ? formatDate(period.endDate) : "Still Active"}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "doctor":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Doctor"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {doctors.length === 0 ? (
                <MenuItem value="">No Doctors Available</MenuItem>
              ) : (
                doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "bank":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Bank"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {banks.length === 0 ? (
                <MenuItem value="">No Banks Available</MenuItem>
              ) : (
                banks.map((bank) => (
                  <MenuItem key={bank.id} value={bank.id}>
                    {bank.name} - {bank.accountUsername} ({bank.accountNo})
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "appointmentType":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Appointment Type"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={appointmentTypeId}
              onChange={(e) => setAppointmentTypeId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {fieldConfig.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        );

      case "reservationType":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Reservation Type"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={reservationTypeId}
              onChange={(e) => setReservationTypeId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {fieldConfig.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        );

      case "user":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select User"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {users.length === 0 ? (
                <MenuItem value="">No Users Available</MenuItem>
              ) : (
                users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} {user.userName ? `(${user.userName})` : ""}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "cashFlowType":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Cash Flow Type"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={cashFlowTypeId}
              onChange={(e) => setCashFlowTypeId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {cashFlowTypes.length === 0 ? (
                <MenuItem value="">No Cash Flow Types Available</MenuItem>
              ) : (
                cashFlowTypes.map((cashFlow) => (
                  <MenuItem key={cashFlow.id} value={cashFlow.id}>
                    {cashFlow.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "cashType":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Cash Type"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={cashType}
              onChange={(e) => setCashType(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {fieldConfig.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        );

      case "terminal":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Terminal"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={terminalId}
              onChange={(e) => setTerminalId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {terminals.length === 0 ? (
                <MenuItem value="">No Terminals Available</MenuItem>
              ) : (
                terminals.map((terminal) => (
                  <MenuItem key={terminal.id} value={terminal.id}>
                    {terminal.name} ({terminal.code})
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      case "reservation":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
              {fieldConfig.label || "Select Reservation"}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
            >
              {fieldConfig.allowAll !== false && <MenuItem value={0}>All</MenuItem>}
              {reservations.length === 0 ? (
                <MenuItem value="">No Reservations Available</MenuItem>
              ) : (
                reservations.map((reservation) => (
                  <MenuItem key={reservation.id} value={reservation.id}>
                    {reservation.documentNo || reservation.id} - {reservation.customerName || ""}
                  </MenuItem>
                ))
              )}
            </Select>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleOpen} aria-label="View" size="small">
          <Visibility color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container spacing={1}>
              <Grid item xs={12} my={2} display="flex" justifyContent="space-between">
                <Typography variant="h5" fontWeight="bold">
                  {config.title}
                </Typography>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  From
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  To
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Grid>

              {Object.entries(config.fields).map(([fieldName, fieldConfig]) =>
                renderField(fieldName, fieldConfig)
              )}

              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a
                  href={`${Report}/${docName}?${buildQueryParams()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="contained" disabled={!isFormValid()} aria-label="print" size="small">
                    Submit
                  </Button>
                </a>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

