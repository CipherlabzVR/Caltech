import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
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
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Catelogue } from "Base/catelogue";
import { Report } from "Base/report";

const CATEGORY_ID = 198;

export default function ServiceInvoiceList() {
  const router = useRouter();
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, remove, print, customPrint, whatsAppShare } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );

  // Same plumbing as /inventory/grn — Custom print hits the external Report
  // server using the report name configured for "ServiceInvoice". If no report
  // name is configured the Custom print button stays hidden.
  const { data: reportName } = GetReportSettingValueByName("ServiceInvoice");
  const currentUserName =
    typeof window !== "undefined" ? localStorage.getItem("name") || "" : "";

  const [confirmCancel, setConfirmCancel] = React.useState({ open: false, inv: null });

  const {
    data: invoices,
    totalCount,
    page,
    pageSize,
    search,
    isCurrentDate,
    setPage,
    setPageSize,
    setSearch,
    setIsCurrentDate,
    fetchData,
  } = usePaginatedFetch("ServiceInvoice/GetAll");

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
    fetchData(1, e.target.value, pageSize, isCurrentDate);
  };

  const handlePageChange = (_e, value) => {
    setPage(value);
    fetchData(value, search, pageSize, isCurrentDate);
  };

  const handlePageSizeChange = (e) => {
    const size = e.target.value;
    setPageSize(size);
    setPage(1);
    fetchData(1, search, size, isCurrentDate);
  };

  // Format the customer's phone for a wa.me URL: keep digits only.
  // wa.me expects no leading + and no spaces/dashes.
  const toWaNumber = (raw) => (raw ? String(raw).replace(/[^\d]/g, "") : "");

  const openWhatsApp = (inv) => {
    const phone = toWaNumber(inv.contactNo);
    if (!phone) {
      toast.warning("No phone number on this invoice.");
      return;
    }
    const msg = [
      `Hi ${inv.customerName || "there"},`,
      `Your service invoice ${inv.documentNo} is ready.`,
      inv.productName ? `Device: ${inv.productName}` : null,
      `Amount: ${formatCurrency(inv.netTotal)}`,
      `Thank you!`,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Default print opens the dedicated GRN-style print page in a popup.
  const openDefaultPrint = (inv) => {
    const query = new URLSearchParams({
      id: String(inv.id ?? ""),
      documentNumber: inv.documentNo ?? "",
    });
    window.open(
      `/service/service-invoice/print?${query.toString()}`,
      `service-invoice-print-${inv.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  // Custom print = external Report server URL (SSRS-style template), only
  // available when the "ServiceInvoice" report setting is configured.
  const customReportUrl = (inv) =>
    `${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}` +
    `&documentNumber=${encodeURIComponent(inv.documentNo || "")}` +
    `&reportName=${encodeURIComponent(reportName || "")}` +
    `&warehouseId=${inv.warehouseId || ""}` +
    `&currentUser=${encodeURIComponent(currentUserName)}`;

  const openInvoice = (inv) => router.push(`/service/service-invoice/${inv.id}`);

  const doCancel = async () => {
    const inv = confirmCancel.inv;
    if (!inv) return;
    try {
      const token = localStorage.getItem("token");
      const r = await fetch(`${BASE_URL}/ServiceInvoice/Cancel/${inv.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === -99) {
        toast.error(j?.message || "Failed to cancel invoice.");
        return;
      }
      toast.success("Service invoice cancelled.");
      setConfirmCancel({ open: false, inv: null });
      fetchData(page, search, pageSize, isCurrentDate);
    } catch (e) {
      toast.error(e.message || "Failed to cancel invoice.");
    }
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Service Invoices</h1>
        <ul>
          <li>
            <Link href="/service/service-invoice/">Service Invoice</Link>
          </li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={1}>
        <Grid item xs={12} md={5}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by document no, job card, customer, product or serial..."
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} md={7} display="flex" justifyContent="space-between" alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={isCurrentDate}
                onChange={(e) => {
                  setIsCurrentDate(e.target.checked);
                  fetchData(1, search, pageSize, e.target.checked);
                }}
                color="primary"
              />
            }
            label="Today only"
          />
          {create && (
            <Button
              variant="contained"
              onClick={() => router.push("/service/service-invoice/create")}
            >
              + New service invoice
            </Button>
          )}
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Job Card</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Net Total</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!invoices || invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No service invoices</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv, idx) => (
                    <TableRow key={inv.id} hover>
                      <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell>{inv.documentNo}</TableCell>
                      <TableCell>{formatDate(inv.documentDate || inv.createdOn)}</TableCell>
                      <TableCell>{inv.jobCardDocumentNo}</TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell>{inv.productName}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.netTotal)}</TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {whatsAppShare ? (
                            <Tooltip title={inv.contactNo ? "Send via WhatsApp" : "No phone number"}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => openWhatsApp(inv)}
                                  disabled={!inv.contactNo}
                                >
                                  <WhatsAppIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : ""}
                          {customPrint ? (
                            <Tooltip title="Print (Custom)" placement="top">
                              <a
                                href={customReportUrl(inv)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconButton aria-label="print custom" size="small">
                                  <DescriptionIcon color="action" fontSize="small" />
                                </IconButton>
                              </a>
                            </Tooltip>
                          ) : null}
                          {print !== false ? (
                            <Tooltip title="Print (Default)" placement="top">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => openDefaultPrint(inv)}
                              >
                                <LocalPrintshopIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          {remove && (
                            <Tooltip title="Cancel invoice">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setConfirmCancel({ open: true, inv })}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: 100 }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog
        open={confirmCancel.open}
        onClose={() => setConfirmCancel({ open: false, inv: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel service invoice?</DialogTitle>
        <DialogContent>
          <Typography>
            Invoice <b>{confirmCancel.inv?.documentNo}</b> will be cancelled and unlinked
            from job card <b>{confirmCancel.inv?.jobCardDocumentNo}</b>. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel({ open: false, inv: null })}>Keep</Button>
          <Button color="error" variant="contained" onClick={doCancel}>
            Cancel Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
