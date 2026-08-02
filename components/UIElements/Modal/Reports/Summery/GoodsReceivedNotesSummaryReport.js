import React, { useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import ReportFilterSelect from "@/components/utils/ReportFilterSelect";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "94vw", sm: "80vw", md: 520, lg: 600 },
  maxWidth: 720,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
};

const ALL_LABELS = {
  supplier: "All Suppliers",
  category: "All Categories",
  subCategory: "All Sub Categories",
  product: "All Items",
};

const REPORT_MODE = {
  CUSTOM: "custom",
  DEFAULT: "default",
};

const printActionSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0.25,
  minWidth: 52,
  borderRadius: 1,
  px: 0.5,
  py: 0.25,
};

export default function GoodsReceivedNotesSummaryReport({ docName, reportName } = {}) {
  const warehouseId = typeof window !== "undefined" ? localStorage.getItem("warehouse") : "";
  const name = typeof window !== "undefined" ? localStorage.getItem("name") : "";
  const { data: goodsReceivedNotesSummaryReport } = GetReportSettingValueByName(reportName);

  const [open, setOpen] = useState(false);
  const [reportMode, setReportMode] = useState(REPORT_MODE.DEFAULT);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplierId, setSupplierId] = useState(0);
  const [supplierName, setSupplierName] = useState(ALL_LABELS.supplier);
  const [itemId, setItemId] = useState(0);
  const [itemName, setItemName] = useState(ALL_LABELS.product);
  const [categoryId, setCategoryId] = useState(0);
  const [categoryName, setCategoryName] = useState(ALL_LABELS.category);
  const [subCategoryId, setSubCategoryId] = useState(0);
  const [subCategoryName, setSubCategoryName] = useState(ALL_LABELS.subCategory);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setItemId(0);
    setItemName(ALL_LABELS.product);
    setSupplierId(0);
    setSupplierName(ALL_LABELS.supplier);
    setCategoryId(0);
    setCategoryName(ALL_LABELS.category);
    setSubCategoryId(0);
    setSubCategoryName(ALL_LABELS.subCategory);
  };

  const handleOpen = (mode) => {
    setReportMode(mode);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetFilters();
  };

  const buildCrystalReportUrl = () => {
    const params = new URLSearchParams({
      InitialCatalog: Catelogue,
      reportName: goodsReceivedNotesSummaryReport || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      warehouseId: warehouseId || "",
      currentUser: name || "",
      item: String(itemId || 0),
      supplier: String(supplierId || 0),
      category: String(categoryId || 0),
      subcategory: String(subCategoryId || 0),
    });
    return `${Report}/${docName}?${params.toString()}`;
  };

  const openHtmlReport = () => {
    const params = new URLSearchParams({
      fromDate: fromDate || "",
      toDate: toDate || "",
      supplierId: String(supplierId || 0),
      categoryId: String(categoryId || 0),
      subCategoryId: String(subCategoryId || 0),
      productId: String(itemId || 0),
      supplierName: supplierName || ALL_LABELS.supplier,
      categoryName: categoryName || ALL_LABELS.category,
      subCategoryName: subCategoryName || ALL_LABELS.subCategory,
      productName: itemName || ALL_LABELS.product,
    });
    window.open(`/reports/goods-received-notes-summary/print?${params.toString()}`, "_blank");
  };

  const handleSubmit = () => {
    if (!fromDate || !toDate) return;
    if (reportMode === REPORT_MODE.CUSTOM) {
      window.open(buildCrystalReportUrl(), "_blank");
    } else {
      openHtmlReport();
    }
  };

  const modalTitle =
    reportMode === REPORT_MODE.CUSTOM
      ? "Goods Received Notes Summary Report (Custom)"
      : "Goods Received Notes Summary Report (Default)";

  const canSubmit = Boolean(fromDate && toDate);

  return (
    <>
      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
        <Tooltip title="Print (Custom)" placement="top">
          <IconButton
            onClick={() => handleOpen(REPORT_MODE.CUSTOM)}
            aria-label="Custom print"
            size="small"
            sx={printActionSx}
          >
            <DescriptionIcon color="action" fontSize="medium" />
            <Typography variant="caption" sx={{ lineHeight: 1.1, color: "text.secondary" }}>
              Custom
            </Typography>
          </IconButton>
        </Tooltip>

        <Tooltip title="Print (Default)" placement="top">
          <IconButton
            onClick={() => handleOpen(REPORT_MODE.DEFAULT)}
            aria-label="Default print"
            size="small"
            sx={printActionSx}
          >
            <LocalPrintshopIcon color="primary" fontSize="medium" />
            <Typography variant="caption" sx={{ lineHeight: 1.1, color: "primary.main" }}>
              Default
            </Typography>
          </IconButton>
        </Tooltip>
      </Stack>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="grn-notes-summary-report-title"
        aria-describedby="grn-notes-summary-report-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container spacing={1}>
              <Grid item xs={12} my={2} display="flex" justifyContent="space-between">
                <Typography variant="h5" fontWeight="bold">
                  {modalTitle}
                </Typography>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  From
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  To
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <ReportFilterSelect
                  filterType="supplier"
                  value={supplierId}
                  selectedLabel={supplierId ? supplierName : "All"}
                  onChange={(id, label) => {
                    setSupplierId(id ?? 0);
                    setSupplierName(id ? label || ALL_LABELS.supplier : ALL_LABELS.supplier);
                    setItemId(0);
                    setItemName(ALL_LABELS.product);
                  }}
                  allowAll
                  label="Select Supplier"
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ReportFilterSelect
                  filterType="category"
                  value={categoryId}
                  selectedLabel={categoryId ? categoryName : "All"}
                  onChange={(id, label) => {
                    setCategoryId(id ?? 0);
                    setCategoryName(id ? label || ALL_LABELS.category : ALL_LABELS.category);
                    setSubCategoryId(0);
                    setSubCategoryName(ALL_LABELS.subCategory);
                    setItemId(0);
                    setItemName(ALL_LABELS.product);
                  }}
                  allowAll
                  label="Select Category"
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ReportFilterSelect
                  filterType="subCategory"
                  extraParams={{ categoryId: categoryId || undefined }}
                  value={subCategoryId}
                  selectedLabel={subCategoryId ? subCategoryName : "All"}
                  onChange={(id, label) => {
                    setSubCategoryId(id ?? 0);
                    setSubCategoryName(id ? label || ALL_LABELS.subCategory : ALL_LABELS.subCategory);
                    setItemId(0);
                    setItemName(ALL_LABELS.product);
                  }}
                  allowAll
                  label="Select Sub Category"
                />
              </Grid>
              <Grid item xs={12}>
                <ReportFilterSelect
                  filterType="item"
                  extraParams={{
                    supplierId: supplierId || undefined,
                    categoryId: categoryId || undefined,
                    subCategoryId: subCategoryId || undefined,
                  }}
                  value={itemId}
                  selectedLabel={itemId ? itemName : "All"}
                  onChange={(id, label) => {
                    setItemId(id ?? 0);
                    setItemName(id ? label || ALL_LABELS.product : ALL_LABELS.product);
                  }}
                  allowAll
                  label="Select Item"
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <Button
                  variant="contained"
                  aria-label="print"
                  size="small"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
