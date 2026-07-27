import { v4 as uuidv4 } from "uuid";
import BASE_URL from "Base/api";

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export async function fetchBatchLines(warehouseId, productId, includeZeroQty = false) {
  const response = await fetch(
    `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=${warehouseId}&productId=${productId}&includeZeroQty=${includeZeroQty}`,
    { method: "GET", headers: authHeaders() }
  );
  if (!response.ok) return [];
  const json = await response.json();
  return json.result || [];
}

export async function fetchGrnsBySupplier(supplierId) {
  const response = await fetch(
    `${BASE_URL}/GoodReceivedNote/GetAllGRNBySupplierId?supplierId=${supplierId}`,
    { method: "GET", headers: authHeaders() }
  );
  if (!response.ok) return [];
  const json = await response.json();
  return json.result || [];
}

export const GRN_DROPDOWN_INITIAL_LIMIT = 5;

export function mapGrnsToDropdownOptions(grns) {
  return (grns || [])
    .filter((grn) => grn.documentNo)
    .map((grn) => ({
      id: grn.id,
      documentNo: grn.documentNo,
      label: grn.documentNo,
    }));
}

export function filterGrnDropdownOptions(
  options,
  params,
  limit = GRN_DROPDOWN_INITIAL_LIMIT
) {
  const hasInput = params.inputValue?.trim();
  if (!hasInput) {
    return options.slice(0, limit);
  }

  const search = params.inputValue.toLowerCase();
  return options.filter((option) => {
    const documentNo = (option.documentNo || option.label || "").toLowerCase();
    return documentNo.includes(search);
  });
}

export function batchLineToRow(batch, supplier) {
  return {
    rowId: uuidv4(),
    stockBalanceId: batch.id,
    productId: batch.productId,
    productCode: batch.productCode,
    productName: batch.productName,
    supplierId: supplier?.id ?? batch.supplierID,
    supplierName: supplier?.name ?? batch.supplierName ?? "",
    warehouseId: batch.warehouseId,
    batchNumber: batch.batchNumber || "",
    expiryDate: batch.expiryDate,
    currentQty: batch.bookBalanceQuantity,
    newQty: "",
    dispatchQty: "",
    unitPrice: batch.unitPrice,
    costPrice: batch.costPrice,
    sellingPrice: batch.sellingPrice,
    remark: "",
  };
}

export async function grnLinesToRows(grn, supplier) {
  const lines =
    grn.goodReceivedNoteLineDetails || grn.GoodReceivedNoteLineDetails || [];
  const rows = [];

  for (const line of lines) {
    if (line.isDeleted) continue;

    const batches = await fetchBatchLines(line.warehouseId, line.productId, true);
    const lineBatch = (line.batch || "").trim();
    const match =
      batches.find((batch) => (batch.batchNumber || "").trim() === lineBatch) ||
      batches[0];

    if (!match) continue;

    const currentQty =
      line.grnstockQty ??
      line.grnStockQty ??
      line.GRNSTOCKQTY ??
      match.bookBalanceQuantity;

    rows.push({
      rowId: uuidv4(),
      stockBalanceId: match.id,
      productId: line.productId,
      productCode: line.productCode,
      productName: line.productName,
      supplierId: supplier?.id,
      supplierName: supplier?.name ?? "",
      warehouseId: line.warehouseId,
      batchNumber: line.batch || match.batchNumber || "",
      expiryDate: line.expDate || match.expiryDate,
      currentQty,
      newQty: "",
      dispatchQty: "",
      unitPrice: match.unitPrice,
      costPrice: match.costPrice ?? line.costPrice ?? 0,
      sellingPrice: match.sellingPrice ?? line.sellingPrice ?? 0,
      remark: "",
    });
  }

  return rows;
}

export function mergeRows(existingRows, incomingRows) {
  const existingIds = new Set(existingRows.map((row) => row.stockBalanceId));
  const uniqueIncoming = incomingRows.filter(
    (row) => !existingIds.has(row.stockBalanceId)
  );
  return {
    merged: [...existingRows, ...uniqueIncoming],
    skipped: incomingRows.length - uniqueIncoming.length,
  };
}

export function isApiSuccess(json) {
  return json?.statusCode === 200;
}

export function getApiMessage(json) {
  return json?.result?.message || json?.message || "Request failed";
}
