/**
 * Shared configs for Sales screen print templates.
 * Tier A: editable {{#lineItems}} columns + orientation
 * Tier C/D: orientation only (complex / multi-table / no lines)
 */

const LOGO =
  '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>';

const companySample = {
  companyLogo: LOGO,
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
};

const salesBreadcrumbs = (templateName) => [
  { label: "Screens Template", href: "/report-template/screens-template/" },
  { label: "Sales", href: "/report-template/screens-template/?module=sales" },
  { label: templateName },
];

// ── Invoice ─────────────────────────────────────────────────────
export const INVOICE_CONFIG = {
  reportKey: "INVOICE",
  templateName: "Invoice Print Template",
  breadcrumbs: salesBreadcrumbs("Invoice Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "INV-000789",
    customerName: "Kamal Fernando",
    invoiceDate: "30-Jun-2026",
    remark: "Thank you",
    paymentType: "Cash",
    warehouseName: "Main Warehouse",
    createdBy: "John Perera",
    salesPerson: "Nimal Silva",
    grossTotal: "55,000.00",
    discountPercent: "5.00",
    totalDiscount: "2,750.00",
    netTotal: "52,250.00",
    paymentAmount: "52,250.00",
    balance: "0.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        {
          token: "productName",
          label: "Item",
          header: "Item",
          numeric: false,
          cellHtml: "{{productName}}<br/>{{productCode}}",
        },
        { token: "productCode", label: "Item Code", header: "Item Code", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [{ token: "qty", label: "Qty", header: "Qty", numeric: true }],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
        {
          token: "discountPercentage",
          label: "Discount %",
          header: "Dis%",
          numeric: true,
        },
        {
          token: "discountAmount",
          label: "Discount Amt",
          header: "Dis Amt",
          numeric: true,
        },
        { token: "lineTotal", label: "Line Total", header: "Line Total", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{productName}}<br/>{{productCode}}</td>
          <td class="num">{{qty}}</td>
          <td class="num">{{unitPrice}}</td>
          <td class="num">{{discountPercentage}}</td>
          <td class="num">{{discountAmount}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      productName: "A4 Copy Paper 80gsm",
      productCode: "ITM-1001",
      qty: "20",
      unitPrice: "850.00",
      discountPercentage: "0.00",
      discountAmount: "0.00",
      lineTotal: "17,000.00",
    },
    {
      productName: "Blue Ball Pen",
      productCode: "ITM-1002",
      qty: "100",
      unitPrice: "45.00",
      discountPercentage: "5.00",
      discountAmount: "225.00",
      lineTotal: "4,275.00",
    },
    {
      productName: "Stapler Heavy Duty",
      productCode: "ITM-1003",
      qty: "10",
      unitPrice: "1,250.00",
      discountPercentage: "0.00",
      discountAmount: "0.00",
      lineTotal: "12,500.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Sales Order ─────────────────────────────────────────────────
export const SALES_ORDER_CONFIG = {
  reportKey: "SALESORDER",
  templateName: "Sales Order Print Template",
  breadcrumbs: salesBreadcrumbs("Sales Order Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "SO-000456",
    customerName: "Kamal Fernando",
    orderDate: "30-Jun-2026",
    remark: "Urgent",
    paymentType: "Credit",
    warehouseName: "Main Warehouse",
    createdBy: "John Perera",
    salesPerson: "Nimal Silva",
    grossTotal: "45,000.00",
    netTotal: "45,000.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "productName", label: "Product", header: "Product", numeric: false },
        { token: "productCode", label: "Code", header: "Code", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [{ token: "qty", label: "Qty", header: "Qty", numeric: true }],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
        { token: "lineTotal", label: "Line Total", header: "Line Total", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{productName}}</td>
          <td>{{productCode}}</td>
          <td class="num">{{qty}}</td>
          <td class="num">{{unitPrice}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      productName: "A4 Copy Paper 80gsm",
      productCode: "ITM-1001",
      qty: "20",
      unitPrice: "850.00",
      lineTotal: "17,000.00",
    },
    {
      productName: "Blue Ball Pen",
      productCode: "ITM-1002",
      qty: "100",
      unitPrice: "45.00",
      lineTotal: "4,500.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Sales Quotation ─────────────────────────────────────────────
export const SALES_QUOTATION_CONFIG = {
  reportKey: "SALESQUOTATION",
  templateName: "Sales Quotation Print Template",
  breadcrumbs: salesBreadcrumbs("Sales Quotation Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "SQ-000321",
    customerName: "Kamal Fernando",
    quotationDate: "30-Jun-2026",
    remark: "Valid for 14 days",
    warehouseName: "Main Warehouse",
    createdBy: "John Perera",
    salesPerson: "Nimal Silva",
    grossTotal: "36,000.00",
    netTotal: "36,000.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "productName", label: "Product", header: "Product", numeric: false },
        { token: "productCode", label: "Code", header: "Code", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [{ token: "qty", label: "Qty", header: "Qty", numeric: true }],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        {
          token: "sellingPrice",
          label: "Selling Price",
          header: "Selling Price",
          numeric: true,
        },
        { token: "lineTotal", label: "Line Total", header: "Line Total", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{productName}}</td>
          <td>{{productCode}}</td>
          <td class="num">{{qty}}</td>
          <td class="num">{{sellingPrice}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      productName: "A4 Copy Paper 80gsm",
      productCode: "ITM-1001",
      qty: "20",
      sellingPrice: "900.00",
      lineTotal: "18,000.00",
    },
    {
      productName: "Blue Ball Pen",
      productCode: "ITM-1002",
      qty: "100",
      sellingPrice: "50.00",
      lineTotal: "5,000.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Daily Deposit ───────────────────────────────────────────────
export const DAILY_DEPOSIT_CONFIG = {
  reportKey: "DAILYDEPOSIT",
  templateName: "Daily Deposit Print Template",
  breadcrumbs: salesBreadcrumbs("Daily Deposit Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "DEP-000088",
    depositDate: "30-Jun-2026",
    warehouseName: "Main Warehouse",
    createdBy: "John Perera",
    totalAmount: "125,000.00",
    remark: "End of day deposit",
  },
  fieldGroups: [
    {
      id: "deposit",
      title: "Deposit lines",
      fields: [
        { token: "supplier", label: "Supplier", header: "Supplier", numeric: false },
        { token: "bank", label: "Bank", header: "Bank", numeric: false },
        {
          token: "bankAccountNumber",
          label: "Bank Account No",
          header: "Bank Account No",
          numeric: false,
        },
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{supplier}}</td>
          <td>{{bank}}</td>
          <td>{{bankAccountNumber}}</td>
          <td class="num">{{amount}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      supplier: "Cash Sales",
      bank: "Commercial Bank",
      bankAccountNumber: "1234567890",
      amount: "85,000.00",
    },
    {
      supplier: "Card Settlements",
      bank: "Sampath Bank",
      bankAccountNumber: "9876543210",
      amount: "40,000.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Credit Note ─────────────────────────────────────────────────
export const CREDIT_NOTE_CONFIG = {
  reportKey: "CREDITNOTE",
  templateName: "Customer Note Print Template",
  breadcrumbs: salesBreadcrumbs("Customer Note Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "CN-000055",
    customerName: "Kamal Fernando",
    noteDate: "30-Jun-2026",
    invoiceNumber: "INV-000789",
    noteType: "Credit",
    amount: "2,500.00",
    remark: "Price adjustment",
    warehouseName: "Main Warehouse",
  },
  fieldGroups: [
    {
      id: "note",
      title: "Note details",
      fields: [
        {
          token: "invoiceNumber",
          label: "Invoice No",
          header: "Invoice No",
          numeric: false,
        },
        { token: "noteType", label: "Type", header: "Type", numeric: false },
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{invoiceNumber}}</td>
          <td>{{noteType}}</td>
          <td class="num">{{amount}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    { invoiceNumber: "INV-000789", noteType: "Credit", amount: "2,500.00" },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Receipt ─────────────────────────────────────────────────────
export const RECEIPT_CONFIG = {
  reportKey: "RECEIPT",
  templateName: "Receipts Print Template",
  breadcrumbs: salesBreadcrumbs("Receipts Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "RCP-000210",
    customerName: "Kamal Fernando",
    receiptDate: "30-Jun-2026",
    warehouseName: "Main Warehouse",
    paymentMethod: "Cash",
    totalPaid: "52,250.00",
    remark: "Full settlement",
  },
  fieldGroups: [
    {
      id: "receipt",
      title: "Receipt lines",
      fields: [
        { token: "invoiceNo", label: "Invoice No", header: "Invoice No", numeric: false },
        {
          token: "paymentDate",
          label: "Payment Date",
          header: "Payment Date",
          numeric: false,
        },
        {
          token: "totalInvoiceAmount",
          label: "Invoice Amount",
          header: "Total Invoice Amount",
          numeric: true,
        },
        {
          token: "receivedAmount",
          label: "Received Amount",
          header: "Received Amount",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{invoiceNo}}</td>
          <td>{{paymentDate}}</td>
          <td class="num">{{totalInvoiceAmount}}</td>
          <td class="num">{{receivedAmount}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      invoiceNo: "INV-000789",
      paymentDate: "30-Jun-2026",
      totalInvoiceAmount: "52,250.00",
      receivedAmount: "52,250.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Sales Return ────────────────────────────────────────────────
export const SALES_RETURN_CONFIG = {
  reportKey: "SALESRETURN",
  templateName: "Sales Return Print Template",
  breadcrumbs: salesBreadcrumbs("Sales Return Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "0000000006",
    salesReturnDate: "2026-01-22",
    customerName: "MADURA",
    customerAddress: "No. 45, Galle Road, Colombo",
    invoiceNo: "0000000707",
    paymentType: "Credit",
    salesPerson: "Kasun Silva",
    warehouseName: "Main",
    totalInvoiceAmount: "23,000.00",
    outstandingAmount: "11,500.00",
    returnAmount: "11,500.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "rowNum", label: "#", header: "#", numeric: false },
        { token: "productCode", label: "Product Code", header: "Product Code", numeric: false },
        { token: "productName", label: "Product Name", header: "Product Name", numeric: false },
        { token: "reason", label: "Reason", header: "Reason", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [
        { token: "invQty", label: "Inv. Qty", header: "Inv. Qty", numeric: true },
        { token: "returnQty", label: "Return Qty", header: "Return Qty", numeric: true },
      ],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
        {
          token: "returnAmount",
          label: "Return Amount",
          header: "Return Amount",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{rowNum}}</td>
          <td>{{productCode}}</td>
          <td>{{productName}}</td>
          <td class="num">{{invQty}}</td>
          <td class="num">{{returnQty}}</td>
          <td class="num">{{unitPrice}}</td>
          <td class="num">{{returnAmount}}</td>
          <td>{{reason}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      rowNum: "1",
      productCode: "PRD-001",
      productName: "Product A",
      invQty: "2",
      returnQty: "1",
      unitPrice: "5,750.00",
      returnAmount: "5,750.00",
      reason: "Damaged",
    },
    {
      rowNum: "2",
      productCode: "PRD-002",
      productName: "Product B",
      invQty: "3",
      returnQty: "1",
      unitPrice: "5,750.00",
      returnAmount: "5,750.00",
      reason: "Wrong item",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Daily Outstandings ──────────────────────────────────────────
export const DAILY_OUTSTANDING_CONFIG = {
  reportKey: "DAILYOUTSTANDING",
  templateName: "Daily Outstandings Print Template",
  breadcrumbs: salesBreadcrumbs("Daily Outstandings Print Template"),
  sampleData: {
    ...companySample,
    snapshotDate: "07-Jul-2026 12:00 AM",
    warehouseName: "Main",
    customerCount: "28",
    generatedOn: "08-Jul-2026 02:30 PM",
    totalOutstanding: "3,387,686.00",
  },
  fieldGroups: [
    {
      id: "customer",
      title: "Customer rows",
      fields: [
        { token: "rowNum", label: "#", header: "#", numeric: false },
        { token: "customerName", label: "Customer", header: "Customer", numeric: false },
        {
          token: "outstandingAmount",
          label: "Outstanding",
          header: "Outstanding Amount",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{rowNum}}</td>
          <td>{{customerName}}</td>
          <td class="num">{{outstandingAmount}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    { rowNum: "1", customerName: "MADURA", outstandingAmount: "450,250.00" },
    { rowNum: "2", customerName: "HASANTHA", outstandingAmount: "320,500.00" },
    { rowNum: "3", customerName: "SACHINTHAKA", outstandingAmount: "275,000.00" },
    { rowNum: "4", customerName: "Kamal Fernando", outstandingAmount: "198,750.00" },
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
