/**
 * Shared configs for Inventory REPORT templates
 * (/report-template/report-template/?module=inventory).
 * Tier A: editable {{#lineItems}} columns + orientation
 * Tier C: orientation only (grouped / multi-row layouts)
 */

const LOGO =
  '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>';

const companySample = {
  companyLogo: LOGO,
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
};

const inventoryReportBreadcrumbs = (templateName) => [
  { label: "Report Template", href: "/report-template/report-template/" },
  {
    label: "Inventory",
    href: "/report-template/report-template/?module=inventory",
  },
  { label: templateName },
];

// ── Stock Balance Statement ─────────────────────────────────────
export const STOCK_BALANCE_CONFIG = {
  reportKey: "STOCKBALANCESTATEMENT",
  templateName: "Stock Balance Statement Template",
  breadcrumbs: inventoryReportBreadcrumbs("Stock Balance Statement Template"),
  sampleData: {
    ...companySample,
    generatedOn: "23-Jul-2026 11:30 AM",
    warehouseName: "Main",
    currentUser: "Admin",
    supplierFilter: "All Suppliers",
    categoryFilter: "All Categories",
    subCategoryFilter: "All Sub Categories",
    productFilter: "All Items",
    totalQty: "3,181",
    totalValue: "7,027,131.05",
  },
  fieldGroups: [
    {
      id: "product",
      title: "Product details",
      fields: [
        {
          token: "supplierName",
          label: "Supplier",
          header: "Supplier",
          numeric: false,
        },
        {
          token: "categoryName",
          label: "Category",
          header: "Category",
          numeric: false,
        },
        {
          token: "subCategoryName",
          label: "Sub Category",
          header: "Sub Category",
          numeric: false,
        },
        { token: "uom", label: "UOM", header: "UOM", numeric: false },
      ],
    },
    {
      id: "batch",
      title: "Batch / GRN",
      fields: [
        {
          token: "grnNumber",
          label: "GRN Number",
          header: "GRN Number",
          numeric: false,
        },
        { token: "batchNumber", label: "Batch", header: "Batch", numeric: false },
        {
          token: "expiryDate",
          label: "Expiry Date",
          header: "Expiry Date",
          numeric: false,
        },
      ],
    },
    {
      id: "value",
      title: "Qty & cost",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        { token: "unitCost", label: "Unit Cost", header: "Unit Cost", numeric: true },
        {
          token: "totalCost",
          label: "Total Cost",
          header: "Total Cost",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{supplierName}}</td>
            <td>{{categoryName}}</td>
            <td>{{subCategoryName}}</td>
            <td>{{uom}}</td>
            <td>{{grnNumber}}</td>
            <td>{{batchNumber}}</td>
            <td>{{expiryDate}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{unitCost}}</td>
            <td class="num">{{totalCost}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
      categoryName: "SUBLIMATION",
      subCategoryName: "AUDLEY",
      uom: "PCS",
      grnNumber: "GRN-000125",
      batchNumber: "B-001",
      expiryDate: "31-Dec-2027",
      qty: "120",
      unitCost: "1,250.00",
      totalCost: "150,000.00",
    },
    {
      supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
      categoryName: "SUBLIMATION",
      subCategoryName: "AUDLEY",
      uom: "PCS",
      grnNumber: "GRN-000198",
      batchNumber: "B-014",
      expiryDate: "15-Mar-2028",
      qty: "85",
      unitCost: "980.50",
      totalCost: "83,342.50",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Purchase Order Notes Summary ────────────────────────────────
export const PO_NOTES_SUMMARY_CONFIG = {
  reportKey: "PONOTESSUMMARY",
  templateName: "Purchase Order Notes Summary Template",
  breadcrumbs: inventoryReportBreadcrumbs(
    "Purchase Order Notes Summary Template"
  ),
  sampleData: {
    ...companySample,
    generatedOn: "23-Jul-2026 04:30 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "23-Jul-2026",
    supplierFilter: "All Suppliers",
    categoryFilter: "All Categories",
    subCategoryFilter: "All Sub Categories",
    productFilter: "All Items",
    statusFilter: "All Statuses",
    totalOrders: "2",
    totalQty: "150.00",
    totalAmount: "125,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Document details",
      fields: [
        { token: "poDate", label: "PO Date", header: "PO Date", numeric: false },
        {
          token: "purchaseOrderNo",
          label: "PO No",
          header: "PO No",
          numeric: false,
        },
        { token: "grnNo", label: "GRN No", header: "GRN No", numeric: false },
        {
          token: "supplierName",
          label: "Supplier",
          header: "Supplier",
          numeric: false,
        },
        {
          token: "referenceNo",
          label: "Reference",
          header: "Reference",
          numeric: false,
        },
        { token: "status", label: "Status", header: "Status", numeric: false },
      ],
    },
    {
      id: "totals",
      title: "Qty & amounts",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{poDate}}</td>
            <td>{{purchaseOrderNo}}</td>
            <td>{{grnNo}}</td>
            <td>{{supplierName}}</td>
            <td>{{referenceNo}}</td>
            <td>{{status}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{amount}}</td>
            <td>{{remark}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      poDate: "01-Jul-2026",
      purchaseOrderNo: "PO-000125",
      grnNo: "GRN-000098",
      supplierName: "ABC Suppliers",
      referenceNo: "REF-001",
      status: "GRN Completed",
      qty: "100.00",
      amount: "80,000.00",
      remark: "Urgent",
    },
    {
      poDate: "10-Jul-2026",
      purchaseOrderNo: "PO-000142",
      grnNo: "—",
      supplierName: "XYZ Traders",
      referenceNo: "REF-014",
      status: "Pending",
      qty: "50.00",
      amount: "45,000.00",
      remark: "—",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Goods Received Notes Summary ────────────────────────────────
export const GRN_NOTES_SUMMARY_CONFIG = {
  reportKey: "GRNNOTESSUMMARY",
  templateName: "Goods Received Notes Summary Template",
  breadcrumbs: inventoryReportBreadcrumbs(
    "Goods Received Notes Summary Template"
  ),
  sampleData: {
    ...companySample,
    generatedOn: "23-Jul-2026 04:45 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "23-Jul-2026",
    supplierFilter: "All Suppliers",
    categoryFilter: "All Categories",
    subCategoryFilter: "All Sub Categories",
    productFilter: "All Items",
    totalGrns: "2",
    totalQty: "175.00",
    totalAmount: "142,500.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Document details",
      fields: [
        {
          token: "grnDate",
          label: "GRN Date",
          header: "GRN Date",
          numeric: false,
        },
        {
          token: "documentNo",
          label: "GRN No",
          header: "GRN No",
          numeric: false,
        },
        {
          token: "purchaseOrderNo",
          label: "PO No",
          header: "PO No",
          numeric: false,
        },
        {
          token: "referenceNo",
          label: "Reference",
          header: "Reference",
          numeric: false,
        },
        {
          token: "supplierName",
          label: "Supplier",
          header: "Supplier",
          numeric: false,
        },
      ],
    },
    {
      id: "totals",
      title: "Qty & amounts",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{grnDate}}</td>
            <td>{{documentNo}}</td>
            <td>{{purchaseOrderNo}}</td>
            <td>{{referenceNo}}</td>
            <td>{{supplierName}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{amount}}</td>
            <td>{{remark}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      grnDate: "01-Jul-2026",
      documentNo: "GRN-000098",
      purchaseOrderNo: "PO-000125",
      referenceNo: "REF-001",
      supplierName: "ABC Suppliers",
      qty: "100.00",
      amount: "80,000.00",
      remark: "Urgent",
    },
    {
      grnDate: "12-Jul-2026",
      documentNo: "GRN-000112",
      purchaseOrderNo: "—",
      referenceNo: "REF-020",
      supplierName: "XYZ Traders",
      qty: "75.00",
      amount: "62,500.00",
      remark: "—",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Shipment Summary ────────────────────────────────────────────
export const SHIPMENT_SUMMARY_CONFIG = {
  reportKey: "SHIPMENTSUMMARY",
  templateName: "Shipment Summary Template",
  breadcrumbs: inventoryReportBreadcrumbs("Shipment Summary Template"),
  sampleData: {
    ...companySample,
    generatedOn: "23-Jul-2026 05:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "23-Jul-2026",
    supplierFilter: "All Suppliers",
    categoryFilter: "All Categories",
    subCategoryFilter: "All Sub Categories",
    productFilter: "All Items",
    statusFilter: "All Statuses",
    totalShipments: "2",
    totalQty: "160.00",
    totalAmount: "210,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Document details",
      fields: [
        {
          token: "shipmentDate",
          label: "Ship Date",
          header: "Ship Date",
          numeric: false,
        },
        {
          token: "documentNo",
          label: "Shipment No",
          header: "Shipment No",
          numeric: false,
        },
        {
          token: "purchaseOrderNos",
          label: "PO No",
          header: "PO No",
          numeric: false,
        },
        {
          token: "supplierName",
          label: "Supplier",
          header: "Supplier",
          numeric: false,
        },
        {
          token: "referenceNo",
          label: "Reference",
          header: "Reference",
          numeric: false,
        },
        { token: "status", label: "Status", header: "Status", numeric: false },
      ],
    },
    {
      id: "totals",
      title: "Qty & amounts",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{shipmentDate}}</td>
            <td>{{documentNo}}</td>
            <td>{{purchaseOrderNos}}</td>
            <td>{{supplierName}}</td>
            <td>{{referenceNo}}</td>
            <td>{{status}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{amount}}</td>
            <td>{{remark}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      shipmentDate: "02-Jul-2026",
      documentNo: "SHP-000045",
      purchaseOrderNos: "PO-000125",
      supplierName: "ABC Suppliers",
      referenceNo: "REF-S01",
      status: "Dispatched",
      qty: "100.00",
      amount: "120,000.00",
      remark: "Sea freight",
    },
    {
      shipmentDate: "15-Jul-2026",
      documentNo: "SHP-000052",
      purchaseOrderNos: "PO-000142",
      supplierName: "XYZ Traders",
      referenceNo: "REF-S08",
      status: "Ordered",
      qty: "60.00",
      amount: "90,000.00",
      remark: "—",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

/** Helper props for thin ReportTemplateEditor pages (Tier A). */
export const editorPropsFromConfig = (config) => ({
  reportKey: config.reportKey,
  templateName: config.templateName,
  pageTitle: config.templateName,
  breadcrumbs: config.breadcrumbs,
  sampleData: config.sampleData,
  sampleLineItems: config.sampleLineItems,
  buildLineTokenMap: config.buildLineTokenMap,
  fieldGroups: config.fieldGroups,
  defaultLineItemsBlock: config.defaultLineItemsBlock,
  enableOrientation: true,
});

/** Tier C — Stock Movement (grouped product blocks). */
export const STOCK_MOVEMENT_META = {
  reportKey: "STOCKMOVEMENTREPORT",
  templateName: "Stock Movement Report Template",
  breadcrumbs: inventoryReportBreadcrumbs("Stock Movement Report Template"),
  sampleData: {
    ...companySample,
    generatedOn: "23-Jul-2026 03:30 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "23-Jul-2026",
    supplierFilter: "All Suppliers",
    categoryFilter: "All Categories",
    subCategoryFilter: "All Sub Categories",
    productFilter: "All Items",
    totalQtyIn: "135.00",
    totalQtyOut: "15.00",
  },
  sampleRows: `
  <tr class="item-header"><td colspan="9">0000000100 - XP 600 BRAND NEW PRINT HEAD</td></tr>
  <tr class="stock-mark"><td>Start Stock</td><td>—</td><td>—</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>—</td><td class="num">0.00</td><td class="num">0.00</td><td class="num">100.00</td></tr>
  <tr><td>01-Jul-2026</td><td>GRN-000125</td><td>GoodReceivedNote</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>B-001</td><td class="num">120.00</td><td class="num">0.00</td><td class="num">220.00</td></tr>
  <tr><td>05-Jul-2026</td><td>INV-000482</td><td>Invoice</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>B-001</td><td class="num">0.00</td><td class="num">15.00</td><td class="num">205.00</td></tr>
  <tr class="stock-mark"><td>End Stock</td><td>—</td><td>—</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>—</td><td class="num">0.00</td><td class="num">0.00</td><td class="num">205.00</td></tr>
`,
};
