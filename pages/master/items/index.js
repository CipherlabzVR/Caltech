import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import AddItems from "pages/master/items/AddItems";
import BASE_URL from "Base/api";
import EditItems from "pages/master/items/EditItems";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import ProductUpload from "pages/master/items/ProductUpload";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { formatCurrency } from "@/components/utils/formatHelper";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import useApi from "@/components/utils/useApi";

const OUTBOUND_METHOD_LABELS = {
  1: "FIFO",
  2: "LIFO",
  3: "FEFO",
  4: "LEFO",
  5: "BIFO",
  6: "BILO",
};

export default function Items() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print, approve1 } = IsPermissionEnabled(cId);
  const [itemsList, setItemsList] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const controller = "Items/DeleteItems";
  const { data: isPOSSystem } = IsAppSettingEnabled(`IsPosSystem`);
  const { data: isGarmentSystem } = IsAppSettingEnabled(`IsGarmentSystem`);
  const { data: isBarcodeEnabled } = IsAppSettingEnabled(`IsBarcodeEnabled`);
  const { data: IsEcommerceWebSiteAvailable } = IsAppSettingEnabled(`IsEcommerceWebSiteAvailable`);
  const { data: isSubCategoryNotRequired } = IsAppSettingEnabled("IsSubCategoryNotRequired");
  const { data: isUOMNotRequired } = IsAppSettingEnabled("IsUOMNotRequired");
  const { data: showItemWebDetailFields } = IsAppSettingEnabled("ShowEcomItemWebDetailFieldsInMaster");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: supplierList, refetch: refetchSuppliers } = GetAllSuppliers();
  const { categories, subCategories, uoms, refetch: refetchItemDetails } = GetAllItemDetails();
  const [chartOfAccInfo, setChartOfAccInfo] = useState({});
  const [supplierInfo, setSupplierInfo] = useState({});
  const [uomInfo, setUOMInfo] = useState({});
  const [catInfo, setCatInfo] = useState({});
  const [subCatInfo, setSubCatInfo] = useState({});
  const [page, setPage] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = parseInt(sessionStorage.getItem("itemsPage"), 10);
    return Number.isNaN(saved) || saved < 1 ? 1 : saved;
  });
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window === "undefined") return 10;
    const saved = parseInt(sessionStorage.getItem("itemsPageSize"), 10);
    return Number.isNaN(saved) || saved < 1 ? 10 : saved;
  });
  const [totalCount, setTotalCount] = useState(0);
  const [duplicateRequestSeq, setDuplicateRequestSeq] = useState(0);
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const handleDuplicateItemRequest = useCallback(() => {
    setDuplicateRequestSeq((n) => n + 1);
  }, []);

  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  useEffect(() => {
    if (uoms) {
      const uomMap = uoms.reduce((acc, uom) => {
        acc[uom.id] = uom;
        return acc;
      }, {});
      setUOMInfo(uomMap);
    }
    if (categories) {
      const catMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {});
      setCatInfo(catMap);
    }
    if (subCategories) {
      const subcatMap = subCategories.reduce((acc, subcat) => {
        acc[subcat.id] = subcat;
        return acc;
      }, {});
      setSubCatInfo(subcatMap);
    }
    if (supplierList) {
      const supplierMap = supplierList.reduce((acc, supplier) => {
        acc[supplier.id] = supplier;
        return acc;
      }, {});
      setSupplierInfo(supplierMap);
    }
    if (accountList) {
      const accMap = accountList.reduce((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});
      setChartOfAccInfo(accMap);
      setChartOfAccounts(accountList);
    }
  }, [uoms, categories, subCategories, supplierList, accountList]);

  const refreshItemTableLookups = async () => {
    await Promise.all([refetchItemDetails(), refetchSuppliers()]);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchItemsList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchItemsList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchItemsList(1, searchTerm, newSize);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedItemsList = React.useMemo(() => {
    if (sortField !== "stockMethod") return itemsList;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...itemsList].sort((a, b) => {
      const aVal = a.stockMethod ?? 1;
      const bVal = b.stockMethod ?? 1;
      return (aVal - bVal) * dir;
    });
  }, [itemsList, sortField, sortDir]);

  const fetchItemsList = async (page = 1, search = "", size = pageSize) => {
    setPage(page);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("itemsPage", page);
      sessionStorage.setItem("itemsPageSize", size);
    }
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setItemsList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchItemsList(page, searchTerm, pageSize);
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Items</h1>
        <ul>
          <li>
            <Link href="/master/items/">Items</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" alignItems="center" gap={1} order={{ xs: 1, lg: 2 }}>
          {create ? <ProductUpload fetchItems={fetchItemsList} isSubCategoryNotRequired={isSubCategoryNotRequired} isUOMNotRequired={isUOMNotRequired} /> : ""}
          {create ? (
            <AddItems
              fetchItems={fetchItemsList}
              onMasterLookupRefresh={refreshItemTableLookups}
              isPOSSystem={isPOSSystem}
              uoms={uoms}
              isGarmentSystem={isGarmentSystem}
              chartOfAccounts={chartOfAccounts}
              barcodeEnabled={isBarcodeEnabled}
              IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
              subCategories={subCategories}
              duplicateRequestSeq={duplicateRequestSeq}
              isSubCategoryNotRequired={isSubCategoryNotRequired}
              isUOMNotRequired={isUOMNotRequired}
              showItemWebDetailFields={showItemWebDetailFields}
            />
          ) : (
            ""
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Sub Category</TableCell>
                  <TableCell>Supplier</TableCell>
                  {IsEcommerceWebSiteAvailable && <TableCell>Average Price (LKR)</TableCell>}
                  {isGarmentSystem && <>
                    <TableCell>Reorder Level</TableCell>
                    <TableCell>Shipment Target</TableCell>
                  </>}
                  <TableCell>UOM</TableCell>
                  <TableCell
                    onClick={() => handleSort("stockMethod")}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Outbound Method{sortField === "stockMethod" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </TableCell>
                  <TableCell>Cost Acc</TableCell>
                  <TableCell>Income Acc</TableCell>
                  <TableCell>Assets Acc</TableCell>
                  {isBarcodeEnabled && <TableCell>Barcode</TableCell>}
                  <TableCell>Inventory Item</TableCell>
                  <TableCell>Serial No. Available</TableCell>
                  {IsEcommerceWebSiteAvailable && (<TableCell>Show In Web</TableCell>)}
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <Typography color="error">No Items Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedItemsList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{catInfo[item.categoryId]?.name || "-"}</TableCell>
                      <TableCell>{subCatInfo[item.subCategoryId]?.name || "-"}</TableCell>
                      <TableCell>{supplierInfo[item.supplier]?.name || "-"}</TableCell>
                      {IsEcommerceWebSiteAvailable && <TableCell>{formatCurrency(item.averagePrice)}</TableCell>}
                      {isGarmentSystem && <>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{item.shipmentTarget}</TableCell>
                      </>}
                      <TableCell>{uomInfo[item.uom]?.name || "-"}</TableCell>
                      <TableCell>{OUTBOUND_METHOD_LABELS[item.stockMethod] ?? "FIFO"}</TableCell>
                      <TableCell>{chartOfAccInfo[item.costAccount]?.code || "-"} - {chartOfAccInfo[item.costAccount]?.description || "-"}</TableCell>
                      <TableCell>{chartOfAccInfo[item.incomeAccount]?.code || "-"} - {chartOfAccInfo[item.incomeAccount]?.description || "-"}</TableCell>
                      <TableCell>{chartOfAccInfo[item.assetsAccount]?.code || "-"} - {chartOfAccInfo[item.assetsAccount]?.description || "-"}</TableCell>
                      {isBarcodeEnabled && <TableCell>{item.barcode}</TableCell>}

                      <TableCell align="right">
                        {item.isNonInventoryItem ? (
                          <span className="dangerBadge">No</span>
                        ) : (
                          <span className="successBadge">Yes</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.hasSerialNumbers ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      {IsEcommerceWebSiteAvailable && (
                        <TableCell>
                          {item.isWebView == true ? (
                            <span className="successBadge">Yes</span>
                          ) : (
                            <span className="dangerBadge">No</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditItems
                            fetchItems={() => fetchItemsList(page, searchTerm, pageSize)}
                            item={item}
                            isPOSSystem={isPOSSystem}
                            uoms={uoms}
                            isGarmentSystem={isGarmentSystem}
                            chartOfAccounts={chartOfAccounts}
                            barcodeEnabled={isBarcodeEnabled}
                            IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable}
                            onDuplicateRequest={handleDuplicateItemRequest}
                            canDuplicate={create}
                            approve1={approve1}
                            isSubCategoryNotRequired={isSubCategoryNotRequired}
                            isUOMNotRequired={isUOMNotRequired}
                            showItemWebDetailFields={showItemWebDetailFields}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? <DeleteConfirmationById id={item.id} controller={controller} fetchItems={fetchItemsList} /> : ""}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>

              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
