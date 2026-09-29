/**
 * Shared configs for Finance REPORT templates
 * (/report-template/report-template/?module=finance).
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

const financeReportBreadcrumbs = (templateName) => [
  { label: "Report Template", href: "/report-template/report-template/" },
  { label: "Finance", href: "/report-template/report-template/?module=finance" },
  { label: templateName },
];

// ── Shift Summary ───────────────────────────────────────────────
export const SHIFT_SUMMARY_CONFIG = {
  reportKey: "SHIFTSUMMARY",
  templateName: "Shift Summary Template",
  breadcrumbs: financeReportBreadcrumbs("Shift Summary Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    userFilter: "All Users",
    terminalFilter: "All Terminals",
    totalShifts: "2",
    totalInvoice: "150,000.00",
    totalReceipt: "120,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Shift details",
      fields: [
        {
          token: "documentNo",
          label: "Shift No",
          header: "Shift No",
          numeric: false,
        },
        { token: "startDate", label: "Start", header: "Start", numeric: false },
        { token: "endDate", label: "End", header: "End", numeric: false },
        { token: "userName", label: "User", header: "User", numeric: false },
        {
          token: "terminalCode",
          label: "Terminal",
          header: "Terminal",
          numeric: false,
        },
        { token: "status", label: "Status", header: "Status", numeric: false },
      ],
    },
    {
      id: "amounts",
      title: "Amounts",
      fields: [
        {
          token: "totalStartAmount",
          label: "Start Amt",
          header: "Start Amt",
          numeric: true,
        },
        {
          token: "totalEndAmount",
          label: "End Amt",
          header: "End Amt",
          numeric: true,
        },
        {
          token: "totalInvoice",
          label: "Invoice",
          header: "Invoice",
          numeric: true,
        },
        {
          token: "totalReceipt",
          label: "Receipt",
          header: "Receipt",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{documentNo}}</td>
            <td>{{startDate}}</td>
            <td>{{endDate}}</td>
            <td>{{userName}}</td>
            <td>{{terminalCode}}</td>
            <td class="num">{{totalStartAmount}}</td>
            <td class="num">{{totalEndAmount}}</td>
            <td class="num">{{totalInvoice}}</td>
            <td class="num">{{totalReceipt}}</td>
            <td>{{status}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      documentNo: "SHF-0001",
      startDate: "01-Jul-2026",
      endDate: "01-Jul-2026",
      userName: "John Doe",
      terminalCode: "T01",
      totalStartAmount: "10,000.00",
      totalEndAmount: "25,000.00",
      totalInvoice: "80,000.00",
      totalReceipt: "70,000.00",
      status: "Closed",
    },
    {
      documentNo: "SHF-0002",
      startDate: "10-Jul-2026",
      endDate: "10-Jul-2026",
      userName: "Jane Smith",
      terminalCode: "T02",
      totalStartAmount: "5,000.00",
      totalEndAmount: "12,000.00",
      totalInvoice: "70,000.00",
      totalReceipt: "50,000.00",
      status: "Closed",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Bank History ────────────────────────────────────────────────
export const BANK_HISTORY_CONFIG = {
  reportKey: "BANKHISTORY",
  templateName: "Bank History Template",
  breadcrumbs: financeReportBreadcrumbs("Bank History Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    bankFilter: "Commercial Bank - Main (123456)",
    categoryFilter: "All Categories",
    totalRows: "2",
    totalCredit: "50,000.00",
    totalDebit: "20,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Transaction details",
      fields: [
        { token: "date", label: "Date", header: "Date", numeric: false },
        {
          token: "documentNo",
          label: "Doc No",
          header: "Doc No",
          numeric: false,
        },
        { token: "bankName", label: "Bank", header: "Bank", numeric: false },
        {
          token: "categoryName",
          label: "Category",
          header: "Category",
          numeric: false,
        },
        {
          token: "transactionType",
          label: "Type",
          header: "Type",
          numeric: false,
        },
        {
          token: "description",
          label: "Description",
          header: "Description",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Amounts",
      fields: [
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
        {
          token: "remainingBalance",
          label: "Balance",
          header: "Balance",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{date}}</td>
            <td>{{documentNo}}</td>
            <td>{{bankName}}</td>
            <td>{{categoryName}}</td>
            <td>{{transactionType}}</td>
            <td class="num">{{amount}}</td>
            <td class="num">{{remainingBalance}}</td>
            <td>{{description}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      date: "03-Jul-2026",
      documentNo: "BH-0001",
      bankName: "Commercial Bank",
      categoryName: "Deposit",
      transactionType: "Credit",
      amount: "50,000.00",
      remainingBalance: "150,000.00",
      description: "Daily deposit",
    },
    {
      date: "12-Jul-2026",
      documentNo: "BH-0002",
      bankName: "Commercial Bank",
      categoryName: "Payment",
      transactionType: "Debit",
      amount: "20,000.00",
      remainingBalance: "130,000.00",
      description: "Supplier payment",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Cash Book Summary ───────────────────────────────────────────
export const CASH_BOOK_SUMMARY_CONFIG = {
  reportKey: "CASHBOOKSUMMARY",
  templateName: "Cash Book Summary Template",
  breadcrumbs: financeReportBreadcrumbs("Cash Book Summary Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    customerFilter: "John Doe",
    totalRows: "2",
    totalAmount: "55,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Entry details",
      fields: [
        { token: "date", label: "Date", header: "Date", numeric: false },
        {
          token: "documentNo",
          label: "Doc No",
          header: "Doc No",
          numeric: false,
        },
        {
          token: "customerName",
          label: "Customer",
          header: "Customer",
          numeric: false,
        },
        {
          token: "transactionType",
          label: "Type",
          header: "Type",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Amounts",
      fields: [
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
        {
          token: "remainingBalance",
          label: "Balance",
          header: "Balance",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{date}}</td>
            <td>{{documentNo}}</td>
            <td>{{customerName}}</td>
            <td>{{transactionType}}</td>
            <td class="num">{{amount}}</td>
            <td class="num">{{remainingBalance}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      date: "03-Jul-2026",
      documentNo: "CB-0001",
      customerName: "John Doe",
      transactionType: "Receipt",
      amount: "30,000.00",
      remainingBalance: "30,000.00",
    },
    {
      date: "12-Jul-2026",
      documentNo: "CB-0002",
      customerName: "John Doe",
      transactionType: "Receipt",
      amount: "25,000.00",
      remainingBalance: "55,000.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Cash Flow Summary ───────────────────────────────────────────
export const CASH_FLOW_SUMMARY_CONFIG = {
  reportKey: "CASHFLOWSUMMARY",
  templateName: "Cash Flow Summary Template",
  breadcrumbs: financeReportBreadcrumbs("Cash Flow Summary Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    cashFlowTypeFilter: "All Cash Flow Types",
    cashTypeFilter: "All",
    totalRows: "2",
    totalAmount: "15,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Entry details",
      fields: [
        { token: "date", label: "Date", header: "Date", numeric: false },
        { token: "shiftNo", label: "Shift No", header: "Shift No", numeric: false },
        {
          token: "cashFlowTypeName",
          label: "Flow Type",
          header: "Flow Type",
          numeric: false,
        },
        {
          token: "cashType",
          label: "Cash Type",
          header: "Cash Type",
          numeric: false,
        },
        {
          token: "description",
          label: "Description",
          header: "Description",
          numeric: false,
        },
        { token: "status", label: "Status", header: "Status", numeric: false },
      ],
    },
    {
      id: "amounts",
      title: "Amount",
      fields: [
        { token: "amount", label: "Amount", header: "Amount", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{date}}</td>
            <td>{{shiftNo}}</td>
            <td>{{cashFlowTypeName}}</td>
            <td>{{cashType}}</td>
            <td class="num">{{amount}}</td>
            <td>{{description}}</td>
            <td>{{status}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      date: "03-Jul-2026",
      shiftNo: "SHF-0001",
      cashFlowTypeName: "Petty Cash",
      cashType: "Cash In",
      amount: "10,000.00",
      description: "Opening float",
      status: "Approved",
    },
    {
      date: "12-Jul-2026",
      shiftNo: "SHF-0002",
      cashFlowTypeName: "Expense",
      cashType: "Cash Out",
      amount: "5,000.00",
      description: "Stationary",
      status: "Approved",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Profitability Report ────────────────────────────────────────
export const PROFITABILITY_REPORT_CONFIG = {
  reportKey: "PROFITABILITYREPORT",
  templateName: "Profitability Report Template",
  breadcrumbs: financeReportBreadcrumbs("Profitability Report Template"),
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
    totalRows: "2",
    totalSales: "150,000.00",
    totalCost: "90,000.00",
    totalProfit: "60,000.00",
  },
  fieldGroups: [
    {
      id: "doc",
      title: "Line details",
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
          token: "productCode",
          label: "Code",
          header: "Code",
          numeric: false,
        },
        {
          token: "productName",
          label: "Product",
          header: "Product",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Qty & profit",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        {
          token: "salesAmount",
          label: "Sales",
          header: "Sales",
          numeric: true,
        },
        {
          token: "profitAmount",
          label: "Profit",
          header: "Profit",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{documentDate}}</td>
            <td>{{documentNo}}</td>
            <td>{{customerName}}</td>
            <td>{{productCode}}</td>
            <td>{{productName}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{salesAmount}}</td>
            <td class="num">{{profitAmount}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      documentDate: "02-Jul-2026",
      documentNo: "INV-000210",
      customerName: "John Doe",
      productCode: "ITM-01",
      productName: "Product A",
      qty: "10.00",
      salesAmount: "80,000.00",
      profitAmount: "30,000.00",
    },
    {
      documentDate: "10-Jul-2026",
      documentNo: "INV-000225",
      customerName: "Jane Smith",
      productCode: "ITM-02",
      productName: "Product B",
      qty: "5.00",
      salesAmount: "70,000.00",
      profitAmount: "30,000.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Company Wise Profit ─────────────────────────────────────────
export const COMPANY_WISE_PROFIT_CONFIG = {
  reportKey: "COMPANYWISEPROFIT",
  templateName: "Company Wise Profit Template",
  breadcrumbs: financeReportBreadcrumbs("Company Wise Profit Template"),
  sampleData: {
    ...companySample,
    generatedOn: "24-Jul-2026 12:00 PM",
    warehouseName: "Main",
    currentUser: "Admin",
    fromDate: "01-Jul-2026",
    toDate: "24-Jul-2026",
    supplierFilter: "ABC Suppliers",
    salesPersonFilter: "All Sales Persons",
    totalProducts: "2",
    totalSales: "150,000.00",
    totalCost: "90,000.00",
    totalProfit: "60,000.00",
  },
  fieldGroups: [
    {
      id: "product",
      title: "Product",
      fields: [
        {
          token: "productCode",
          label: "Code",
          header: "Code",
          numeric: false,
        },
        {
          token: "productName",
          label: "Product",
          header: "Product",
          numeric: false,
        },
      ],
    },
    {
      id: "amounts",
      title: "Qty & amounts",
      fields: [
        { token: "qty", label: "Qty", header: "Qty", numeric: true },
        {
          token: "salesAmount",
          label: "Sales",
          header: "Sales",
          numeric: true,
        },
        {
          token: "costAmount",
          label: "Cost",
          header: "Cost",
          numeric: true,
        },
        {
          token: "profitAmount",
          label: "Profit",
          header: "Profit",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{productCode}}</td>
            <td>{{productName}}</td>
            <td class="num">{{qty}}</td>
            <td class="num">{{salesAmount}}</td>
            <td class="num">{{costAmount}}</td>
            <td class="num">{{profitAmount}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      productCode: "ITM-01",
      productName: "Product A",
      qty: "10.00",
      salesAmount: "80,000.00",
      costAmount: "50,000.00",
      profitAmount: "30,000.00",
    },
    {
      productCode: "ITM-02",
      productName: "Product B",
      qty: "5.00",
      salesAmount: "70,000.00",
      costAmount: "40,000.00",
      profitAmount: "30,000.00",
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
