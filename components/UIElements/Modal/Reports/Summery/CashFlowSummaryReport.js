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
  cashFlowType: "All Cash Flow Types",
  cashType: "All",
};

const CASH_TYPE_OPTIONS = [
  { value: 0, label: "All" },
  { value: 1, label: "Cash In" },
  { value: 2, label: "Cash Out" },
];

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

export default function CashFlowSummaryReport({ docName, reportName } = {}) {
  const warehouseId = typeof window !== "undefined" ? localStorage.getItem("warehouse") : "";
  const name = typeof window !== "undefined" ? localStorage.getItem("name") : "";
  const { data: cashFlowSummaryReport } = GetReportSettingValueByName(reportName);

  const [open, setOpen] = useState(false);
  const [reportMode, setReportMode] = useState(REPORT_MODE.DEFAULT);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cashFlowTypeId, setCashFlowTypeId] = useState(0);
  const [cashFlowTypeName, setCashFlowTypeName] = useState(ALL_LABELS.cashFlowType);
  const [cashType, setCashType] = useState(0);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setCashFlowTypeId(0);
    setCashFlowTypeName(ALL_LABELS.cashFlowType);
    setCashType(0);
  };

  const handleOpen = (mode) => {
    setReportMode(mode);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetFilters();
  };

  const cashTypeName =
    CASH_TYPE_OPTIONS.find((o) => o.value === Number(cashType))?.label || ALL_LABELS.cashType;

  const buildCrystalReportUrl = () => {
    const params = new URLSearchParams({
      InitialCatalog: Catelogue,
      reportName: cashFlowSummaryReport || "",
      fromDate: fromDate || "",
      toDate: toDate || "",
      warehouseId: warehouseId || "",
      currentUser: name || "",
      cashFlowTypeId: String(cashFlowTypeId || 0),
      cashType: String(cashType || 0),
    });
    return `${Report}/${docName}?${params.toString()}`;
  };

  const openHtmlReport = () => {
    const params = new URLSearchParams({
      fromDate: fromDate || "",
      toDate: toDate || "",
      cashFlowTypeId: String(cashFlowTypeId || 0),
      cashType: String(cashType || 0),
      cashFlowTypeName,
      cashTypeName,
    });
    window.open(`/reports/cash-flow-summary/print?${params.toString()}`, "_blank");
  };

  const handleSubmit = () => {
    if (!fromDate || !toDate) return;
    if (reportMode === REPORT_MODE.CUSTOM) window.open(buildCrystalReportUrl(), "_blank");
    else openHtmlReport();
  };

  const canSubmit = Boolean(fromDate && toDate);
  const modalTitle =
    reportMode === REPORT_MODE.CUSTOM
      ? "Cash Flow Summary Report (Custom)"
      : "Cash Flow Summary Report (Default)";

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
                filterType="cashFlowType"
                value={cashFlowTypeId}
                selectedLabel={cashFlowTypeId ? cashFlowTypeName : "All"}
                onChange={(id, label) => {
                  setCashFlowTypeId(id ?? 0);
                  setCashFlowTypeName(id ? label || ALL_LABELS.cashFlowType : ALL_LABELS.cashFlowType);
                }}
                allowAll
                label="Select Cash Flow Type"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>Select Cash Type</Typography>
              <Select fullWidth size="small" value={cashType} onChange={(e) => setCashType(Number(e.target.value) || 0)}>
                {CASH_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </Grid>
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
