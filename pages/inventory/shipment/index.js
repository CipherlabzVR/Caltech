import React, { useCallback, useEffect, useRef, useState } from "react";
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
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DescriptionIcon from "@mui/icons-material/Description";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, IconButton, Tooltip } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import StatusType from "pages/production/ongoing/Types/StatusType";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
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

const SHIPMENT_LIST_ENDPOINT = "ShipmentNote/GetAll";
const inFlightShipmentListRequests = new Map();

const parseShipmentListResponse = (json) => {
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

const requestShipmentList = (pageNum, term, size) => {
  const skip = (pageNum - 1) * size;
  const searchParam = term ? encodeURIComponent(term) : "null";
  const url = `${BASE_URL}/${SHIPMENT_LIST_ENDPOINT}?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}&Filter=null&isCurrentDate=true`;

  let pending = inFlightShipmentListRequests.get(url);
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
        throw new Error("Failed to fetch shipment notes");
      }
      return response.json();
    })().finally(() => {
      inFlightShipmentListRequests.delete(url);
    });
    inFlightShipmentListRequests.set(url, pending);
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

export default function ShipmentNote() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print, customPrint } = IsPermissionEnabled(cId);
  const { data: isSupplierInvolvedToShipment } = IsAppSettingEnabled(
    "IsSupplierInvolvedToShipment"
  );
  const name = localStorage.getItem("name");
  const { data: ReportName } = GetReportSettingValueByName("ShipmentNote");
  const router = useRouter();

  const [shipmentList, setShipmentList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const didInitialFetchRef = useRef(false);

  const fetchShipmentList = useCallback(async (pageNum, term, size) => {
    try {
      const json = await requestShipmentList(pageNum, term, size);
      const parsed = parseShipmentListResponse(json);
      setShipmentList(parsed.items);
      setTotalCount(parsed.totalCount);
    } catch {
      setShipmentList([]);
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
    fetchShipmentList(queryPage, "", querySize);
    if (isReload) {
      syncListPaginationQuery(router, queryPage, querySize);
    }
  }, [router.isReady, fetchShipmentList]);

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
    onFetch: (targetPage, value, size) => fetchShipmentList(targetPage, value, size),
  });

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

  const navigateToCreate = () => {
    router.push({
      pathname: "/inventory/shipment/create-shipment" });
  };

  const navigateToEdit = (id) => {
    router.push({
      pathname: `/inventory/shipment/edit-shipment`,
      query: { id: id } });
  };

  const openShipmentPrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.documentNo ?? "" });

    window.open(
      `/inventory/shipment/print?${query.toString()}`,
      `shipment-print-${item.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  const getSupplierViewLink = (shipmentId) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/inventory/shipment/view?id=${shipmentId}`;
  };

  const handleCopySupplierLink = async (shipmentId) => {
    const link = getSupplierViewLink(shipmentId);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Supplier link copied to clipboard");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Supplier link copied to clipboard");
    }
  };

  const showSupplierLink = isSupplierInvolvedToShipment === true;
  const tableColSpan = showSupplierLink ? 9 : 8;

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shipment Note</h1>
        <ul>
          <li>
            <Link href="/inventory/shipment/">Shipment Note</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + Add New
          </Button> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Shipment Date</TableCell>
                  <TableCell>Shipment No</TableCell>
                  <TableCell>PO No.</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Status</TableCell>
                  {showSupplierLink ? <TableCell>Supplier Link</TableCell> : null}
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipmentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan} align="center">
                      <Typography color="error">
                        No Shipment Notes Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  shipmentList.map((item, index) => {
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{formatDate(item.shipmentDate)}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>
                          {item.shipmentNoteLineDetails && (
                            [...new Set(item.shipmentNoteLineDetails.map(no => no.purchaseOrderNo))]
                              .join(', ')
                          )}
                        </TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.referanceNo}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell>
                          <StatusType type={item.status} />
                        </TableCell>
                        {showSupplierLink ? (
                          <TableCell>
                            <Typography
                              component="span"
                              sx={{
                                color: "primary.main",
                                cursor: "pointer",
                                textDecoration: "underline",
                                fontSize: "14px" }}
                              onClick={() => handleCopySupplierLink(item.id)}
                            >
                              copy link
                            </Typography>
                          </TableCell>
                        ) : null}
                        <TableCell align="right">
                          {item.status != 7 ? (
                            update ? (
                              <Tooltip title="Edit" placement="top">
                                <IconButton
                                  onClick={() => navigateToEdit(item.id)}
                                  aria-label="edit"
                                  size="small"
                                >
                                  <BorderColorIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            ) : null
                          ) : (
                            (print || customPrint) ? (
                              <>
                                {customPrint ? (
                                  <Tooltip title="Print (Custom)" placement="top">
                                    <a href={`${Report}${reportLink}`} target="_blank" rel="noopener noreferrer">
                                      <IconButton aria-label="print custom" size="small">
                                        <DescriptionIcon color="action" fontSize="medium" />
                                      </IconButton>
                                    </a>
                                  </Tooltip>
                                ) : null}
                                {print ? (
                                  <Tooltip title="Print (Default)" placement="top">
                                    <IconButton
                                      aria-label="print default"
                                      size="small"
                                      onClick={() => openShipmentPrintPopup(item)}
                                    >
                                      <LocalPrintshopIcon color="primary" fontSize="medium" />
                                    </IconButton>
                                  </Tooltip>
                                ) : null}
                              </>
                            ) : null
                          )}
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