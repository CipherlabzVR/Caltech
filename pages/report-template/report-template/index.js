import React from "react";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import TemplateModuleBrowser from "@/components/ReportTemplate/TemplateModuleBrowser";

// Report (document) templates grouped by ERP module.
const REPORT_TEMPLATE_MODULES = [
  {
    key: "inventory",
    title: "Inventory",
    icon: <Inventory2OutlinedIcon color="primary" />,
    templates: [
      {
        key: "stock-balance-statement",
        title: "Stock Balance Statement Template",
        description: "Inventory Stock Balance Statement",
        path: "/report-template/stock-balance-statement/",
      },
      {
        key: "stock-movement-report",
        title: "Stock Movement Report Template",
        description: "Inventory Stock Movement Report",
        path: "/report-template/stock-movement-report/",
      },
      {
        key: "purchase-order-notes-summary",
        title: "Purchase Order Notes Summary Template",
        description: "Inventory Purchase Order Notes Summary Report",
        path: "/report-template/purchase-order-notes-summary/",
      },
      {
        key: "goods-received-notes-summary",
        title: "Goods Received Notes Summary Template",
        description: "Inventory Goods Received Notes Summary Report",
        path: "/report-template/goods-received-notes-summary/",
      },
      {
        key: "shipment-summary",
        title: "Shipment Summary Template",
        description: "Inventory Shipment Summary Report",
        path: "/report-template/shipment-summary/",
      },
    ],
  },
  {
    key: "sales",
    title: "Sales",
    icon: <PointOfSaleOutlinedIcon color="primary" />,
    templates: [
      {
        key: "sales-summary",
        title: "Sales Summary Template",
        description: "Sales Summary Report",
        path: "/report-template/sales-summary/",
      },
      {
        key: "customer-payment-summary",
        title: "Customer Payment Summary Template",
        description: "Customer Payment Summary Report",
        path: "/report-template/customer-payment-summary/",
      },
      {
        key: "outstanding-report",
        title: "Outstanding Report Template",
        description: "Customer Outstanding Report",
        path: "/report-template/outstanding-report/",
      },
    ],
  },
  {
    key: "finance",
    title: "Finance",
    icon: <AccountBalanceOutlinedIcon color="primary" />,
    templates: [
      {
        key: "shift-summary",
        title: "Shift Summary Template",
        description: "Finance Shift Summary Report",
        path: "/report-template/shift-summary/",
      },
      {
        key: "bank-history",
        title: "Bank History Template",
        description: "Finance Bank History Report",
        path: "/report-template/bank-history/",
      },
      {
        key: "cash-book-summary",
        title: "Cash Book Summary Template",
        description: "Finance Cash Book Summary Report",
        path: "/report-template/cash-book-summary/",
      },
      {
        key: "cash-flow-summary",
        title: "Cash Flow Summary Template",
        description: "Finance Cash Flow Summary Report",
        path: "/report-template/cash-flow-summary/",
      },
      {
        key: "profitability-report",
        title: "Profitability Report Template",
        description: "Finance Profitability Report",
        path: "/report-template/profitability-report/",
      },
      {
        key: "company-wise-profit",
        title: "Company Wise Profit Template",
        description: "Finance Company Wise Profit Report",
        path: "/report-template/company-wise-profit/",
      },
    ],
  },
];

export default function ReportTemplatePage() {
  return (
    <TemplateModuleBrowser
      pageTitle="Report Template"
      basePath="/report-template/report-template"
      modules={REPORT_TEMPLATE_MODULES}
      emptyMessage="No report templates have been configured yet."
    />
  );
}
