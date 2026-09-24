import React, { useCallback, useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select } from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DescriptionIcon from "@mui/icons-material/Description";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { toast, ToastContainer } from "react-toastify";
import ShareReports from "@/components/UIElements/Modal/Reports/ShareReports";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";
import IsFiscalPeriodAvailable from "@/components/utils/IsFiscalPeriodAvailable";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { Report } from "Base/report";
import BASE_URL from "Base/api";

const ALLOWED_PAGE_SIZES = [5, 10, 25];

const parseQueryInt = (value, fallback) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const parseQueryPageSize = (value) => {
  const n = parseQueryInt(value, 10);
  return ALLOWED_PAGE_SIZES.includes(n) ? n : 10;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const consumeDocumentReload = () => {
  if (typeof window === "undefined") return false;
  if (window.__listPaginationReloadConsumed) return false;
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  const isReload =
    nav && typeof nav.type === "string"
      ? nav.type === "reload"
      : typeof performance.navigation !== "undefined" && performance.navigation.type === 1;
  if (!isReload) return false;
  window.__listPaginationReloadConsumed = true;
  return true;
};

const PO_LIST_ENDPOINT = "GoodReceivedNote/GetAllPO";
const inFlightPOListRequests = new Map();

const parsePOListResponse = (json) => {
  if (json?.result) {
    if (Array.isArray(json.result)) {
      return { items: json.result, totalCount: json.result.length };
    }
    if (json.result.result?.items) {
      const items = json.result.result.items || [];
      return {
        items,
        totalCount: json.result.result.totalCount || items.length || 0,
      };
    }
    if (json.result.items) {
      const items = json.result.items || [];
      return { items, totalCount: json.result.totalCount || items.length || 0 };
    }
  }
  if (Array.isArray(json)) {
    return { items: json, totalCount: json.length };
  }
  if (json?.items) {
    const items = json.items || [];
    return { items, totalCount: json.totalCount || items.length || 0 };
  }
  return { items: [], totalCount: 0 };
};

const requestPOList = (pageNum, term, size) => {
  const skip = (pageNum - 1) * size;
  const searchParam = term ? encodeURIComponent(term) : "null";
  const url = `${BASE_URL}/${PO_LIST_ENDPOINT}?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}&Filter=null&isCurrentDate=true`;

  let pending = inFlightPOListRequests.get(url);
  if (!pending) {
    pending = (async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch purchase orders");
      }
      return response.json();
    })().finally(() => {
      inFlightPOListRequests.delete(url);
    });
    inFlightPOListRequests.set(url, pending);
  }
  return pending;
};

const syncListPaginationQuery = (router, nextPage, nextPageSize) => {
  if (!router.isReady) return;
  const page = String(nextPage);
  const pageSize = String(nextPageSize);
  const currentPage = Array.isArray(router.query.page) ? router.query.page[0] : router.query.page;
  const currentSize = Array.isArray(router.query.pageSize)
    ? router.query.pageSize[0]
    : router.query.pageSize;
  if (currentPage === page && currentSize === pageSize) return;
  router.replace(
    { pathname: router.pathname, query: { ...router.query, page, pageSize } },
    undefined,
    { shallow: true }
  );
};

export default function PurchaseOrder() {
  const name = localStorage.getItem("name");
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print, customPrint, whatsAppShare } = IsPermissionEnabled(cId);
  const router = useRouter();
  const { data: ReportName } = GetReportSettingValueByName("PurchaseOrder");
  const { data: isFiscalPeriodAvailable } = IsFiscalPeriodAvailable();

  const [poList, setPOList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const didInitialFetchRef = useRef(false);

  const fetchPOList = useCallback(async (pageNum, term, size) => {
    try {
      const json = await requestPOList(pageNum, term, size);
      const parsed = parsePOListResponse(json);
      setPOList(parsed.items);
      setTotalCount(parsed.totalCount);
    } catch {
      setPOList([]);
      setTotalCount(0);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;
    const isReload = consumeDocumentReload();
    const queryPage = isReload ? DEFAULT_PAGE : parseQueryInt(router.query.page, DEFAULT_PAGE);
    const querySize = isReload ? DEFAULT_PAGE_SIZE : parseQueryPageSize(router.query.pageSize);
    setPage(queryPage);
    setPageSize(querySize);
    fetchPOList(queryPage, "", querySize);
    if (isReload) {
      syncListPaginationQuery(router, queryPage, querySize);
    }
  }, [router.isReady, fetchPOList]);

  const {
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
  } = usePaginationHandlers({
    page,
    pageSize,
    totalCount,
    search,
    setPage,
    setPageSize,
    setSearch,
    onFetch: (targetPage, value, size) => fetchPOList(targetPage, value, size),
  });

  const navigateToCreate = () => {
    if (!isFiscalPeriodAvailable) {
      toast.warning("Please Start Fiscal Period First");
      return;
    }
    router.push({
      pathname: "/inventory/purchase-order/create-po" });
  };

  const navigateToEdit = (id) => {
    router.push(`/inventory/purchase-order/edit-po?id=${id}`);
  };

  const isLocalPOItem = (item) => (item.type ?? item.purchasingOrderType) == 1;

  const canShowEditIcon = (item) => {
    if (item.documentNo) {
      return false;
    }
    if (isLocalPOItem(item)) {
      return !item.isPurchasingOrderComplete;
    }
    return true;
  };

  const openPurchaseOrderPrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.purchaseOrderNo ?? "" });

    window.open(
      `/inventory/purchase-order/print?${query.toString()}`,
      `purchase-order-print-${item.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  const onPageChange = (event, value) => {
    handlePageChange(event, value);
    syncListPaginationQuery(router, value, pageSize);
  };

  const onPageSizeChange = (event) => {
    handlePageSizeChange(event);
    const size = Number(event.target.value);
    const maxPage = Math.max(1, Math.ceil(totalCount / size) || 1);
    const newPage = Math.min(page, maxPage);
    syncListPaginationQuery(router, newPage, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
    <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Purchase Order</h1>
        <ul>
          <li>
            <Link href="/inventory/purchase-order">Purchase Order</Link>
          </li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + Add New
          </Button> : ""}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>PO Date</TableCell>
                  <TableCell>PO No</TableCell>
                  <TableCell>Shipment No</TableCell>
                  <TableCell>GRN No</TableCell> 
                  <TableCell>Supplier</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {poList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">
                        No Purchase Orders Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  poList.map((item, index) => {
                    const whatsapp = `/PrintDocuments?InitialCatalog=${Catelogue}&documentNumber=${item.purchaseOrderNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.purchaseOrderNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{formatDate(item.poDate)}</TableCell>
                        <TableCell>{item.purchaseOrderNo}</TableCell>
                        <TableCell>
                          {Array.isArray(item.shipmentNos) && item.shipmentNos.length > 0
                            ? item.shipmentNos.join(", ")
                            : item.shipmentNo || ""}
                        </TableCell>
                        <TableCell>{item.documentNo}</TableCell> 
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.referanceNo}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            
                            {update && canShowEditIcon(item) ? <Tooltip title="Edit" placement="top">
                              <IconButton
                                onClick={() => navigateToEdit(item.id)}
                                aria-label="edit"
                                size="small"
                              >
                                <BorderColorIcon
                                  color="primary"
                                  fontSize="medium"
                                />
                              </IconButton>
                            </Tooltip> : ""}
                            {whatsAppShare ? (
                              <ShareReports url={whatsapp} mobile={item.supplierMobileNo} />
                            ) : ""}
                            {customPrint ? (
                              <Tooltip title="Print (Custom)" placement="top">
                                <a href={`${Report}${reportLink}`} target="_blank" rel="noopener noreferrer">
                                  <IconButton aria-label="print custom" size="small">
                                    <DescriptionIcon color="action" fontSize="medium" />
                                  </IconButton>
                                </a>
                              </Tooltip>
                            ) : ""}
                            {print ? (
                              <Tooltip title="Print (Default)" placement="top">
                                <IconButton
                                  aria-label="print default"
                                  size="small"
                                  onClick={() => openPurchaseOrderPrintPopup(item)}
                                >
                                  <LocalPrintshopIcon color="primary" fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                            ) : ""}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={onPageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={onPageSizeChange}>
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
