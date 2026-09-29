import React, { useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Button,
  IconButton,
  Tooltip,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SendIcon from "@mui/icons-material/Send";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import RecordPayment from "./RecordPayment";
import QuotationReject from "./QuotationReject";
import QuotationApprove from "./QuotationApprove";
import QuotationVersions from "./QuotationVersions";

const CATEGORY_ID = 341;

// Draft=1, Sent=2, Accepted=3, Rejected=4, Converted=5, PendingApproval=6, Approved=7
const FILTER_BY_TAB = [
  "Status:6,1",
  "Status:7,2,3,5",
  "Status:4",
];

const normalizedStatus = (status) => String(status || "").replace(/[\s_-]/g, "").toLowerCase();
const isStatus = (status, expected) => normalizedStatus(status) === normalizedStatus(expected);

const statusBadge = (status) => {
  switch (normalizedStatus(status)) {
    case "sent":
      return <span className="successBadge">Sent</span>;
    case "accepted":
      return <span className="successBadge">Accepted</span>;
    case "converted":
      return <span className="successBadge">Converted</span>;
    case "approved":
      return <span className="successBadge">Approved</span>;
    case "pendingapproval":
      return <span className="warningBadge">Pending Approval</span>;
    case "rejected":
      return <span className="dangerBadge">Rejected</span>;
    default:
      return <span className="warningBadge">Draft</span>;
  }
};

export default function PhotographyQuotationList() {
  const router = useRouter();
  const { navigate, create, update, remove, print, approve1, approve2 } = IsPermissionEnabled(CATEGORY_ID);

  const [tabIndex, setTabIndex] = useState(0);

  const {
    data: list,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchList,
  } = usePaginatedFetch(
    "PhotographyQuotation/GetAllQuotationPaged",
    "",
    10,
    false,
    false,
    FILTER_BY_TAB[0]
  );

  const refresh = (nextTab = tabIndex, nextPage = page, nextSearch = search, nextSize = pageSize) => {
    fetchList(nextPage, nextSearch, nextSize, false, FILTER_BY_TAB[nextTab]);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setPage(1);
    refresh(newValue, 1, search, pageSize);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    refresh(tabIndex, 1, event.target.value, pageSize);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    refresh(tabIndex, value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    refresh(tabIndex, 1, search, size);
  };

  const postAction = async (endpoint, id, successMsg, failMsg) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/${endpoint}?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || successMsg);
        refresh();
      } else {
        toast.error(data.message || failMsg);
      }
    } catch (e) {
      toast.error(e.message || failMsg);
    }
  };

  const sendWhatsApp = (id) =>
    postAction("SendQuotation", id, "Quotation sent", "Failed to send quotation");
  const submitForApproval = (id) =>
    postAction("SubmitForApproval", id, "Submitted for approval", "Failed to submit for approval");

  const pendingHasActions = update || approve1 || remove;
  const confirmedHasActions = true;
  const rejectedHasActions = update;
  const showActionColumn =
    (tabIndex === 0 && pendingHasActions) ||
    (tabIndex === 1 && confirmedHasActions) ||
    (tabIndex === 2 && rejectedHasActions);

  const colSpan = 7 + (tabIndex === 2 ? 1 : 0) + (showActionColumn ? 1 : 0);

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>💵 Quotations</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Quotations</li>
        </ul>
      </div>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Pending" />
        <Tab label="Confirmed" />
        <Tab label="Rejected" />
      </Tabs>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by no / customer…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? (
            <Button variant="outlined" onClick={() => router.push("/photography/quotations/create-quotation")}>
              + new quotation
            </Button>
          ) : (
            ""
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="quotations" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Quotation No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Event Date</TableCell>
                  <TableCell>Net Total</TableCell>
                  <TableCell>Out of Colombo</TableCell>
                  <TableCell>Status</TableCell>
                  {tabIndex === 2 ? <TableCell>Rejected Reason</TableCell> : ""}
                  {showActionColumn ? <TableCell align="right">Action</TableCell> : ""}
                </TableRow>
              </TableHead>
              <TableBody>
                {!list || list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan}>
                      <Typography color="error">No quotations available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.quotationNo}</TableCell>
                      <TableCell>
                        {item.customerName}
                        <br />
                        <Typography variant="caption" color="text.secondary">{item.customerMobileNo}</Typography>
                      </TableCell>
                      <TableCell>{item.eventTypeName}</TableCell>
                      <TableCell>{formatDate(item.eventDate)}</TableCell>
                      <TableCell>{formatCurrency(item.netTotal)}</TableCell>
                      <TableCell>{item.isOutOfColombo ? "Yes" : "No"}</TableCell>
                      <TableCell>{statusBadge(item.statusName)}</TableCell>
                      {tabIndex === 2 ? <TableCell>{item.rejectRemark || "-"}</TableCell> : ""}
                      {showActionColumn ? (
                        <TableCell align="right">
                          <Box display="flex" gap={0.75} justifyContent="end" alignItems="center" flexWrap="wrap">
                            <QuotationVersions
                              quotation={item}
                              canPrint={
                                tabIndex === 1 &&
                                print &&
                                isStatus(item.statusName, "Approved")
                              }
                            />
                            {tabIndex === 0 && update && !["Approved", "Sent", "Converted"].some((status) => isStatus(item.statusName, status)) ? (
                              <Tooltip title="Edit" placement="top">
                                <IconButton size="small" onClick={() => router.push(`/photography/quotations/create-quotation?id=${item.id}`)}>
                                  <BorderColorIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {tabIndex === 0 && update && (isStatus(item.statusName, "Draft") || isStatus(item.statusName, "Rejected")) ? (
                              <Tooltip title="Submit for Approval" placement="top">
                                <IconButton size="small" onClick={() => submitForApproval(item.id)}>
                                  <SendIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {tabIndex === 0 && approve1 && isStatus(item.statusName, "PendingApproval") ? (
                              <QuotationApprove item={item} fetchItems={refresh} canApprove={approve1} />
                            ) : (
                              ""
                            )}
                            {tabIndex === 0 && remove && isStatus(item.statusName, "PendingApproval") ? (
                              <QuotationReject id={item.id} fetchItems={refresh} />
                            ) : (
                              ""
                            )}
                            {tabIndex === 1 && (isStatus(item.statusName, "Approved") || isStatus(item.statusName, "Sent")) ? (
                              <Tooltip title="Send WhatsApp" placement="top">
                                <IconButton size="small" onClick={() => sendWhatsApp(item.id)}>
                                  <WhatsAppIcon color="success" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {tabIndex === 1 && approve2 && (isStatus(item.statusName, "Approved") || isStatus(item.statusName, "Sent") || isStatus(item.statusName, "Accepted")) ? (
                              <RecordPayment quotation={item} fetchItems={refresh} canRecordPayment={approve2} />
                            ) : (
                              ""
                            )}
                            {tabIndex === 2 && update ? (
                              <>
                                <Tooltip title="Edit" placement="top">
                                  <IconButton size="small" onClick={() => router.push(`/photography/quotations/create-quotation?id=${item.id}`)}>
                                    <BorderColorIcon color="primary" fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Submit for Approval" placement="top">
                                  <IconButton size="small" onClick={() => submitForApproval(item.id)}>
                                    <SendIcon color="primary" fontSize="inherit" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              ""
                            )}
                          </Box>
                        </TableCell>
                      ) : (
                        ""
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handleChangeRowsPerPage}>
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
