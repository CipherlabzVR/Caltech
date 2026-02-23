import React, { useState } from "react";
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
import ReportSearchField from "@/components/utils/ReportSearchField";

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

  const [customerId, setCustomerId] = useState(config.fields.customer?.defaultValue || null);
  const [supplierId, setSupplierId] = useState(config.fields.supplier?.defaultValue || null);
  const [categoryId, setCategoryId] = useState(config.fields.category?.defaultValue || null);
  const [subCategoryId, setSubCategoryId] = useState(config.fields.subCategory?.defaultValue || null);
  const [itemId, setItemId] = useState(config.fields.item?.defaultValue || null);
  const [invoiceId, setInvoiceId] = useState(config.fields.invoice?.defaultValue || 0);
  const [paymentType, setPaymentType] = useState(config.fields.paymentType?.defaultValue || 0);
  const [status, setStatus] = useState(config.fields.status?.defaultValue || 0);
  const [fiscalPeriod, setFiscalPeriod] = useState(config.fields.fiscalPeriod?.defaultValue || 0);
  const [doctorId, setDoctorId] = useState(config.fields.doctor?.defaultValue || 0);
  const [bankId, setBankId] = useState(config.fields.bank?.defaultValue || 0);
  const [appointmentTypeId, setAppointmentTypeId] = useState(config.fields.appointmentType?.defaultValue || "");
  const [reservationTypeId, setReservationTypeId] = useState(config.fields.reservationType?.defaultValue || "");
  const [userId, setUserId] = useState(config.fields.user?.defaultValue || 0);
  const [cashFlowTypeId, setCashFlowTypeId] = useState(config.fields.cashFlowType?.defaultValue || 0);
  const [cashType, setCashType] = useState(config.fields.cashType?.defaultValue || 0);
  const [terminalId, setTerminalId] = useState(config.fields.terminal?.defaultValue || 0);
  const [reservationId, setReservationId] = useState(config.fields.reservation?.defaultValue || 0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFromDate("");
    setToDate("");
    setCustomerId(config.fields.customer?.defaultValue || null);
    setSupplierId(config.fields.supplier?.defaultValue || null);
    setCategoryId(config.fields.category?.defaultValue || null);
    setSubCategoryId(config.fields.subCategory?.defaultValue || null);
    setItemId(config.fields.item?.defaultValue || null);
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
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="customer"
              extraParams={{}}
              value={customerId}
              onChange={(id) => setCustomerId(id)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Customer"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "supplier":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="supplier"
              extraParams={{}}
              value={supplierId}
              onChange={(id) => {
                setSupplierId(id);
                if (config.fields.item?.enabled) setItemId(null);
              }}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Supplier"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "category":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="category"
              extraParams={{}}
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id);
                if (config.fields.subCategory?.enabled) setSubCategoryId(null);
                if (config.fields.item?.enabled) setItemId(null);
              }}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Category"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "subCategory":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="subCategory"
              extraParams={{ categoryId: categoryId || undefined }}
              value={subCategoryId}
              onChange={(id) => {
                setSubCategoryId(id);
                if (config.fields.item?.enabled) setItemId(null);
              }}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Sub Category"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "item":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="item"
              extraParams={{ supplierId: supplierId || undefined, categoryId: categoryId || undefined, subCategoryId: subCategoryId || undefined }}
              value={itemId}
              onChange={(id) => setItemId(id)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Item"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "invoice":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="invoice"
              extraParams={{ customerId: customerId || undefined }}
              value={invoiceId}
              onChange={(id) => setInvoiceId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Invoice"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
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
            <ReportSearchField
              filterType="fiscalPeriod"
              extraParams={{}}
              value={fiscalPeriod}
              onChange={(id) => setFiscalPeriod(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Fiscal Period"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "doctor":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="doctor"
              extraParams={{}}
              value={doctorId}
              onChange={(id) => setDoctorId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Doctor"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "bank":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="bank"
              extraParams={{}}
              value={bankId}
              onChange={(id) => setBankId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Bank"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
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
            <ReportSearchField
              filterType="user"
              extraParams={{}}
              value={userId}
              onChange={(id) => setUserId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select User"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "cashFlowType":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="cashFlowType"
              extraParams={{ bankTypeOnly: fieldConfig.bankTypeOnly }}
              value={cashFlowTypeId}
              onChange={(id) => setCashFlowTypeId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Cash Flow Type"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
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
            <ReportSearchField
              filterType="terminal"
              extraParams={{}}
              value={terminalId}
              onChange={(id) => setTerminalId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Terminal"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
          </Grid>
        );

      case "reservation":
        return (
          <Grid item {...gridSize} key={fieldName}>
            <ReportSearchField
              filterType="reservation"
              extraParams={{}}
              value={reservationId}
              onChange={(id) => setReservationId(id ?? 0)}
              allowAll={fieldConfig.allowAll}
              label={fieldConfig.label || "Select Reservation"}
              placeholder="Type to search..."
              required={fieldConfig.required}
            />
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

