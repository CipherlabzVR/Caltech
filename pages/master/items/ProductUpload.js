import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Chip,
  Alert,
  Tooltip,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExcelJS from "exceljs";
import BASE_URL from "Base/api";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 850, md: 750, xs: 380 },
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 2,
  overflowY: "auto",
};

const dropZoneBase = {
  border: "2px dashed #ccc",
  borderRadius: "8px",
  p: 4,
  textAlign: "center",
  backgroundColor: "#f9f9f9",
  cursor: "pointer",
  transition: "border-color 0.2s, background-color 0.2s",
};

const dropZoneHover = {
  ...dropZoneBase,
  borderColor: "#1976D2",
  backgroundColor: "#E3F2FD",
};

const validationErrorFill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFCDD2" },
};

const validationErrorBorder = {
  top: { style: "thin", color: { argb: "FFD32F2F" } },
  left: { style: "thin", color: { argb: "FFD32F2F" } },
  bottom: { style: "thin", color: { argb: "FFD32F2F" } },
  right: { style: "thin", color: { argb: "FFD32F2F" } },
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

async function fetchAllReferenceData() {
  const headers = getAuthHeaders();
  const [catRes, subCatRes, uomRes, supplierRes, itemsRes, accountsRes, currencyRes] =
    await Promise.all([
      fetch(`${BASE_URL}/Category/GetAllCategory`, { method: "GET", headers }),
      fetch(`${BASE_URL}/SubCategory/GetAllSubCategory`, { method: "GET", headers }),
      fetch(`${BASE_URL}/UnitOfMeasure/GetAllUnitOfMeasure`, { method: "GET", headers }),
      fetch(`${BASE_URL}/Supplier/GetAllSupplier`, { method: "GET", headers }),
      fetch(`${BASE_URL}/Items/GetAllItems`, { method: "GET", headers }),
      fetch(`${BASE_URL}/ChartOfAccount/GetAll`, { method: "GET", headers }),
      fetch(`${BASE_URL}/Currency/GetAllCurrency?SkipCount=0&MaxResultCount=1000&Search=null`, { method: "GET", headers }),
    ]);

  const [catData, subCatData, uomData, supplierData, itemsData, accountsData, currencyData] =
    await Promise.all([
      catRes.json(),
      subCatRes.json(),
      uomRes.json(),
      supplierRes.json(),
      itemsRes.json(),
      accountsRes.json(),
      currencyRes.json(),
    ]);

  const categories = catData.result || [];
  const subCategories = subCatData.result || [];
  const uoms = uomData.result || [];
  const suppliers = supplierData.result || [];
  const items = Array.isArray(itemsData.result) ? itemsData.result : (itemsData.result?.items || []);
  const accounts = accountsData.result || [];
  let currencies = [];
  if (currencyData.result && currencyData.result.items) {
    currencies = currencyData.result.items;
  } else if (Array.isArray(currencyData.result)) {
    currencies = currencyData.result;
  }

  return { categories, subCategories, uoms, suppliers, items, accounts, currencies };
}

function buildTemplateWorkbook(wb, refData) {
  const { categories, subCategories, uoms, suppliers, items, accounts } = refData;

  const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1976D2" } };
  const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const requiredFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD32F2F" } };
  const refHeaderFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF455A64" } };

  const applyRefHeader = (ws, cols) => {
    cols.forEach((col, i) => {
      const cell = ws.getRow(1).getCell(i + 1);
      cell.value = col;
      cell.fill = refHeaderFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center" };
    });
    ws.getRow(1).commit();
  };

  const catMap = categories.reduce((m, c) => { m[c.id] = c.name; return m; }, {});
  const supplierMap = suppliers.reduce((m, s) => { m[s.id] = s.name; return m; }, {});
  const uomMap = uoms.reduce((m, u) => { m[u.id] = u.name; return m; }, {});
  const subCatMap = subCategories.reduce((m, sc) => { m[sc.id] = sc.name; return m; }, {});

  // --- Sheet 1: Item Upload Template (created first so it appears as the first tab) ---
  const wsTemplate = wb.addWorksheet("Item Upload Template");
  const templateColumns = [
    { header: "Item Name *", key: "Name", width: 28 },
    { header: "Item Code *", key: "Code", width: 20 },
    { header: "Category Name *", key: "CategoryName", width: 25 },
    { header: "Subcategory Name *", key: "SubCategoryName", width: 25 },
    { header: "Supplier Name *", key: "SupplierName", width: 25 },
    { header: "Unit of Measure *", key: "UOMName", width: 22 },
    { header: "Average Price", key: "AveragePrice", width: 16 },
    { header: "Reorder Level", key: "ReorderLevel", width: 16 },
    { header: "Shipment Target", key: "ShipmentTarget", width: 18 },
    { header: "Currency Code", key: "CurrencyCode", width: 16 },
    { header: "Barcode", key: "Barcode", width: 18 },
    { header: "Cost Account Code", key: "CostAccount", width: 22 },
    { header: "Income Account Code", key: "IncomeAccount", width: 22 },
    { header: "Assets Account Code", key: "AssetsAccount", width: 22 },
    { header: "Description", key: "Description", width: 35 },
    { header: "Is Active", key: "IsActive", width: 14 },
    { header: "Is Non Inventory Item", key: "IsNonInventoryItem", width: 22 },
    { header: "Has Serial Numbers", key: "HasSerialNumbers", width: 20 },
    { header: "Show In Web", key: "ShowInWeb", width: 14 },
    { header: "Is Item End Involve", key: "IsItemEndInvolve", width: 20 },
  ];
  wsTemplate.columns = templateColumns;

  const headerRow = wsTemplate.getRow(1);
  templateColumns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    const isRequired = col.header.includes("*");
    cell.fill = isRequired ? requiredFill : headerFill;
    cell.font = headerFont;
    cell.alignment = { horizontal: "center", wrapText: true };
  });
  headerRow.commit();

  // Freeze top row
  wsTemplate.views = [{ state: "frozen", ySplit: 1 }];

  // Data validation dropdowns
  const activeCatNames = categories.filter((c) => c.isActive).map((c) => `"${c.name}"`).join(",");
  const activeSubCatNames = subCategories.filter((sc) => sc.isActive).map((sc) => `"${sc.name}"`).join(",");
  const activeSupplierNames = suppliers.filter((s) => s.isActive).map((s) => `"${s.name}"`).join(",");
  const activeUomNames = uoms.filter((u) => u.isActive).map((u) => `"${u.name}"`).join(",");
  const yesNo = '"Yes,No"';

  const maxRows = 1000;
  for (let row = 2; row <= maxRows; row++) {
    if (activeCatNames) {
      wsTemplate.getCell(`C${row}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [activeCatNames], showErrorMessage: true,
        errorTitle: "Invalid Category", error: "Please select from the dropdown.",
      };
    }
    if (activeSubCatNames) {
      wsTemplate.getCell(`D${row}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [activeSubCatNames], showErrorMessage: true,
        errorTitle: "Invalid Subcategory", error: "Please select from the dropdown.",
      };
    }
    if (activeSupplierNames) {
      wsTemplate.getCell(`E${row}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [activeSupplierNames], showErrorMessage: true,
        errorTitle: "Invalid Supplier", error: "Please select from the dropdown.",
      };
    }
    if (activeUomNames) {
      wsTemplate.getCell(`F${row}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [activeUomNames], showErrorMessage: true,
        errorTitle: "Invalid UOM", error: "Please select from the dropdown.",
      };
    }
    // Yes/No dropdowns
    for (const col of ["P", "Q", "R", "S", "T"]) {
      wsTemplate.getCell(`${col}${row}`).dataValidation = {
        type: "list", allowBlank: true, formulae: [yesNo], showErrorMessage: true,
        errorTitle: "Invalid Value", error: "Please select Yes or No.",
      };
    }
  }

  // --- Reference Sheets (added after template so template is the first tab) ---

  // --- Category List ---
  const wsCat = wb.addWorksheet("Category List");
  wsCat.columns = [
    { header: "", key: "id", width: 15 },
    { header: "", key: "name", width: 30 },
    { header: "", key: "isActive", width: 15 },
  ];
  applyRefHeader(wsCat, ["Category ID", "Category Name", "Is Active"]);
  categories.forEach((c) => wsCat.addRow({ id: c.id, name: c.name, isActive: c.isActive ? "Yes" : "No" }));
  wsCat.protect("", { selectLockedCells: true, selectUnlockedCells: true });

  // --- Subcategory List ---
  const wsSubCat = wb.addWorksheet("Subcategory List");
  wsSubCat.columns = [
    { header: "", key: "id", width: 18 },
    { header: "", key: "name", width: 30 },
    { header: "", key: "categoryId", width: 15 },
    { header: "", key: "categoryName", width: 30 },
    { header: "", key: "isActive", width: 15 },
  ];
  applyRefHeader(wsSubCat, ["Subcategory ID", "Subcategory Name", "Category ID", "Category Name", "Is Active"]);
  subCategories.forEach((sc) =>
    wsSubCat.addRow({
      id: sc.id,
      name: sc.name,
      categoryId: sc.categoryId,
      categoryName: catMap[sc.categoryId] || "",
      isActive: sc.isActive ? "Yes" : "No",
    })
  );
  wsSubCat.protect("", { selectLockedCells: true, selectUnlockedCells: true });

  // --- Unit of Measure List ---
  const wsUom = wb.addWorksheet("Unit of Measure List");
  wsUom.columns = [
    { header: "", key: "id", width: 15 },
    { header: "", key: "name", width: 25 },
    { header: "", key: "description", width: 30 },
    { header: "", key: "value", width: 12 },
    { header: "", key: "isActive", width: 15 },
  ];
  applyRefHeader(wsUom, ["UOM ID", "UOM Name", "Description", "Value", "Is Active"]);
  uoms.forEach((u) =>
    wsUom.addRow({ id: u.id, name: u.name, description: u.description || "", value: u.value, isActive: u.isActive ? "Yes" : "No" })
  );
  wsUom.protect("", { selectLockedCells: true, selectUnlockedCells: true });

  // --- Supplier List ---
  const wsSupplier = wb.addWorksheet("Supplier List");
  wsSupplier.columns = [
    { header: "", key: "id", width: 15 },
    { header: "", key: "name", width: 30 },
    { header: "", key: "mobileNo", width: 20 },
    { header: "", key: "isActive", width: 15 },
  ];
  applyRefHeader(wsSupplier, ["Supplier ID", "Supplier Name", "Mobile No", "Is Active"]);
  suppliers.forEach((s) =>
    wsSupplier.addRow({ id: s.id, name: s.name, mobileNo: s.mobileNo || "", isActive: s.isActive ? "Yes" : "No" })
  );
  wsSupplier.protect("", { selectLockedCells: true, selectUnlockedCells: true });

  // --- Existing Items ---
  const wsItems = wb.addWorksheet("Existing Items");
  wsItems.columns = [
    { header: "", key: "code", width: 18 },
    { header: "", key: "name", width: 30 },
    { header: "", key: "category", width: 25 },
    { header: "", key: "subCategory", width: 25 },
    { header: "", key: "supplier", width: 25 },
    { header: "", key: "uom", width: 20 },
    { header: "", key: "isActive", width: 15 },
  ];
  applyRefHeader(wsItems, ["Item Code", "Item Name", "Category", "Subcategory", "Supplier", "UOM", "Is Active"]);
  items.forEach((item) =>
    wsItems.addRow({
      code: item.code,
      name: item.name,
      category: catMap[item.categoryId] || "",
      subCategory: subCatMap[item.subCategoryId] || "",
      supplier: supplierMap[item.supplier] || "",
      uom: uomMap[item.uom] || "",
      isActive: item.isActive ? "Yes" : "No",
    })
  );
  wsItems.protect("", { selectLockedCells: true, selectUnlockedCells: true });
}

function parseYesNo(val, defaultVal = false) {
  if (val === undefined || val === null || val === "") return defaultVal;
  const s = String(val).trim().toLowerCase();
  if (s === "yes" || s === "true" || s === "1") return true;
  if (s === "no" || s === "false" || s === "0") return false;
  return defaultVal;
}

function validateAndResolveRows(rows, refData) {
  const { categories, subCategories, uoms, suppliers, accounts, currencies } = refData;

  const catByName = {};
  categories.forEach((c) => { if (c.isActive) catByName[c.name.trim().toLowerCase()] = c; });
  const subCatByName = {};
  subCategories.forEach((sc) => { if (sc.isActive) subCatByName[sc.name.trim().toLowerCase()] = sc; });
  const uomByName = {};
  uoms.forEach((u) => { if (u.isActive) uomByName[u.name.trim().toLowerCase()] = u; });
  const supplierByName = {};
  suppliers.forEach((s) => { if (s.isActive) supplierByName[s.name.trim().toLowerCase()] = s; });
  const accountByCode = {};
  accounts.forEach((a) => { accountByCode[String(a.code).trim()] = a; });
  const currencyByCode = {};
  currencies.forEach((c) => { if (c.isActive !== false) currencyByCode[String(c.code).trim().toUpperCase()] = c; });

  const validRows = [];
  const errorRows = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rowErrors = [];

    const name = row["Name"]?.toString().trim();
    const code = row["Code"]?.toString().trim();
    const categoryName = row["CategoryName"]?.toString().trim();
    const subCategoryName = row["SubCategoryName"]?.toString().trim();
    const supplierName = row["SupplierName"]?.toString().trim();
    const uomName = row["UOMName"]?.toString().trim();

    if (!name) rowErrors.push({ field: "Item Name", message: "Item Name is required" });
    if (!code) rowErrors.push({ field: "Item Code", message: "Item Code is required" });
    if (!categoryName) rowErrors.push({ field: "Category Name", message: "Category Name is required" });
    if (!subCategoryName) rowErrors.push({ field: "Subcategory Name", message: "Subcategory Name is required" });
    if (!supplierName) rowErrors.push({ field: "Supplier Name", message: "Supplier Name is required" });
    if (!uomName) rowErrors.push({ field: "Unit of Measure", message: "Unit of Measure is required" });

    let resolvedCat = null;
    let resolvedSubCat = null;
    let resolvedSupplier = null;
    let resolvedUom = null;

    if (categoryName) {
      resolvedCat = catByName[categoryName.toLowerCase()];
      if (!resolvedCat) rowErrors.push({ field: "Category Name", message: `Category "${categoryName}" not found or inactive` });
    }
    if (subCategoryName) {
      resolvedSubCat = subCatByName[subCategoryName.toLowerCase()];
      if (!resolvedSubCat) {
        rowErrors.push({ field: "Subcategory Name", message: `Subcategory "${subCategoryName}" not found or inactive` });
      } else if (resolvedCat && resolvedSubCat.categoryId !== resolvedCat.id) {
        rowErrors.push({ field: "Subcategory Name", message: `Subcategory "${subCategoryName}" does not belong to Category "${categoryName}"` });
      }
    }
    if (supplierName) {
      resolvedSupplier = supplierByName[supplierName.toLowerCase()];
      if (!resolvedSupplier) rowErrors.push({ field: "Supplier Name", message: `Supplier "${supplierName}" not found or inactive` });
    }
    if (uomName) {
      resolvedUom = uomByName[uomName.toLowerCase()];
      if (!resolvedUom) rowErrors.push({ field: "Unit of Measure", message: `UOM "${uomName}" not found or inactive` });
    }

    const avgPrice = row["AveragePrice"];
    if (avgPrice !== undefined && avgPrice !== null && avgPrice !== "" && isNaN(Number(avgPrice))) {
      rowErrors.push({ field: "Average Price", message: "Must be a valid number" });
    }
    const reorderLevel = row["ReorderLevel"];
    if (reorderLevel !== undefined && reorderLevel !== null && reorderLevel !== "" && isNaN(Number(reorderLevel))) {
      rowErrors.push({ field: "Reorder Level", message: "Must be a valid number" });
    }
    const shipmentTarget = row["ShipmentTarget"];
    if (shipmentTarget !== undefined && shipmentTarget !== null && shipmentTarget !== "" && isNaN(Number(shipmentTarget))) {
      rowErrors.push({ field: "Shipment Target", message: "Must be a valid number" });
    }

    let resolvedCostAcc = null;
    let resolvedIncomeAcc = null;
    let resolvedAssetsAcc = null;
    let resolvedCurrency = null;

    const costCode = row["CostAccount"]?.toString().trim();
    if (costCode) {
      resolvedCostAcc = accountByCode[costCode];
      if (!resolvedCostAcc) rowErrors.push({ field: "Cost Account Code", message: `Account code "${costCode}" not found` });
    }
    const incomeCode = row["IncomeAccount"]?.toString().trim();
    if (incomeCode) {
      resolvedIncomeAcc = accountByCode[incomeCode];
      if (!resolvedIncomeAcc) rowErrors.push({ field: "Income Account Code", message: `Account code "${incomeCode}" not found` });
    }
    const assetsCode = row["AssetsAccount"]?.toString().trim();
    if (assetsCode) {
      resolvedAssetsAcc = accountByCode[assetsCode];
      if (!resolvedAssetsAcc) rowErrors.push({ field: "Assets Account Code", message: `Account code "${assetsCode}" not found` });
    }
    const currCode = row["CurrencyCode"]?.toString().trim();
    if (currCode) {
      resolvedCurrency = currencyByCode[currCode.toUpperCase()];
      if (!resolvedCurrency) rowErrors.push({ field: "Currency Code", message: `Currency "${currCode}" not found` });
    }

    if (rowErrors.length > 0) {
      rowErrors.forEach((e) => errorRows.push({ row: rowNum, ...e }));
    } else {
      validRows.push({
        Name: name,
        Code: code,
        CategoryId: resolvedCat.id,
        SubCategoryId: resolvedSubCat.id,
        Supplier: resolvedSupplier.id,
        UOM: resolvedUom.id,
        AveragePrice: avgPrice !== undefined && avgPrice !== null && avgPrice !== "" ? Number(avgPrice) : null,
        ReorderLevel: reorderLevel !== undefined && reorderLevel !== null && reorderLevel !== "" ? Number(reorderLevel) : null,
        ShipmentTarget: shipmentTarget !== undefined && shipmentTarget !== null && shipmentTarget !== "" ? Number(shipmentTarget) : null,
        CurrencyId: resolvedCurrency?.id || null,
        Barcode: row["Barcode"]?.toString().trim() || null,
        CostAccount: resolvedCostAcc?.id || null,
        IncomeAccount: resolvedIncomeAcc?.id || null,
        AssetsAccount: resolvedAssetsAcc?.id || null,
        Description: row["Description"]?.toString().trim() || "",
        IsActive: parseYesNo(row["IsActive"], true),
        IsNonInventoryItem: parseYesNo(row["IsNonInventoryItem"], false),
        HasSerialNumbers: parseYesNo(row["HasSerialNumbers"], false),
        IsWebView: parseYesNo(row["ShowInWeb"], false),
        IsOutOfStock: false,
        IsItemEndInvolve: parseYesNo(row["IsItemEndInvolve"], false),
      });
    }
  });

  return { validRows, errorRows };
}

async function submitItem(itemData) {
  const formData = new FormData();
  formData.append("Name", itemData.Name);
  formData.append("Code", itemData.Code);
  formData.append("AveragePrice", itemData.AveragePrice != null ? String(itemData.AveragePrice) : "0");
  formData.append("CategoryId", itemData.CategoryId);
  formData.append("SubCategoryId", itemData.SubCategoryId);
  formData.append("Supplier", itemData.Supplier);
  formData.append("UOM", itemData.UOM);
  formData.append("IsActive", itemData.IsActive);
  formData.append("IsNonInventoryItem", itemData.IsNonInventoryItem);
  formData.append("HasSerialNumbers", itemData.HasSerialNumbers);
  formData.append("IsWebView", itemData.IsWebView);
  formData.append("IsOutOfStock", itemData.IsOutOfStock);
  formData.append("IsItemEndInvolve", itemData.IsItemEndInvolve);
  if (itemData.Description && itemData.Description.trim() !== "") {
    formData.append("Description", itemData.Description);
  }
  formData.append("SubImagesMeta", "[]");

  if (itemData.ShipmentTarget != null) formData.append("ShipmentTarget", String(itemData.ShipmentTarget));
  if (itemData.ReorderLevel != null) formData.append("ReorderLevel", String(itemData.ReorderLevel));
  if (itemData.CurrencyId) formData.append("CurrencyId", itemData.CurrencyId);
  if (itemData.Barcode) formData.append("Barcode", itemData.Barcode);
  if (itemData.CostAccount) formData.append("CostAccount", itemData.CostAccount);
  if (itemData.AssetsAccount) formData.append("AssetsAccount", itemData.AssetsAccount);
  if (itemData.IncomeAccount) formData.append("IncomeAccount", itemData.IncomeAccount);

  const response = await fetch(`${BASE_URL}/Items/CreateItems`, {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const responseData = await response.json().catch(() => null);
  console.log("CreateItems response:", response.status, responseData);

  if (!response.ok || !responseData) {
    let errorMsg = "";
    if (responseData?.errors) {
      errorMsg = Object.entries(responseData.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join("; ");
    }
    return {
      statusCode: response.status,
      message: errorMsg || responseData?.message || responseData?.title || `Server error (${response.status})`,
    };
  }

  return responseData;
}

const COLUMN_KEYS = [
  "Name", "Code", "CategoryName", "SubCategoryName", "SupplierName", "UOMName",
  "AveragePrice", "ReorderLevel", "ShipmentTarget", "CurrencyCode", "Barcode",
  "CostAccount", "IncomeAccount", "AssetsAccount", "Description",
  "IsActive", "IsNonInventoryItem", "HasSerialNumbers", "ShowInWeb", "IsItemEndInvolve",
];

const FIELD_TO_COLUMN_KEY = {
  "Item Name": "Name",
  "Item Code": "Code",
  "Category Name": "CategoryName",
  "Subcategory Name": "SubCategoryName",
  "Supplier Name": "SupplierName",
  "Unit of Measure": "UOMName",
  "Average Price": "AveragePrice",
  "Reorder Level": "ReorderLevel",
  "Shipment Target": "ShipmentTarget",
  "Currency Code": "CurrencyCode",
  "Cost Account Code": "CostAccount",
  "Income Account Code": "IncomeAccount",
  "Assets Account Code": "AssetsAccount",
};

function getHighlightedFileName(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return `${fileName}_Validated.xlsx`;
  return `${fileName.slice(0, dotIndex)}_Validated${fileName.slice(dotIndex)}`;
}

function downloadBufferAsFile(buffer, fileName) {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getCellPrimitive(cell) {
  const raw = cell.value;
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return raw;
  if (raw.result !== undefined) return raw.result;
  if (raw.text !== undefined) return raw.text;
  if (raw.richText) return raw.richText.map((r) => r.text).join("");
  if (raw instanceof Date) return raw;
  return String(raw);
}

function extractTemplateRows(ws) {
  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData = {};
    let hasData = false;

    COLUMN_KEYS.forEach((key, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const value = getCellPrimitive(cell);
      if (value !== null && value !== undefined && value !== "") hasData = true;
      rowData[key] = value;
    });

    if (hasData) rows.push(rowData);
  });

  return rows;
}

function applyValidationHighlights(ws, errorRows) {
  const errorMessagesByCell = new Map();

  errorRows.forEach((error) => {
    const columnKey = FIELD_TO_COLUMN_KEY[error.field];
    const columnIndex = COLUMN_KEYS.indexOf(columnKey) + 1;

    if (!columnKey || columnIndex <= 0) return;

    const cell = ws.getRow(error.row).getCell(columnIndex);
    cell.fill = validationErrorFill;
    cell.border = validationErrorBorder;
    cell.alignment = { ...(cell.alignment || {}), wrapText: true };
    cell.font = {
      ...(cell.font || {}),
      color: { argb: "FFB71C1C" },
    };

    const cellKey = `${error.row}:${columnIndex}`;
    const messages = errorMessagesByCell.get(cellKey) || [];
    if (!messages.includes(error.message)) messages.push(error.message);
    errorMessagesByCell.set(cellKey, messages);
  });

  errorMessagesByCell.forEach((messages, cellKey) => {
    const [rowNumber, columnIndex] = cellKey.split(":").map(Number);
    ws.getRow(rowNumber).getCell(columnIndex).note = messages.join("\n");
  });
}

function addValidationErrorsSheet(wb, errorRows) {
  const existingSheet = wb.getWorksheet("Validation Errors");
  if (existingSheet) wb.removeWorksheet(existingSheet.id);

  const wsErrors = wb.addWorksheet("Validation Errors");
  wsErrors.columns = [
    { header: "Row", key: "row", width: 10 },
    { header: "Field", key: "field", width: 24 },
    { header: "Error", key: "message", width: 60 },
  ];

  wsErrors.getRow(1).font = { bold: true };
  wsErrors.views = [{ state: "frozen", ySplit: 1 }];
  errorRows.forEach((error) => wsErrors.addRow(error));
}

const PREVIEW_COLUMNS = [
  { key: "Name", label: "Item Name" },
  { key: "Code", label: "Item Code" },
  { key: "CategoryName", label: "Category" },
  { key: "SubCategoryName", label: "Subcategory" },
  { key: "SupplierName", label: "Supplier" },
  { key: "UOMName", label: "UOM" },
  { key: "AveragePrice", label: "Avg Price" },
  { key: "CurrencyCode", label: "Currency" },
  { key: "Barcode", label: "Barcode" },
];

function buildPreviewRows(rawRows, errorRows) {
  const errorsByRow = {};
  errorRows.forEach((err) => {
    if (!errorsByRow[err.row]) errorsByRow[err.row] = {};
    const colKey = FIELD_TO_COLUMN_KEY[err.field];
    if (colKey) {
      if (!errorsByRow[err.row][colKey]) errorsByRow[err.row][colKey] = [];
      errorsByRow[err.row][colKey].push(err.message);
    }
  });

  return rawRows.map((row, idx) => {
    const rowNum = idx + 2;
    const cellErrors = errorsByRow[rowNum] || {};
    return {
      rowNum,
      data: row,
      hasError: Object.keys(cellErrors).length > 0,
      cellErrors,
    };
  });
}

async function validateUploadedWorkbook(file, { createHighlightedCopy = false } = {}) {
  const arrayBuffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);

  const ws = wb.getWorksheet("Item Upload Template");
  if (!ws) {
    return {
      error: "Sheet 'Item Upload Template' not found in the uploaded file.",
      validRows: [],
      errorRows: [],
      rawRows: [],
      isEmpty: false,
      highlightedBuffer: null,
    };
  }

  const rawRows = extractTemplateRows(ws);
  if (rawRows.length === 0) {
    return {
      validRows: [],
      errorRows: [],
      rawRows: [],
      isEmpty: true,
      highlightedBuffer: null,
    };
  }

  const refData = await fetchAllReferenceData();
  const { validRows, errorRows } = validateAndResolveRows(rawRows, refData);

  let highlightedBuffer = null;
  if (createHighlightedCopy && errorRows.length > 0) {
    applyValidationHighlights(ws, errorRows);
    addValidationErrorsSheet(wb, errorRows);
    highlightedBuffer = await wb.xlsx.writeBuffer();
  }

  return {
    validRows,
    errorRows,
    rawRows,
    isEmpty: false,
    highlightedBuffer,
  };
}

export default function ProductUpload({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [validatingFile, setValidatingFile] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [validationErrors, setValidationErrors] = useState([]);
  const [fileValidationStatus, setFileValidationStatus] = useState("idle");
  const [highlightedFileBuffer, setHighlightedFileBuffer] = useState(null);
  const [highlightedFileName, setHighlightedFileName] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleOpen = () => {
    setOpen(true);
    resetState();
  };

  const handleClose = () => {
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setUploadedFile(null);
    setIsDragOver(false);
    setProcessing(false);
    setValidatingFile(false);
    setProgress({ current: 0, total: 0 });
    setValidationErrors([]);
    setFileValidationStatus("idle");
    setHighlightedFileBuffer(null);
    setHighlightedFileName("");
    setPreviewRows([]);
    setResults(null);
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const refData = await fetchAllReferenceData();
      const wb = new ExcelJS.Workbook();
      buildTemplateWorkbook(wb, refData);
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Item_Upload_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template downloaded successfully");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Failed to generate template. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const onFileSelected = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "xlsx") {
      toast.error("Only .xlsx files are accepted");
      return;
    }
    setUploadedFile(file);
    setValidationErrors([]);
    setFileValidationStatus("idle");
    setHighlightedFileBuffer(null);
    setHighlightedFileName("");
    setPreviewRows([]);
    setResults(null);

    setValidatingFile(true);
    try {
      const validation = await validateUploadedWorkbook(file, { createHighlightedCopy: true });

      if (validation.error) {
        setFileValidationStatus("error");
        toast.error(validation.error);
        return;
      }

      if (validation.isEmpty) {
        setFileValidationStatus("empty");
        toast.warning("No data rows found in the template.");
        return;
      }

      const preview = buildPreviewRows(validation.rawRows, validation.errorRows);
      setPreviewRows(preview);
      setValidationErrors(validation.errorRows);

      if (validation.errorRows.length > 0) {
        setHighlightedFileBuffer(validation.highlightedBuffer);
        setHighlightedFileName(getHighlightedFileName(file.name));
        setFileValidationStatus("error");
        const errorRowCount = preview.filter((r) => r.hasError).length;
        toast.error(`${errorRowCount} row(s) with errors. Fix highlighted cells and re-upload.`);
      } else {
        setFileValidationStatus("success");
        toast.success("All rows validated. Ready to upload.");
      }
    } catch (err) {
      console.error("File validation error:", err);
      setFileValidationStatus("error");
      toast.error("Failed to validate the uploaded file.");
    } finally {
      setValidatingFile(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    onFileSelected(file);
    e.target.value = "";
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    onFileSelected(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDownloadHighlightedFile = () => {
    if (!highlightedFileBuffer || !highlightedFileName) return;
    downloadBufferAsFile(highlightedFileBuffer, highlightedFileName);
  };

  const handleUploadAndProcess = async () => {
    if (!uploadedFile || validatingFile) return;
    setProcessing(true);
    setValidationErrors([]);
    setResults(null);

    try {
      const validation = await validateUploadedWorkbook(uploadedFile, { createHighlightedCopy: true });

      if (validation.error) {
        toast.error(validation.error);
        setProcessing(false);
        return;
      }

      if (validation.isEmpty) {
        setFileValidationStatus("empty");
        toast.warning("No data rows found in the template.");
        setProcessing(false);
        return;
      }

      const { validRows, errorRows } = validation;

      const preview = buildPreviewRows(validation.rawRows, errorRows);
      setPreviewRows(preview);

      if (errorRows.length > 0) {
        setValidationErrors(errorRows);
        setHighlightedFileBuffer(validation.highlightedBuffer);
        setHighlightedFileName(getHighlightedFileName(uploadedFile.name));
        setFileValidationStatus("error");
        const errorRowCount = preview.filter((r) => r.hasError).length;
        toast.error(`${errorRowCount} row(s) with errors. Fix and re-upload.`);
        setProcessing(false);
        return;
      }

      setFileValidationStatus("success");
      setHighlightedFileBuffer(null);
      setHighlightedFileName("");

      setProgress({ current: 0, total: validRows.length });
      let successCount = 0;
      let failCount = 0;
      const failedItems = [];
      const uploadStatuses = {};

      for (let i = 0; i < validRows.length; i++) {
        const rowNum = i + 2;
        setProgress({ current: i + 1, total: validRows.length });
        try {
          const result = await submitItem(validRows[i]);
          if (result.statusCode == 200) {
            successCount++;
            uploadStatuses[rowNum] = { status: "success", message: result.message || "Created successfully" };
          } else {
            failCount++;
            const msg = result.message || `Failed (status: ${result.statusCode})`;
            failedItems.push({ row: rowNum, name: validRows[i].Name, message: msg });
            uploadStatuses[rowNum] = { status: "failed", message: msg };
          }
        } catch (err) {
          failCount++;
          const msg = err.message || "Network error";
          failedItems.push({ row: rowNum, name: validRows[i].Name, message: msg });
          uploadStatuses[rowNum] = { status: "failed", message: msg };
        }

        setPreviewRows((prev) =>
          prev.map((r) =>
            r.rowNum === rowNum
              ? { ...r, uploadStatus: uploadStatuses[rowNum].status, uploadMessage: uploadStatuses[rowNum].message }
              : r
          )
        );
      }

      if (failCount === 0) {
        toast.success(`${successCount} item(s) created successfully`);
        if (fetchItems) fetchItems();
        resetState();
      } else {
        setResults({ successCount, failCount, failedItems });
        if (successCount > 0) {
          toast.success(`${successCount} item(s) created successfully`);
          if (fetchItems) fetchItems();
        }
        toast.error(`${failCount} item(s) failed to create`);
      }
    } catch (err) {
      console.error("Upload processing error:", err);
      toast.error("Failed to process the uploaded file.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen} startIcon={<UploadFileIcon />}>
        Bulk Upload
      </Button>

      <Modal open={open} onClose={processing ? undefined : handleClose}>
        <Box sx={modalStyle} className="bg-black">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>
              Bulk Product Upload
            </Typography>
            <IconButton onClick={handleClose} disabled={processing} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Download Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={500} gutterBottom>
              Step 1: Download Template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Download the Excel template. Fill in the &quot;Item Upload Template&quot; sheet using the reference sheets
              (Category List, Subcategory List, Unit of Measure List, Supplier List, Existing Items) for valid values.
              Required fields are marked with an asterisk (*).
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              disabled={downloading}
            >
              {downloading ? "Generating Template..." : "Download Template"}
            </Button>
            {downloading && <LinearProgress sx={{ mt: 1 }} />}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Upload Section */}
          <Box>
            <Typography variant="h6" fontWeight={500} gutterBottom>
              Step 2: Upload Completed Template
            </Typography>

            {!uploadedFile ? (
              <Box
                sx={isDragOver ? dropZoneHover : dropZoneBase}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUploadIcon sx={{ fontSize: 56, color: isDragOver ? "#1976D2" : "#999", mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  Drag &amp; drop your .xlsx file here
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  or click to browse
                </Typography>
                <Button variant="outlined" size="small" component="span">
                  Browse Files
                </Button>
                <input ref={fileInputRef} type="file" hidden accept=".xlsx" onChange={handleFileInput} />
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
                <InsertDriveFileIcon color="success" sx={{ fontSize: 40 }} />
                <Box flex={1}>
                  <Typography variant="body1" fontWeight={500}>{uploadedFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => { setUploadedFile(null); setValidationErrors([]); setPreviewRows([]); setFileValidationStatus("idle"); setResults(null); }} disabled={processing}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {validatingFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Checking the selected file for validation errors...
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {/* Progress */}
            {processing && (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Processing...</Typography>
                  <Typography variant="body2">
                    {progress.current} / {progress.total}
                  </Typography>
                </Box>
                <LinearProgress
                  variant={progress.total > 0 ? "determinate" : "indeterminate"}
                  value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                />
              </Box>
            )}

            {/* Full Data Preview & Upload Results (unified table) */}
            {previewRows.length > 0 && !processing && (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {results ? "Upload Results" : "Data Preview"} ({previewRows.length} row{previewRows.length !== 1 ? "s" : ""})
                    </Typography>
                    {!results && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={`Valid: ${previewRows.filter((r) => !r.hasError).length}`}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {!results && previewRows.some((r) => r.hasError) && (
                      <Chip
                        icon={<ErrorIcon />}
                        label={`Errors: ${previewRows.filter((r) => r.hasError).length}`}
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {results && (
                      <>
                        <Chip icon={<CheckCircleIcon />} label={`Success: ${results.successCount}`} color="success" size="small" variant="outlined" />
                        {results.failCount > 0 && (
                          <Chip icon={<ErrorIcon />} label={`Failed: ${results.failCount}`} color="error" size="small" variant="outlined" />
                        )}
                      </>
                    )}
                  </Box>
                  {highlightedFileBuffer && !results && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadHighlightedFile}
                      color="error"
                    >
                      Download Highlighted File
                    </Button>
                  )}
                </Box>

                {!results && validationErrors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {previewRows.filter((r) => r.hasError).length} row(s) have errors. Hover over red cells to see details. Fix and re-upload to enable processing.
                  </Alert>
                )}
                {!results && validationErrors.length === 0 && fileValidationStatus === "success" && (
                  <Alert severity="success" sx={{ mb: 1 }}>
                    All rows validated successfully. You can now upload and process.
                  </Alert>
                )}
                {results && results.failCount === 0 && (
                  <Alert severity="success" sx={{ mb: 1 }}>
                    All {results.successCount} item(s) created successfully.
                  </Alert>
                )}
                {results && results.failCount > 0 && results.successCount > 0 && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    {results.successCount} item(s) created, {results.failCount} failed. Hover over failed rows to see errors.
                  </Alert>
                )}
                {results && results.failCount > 0 && results.successCount === 0 && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    All {results.failCount} item(s) failed to create. Hover over failed rows to see errors.
                  </Alert>
                )}

                <TableContainer component={Paper} sx={{ maxHeight: 350, border: "1px solid #e0e0e0" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f5f5", minWidth: 50 }}>Row</TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f5f5", minWidth: 50, textAlign: "center" }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f5f5", minWidth: 120 }}>Item Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f5f5", minWidth: 100 }}>Item Code</TableCell>
                        <TableCell sx={{ fontWeight: 700, backgroundColor: "#f5f5f5", minWidth: 200 }}>Error / Status</TableCell>
                        {PREVIEW_COLUMNS.filter((c) => c.key !== "Name" && c.key !== "Code").map((col) => (
                          <TableCell key={col.key} sx={{ fontWeight: 700, backgroundColor: "#f5f5f5", minWidth: 100, whiteSpace: "nowrap" }}>
                            {col.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewRows.map((pRow) => {
                        const isUploadFailed = pRow.uploadStatus === "failed";
                        const isUploadSuccess = pRow.uploadStatus === "success";
                        const hasValidationErr = pRow.hasError;
                        const rowBg = isUploadFailed
                          ? "#FFF3F3"
                          : isUploadSuccess
                          ? "#F1F8E9"
                          : hasValidationErr
                          ? "#FFF3F3"
                          : "inherit";
                        const rowHoverBg = isUploadFailed
                          ? "#FFE0E0"
                          : isUploadSuccess
                          ? "#DCEDC8"
                          : hasValidationErr
                          ? "#FFE0E0"
                          : "#F5F5F5";

                        const statusIcon = isUploadSuccess ? (
                          <CheckCircleIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
                        ) : isUploadFailed ? (
                          <ErrorIcon sx={{ fontSize: 18, color: "#D32F2F" }} />
                        ) : hasValidationErr ? (
                          <ErrorIcon sx={{ fontSize: 18, color: "#D32F2F" }} />
                        ) : (
                          <CheckCircleIcon sx={{ fontSize: 18, color: "#2E7D32" }} />
                        );

                        const errorMessage = isUploadFailed
                          ? pRow.uploadMessage || "Upload failed"
                          : hasValidationErr
                          ? Object.values(pRow.cellErrors).flat().join("; ")
                          : "";

                        const nameValue = pRow.data["Name"] != null ? String(pRow.data["Name"]) : "";
                        const codeValue = pRow.data["Code"] != null ? String(pRow.data["Code"]) : "";

                        return (
                          <TableRow
                            key={pRow.rowNum}
                            sx={{ backgroundColor: rowBg, "&:hover": { backgroundColor: rowHoverBg } }}
                          >
                            <TableCell sx={{ fontWeight: 500 }}>{pRow.rowNum}</TableCell>
                            <TableCell sx={{ textAlign: "center" }}>{statusIcon}</TableCell>
                            <TableCell sx={{ fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {nameValue}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {codeValue}
                            </TableCell>
                            <TableCell
                              sx={{
                                color: errorMessage ? "#B71C1C" : "#2E7D32",
                                fontWeight: errorMessage ? 600 : 400,
                                fontSize: "0.8rem",
                                maxWidth: 300,
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {errorMessage || (isUploadSuccess ? "Created successfully" : "Valid")}
                            </TableCell>
                            {PREVIEW_COLUMNS.filter((c) => c.key !== "Name" && c.key !== "Code").map((col) => {
                              const cellErr = pRow.cellErrors[col.key];
                              const cellValue = pRow.data[col.key];
                              const displayValue = cellValue !== null && cellValue !== undefined ? String(cellValue) : "";

                              if (cellErr) {
                                return (
                                  <Tooltip key={col.key} title={cellErr.join("; ")} arrow placement="top">
                                    <TableCell
                                      sx={{
                                        backgroundColor: "#FFCDD2",
                                        color: "#B71C1C",
                                        fontWeight: 600,
                                        borderLeft: "3px solid #D32F2F",
                                        cursor: "help",
                                        maxWidth: 160,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {displayValue || <em style={{ color: "#D32F2F" }}>empty</em>}
                                    </TableCell>
                                  </Tooltip>
                                );
                              }

                              return (
                                <TableCell
                                  key={col.key}
                                  sx={{
                                    maxWidth: 160,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {displayValue}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {uploadedFile && fileValidationStatus === "empty" && !processing && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                The selected template does not contain any data rows yet.
              </Alert>
            )}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button variant="contained" color="error" onClick={handleClose} disabled={processing} size="small">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleUploadAndProcess}
                disabled={!uploadedFile || processing || validatingFile || validationErrors.length > 0 || fileValidationStatus !== "success"}
                startIcon={<UploadFileIcon />}
                size="small"
              >
                {processing ? "Processing..." : "Upload & Process"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
