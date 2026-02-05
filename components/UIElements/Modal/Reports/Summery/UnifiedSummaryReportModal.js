import React, { useEffect, useState, useRef } from "react";
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
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import useApi from "@/components/utils/useApi";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import {
  DEFAULT_PAGE_SIZE,
  filterTopMatches,
  filterTopMatchesWithLoadMore,
  withAllOption,
} from "@/components/utils/autocompleteTopMatches";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "94vw", sm: "80vw", md: 520, lg: 600 },
  maxWidth: 720,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
};

const renderAutocompleteOption = (props, option) => (
  <li
    {...props}
    style={
      option?.__loadMore ? { justifyContent: "center", fontWeight: 600 } : props.style
    }
  >
    {option.label}
  </li>
);

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
      supplier: { enabled: true, required: false, label: "Select Supplier", paramName: "supplier", allowAll: false },
      category: { enabled: true, required: false, label: "Select Category", paramName: "category", allowAll: false },
      subCategory: { enabled: true, required: false, label: "Select Sub Category", paramName: "subCategory", allowAll: false },
      item: { enabled: true, required: false, label: "Select Item", paramName: "item", allowAll: false },
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
  const [customerId, setCustomerId] = useState(config.fields.customer?.defaultValue || null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(config.fields.supplier?.defaultValue || null);
  const [supplierSearchInput, setSupplierSearchInput] = useState("");
  const supplierSearchDebounceRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(config.fields.category?.defaultValue || null);
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const categorySearchDebounceRef = useRef(null);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryId, setSubCategoryId] = useState(config.fields.subCategory?.defaultValue || null);
  const [subCategorySearchInput, setSubCategorySearchInput] = useState("");
  const subCategorySearchDebounceRef = useRef(null);
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState(config.fields.item?.defaultValue || null);
  const [itemSearchInput, setItemSearchInput] = useState("");
  const itemSearchDebounceRef = useRef(null);
  const itemFilterDebounceRef = useRef(null);
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
  const [optionLimits, setOptionLimits] = useState({});

  const getLimit = (field) => optionLimits[field] || DEFAULT_PAGE_SIZE;
  const incLimit = (field) =>
    setOptionLimits((prev) => ({
      ...prev,
      [field]: (prev[field] || DEFAULT_PAGE_SIZE) + DEFAULT_PAGE_SIZE,
    }));

  const handleOpen = () => {
    setOptionLimits({});
    // Clear all fields and search when opening modal
    setItems([]);
    setItemSearchInput("");
    setSuppliers([]);
    setSupplierSearchInput("");
    setCategories([]);
    setCategorySearchInput("");
    setSubCategories([]);
    setSubCategorySearchInput("");
    if (itemSearchDebounceRef.current) {
      clearTimeout(itemSearchDebounceRef.current);
    }
    if (supplierSearchDebounceRef.current) {
      clearTimeout(supplierSearchDebounceRef.current);
    }
    if (categorySearchDebounceRef.current) {
      clearTimeout(categorySearchDebounceRef.current);
    }
    if (subCategorySearchDebounceRef.current) {
      clearTimeout(subCategorySearchDebounceRef.current);
    }
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setOptionLimits({});
    setFromDate("");
    setToDate("");
    setCustomerId(config.fields.customer?.defaultValue || null);
    setSupplierId(config.fields.supplier?.defaultValue || null);
    setSupplierSearchInput("");
    setSuppliers([]);
    setCategoryId(config.fields.category?.defaultValue || null);
    setCategorySearchInput("");
    setCategories([]);
    setSubCategoryId(config.fields.subCategory?.defaultValue || null);
    setSubCategorySearchInput("");
    setSubCategories([]);
    setItemId(config.fields.item?.defaultValue || null);
    setItemSearchInput("");
    setItems([]);
    if (itemSearchDebounceRef.current) {
      clearTimeout(itemSearchDebounceRef.current);
    }
    if (itemFilterDebounceRef.current) {
      clearTimeout(itemFilterDebounceRef.current);
    }
    if (supplierSearchDebounceRef.current) {
      clearTimeout(supplierSearchDebounceRef.current);
    }
    if (categorySearchDebounceRef.current) {
      clearTimeout(categorySearchDebounceRef.current);
    }
    if (subCategorySearchDebounceRef.current) {
      clearTimeout(subCategorySearchDebounceRef.current);
    }
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
    // Only load suppliers automatically if allowAll is true (not for StockMovementReport)
    if (supplierList && config.fields.supplier?.enabled && config.fields.supplier?.allowAll !== false) {
      setSuppliers(supplierList);
    }
    // Only load categories automatically if allowAll is true (not for StockMovementReport)
    if (categoryList && config.fields.category?.enabled && config.fields.category?.allowAll !== false) {
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
  }, [terminalList, customerList, supplierList, categoryList, doctorList, bankList, fiscalPeriodList, userList, cashFlowTypeList, config]);

  const handleGetSupplierItems = async (id) => {
    setItemId(null);
    handleGetFilteredItems(id || 0, categoryId || 0, subCategoryId || 0);
  };

  const handleGetSubCategories = async (id) => {
    setItemId(null);
    setSubCategoryId(null);
    handleGetFilteredItems(supplierId || 0, id || 0, 0);
    // Only auto-load subcategories if allowAll is true
    if (config.fields.subCategory?.allowAll !== false) {
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
    }
  };

  const handleGetFilteredItems = async (supplier, category, subCategory) => {
    setItemId(null);
    setItems([]);
    // Clear any pending search
    if (itemSearchDebounceRef.current) {
      clearTimeout(itemSearchDebounceRef.current);
    }
    setItemSearchInput("");
  };

  const fetchSuppliersWithSearch = async (searchTerm) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Supplier/GetAllSupplier?Search=${encodeURIComponent(searchTerm || "")}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch suppliers");
      const data = await response.json();
      setSuppliers(data.result || []);
    } catch (error) {
      console.error("Error:", error);
      setSuppliers([]);
    }
  };

  const fetchCategoriesWithSearch = async (searchTerm) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Category/GetAllCategory?Search=${encodeURIComponent(searchTerm || "")}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.result || []);
    } catch (error) {
      console.error("Error:", error);
      setCategories([]);
    }
  };

  const fetchSubCategoriesWithSearch = async (searchTerm, categoryIdParam) => {
    try {
      const token = localStorage.getItem("token");
      let query;
      if (categoryIdParam) {
        query = `${BASE_URL}/SubCategory/GetAllSubCategoriesByCategoryId?categoryId=${categoryIdParam}`;
      } else {
        query = `${BASE_URL}/SubCategory/GetAllSubCategory`;
      }
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch sub categories");
      const data = await response.json();
      let fetchedSubCategories = data.result || [];
      // Filter by category if provided
      if (categoryIdParam) {
        fetchedSubCategories = fetchedSubCategories.filter(sc => sc.categoryId === categoryIdParam);
      }
      // Client-side filtering by search term
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        fetchedSubCategories = fetchedSubCategories.filter(sc => 
          (sc.name || "").toLowerCase().includes(searchLower)
        );
      }
      setSubCategories(fetchedSubCategories);
    } catch (error) {
      console.error("Error:", error);
      setSubCategories([]);
    }
  };

  const fetchItemsWithSearch = async (searchTerm) => {
    try {
      const token = localStorage.getItem("token");
      let query;
      let fetchedItems = [];
      
      // Optimize API selection based on filters and search term
      if (searchTerm && searchTerm.trim()) {
        // If search term exists and supplier is set, use optimized API
        if (supplierId) {
          query = `${BASE_URL}/Items/GetAllItemsBySupplierIdAndName?supplierId=${supplierId}&keyword=${encodeURIComponent(searchTerm.trim())}`;
        } else {
          // Use GetAllItemsByName for search (returns 5 items, but faster)
          query = `${BASE_URL}/Items/GetAllItemsByName?keyword=${encodeURIComponent(searchTerm.trim())}`;
        }
        
        const response = await fetch(query, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        fetchedItems = data.result || [];
        
        // Apply additional filters client-side if needed (category, subCategory)
        if (categoryId) {
          fetchedItems = fetchedItems.filter(item => item.categoryId === categoryId || item.CategoryId === categoryId);
        }
        if (subCategoryId) {
          fetchedItems = fetchedItems.filter(item => item.subCategoryId === subCategoryId || item.SubCategoryId === subCategoryId);
        }
      } else {
        // No search term - use GetFilteredItems for better performance when filters are set
        if (supplierId || categoryId || subCategoryId) {
          query = `${BASE_URL}/Items/GetFilteredItems?supplier=${supplierId || 0}&category=${categoryId || 0}&subCategory=${subCategoryId || 0}`;
          const response = await fetch(query, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) throw new Error("Failed to fetch items");
          const data = await response.json();
          fetchedItems = data.result || [];
        } else {
          // No filters and no search - don't load anything
          setItems([]);
          return;
        }
      }
      
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error:", error);
      setItems([]);
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (itemSearchDebounceRef.current) {
        clearTimeout(itemSearchDebounceRef.current);
      }
      if (itemFilterDebounceRef.current) {
        clearTimeout(itemFilterDebounceRef.current);
      }
      if (supplierSearchDebounceRef.current) {
        clearTimeout(supplierSearchDebounceRef.current);
      }
      if (categorySearchDebounceRef.current) {
        clearTimeout(categorySearchDebounceRef.current);
      }
      if (subCategorySearchDebounceRef.current) {
        clearTimeout(subCategorySearchDebounceRef.current);
      }
    };
  }, []);

  // Clear items when filters change - items will load only when user types (with debounce)
  useEffect(() => {
    if (config.fields.item?.enabled) {
      // Clear items and search input when filters change
      setItems([]);
      setItemSearchInput("");
      // Clear any pending search debounce
      if (itemSearchDebounceRef.current) {
        clearTimeout(itemSearchDebounceRef.current);
      }
      // Clear any pending filter debounce
      if (itemFilterDebounceRef.current) {
        clearTimeout(itemFilterDebounceRef.current);
      }
    }
  }, [supplierId, categoryId, subCategoryId]);

  // Clear subCategories when category changes
  useEffect(() => {
    if (config.fields.subCategory?.enabled && config.fields.subCategory?.allowAll === false) {
      setSubCategories([]);
      setSubCategorySearchInput("");
      setSubCategoryId(null);
      if (subCategorySearchDebounceRef.current) {
        clearTimeout(subCategorySearchDebounceRef.current);
      }
    }
  }, [categoryId]);

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
      const query = `${BASE_URL}/Reservation/GetAllReservationSkipAndTake?SkipCount=0&MaxResultCount=1000&Search=null&appointmentType=0&bridalType=0`;
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
      params.append(config.fields.supplier.paramName || "supplier", supplierId || 0);
    }
    if (config.fields.category?.enabled) {
      params.append(config.fields.category.paramName || "category", categoryId || 0);
    }
    if (config.fields.subCategory?.enabled) {
      params.append(config.fields.subCategory.paramName || "subCategory", subCategoryId || 0);
    }
    if (config.fields.item?.enabled) {
      params.append(config.fields.item.paramName || "item", itemId || 0);
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
        {
          const customerOptions = withAllOption(
            customers.map((c) => ({
              id: c.id,
              label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || String(c.id),
            })),
            fieldConfig.allowAll
          );
          const value = customerOptions.find((o) => o.id === customerId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Customer"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={customerOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  handleSelectCustomer(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

      case "supplier":
        {
          const supplierOptions = withAllOption(
            suppliers.map((s) => ({ id: s.id, label: s.name || String(s.id) })),
            fieldConfig.allowAll
          );
          const value = supplierOptions.find((o) => o.id === supplierId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Supplier"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect={fieldConfig.allowAll !== false}
                fullWidth
                size="small"
                options={supplierOptions}
                value={value}
                onInputChange={(_, newInputValue, reason) => {
                  if (fieldConfig.allowAll === false) {
                    // Only trigger search on user input, not when clearing, resetting, or selecting
                    if (reason === "input") {
                      // Clear previous debounce
                      if (supplierSearchDebounceRef.current) {
                        clearTimeout(supplierSearchDebounceRef.current);
                      }
                      // Set new debounce
                      supplierSearchDebounceRef.current = setTimeout(() => {
                        fetchSuppliersWithSearch(newInputValue);
                      }, 300);
                    } else if (reason === "clear") {
                      setSuppliers([]);
                      setSupplierId(null);
                      if (supplierSearchDebounceRef.current) {
                        clearTimeout(supplierSearchDebounceRef.current);
                      }
                    }
                  }
                }}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  const id = opt?.id ?? null;
                  setSupplierId(id);
                  if (config.fields.item?.enabled) handleGetSupplierItems(id || 0);
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!option || !val) return false;
                  return option.id === val.id;
                }}
                filterOptions={fieldConfig.allowAll === false ? (options) => options : (options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText={fieldConfig.allowAll === false ? "Type supplier name to search" : "No matches"}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type supplier name to search" />
                )}
              />
            </Grid>
          );
        }

      case "category":
        {
          const categoryOptions = withAllOption(
            categories.map((c) => ({ id: c.id, label: c.name || String(c.id) })),
            fieldConfig.allowAll
          );
          const value = categoryOptions.find((o) => o.id === categoryId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Category"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect={fieldConfig.allowAll !== false}
                fullWidth
                size="small"
                options={categoryOptions}
                value={value}
                onInputChange={(_, newInputValue, reason) => {
                  if (fieldConfig.allowAll === false) {
                    // Only trigger search on user input, not when clearing, resetting, or selecting
                    if (reason === "input") {
                      // Clear previous debounce
                      if (categorySearchDebounceRef.current) {
                        clearTimeout(categorySearchDebounceRef.current);
                      }
                      // Set new debounce
                      categorySearchDebounceRef.current = setTimeout(() => {
                        fetchCategoriesWithSearch(newInputValue);
                      }, 300);
                    } else if (reason === "clear") {
                      setCategories([]);
                      setCategoryId(null);
                      if (categorySearchDebounceRef.current) {
                        clearTimeout(categorySearchDebounceRef.current);
                      }
                    }
                  }
                }}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  const id = opt?.id ?? null;
                  setCategoryId(id);
                  if (config.fields.subCategory?.enabled) handleGetSubCategories(id || 0);
                  if (config.fields.item?.enabled) handleGetFilteredItems(supplierId || 0, id || 0, subCategoryId || 0);
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!option || !val) return false;
                  return option.id === val.id;
                }}
                filterOptions={fieldConfig.allowAll === false ? (options) => options : (options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText={fieldConfig.allowAll === false ? "Type category name to search" : "No matches"}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type category name to search" />
                )}
              />
            </Grid>
          );
        }

      case "subCategory":
        {
          const subCategoryOptions = withAllOption(
            subCategories.map((c) => ({ id: c.id, label: c.name || String(c.id) })),
            fieldConfig.allowAll
          );
          const value = subCategoryOptions.find((o) => o.id === subCategoryId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Sub Category"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect={fieldConfig.allowAll !== false}
                fullWidth
                size="small"
                options={subCategoryOptions}
                value={value}
                onInputChange={(_, newInputValue, reason) => {
                  if (fieldConfig.allowAll === false) {
                    // Only trigger search on user input, not when clearing, resetting, or selecting
                    if (reason === "input") {
                      // Clear previous debounce
                      if (subCategorySearchDebounceRef.current) {
                        clearTimeout(subCategorySearchDebounceRef.current);
                      }
                      // Set new debounce
                      subCategorySearchDebounceRef.current = setTimeout(() => {
                        fetchSubCategoriesWithSearch(newInputValue, categoryId);
                      }, 300);
                    } else if (reason === "clear") {
                      setSubCategories([]);
                      setSubCategoryId(null);
                      if (subCategorySearchDebounceRef.current) {
                        clearTimeout(subCategorySearchDebounceRef.current);
                      }
                    }
                  }
                }}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  const id = opt?.id ?? null;
                  setSubCategoryId(id);
                  if (config.fields.item?.enabled) handleGetFilteredItems(supplierId || 0, categoryId || 0, id || 0);
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!option || !val) return false;
                  return option.id === val.id;
                }}
                filterOptions={fieldConfig.allowAll === false ? (options) => options : (options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText={fieldConfig.allowAll === false ? "Type sub category name to search" : "No matches"}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type sub category name to search" />
                )}
              />
            </Grid>
          );
        }

      case "item":
        {
          const itemOptions = withAllOption(
            items.map((i) => ({ id: i.id, label: i.name || String(i.id) })),
            fieldConfig.allowAll
          );
          
          const value = itemOptions.find((o) => o.id === itemId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Item"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect={fieldConfig.allowAll !== false}
                fullWidth
                size="small"
                options={itemOptions}
                value={value}
                onInputChange={(_, newInputValue, reason) => {
                  // Only trigger search on user input, not when clearing, resetting, or selecting
                  if (reason === "input") {
                    // Clear previous debounce
                    if (itemSearchDebounceRef.current) {
                      clearTimeout(itemSearchDebounceRef.current);
                    }
                    // Set new debounce
                    itemSearchDebounceRef.current = setTimeout(() => {
                      fetchItemsWithSearch(newInputValue);
                    }, 300);
                  } else if (reason === "clear") {
                    setItems([]);
                    setItemId(null);
                    if (itemSearchDebounceRef.current) {
                      clearTimeout(itemSearchDebounceRef.current);
                    }
                  }
                }}
                onChange={(event, opt, reason) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  // Handle selection
                  if (reason === "selectOption") {
                    setItemId(opt?.id ?? null);
                  } else if (reason === "clear") {
                    setItemId(null);
                    setItems([]);
                  }
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!option || !val) return false;
                  return option.id === val.id;
                }}
                filterOptions={(options) => options} // Disable client-side filtering since we're doing server-side search
                renderOption={renderAutocompleteOption}
                noOptionsText={fieldConfig.allowAll === false ? "Type item name to search" : "Type to search items..."}
                renderInput={(params) => (
                  <TextField {...params} placeholder={fieldConfig.allowAll === false ? "Type item name to search" : "Type to search..."} />
                )}
              />
            </Grid>
          );
        }

      case "invoice":
        {
          const invoiceOptions = withAllOption(
            invoices.map((inv) => ({
              id: inv.id,
              label: `${inv.documentNo || inv.id} - ${formatCurrency(inv.grossTotal)}`,
            })),
            fieldConfig.allowAll
          );
          const value = invoiceOptions.find((o) => o.id === invoiceId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Invoice"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={invoiceOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setInvoiceId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

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
        {
          const periodOptions = withAllOption(
            fiscalPeriods.map((p) => ({
              id: p.id,
              label: `${formatDate(p.startDate)} - ${p.endDate ? formatDate(p.endDate) : "Still Active"}`,
            })),
            fieldConfig.allowAll
          );
          const value = periodOptions.find((o) => o.id === fiscalPeriod) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Fiscal Period"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={periodOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setFiscalPeriod(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

      case "doctor":
        {
          const doctorOptions = withAllOption(
            doctors.map((d) => ({ id: d.id, label: d.name || String(d.id) })),
            fieldConfig.allowAll
          );
          const value = doctorOptions.find((o) => o.id === doctorId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Doctor"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={doctorOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setDoctorId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

      case "bank":
        {
          const bankOptions = withAllOption(
            banks.map((b) => ({
              id: b.id,
              label: `${b.name || ""} - ${b.accountUsername || ""} (${b.accountNo || ""})`.trim() || String(b.id),
            })),
            fieldConfig.allowAll
          );
          const value = bankOptions.find((o) => o.id === bankId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Bank"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={bankOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setBankId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

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
        {
          const userOptions = withAllOption(
            users.map((u) => ({
              id: u.id,
              label: `${u.firstName || ""} ${u.lastName || ""} ${u.userName ? `(${u.userName})` : ""}`.trim() || String(u.id),
            })),
            fieldConfig.allowAll
          );
          const value = userOptions.find((o) => o.id === userId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select User"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={userOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setUserId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

      case "cashFlowType":
        {
          const cashFlowOptions = withAllOption(
            cashFlowTypes.map((c) => ({ id: c.id, label: c.name || String(c.id) })),
            fieldConfig.allowAll
          );
          const value = cashFlowOptions.find((o) => o.id === cashFlowTypeId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Cash Flow Type"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={cashFlowOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setCashFlowTypeId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

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
        {
          const terminalOptions = withAllOption(
            terminals.map((t) => ({ id: t.id, label: `${t.name || ""} (${t.code || ""})`.trim() || String(t.id) })),
            fieldConfig.allowAll
          );
          const value = terminalOptions.find((o) => o.id === terminalId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Terminal"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={terminalOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setTerminalId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

      case "reservation":
        {
          const reservationOptions = withAllOption(
            reservations.map((r) => ({
              id: r.id,
              label: `${r.documentNo || r.id} - ${r.customerName || ""}`.trim(),
            })),
            fieldConfig.allowAll
          );
          const value = reservationOptions.find((o) => o.id === reservationId) || null;

          return (
            <Grid item {...gridSize} key={fieldName}>
              <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                {fieldConfig.label || "Select Reservation"}
              </Typography>
              <Autocomplete
                disableCloseOnSelect
                fullWidth
                size="small"
                options={reservationOptions}
                value={value}
                onChange={(_, opt) => {
                  if (opt?.__loadMore) {
                    incLimit(fieldName);
                    return;
                  }
                  setReservationId(opt?.id ?? 0);
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(options, state) =>
                  filterTopMatchesWithLoadMore(options, state.inputValue, getLimit(fieldName))
                }
                renderOption={renderAutocompleteOption}
                noOptionsText="No matches"
                renderInput={(params) => (
                  <TextField {...params} placeholder="Type to search..." />
                )}
              />
            </Grid>
          );
        }

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

