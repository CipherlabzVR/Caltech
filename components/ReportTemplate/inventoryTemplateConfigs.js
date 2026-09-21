/**
 * Shared configs for Inventory screen print templates:
 * field pickers, default {{#lineItems}} blocks, and sample preview data.
 */

const LOGO =
  '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>';

const companySample = {
  companyLogo: LOGO,
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
};

const fmt = (n) =>
  Number(n ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const qty = (n) => {
  const v = Number(n ?? 0);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

// ── Purchase Order ──────────────────────────────────────────────
export const PO_CONFIG = {
  reportKey: "PO",
  templateName: "Purchase Order Print Template",
  sampleData: {
    ...companySample,
    documentNo: "PO-000045",
    supplierName: "Global Supplies Ltd",
    poDate: "26-Jun-2026",
    referenceNo: "REF-000012",
    grnDate: "28-Jun-2026",
    orderType: "Local",
    payment: "Credit",
    warehouseName: "Main Warehouse",
    totalProducts: "2",
    totalQty: "140",
    totalDiscount: "7,500.00",
    grandTotal: "142,500.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "productName", label: "Product", header: "Product", numeric: false },
        { token: "shipmentNoteNo", label: "Shipment No", header: "Shipment No", numeric: false },
        { token: "batch", label: "Batch", header: "Batch", numeric: false },
        { token: "expDate", label: "Exp Date", header: "Exp Date", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [
        { token: "orderQty", label: "Order Qty", header: "Order Qty", numeric: true },
        { token: "receivedQty", label: "Received Qty", header: "Received Qty", numeric: true },
        { token: "poReceivedQty", label: "PO Received Qty", header: "PO Rcvd Qty", numeric: true },
      ],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        { token: "costPrice", label: "Cost Price", header: "Cost Price", numeric: true },
        { token: "discountRate", label: "Discount %", header: "Dis%", numeric: true },
        { token: "discountAmount", label: "Discount Amt", header: "Dis Amt", numeric: true },
        { token: "lineTotal", label: "Total Cost", header: "Total Cost", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{productName}}</td>
          <td>{{shipmentNoteNo}}</td>
          <td>{{batch}}</td>
          <td>{{expDate}}</td>
          <td class="num">{{orderQty}}</td>
          <td class="num">{{receivedQty}}</td>
          <td class="num">{{costPrice}}</td>
          <td class="num">{{discountRate}}</td>
          <td class="num">{{discountAmount}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      productName: "A4 Copy Paper 80gsm",
      shipmentNoteNo: "0000000123",
      batch: "B-2207",
      expDate: "-",
      orderQty: "60",
      receivedQty: "60",
      poReceivedQty: "60",
      costPrice: "850.00",
      discountRate: "0.00",
      discountAmount: "0.00",
      lineTotal: "51,000.00",
    },
    {
      productName: "A4 Copy Paper 80gsm",
      shipmentNoteNo: "0000000124",
      batch: "B-2207",
      expDate: "-",
      orderQty: "40",
      receivedQty: "30",
      poReceivedQty: "30",
      costPrice: "850.00",
      discountRate: "0.00",
      discountAmount: "0.00",
      lineTotal: "34,000.00",
    },
    {
      productName: "Blue Ball Pen",
      shipmentNoteNo: "0000000125",
      batch: "B-3310",
      expDate: "-",
      orderQty: "40",
      receivedQty: "40",
      poReceivedQty: "40",
      costPrice: "45.00",
      discountRate: "5.00",
      discountAmount: "90.00",
      lineTotal: "1,710.00",
    },
  ],
  buildLineTokenMap: (item) => ({
    productName: item.productName || item.productCode || "-",
    shipmentNoteNo: item.shipmentNoteNo || "-",
    batch: item.batch || "-",
    expDate: item.expDate || "-",
    orderQty: item.orderQty ?? qty(item.poQty ?? item.orderedQty ?? item.qty),
    receivedQty: item.receivedQty ?? qty(item.shipmentReceivedQty ?? item.receivedQty ?? 0),
    poReceivedQty: item.poReceivedQty ?? qty(item.poReceivedQty ?? 0),
    costPrice: item.costPrice ?? fmt(item.costPrice),
    discountRate: item.discountRate ?? fmt(item.discountRate),
    discountAmount: item.discountAmount ?? fmt(item.discountAmount),
    lineTotal: item.lineTotal ?? fmt(item.lineTotal),
  }),
};

// ── GRN Return ──────────────────────────────────────────────────
export const GRN_RETURN_CONFIG = {
  reportKey: "GRNRETURN",
  templateName: "Goods Return Note Print Template",
  sampleData: {
    ...companySample,
    documentNo: "GRNR-000045",
    supplierName: "Global Supplies Ltd",
    grnDocumentNo: "GRN-000123",
    returnDate: "26-Jun-2026",
    remark: "Damaged items returned",
    totalQty: "18",
    warehouseName: "Main Warehouse",
    createdBy: "John Perera",
    createdDate: "26-Jun-2026 10:30:00AM",
    subtotal: "12,500.00",
    grossTotal: "12,500.00",
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
        { token: "batch", label: "Batch", header: "Batch", numeric: false },
        { token: "expDate", label: "Exp. Date", header: "Exp. Date", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [
        { token: "returnQty", label: "Return Qty", header: "Return Qty", numeric: true },
      ],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
        { token: "discountRate", label: "Discount %", header: "Dis%", numeric: true },
        { token: "lineTotal", label: "Line Total", header: "Line Total", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
        <tr>
          <td>{{productName}}<br/>{{productCode}}</td>
          <td>{{batch}}</td>
          <td>{{expDate}}</td>
          <td class="num">{{returnQty}}</td>
          <td class="num">{{unitPrice}}</td>
          <td class="num">{{discountRate}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/lineItems}}`,
  sampleLineItems: [
    {
      productName: "A4 Copy Paper 80gsm",
      productCode: "ITM-1001",
      batch: "B-2207",
      expDate: "-",
      returnQty: "10",
      unitPrice: "850.00",
      discountRate: "0.00",
      lineTotal: "8,500.00",
    },
    {
      productName: "Blue Ball Pen",
      productCode: "ITM-1002",
      batch: "B-3310",
      expDate: "-",
      returnQty: "5",
      unitPrice: "45.00",
      discountRate: "5.00",
      lineTotal: "213.75",
    },
    {
      productName: "Stapler Heavy Duty",
      productCode: "ITM-1003",
      batch: "B-9921",
      expDate: "-",
      returnQty: "3",
      unitPrice: "1,250.00",
      discountRate: "0.00",
      lineTotal: "3,750.00",
    },
  ],
  buildLineTokenMap: (item) => ({
    productName: item.productName || "-",
    productCode: item.productCode || "",
    batch: item.batch || "-",
    expDate: item.expDate || "-",
    returnQty: item.returnQty ?? qty(item.returnQty),
    unitPrice: item.unitPrice ?? fmt(item.unitPrice),
    discountRate: item.discountRate ?? fmt(item.discountRate),
    lineTotal: item.lineTotal ?? fmt(item.lineTotal),
  }),
};

// ── Shipment ────────────────────────────────────────────────────
export const SHIPMENT_CONFIG = {
  reportKey: "SHIPMENT",
  templateName: "Shipment Print Template",
  sampleData: {
    ...companySample,
    documentNo: "SH-000078",
    shipmentDate: "30-Jun-2026",
    supplierName: "Global Supplies Ltd",
    warehouseName: "Main Warehouse",
    referenceNo: "REF-00125",
    remark: "Received in good condition",
    grossTotal: "125,500.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "purchaseOrderNo", label: "PO No", header: "PO No", numeric: false },
        { token: "productName", label: "Product", header: "Product", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [
        { token: "orderedQty", label: "Ordered Qty", header: "Ordered Qty", numeric: true },
        { token: "receivedQty", label: "Received Qty", header: "Received Qty", numeric: true },
      ],
    },
    {
      id: "price",
      title: "Prices & totals",
      fields: [
        { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
        { token: "freightDuty", label: "Freight Duty", header: "Freight Duty", numeric: true },
        {
          token: "additionalCost",
          label: "Additional Cost",
          header: "Additional Cost",
          numeric: true,
        },
        { token: "lineTotal", label: "Total", header: "Total", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
          <tr>
            <td>{{purchaseOrderNo}}</td>
            <td>{{productName}}</td>
            <td class="num">{{orderedQty}}</td>
            <td class="num">{{receivedQty}}</td>
            <td class="num">{{unitPrice}}</td>
            <td class="num">{{freightDuty}}</td>
            <td class="num">{{additionalCost}}</td>
            <td class="num">{{lineTotal}}</td>
          </tr>
          {{/lineItems}}`,
  sampleLineItems: [
    {
      purchaseOrderNo: "PO-000045",
      productName: "A4 Copy Paper 80gsm",
      orderedQty: "100.00",
      receivedQty: "100.00",
      unitPrice: "850.00",
      freightDuty: "1,200.00",
      additionalCost: "500.00",
      lineTotal: "86,500.00",
    },
    {
      purchaseOrderNo: "PO-000046",
      productName: "Blue Ball Pen",
      orderedQty: "200.00",
      receivedQty: "200.00",
      unitPrice: "45.00",
      freightDuty: "800.00",
      additionalCost: "300.00",
      lineTotal: "39,000.00",
    },
  ],
  buildLineTokenMap: (item) => ({
    purchaseOrderNo: item.purchaseOrderNo || "-",
    productName: item.productName || item.productCode || "-",
    orderedQty: item.orderedQty ?? qty(item.qty),
    receivedQty: item.receivedQty ?? qty(item.receivedQty),
    unitPrice: item.unitPrice ?? fmt(item.unitPrice),
    freightDuty: item.freightDuty ?? fmt(item.freightDutyCost ?? item.freightDuty),
    additionalCost: item.additionalCost ?? fmt(item.additionalCost),
    lineTotal: item.lineTotal ?? fmt(item.lineTotal),
  }),
};

// ── Stock Dispatch ──────────────────────────────────────────────
export const STOCK_DISPATCH_CONFIG = {
  reportKey: "STOCKDISPATCH",
  templateName: "Stock Dispatch Print Template",
  sampleData: {
    ...companySample,
    documentNo: "0000000042",
    dispatchDate: "2026-07-08",
    warehouseName: "Main",
    userName: "Kasun Perera",
    supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
    remark: "yuytu",
    productCode: "0000000026",
    productName: "i 3200 HEAD CABLE",
    batchNumber: "B-2026-001",
    expiryDate: "2027-12-31",
    costPrice: "580.00",
    unitPrice: "180.00",
    sellingPrice: "1,500.00",
    dispatchQuantity: "10",
    totalCostValue: "5,800.00",
    totalSellingValue: "15,000.00",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "date", label: "Date", header: "Date", numeric: false },
        { token: "supplierName", label: "Supplier", header: "Supplier", numeric: false },
        { token: "productCode", label: "Product Code", header: "Product Code", numeric: false },
        { token: "productName", label: "Product Name", header: "Product Name", numeric: false },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
    {
      id: "price",
      title: "Prices & qty",
      fields: [
        { token: "costPrice", label: "Cost Price", header: "Cost Price", numeric: true },
        { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
        { token: "sellingPrice", label: "Selling Price", header: "Selling Price", numeric: true },
        {
          token: "dispatchQuantity",
          label: "Dispatch Qty",
          header: "Dispatch Qty",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
  <tr>
    <td>{{date}}</td>
    <td>{{supplierName}}</td>
    <td>{{productCode}}</td>
    <td>{{productName}}</td>
    <td class="num">{{costPrice}}</td>
    <td class="num">{{unitPrice}}</td>
    <td class="num">{{sellingPrice}}</td>
    <td class="num">{{dispatchQuantity}}</td>
    <td>{{remark}}</td>
  </tr>
  {{/lineItems}}`,
  sampleLineItems: [
    {
      date: "2026-07-08",
      supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
      productCode: "0000000026",
      productName: "i 3200 HEAD CABLE",
      costPrice: "580.00",
      unitPrice: "180.00",
      sellingPrice: "1,500.00",
      dispatchQuantity: "10",
      remark: "yuytu",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Stock Adjustment ────────────────────────────────────────────
export const STOCK_ADJUSTMENT_CONFIG = {
  reportKey: "STOCKADJUSTMENT",
  templateName: "Stock Adjustment Print Template",
  sampleData: {
    ...companySample,
    documentNo: "0000000018",
    adjustmentDate: "2026-07-01",
    warehouseName: "Main",
    userName: "Deshitha",
    supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
    remark: "By Deshitha",
    productCode: "0000000042",
    productName: "5U FILTERS",
    previousQuantity: "1.01",
    updatedQuantity: "1",
    quantityDifference: "-0.01",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item details",
      fields: [
        { token: "date", label: "Date", header: "Date", numeric: false },
        { token: "supplierName", label: "Supplier", header: "Supplier", numeric: false },
        { token: "productCode", label: "Product Code", header: "Product Code", numeric: false },
        { token: "productName", label: "Product Name", header: "Product Name", numeric: false },
        { token: "remark", label: "Remark", header: "Remark", numeric: false },
      ],
    },
    {
      id: "qty",
      title: "Quantities",
      fields: [
        {
          token: "previousQuantity",
          label: "Previous Qty",
          header: "Previous Qty",
          numeric: true,
        },
        {
          token: "updatedQuantity",
          label: "Updated Qty",
          header: "Updated Qty",
          numeric: true,
        },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
  <tr>
    <td>{{date}}</td>
    <td>{{supplierName}}</td>
    <td>{{productCode}}</td>
    <td>{{productName}}</td>
    <td class="num">{{previousQuantity}}</td>
    <td class="num">{{updatedQuantity}}</td>
    <td>{{remark}}</td>
  </tr>
  {{/lineItems}}`,
  sampleLineItems: [
    {
      date: "2026-07-01",
      supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
      productCode: "0000000042",
      productName: "5U FILTERS",
      previousQuantity: "1.01",
      updatedQuantity: "1",
      remark: "By Deshitha",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Stock Details (list) ────────────────────────────────────────
export const STOCK_DETAILS_CONFIG = {
  reportKey: "STOCKDETAILS",
  templateName: "Stock Details Print Template",
  sampleData: {
    ...companySample,
    generatedOn: "08-Jul-2026 04:30 PM",
    warehouseName: "Main",
    searchFilter: "All",
    sortBy: "Item Code: Low → High",
    totalItems: "5",
    totalStockQuantity: "9",
  },
  fieldGroups: [
    {
      id: "item",
      title: "Item columns",
      fields: [
        { token: "rowNum", label: "#", header: "#", numeric: false },
        { token: "itemCode", label: "Item Code", header: "Item Code", numeric: false },
        { token: "itemName", label: "Item Name", header: "Item Name", numeric: false },
        { token: "categoryName", label: "Category", header: "Category", numeric: false },
        {
          token: "subCategoryName",
          label: "Sub Category",
          header: "Sub Category",
          numeric: false,
        },
        { token: "supplierName", label: "Supplier", header: "Supplier", numeric: false },
        { token: "uomName", label: "UOM", header: "UOM", numeric: false },
        { token: "stockLevel", label: "Stock Level", header: "Stock Level", numeric: true },
      ],
    },
  ],
  defaultLineItemsBlock: `{{#lineItems}}
  <tr class="item-header">
    <td>{{rowNum}}</td>
    <td>{{itemCode}}</td>
    <td>{{itemName}}</td>
    <td>{{categoryName}}</td>
    <td>{{subCategoryName}}</td>
    <td>{{supplierName}}</td>
    <td>{{uomName}}</td>
    <td class="num">{{stockLevel}}</td>
  </tr>
  {{/lineItems}}`,
  sampleLineItems: [
    {
      rowNum: "1",
      itemCode: "0000000100",
      itemName: "XP 600 BRAND NEW PRINT HEAD",
      categoryName: "SUBLIMATION",
      subCategoryName: "AUDLEY",
      supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
      uomName: "PCS",
      stockLevel: "2",
    },
    {
      rowNum: "2",
      itemCode: "0000000104",
      itemName: "INK CERCULATION MANIFOLD (XP600)",
      categoryName: "SUBLIMATION",
      subCategoryName: "AUDLEY",
      supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
      uomName: "PCS",
      stockLevel: "2",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};

// ── Stock Details Item ──────────────────────────────────────────
export const STOCK_DETAILS_ITEM_CONFIG = {
  reportKey: "STOCKDETAILSITEM",
  templateName: "Stock Details Item Print Template",
  sampleData: {
    ...companySample,
    generatedOn: "08-Jul-2026 04:52 PM",
    warehouseName: "Main",
    itemCode: "0000000100",
    itemName: "XP 600 BRAND NEW PRINT HEAD",
    categoryName: "SUBLIMATION",
    subCategoryName: "AUDLEY",
    supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
    uomName: "PCS",
    totalStockLevel: "2",
  },
  fieldGroups: [
    {
      id: "stock",
      title: "Stock line columns",
      fields: [
        { token: "rowNum", label: "#", header: "#", numeric: false },
        { token: "batchNumber", label: "Batch No", header: "Batch No", numeric: false },
        { token: "expiryDate", label: "EXP Date", header: "EXP Date", numeric: false },
        {
          token: "stockBalance",
          label: "Stock Balance",
          header: "Stock Balance",
          numeric: true,
        },
        {
          token: "sellingPrice",
          label: "Selling Price",
          header: "Selling Price",
          numeric: true,
        },
        { token: "categoryName", label: "Category", header: "Category", numeric: false },
        {
          token: "subCategoryName",
          label: "Sub Category",
          header: "Sub Category",
          numeric: false,
        },
        { token: "uomName", label: "UOM", header: "UOM", numeric: false },
        { token: "costPrice", label: "Cost Price", header: "Cost Price", numeric: true },
      ],
    },
  ],
  // Prefer {{#lineItems}}; also upgrade legacy {{stockLineRows}}
  defaultLineItemsBlock: `{{#lineItems}}
  <tr>
    <td>{{rowNum}}</td>
    <td>{{batchNumber}}</td>
    <td>{{expiryDate}}</td>
    <td class="num">{{stockBalance}}</td>
    <td class="num">{{sellingPrice}}</td>
    <td>{{categoryName}}</td>
    <td>{{subCategoryName}}</td>
    <td>{{uomName}}</td>
    <td class="num">{{costPrice}}</td>
  </tr>
  {{/lineItems}}`,
  upgradePlaceholders: (html, block) => {
    if (!html || !block) return html;
    let output = html;
    if (!/\{\{#\s*lineItems\s*\}\}/i.test(output)) {
      if (/\{\{\s*stockLineRows\s*\}\}/i.test(output)) {
        output = output.replace(/\{\{\s*stockLineRows\s*\}\}/gi, block);
      } else if (/\{\{\s*lineItemsRows\s*\}\}/i.test(output)) {
        output = output.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, block);
      }
    }
    return output;
  },
  sampleLineItems: [
    {
      rowNum: "1",
      batchNumber: "B-001",
      expiryDate: "2027-12-31",
      stockBalance: "1",
      sellingPrice: "1,500.00",
      categoryName: "SUBLIMATION",
      subCategoryName: "AUDLEY",
      uomName: "PCS",
      costPrice: "580.00",
    },
    {
      rowNum: "2",
      batchNumber: "B-002",
      expiryDate: "2028-06-30",
      stockBalance: "1",
      sellingPrice: "1,500.00",
      categoryName: "SUBLIMATION",
      subCategoryName: "AUDLEY",
      uomName: "PCS",
      costPrice: "580.00",
    },
  ],
  buildLineTokenMap: (item) => ({ ...item }),
};
