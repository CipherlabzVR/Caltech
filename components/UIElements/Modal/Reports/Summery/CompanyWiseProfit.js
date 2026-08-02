import React, { useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  MenuItem,
  Select,
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
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
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
  supplier: "Select Supplier",
  salesPerson: "All Sales Persons",
};

const REPORT_MODE = { CUSTOM: "custom", DEFAULT: "default" };

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

export default function CompanyWiseProfit({ docName, reportName } = {}) {
  const warehouseId = typeof window !== "undefined" ? localStorage.getItem("warehouse") : "";
  const name = typeof window !== "undefined" ? localStorage.getItem("name") : "";
  const { data: companyWiseProfit } = GetReportSettingValueByName(reportName);
  const { data: companyWiseProfitItem } = GetReportSettingValueByName("CompanyWiseProfitItem");
  const { data: companyWiseProfitOutlet } = GetReportSettingValueByName("CompanyWiseProfitOutlet");
  const { data: companyWiseProfitDBR } = GetReportSettingValueByName("CompanyWiseProfitDBR");
  const { data: enableItemTypeFilter } = IsAppSettingEnabled("EnableItemTypeFilter");

  const [open, setOpen] = useState(false);
  const [reportMode, setReportMode] = useState(REPORT_MODE.DEFAULT);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplierId, setSupplierId] = useState(0);
  const [supplierName, setSupplierName] = useState("");
  const [personId, setPersonId] = useState(0);
  const [personName, setPersonName] = useState(ALL_LABELS.salesPerson);
  const [itemType, setItemType] = useState(null);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setSupplierId(0);
    setSupplierName("");
    setPersonId(0);
    setPersonName(ALL_LABELS.salesPerson);
    setItemType(null);
  };

  const handleOpen = (mode) => {
    setReportMode(mode);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetFilters();
  };

  const resolveCrystalReportName = () => {
    if (itemType === 1) return companyWiseProfitItem;
    if (itemType === 2) return companyWiseProfitOutlet;
    if (itemType === 3) return companyWiseProfitDBR;
    return companyWiseProfit;
  };

  const buildCrystalReportUrl = () => {
    const params = new URLSearchParams({
      InitialCatalog: Catelogue,
      reportName: resolveCrystalReportName() || "",
      supplierId: String(supplierId || 0),
      fromDate: fromDate || "",
      toDate: toDate || "",
      warehouseId: warehouseId || "",
      currentUser: name || "",
      salesPerson: String(personId || 0),
    });
    return `${Report}/${docName}?${params.toString()}`;
  };

  const openHtmlReport = () => {
    const params = new URLSearchParams({
      fromDate: fromDate || "",
      toDate: toDate || "",
      supplierId: String(supplierId || 0),
      salesPersonId: String(personId || 0),
      supplierName: supplierName || "",
      salesPersonName: personName,
    });
    window.open(`/reports/company-wise-profit/print?${params.toString()}`, "_blank");
  };

  const handleSubmit = () => {
    if (!fromDate || !toDate || !supplierId) return;
    if (reportMode === REPORT_MODE.CUSTOM) window.open(buildCrystalReportUrl(), "_blank");
    else openHtmlReport();
  };

  const canSubmit = Boolean(fromDate && toDate && supplierId);
  const modalTitle =
    reportMode === REPORT_MODE.CUSTOM
      ? "Company Profit Report (Custom)"
      : "Company Profit Report (Default)";

  return (
    <>
      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
        <Tooltip title="Print (Custom)" placement="top">
          <IconButton onClick={() => handleOpen(REPORT_MODE.CUSTOM)} aria-label="Custom print" size="small" sx={printActionSx}>
            <DescriptionIcon color="action" fontSize="medium" />
            <Typography variant="caption" sx={{ lineHeight: 1.1, color: "text.secondary" }}>Custom</Typography>
          </IconButton>
        </Tooltip>
        <Tooltip title="Print (Default)" placement="top">
          <IconButton onClick={() => handleOpen(REPORT_MODE.DEFAULT)} aria-label="Default print" size="small" sx={printActionSx}>
            <LocalPrintshopIcon color="primary" fontSize="medium" />
            <Typography variant="caption" sx={{ lineHeight: 1.1, color: "primary.main" }}>Default</Typography>
          </IconButton>
        </Tooltip>
      </Stack>

      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Grid container spacing={1}>
            <Grid item xs={12} my={2}>
              <Typography variant="h5" fontWeight="bold">{modalTitle}</Typography>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>From</Typography>
              <TextField type="date" size="small" fullWidth value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>To</Typography>
              <TextField type="date" size="small" fullWidth value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <ReportFilterSelect
                filterType="supplier"
                value={supplierId}
                selectedLabel={supplierId ? supplierName : ""}
                onChange={(id, label) => {
                  setSupplierId(id ?? 0);
                  setSupplierName(id ? label || "" : "");
                  setPersonId(0);
                  setPersonName(ALL_LABELS.salesPerson);
                }}
                allowAll={false}
                label="Select Supplier"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <ReportFilterSelect
                filterType="salesPerson"
                extraParams={{ supplierId: supplierId || undefined }}
                value={personId}
                selectedLabel={personId ? personName : "All"}
                onChange={(id, label) => {
                  setPersonId(id ?? 0);
                  setPersonName(id ? label || ALL_LABELS.salesPerson : ALL_LABELS.salesPerson);
                }}
                allowAll
                label="Select Sales Person"
              />
            </Grid>
            {reportMode === REPORT_MODE.CUSTOM && enableItemTypeFilter && (
              <Grid item xs={12}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>Select Item Type</Typography>
                <Select
                  fullWidth
                  size="small"
                  value={itemType ?? ""}
                  onChange={(e) => setItemType(e.target.value === "" ? null : Number(e.target.value))}
                  displayEmpty
                >
                  <MenuItem value="">Default</MenuItem>
                  <MenuItem value={1}>Item</MenuItem>
                  <MenuItem value={2}>Outlet</MenuItem>
                  <MenuItem value={3}>DBR</MenuItem>
                </Select>
              </Grid>
            )}
            <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
              <Button onClick={handleClose} variant="contained" color="error">Close</Button>
              <Button variant="contained" size="small" onClick={handleSubmit} disabled={!canSubmit}>Submit</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
