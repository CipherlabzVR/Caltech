/**
 * Shared configs for Sales REPORT templates
 * (/report-template/report-template/?module=sales).
 * Tier A: editable {{#lineItems}} columns + orientation
 */

const LOGO =
  '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>';

const companySample = {
  companyLogo: LOGO,
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
};

const salesReportBreadcrumbs = (templateName) => [
  { label: "Report Template", href: "/report-template/report-template/" },
  { label: "Sales", href: "/report-template/report-template/?module=sales" },
  { label: templateName },
];

// ── Sales Summary ───────────────────────────────────────────────
export const SALES_SUMMARY_CONFIG = {
  reportKey: "SALESSUMMARY",
  templateName: "Sales Summary Template",
  breadcrumbs: salesReportBreadcrumbs("Sales Summary Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    customerFilter: "All Customers",
    supplierFilter: "All Suppliers",
    categoryFilter: "All Categories",
    subCategoryFilter: "All Sub Categories",
    productFilter: "All Items",
    paymentTypeFilter: "All Payment Types",
    totalInvoices: "2",
    totalGross: "150,000.00",
    totalNet: "145,000.00",
    totalPaid: "100,000.00",
    totalBalance: "45,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Invoice details",
      fields: [
        {
          token: "documentDate",
          label: "Date",
          header: "Date",
          numeric: false,
        },
        {
          token: "documentNo",
          label: "Invoice No",
          header: "Invoice No",
          numeric: false,
        },
        {
          token: "customerName",
          label: "Customer",
          header: "Customer",
          numeric: false,
        },
        {
          token: "paymentType",
          label: "Pay Type",
          header: "Pay Type",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Amounts",
      fields: [
        { token: "grossTotal", label: "Gross", header: "Gross", numeric: true },
        { token: "netTotal", label: "Net", header: "Net", numeric: true },
        { token: "paymentAmount", label: "Paid", header: "Paid", numeric: true },
        { token: "balance", label: "Balance", header: "Balance", numeric: true },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{documentDate}}</td>
            <td>{{documentNo}}</td>
            <td>{{customerName}}</td>
            <td>{{paymentType}}</td>
            <td class="num">{{grossTotal}}</td>
            <td class="num">{{netTotal}}</td>
            <td class="num">{{paymentAmount}}</td>
            <td class="num">{{balance}}</td>
            <td>{{remark}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      documentDate: "02-Jul-2026",
      documentNo: "INV-000210",
      customerName: "John Doe",
      paymentType: "Cash",
      grossTotal: "80,000.00",
      netTotal: "78,000.00",
      paymentAmount: "78,000.00",
      balance: "0.00",
      remark: "—",
    },
    {
      documentDate: "10-Jul-2026",
      documentNo: "INV-000225",
      customerName: "Jane Smith",
      paymentType: "Credit",
      grossTotal: "70,000.00",
      netTotal: "67,000.00",
      paymentAmount: "22,000.00",
      balance: "45,000.00",
      remark: "Partial",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Customer Payment Summary ────────────────────────────────────
export const CUSTOMER_PAYMENT_SUMMARY_CONFIG = {
  reportKey: "CUSTOMERPAYMENTSUMMARY",
  templateName: "Customer Payment Summary Template",
  breadcrumbs: salesReportBreadcrumbs("Customer Payment Summary Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    customerFilter: "All Customers",
    invoiceFilter: "All Invoices",
    paymentTypeFilter: "All Payment Types",
    totalReceipts: "2",
    totalPaid: "55,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Receipt details",
      fields: [
        {
          token: "receiptDate",
          label: "Date",
          header: "Date",
          numeric: false,
        },
        {
          token: "receiptNumber",
          label: "Receipt No",
          header: "Receipt No",
          numeric: false,
        },
        {
          token: "customerName",
          label: "Customer",
          header: "Customer",
          numeric: false,
        },
        {
          token: "invoiceNos",
          label: "Invoice No",
          header: "Invoice No",
          numeric: false,
        },
        {
          token: "paymentType",
          label: "Pay Type",
          header: "Pay Type",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Payment",
      fields: [
        {
          token: "totalPaidAmount",
          label: "Paid",
          header: "Paid",
          numeric: true,
        },
        {
          token: "referenceNumber",
          label: "Reference",
          header: "Reference",
          numeric: false,
        },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{receiptDate}}</td>
            <td>{{receiptNumber}}</td>
            <td>{{customerName}}</td>
            <td>{{invoiceNos}}</td>
            <td>{{paymentType}}</td>
            <td class="num">{{totalPaidAmount}}</td>
            <td>{{referenceNumber}}</td>
            <td>{{remark}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      receiptDate: "03-Jul-2026",
      receiptNumber: "RCT-000088",
      customerName: "John Doe",
      invoiceNos: "INV-000210",
      paymentType: "Cash",
      totalPaidAmount: "30,000.00",
      referenceNumber: "REF-01",
      remark: "—",
    },
    {
      receiptDate: "12-Jul-2026",
      receiptNumber: "RCT-000102",
      customerName: "Jane Smith",
      invoiceNos: "INV-000225",
      paymentType: "Bank Transfer",
      totalPaidAmount: "25,000.00",
      referenceNumber: "—",
      remark: "Partial",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Outstanding Report ──────────────────────────────────────────
export const OUTSTANDING_REPORT_CONFIG = {
  reportKey: "OUTSTANDINGREPORT",
  templateName: "Outstanding Report Template",
  breadcrumbs: salesReportBreadcrumbs("Outstanding Report Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    customerFilter: "All Customers",
    totalInvoices: "2",
    totalInvoiceAmount: "120,000.00",
    totalCredit: "5,000.00",
    totalOutstanding: "70,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Invoice details",
      fields: [
        {
          token: "invoiceDate",
          label: "Invoice Date",
          header: "Invoice Date",
          numeric: false,
        },
        {
          token: "invoiceNumber",
          label: "Invoice No",
          header: "Invoice No",
          numeric: false,
        },
        {
          token: "customerName",
          label: "Customer",
          header: "Customer",
          numeric: false,
        },
        {
          token: "salesPersonName",
          label: "Sales Person",
          header: "Sales Person",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Amounts",
      fields: [
        {
          token: "totalInvoiceAmount",
          label: "Invoice Amt",
          header: "Invoice Amt",
          numeric: true,
        },
        {
          token: "creditAmount",
          label: "Credit",
          header: "Credit",
          numeric: true,
        },
        {
          token: "outstandingAmount",
          label: "Outstanding",
          header: "Outstanding",
          numeric: true,
        },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{invoiceDate}}</td>
            <td>{{invoiceNumber}}</td>
            <td>{{customerName}}</td>
            <td class="num">{{totalInvoiceAmount}}</td>
            <td class="num">{{creditAmount}}</td>
            <td class="num">{{outstandingAmount}}</td>
            <td>{{salesPersonName}}</td>
            <td>{{remark}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      invoiceDate: "05-Jul-2026",
      invoiceNumber: "INV-000218",
      customerName: "John Doe",
      totalInvoiceAmount: "50,000.00",
      creditAmount: "0.00",
      outstandingAmount: "40,000.00",
      salesPersonName: "Sales Rep A",
      remark: "—",
    },
    {
      invoiceDate: "15-Jul-2026",
      invoiceNumber: "INV-000240",
      customerName: "Jane Smith",
      totalInvoiceAmount: "70,000.00",
      creditAmount: "5,000.00",
      outstandingAmount: "30,000.00",
      salesPersonName: "Sales Rep B",
      remark: "Follow up",
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
