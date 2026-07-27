import React from "react";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import TemplateModuleBrowser from "@/components/ReportTemplate/TemplateModuleBrowser";

// Screen-based print templates grouped by ERP module.
// Add more modules / templates here as they are built.
const SCREEN_TEMPLATE_MODULES = [
  {
    key: "inventory",
    title: "Inventory",
    icon: <Inventory2OutlinedIcon color="primary" />,
    templates: [
      {
        key: "grn",
        title: "GRN Print Template",
        description: "Goods Received Note",
        path: "/report-template/grn/",
      },
      {
        key: "purchase-order",
        title: "Purchase Order Print Template",
        description: "Purchase Order",
        path: "/report-template/purchase-order/",
      },
      {
        key: "grn-return",
        title: "Goods Return Note Print Template",
        description: "Goods Return Note",
        path: "/report-template/grn-return/",
      },
      {
        key: "shipment",
        title: "Shipment Print Template",
        description: "Shipment Note",
        path: "/report-template/shipment/",
      },
      {
        key: "stock-dispatch",
        title: "Stock Dispatch Print Template",
        description: "Stock Dispatch",
        path: "/report-template/stock-dispatch/",
      },
      {
        key: "stock-adjustment",
        title: "Stock Adjustment Print Template",
        description: "Stock Adjustment",
        path: "/report-template/stock-adjustment/",
      },
      {
        key: "stock-details",
        title: "Stock Details Print Template",
        description: "Stock Details List",
        path: "/report-template/stock-details/",
      },
      {
        key: "stock-details-item",
        title: "Stock Details Item Print Template",
        description: "Stock Details per Item",
        path: "/report-template/stock-details-item/",
      },
    ],
  },
  {
    key: "sales",
    title: "Sales",
    icon: <PointOfSaleOutlinedIcon color="primary" />,
    templates: [
      {
        key: "invoice",
        title: "Invoice Print Template",
        description: "Sales Invoice",
        path: "/report-template/invoice/",
      },
      {
        key: "sales-order",
        title: "Sales Order Print Template",
        description: "Sales Order",
        path: "/report-template/sales-order/",
      },
      {
        key: "sales-quotation",
        title: "Sales Quotation Print Template",
        description: "Sales Quotation",
        path: "/report-template/sales-quotation/",
      },
      {
        key: "daily-deposit",
        title: "Daily Deposit Print Template",
        description: "Daily Deposit",
        path: "/report-template/daily-deposit/",
      },
      {
        key: "credit-note",
        title: "Customer Note Print Template",
        description: "Credit / Debit Note",
        path: "/report-template/credit-note/",
      },
      {
        key: "receipt",
        title: "Receipts Print Template",
        description: "Sales Receipt",
        path: "/report-template/receipt/",
      },
      {
        key: "shift",
        title: "Shift Print Template",
        description: "Shift End Report",
        path: "/report-template/shift/",
      },
      {
        key: "shipment-invoice",
        title: "Shipment Invoice Print Template",
        description: "Shipment Invoice",
        path: "/report-template/shipment-invoice/",
      },
      {
        key: "day-end",
        title: "Day End Print Template",
        description: "Day End Report",
        path: "/report-template/day-end/",
      },
      {
        key: "sales-return",
        title: "Sales Return Print Template",
        description: "Sales Return",
        path: "/report-template/sales-return/",
      },
      {
        key: "pos-day-end",
        title: "POS Day End Print Template",
        description: "POS Day End Report",
        path: "/report-template/pos-day-end/",
      },
      {
        key: "cash-in-out",
        title: "Cash In/Out Print Template",
        description: "Cash In/Out",
        path: "/report-template/cash-in-out/",
      },
      {
        key: "daily-outstandings",
        title: "Daily Outstandings Print Template",
        description: "Daily Customer Outstanding",
        path: "/report-template/daily-outstandings/",
      },
    ],
  },
  {
    key: "service",
    title: "Service Management",
    icon: <BuildOutlinedIcon color="primary" />,
    templates: [
      {
        key: "service-job-card",
        title: "Service Job Card Print Template",
        description: "Service Job Card (intake)",
        path: "/report-template/service-job-card/",
      },
      {
        key: "service-repair-estimate",
        title: "Service Repair Estimate Print Template",
        description: "Customer repair estimate / bill",
        path: "/report-template/service-repair-estimate/",
      },
      {
        key: "service-intake-receipt",
        title: "Service Intake Receipt Print Template",
        description: "Device handover receipt",
        path: "/report-template/service-intake-receipt/",
      },
      {
        key: "service-work-authorization",
        title: "Work Authorization Print Template",
        description: "Approved work authorization",
        path: "/report-template/service-work-authorization/",
      },
      {
        key: "service-invoice",
        title: "Service Invoice Print Template",
        description: "Service Invoice",
        path: "/report-template/service-invoice/",
      },
      {
        key: "service-purchase-invoice",
        title: "Purchase Invoice Print Template",
        description: "Service Purchase Invoice",
        path: "/report-template/service-purchase-invoice/",
      },
    ],
  },
];

export default function ScreensTemplatePage() {
  return (
    <TemplateModuleBrowser
      pageTitle="Screens Template"
      basePath="/report-template/screens-template"
      modules={SCREEN_TEMPLATE_MODULES}
    />
  );
}
