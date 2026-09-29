/**
 * Shared configs for Service Management screen print templates.
 * Tier A: editable {{#lineItems}} columns + orientation
 * Tier C: orientation only (complex multi-section layouts)
 */

const LOGO =
  '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>';

const companySample = {
  companyLogo: LOGO,
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
};

const serviceBreadcrumbs = (templateName) => [
  { label: "Screens Template", href: "/report-template/screens-template/" },
  {
    label: "Service Management",
    href: "/report-template/screens-template/?module=service",
  },
  { label: templateName },
];

const accessoryFieldGroups = [
  {
    id: "accessory",
    title: "Accessories",
    fields: [
      { token: "rowNum", label: "#", header: "#", numeric: false },
      { token: "item", label: "Item", header: "Item", numeric: false },
    ],
  },
];

const accessoryDefaultBlock = `{{#lineItems}}
          <tr>
            <td>{{rowNum}}</td>
            <td>{{item}}</td>
          </tr>
          {{/lineItems}}`;

const pricedFieldGroups = [
  {
    id: "item",
    title: "Line details",
    fields: [
      { token: "rowNum", label: "#", header: "#", numeric: false },
      { token: "lineType", label: "Type", header: "Type", numeric: false },
      { token: "item", label: "Item", header: "Item", numeric: false },
    ],
  },
  {
    id: "price",
    title: "Qty & amounts",
    fields: [
      { token: "qty", label: "Qty", header: "Qty", numeric: true },
      { token: "unitPrice", label: "Unit", header: "Unit", numeric: true },
      { token: "amount", label: "Amount", header: "Amount", numeric: true },
    ],
  },
];

const pricedDefaultBlock = `{{#lineItems}}
          <tr>
            <td>{{rowNum}}</td>
            <td>{{lineType}}</td>
            <td>{{item}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{unitPrice}}</td>
            <td class="num">{{amount}}</td>
          </tr>
          {{/lineItems}}`;

// ── Job Card ────────────────────────────────────────────────────
export const JOB_CARD_CONFIG = {
  reportKey: "SERVICEJOBCARD",
  templateName: "Service Job Card Print Template",
  breadcrumbs: serviceBreadcrumbs("Service Job Card Print Template"),
  sampleData: {
    ...companySample,
    docTitle: "SERVICE JOB CARD",
    documentNo: "JC-000125",
    customerName: "Nimal Perera",
    contactNo: "+94 77 123 4567",
    receivedDate: "30-Jun-2026",
    expectedDeliveryDate: "04-Jul-2026",
    status: "Received",
    deviceType: "Laptop",
    brandModel: "Dell / Latitude 5420",
    productName: "Dell Latitude 5420",
    serialNumber: "SN-AX99201",
    serviceType: "Paid Repair",
    priority: "Normal",
    reportedFault: "Device does not power on. No charging light.",
    physicalCondition: "Minor scratches on lid. Screen intact.",
    receivedBy: "Kasun Silva",
    technician: "Ruwan Fernando",
    printedDate: "30-Jun-2026 03:25:10PM",
  },
  fieldGroups: accessoryFieldGroups,
  defaultLineItemsBlock: accessoryDefaultBlock,
  sampleLineItems: [
    { rowNum: "1", item: "Charger" },
    { rowNum: "2", item: "Carry Bag" },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Intake Receipt ──────────────────────────────────────────────
export const INTAKE_RECEIPT_CONFIG = {
  reportKey: "SERVICEINTAKERECEIPT",
  templateName: "Service Intake Receipt Print Template",
  breadcrumbs: serviceBreadcrumbs("Service Intake Receipt Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "JC-000125",
    receivedDate: "30-Jun-2026 03:25:10PM",
    customerName: "Nimal Perera",
    contactNo: "+94 77 123 4567",
    serviceType: "Paid Repair",
    priority: "Normal",
    deviceLine: "Laptop · Dell · Latitude 5420",
    productLine: "Dell Latitude 5420 · Serial: SN-AX99201",
    reportedFault: "Device does not power on.",
    physicalCondition: "Minor scratches on lid.",
  },
  fieldGroups: accessoryFieldGroups,
  defaultLineItemsBlock: accessoryDefaultBlock,
  sampleLineItems: [
    { rowNum: "1", item: "Charger" },
    { rowNum: "2", item: "Carry Bag" },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Repair Estimate ─────────────────────────────────────────────
export const REPAIR_ESTIMATE_CONFIG = {
  reportKey: "SERVICEREPAIRESTIMATE",
  templateName: "Service Repair Estimate Print Template",
  breadcrumbs: serviceBreadcrumbs("Service Repair Estimate Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "JC-000125",
    billDate: "30-Jun-2026 03:25:10PM",
    customerName: "Nimal Perera",
    contactNo: "+94 77 123 4567",
    serviceType: "Paid Repair",
    technician: "Ruwan Fernando",
    estimatedReady: "04-Jul-2026",
    approvedBy: "Kasun Silva",
    deviceDetails:
      "Type: Laptop\nBrand: Dell\nModel: Latitude 5420\nSerial: SN-AX99201\nCondition: Minor scratches",
    reportedFault: "Device does not power on.",
    diagnosis: "Faulty charging board, requires replacement.",
    grossTotal: "12,500.00",
    totalDiscount: "500.00",
    customerPayable: "12,000.00",
  },
  fieldGroups: pricedFieldGroups,
  defaultLineItemsBlock: pricedDefaultBlock,
  sampleLineItems: [
    {
      rowNum: "1",
      lineType: "Part",
      item: "Charging Board",
      qty: "1",
      unitPrice: "9,000.00",
      amount: "9,000.00",
    },
    {
      rowNum: "2",
      lineType: "Labour",
      item: "Repair Service",
      qty: "1",
      unitPrice: "3,500.00",
      amount: "3,000.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Work Authorization ──────────────────────────────────────────
export const WORK_AUTH_CONFIG = {
  reportKey: "SERVICEWORKAUTH",
  templateName: "Work Authorization Print Template",
  breadcrumbs: serviceBreadcrumbs("Work Authorization Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "JC-000125",
    approvedDate: "30-Jun-2026 03:25:10PM",
    customerName: "Nimal Perera",
    contactNo: "+94 77 123 4567",
    serviceType: "Paid Repair",
    deviceLine: "Laptop · Dell · Latitude 5420",
    productLine: "Dell Latitude 5420 · Serial: SN-AX99201",
    reportedFault: "Device does not power on.",
    diagnosis: "Faulty charging board, requires replacement.",
    grossTotal: "12,500.00",
    customerPayable: "12,000.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Line details",
      fields: [
        { token: "rowNum", label: "#", header: "#", numeric: false },
        { token: "lineType", label: "Type", header: "Type", numeric: false },
        {
          token: "item",
          label: "Item / Description",
          header: "Item / Description",
          numeric: false,
        },
      ],
    },
    {
      id: "price",
      title: "Qty & amounts",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        { token: "unitPrice", label: "Unit", header: "Unit", numeric: true },
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{rowNum}}</td>
            <td>{{lineType}}</td>
            <td>{{item}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{unitPrice}}</td>
            <td class="num">{{amount}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: REPAIR_ESTIMATE_CONFIG.sampleLineItems,
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

/** Tier C sample data / breadcrumbs for orientation-only pages. */
export const SERVICE_INVOICE_META = {
  reportKey: "SERVICEINVOICE",
  templateName: "Service Invoice Print Template",
  breadcrumbs: serviceBreadcrumbs("Service Invoice Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "SI-000045",
    issueDate: "30-Jun-2026",
    jobCardNo: "JC-000125",
    status: "Pending",
    customerName: "Nimal Perera",
    contactNo: "+94 77 123 4567",
    productName: "Dell Latitude 5420",
    serialNumber: "SN-AX99201",
    issueReported: "Device does not power on.",
    serviceType: "Paid Repair",
    warrantyDays: "90",
    warrantyUntil: "28-Sep-2026",
    subtotal: "12,500.00",
    warrantyWaiver: "0.00",
    discount: "500.00",
    netTotal: "12,000.00",
    paidAmount: "0.00",
    balanceDue: "12,000.00",
    paymentMethod: "Cash",
    technicianName: "Ruwan Fernando",
    remark: "Repair completed and tested.",
  },
  sampleRows: `
  <tr><td>Charging Board · Part</td><td class="num">1</td><td class="num">9,000.00</td><td class="num">9,000.00</td></tr>
  <tr><td>Repair Service · Labour</td><td class="num">1</td><td class="num">3,500.00</td><td class="num">3,000.00</td></tr>
`,
};

export const PURCHASE_INVOICE_META = {
  reportKey: "SERVICEPURCHASEINVOICE",
  templateName: "Purchase Invoice Print Template",
  breadcrumbs: serviceBreadcrumbs("Purchase Invoice Print Template"),
  sampleData: {
    ...companySample,
    documentNo: "PI-000078",
    invoiceDate: "30 June 2026",
    customerName: "Nimal Perera",
    billTo: "No. 45, Galle Road, Colombo 04",
    salesPerson: "Kasun Silva",
    remark: "Walk-in purchase.",
    grossTotal: "96,500.00",
    totalDiscount: "1,500.00",
    netTotal: "95,000.00",
    warrantyType: "Manufacturer",
    warrantyPeriod: "12 months",
    warrantyStart: "30 June 2026",
    warrantyExpiry: "30 June 2027",
    warrantyTerms: "Covers manufacturing defects only.",
  },
  sampleRows: `
  <tr><td class="idx">1</td><td>Iphone 12</td><td class="num">1</td><td class="num">100,000.00</td><td class="num">5,000.00</td><td class="num">95,000.00</td></tr>
  <tr><td colspan="6" style="padding:10px 12px 12px 44px;background:#F5F3FF;border-bottom:1px solid #E5E7EB;"><div style="font-size:11.5px;color:#374151;"><strong>Device</strong> — Type: Mobile · Brand: Apple · Model: iPhone 12 · Serial/IMEI: SN001</div><div style="font-size:11.5px;color:#374151;margin-top:4px;"><strong>Warranty</strong> — Type: Manufacturer · Period: 12 months</div></td></tr>
  <tr><td class="idx">2</td><td>Iphone Camera</td><td class="num">1</td><td class="num">1,500.00</td><td class="num">—</td><td class="num">1,500.00</td></tr>
`,
  sampleLineDetails: `
  <div class="product-details">
    <div class="product-detail-card">
      <div class="product-detail-title">1. Iphone 12</div>
      <div class="product-detail-grid">
        <div class="detail-block"><div class="detail-label">Device Type</div><div class="detail-value">Mobile</div></div>
        <div class="detail-block"><div class="detail-label">Brand</div><div class="detail-value">Apple</div></div>
        <div class="detail-block"><div class="detail-label">Model</div><div class="detail-value">iPhone 12</div></div>
        <div class="detail-block"><div class="detail-label">Serial / IMEI</div><div class="detail-value">SN001</div></div>
        <div class="detail-block"><div class="detail-label">Warranty Type</div><div class="detail-value">Manufacturer</div></div>
        <div class="detail-block"><div class="detail-label">Period</div><div class="detail-value">12 months</div></div>
        <div class="detail-block"><div class="detail-label">Start Date</div><div class="detail-value">06 July 2026</div></div>
        <div class="detail-block"><div class="detail-label">Expiry Date</div><div class="detail-value">06 July 2027</div></div>
      </div>
      <div class="product-detail-terms"><span class="terms-label">Terms:</span> Manufacturer warranty applies.</div>
    </div>
  </div>
`,
};
