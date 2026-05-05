import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Modal,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";

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

const reportConfigByName = {
  MatrimonialProfileQualityReport: {
    title: "Matrimonial Profile Quality Report",
    fields: ["gender", "religion", "country", "maritalStatus"],
  },
  MatrimonialSubscriptionSummaryReport: {
    title: "Matrimonial Subscription Summary Report",
    fields: ["subscriptionStatus", "paymentStatus"],
  },
  MatrimonialEngagementSummaryReport: {
    title: "Matrimonial Engagement Summary Report",
    fields: ["preferredSearch", "subscriptionStatus"],
  },
};

export default function MatrimonialSummaryReportModal({ reportName, docName }) {
  const config = reportConfigByName[reportName] || {
    title: "Matrimonial Summary Report",
    fields: [],
  };

  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const { data: reportSetting } = GetReportSettingValueByName(reportName);

  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [country, setCountry] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState(0);
  const [preferredSearch, setPreferredSearch] = useState(0);

  const handleClose = () => {
    setOpen(false);
    setFromDate("");
    setToDate("");
    setGender("");
    setReligion("");
    setCountry("");
    setMaritalStatus("");
    setSubscriptionStatus(0);
    setPaymentStatus(0);
    setPreferredSearch(0);
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("InitialCatalog", Catelogue);
    params.append("reportName", reportSetting || reportName);
    params.append("fromDate", fromDate);
    params.append("toDate", toDate);
    params.append("warehouseId", warehouseId || "");
    params.append("currentUser", name || "");

    if (config.fields.includes("gender")) params.append("gender", gender || "");
    if (config.fields.includes("religion")) params.append("religion", religion || "");
    if (config.fields.includes("country")) params.append("country", country || "");
    if (config.fields.includes("maritalStatus")) params.append("maritalStatus", maritalStatus || "");
    if (config.fields.includes("subscriptionStatus")) params.append("subscriptionStatus", String(subscriptionStatus));
    if (config.fields.includes("paymentStatus")) params.append("paymentStatus", String(paymentStatus));
    if (config.fields.includes("preferredSearch")) params.append("preferredSearch", String(preferredSearch));

    return params.toString();
  };

  const isFormValid = Boolean(fromDate && toDate);

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={() => setOpen(true)} aria-label="View" size="small">
          <Visibility color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Grid container spacing={1}>
            <Grid item xs={12} my={2}>
              <Typography variant="h5" fontWeight="bold">
                {config.title}
              </Typography>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                From
              </Typography>
              <TextField type="date" fullWidth size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Grid>
            <Grid item xs={12} lg={6}>
              <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                To
              </Typography>
              <TextField type="date" fullWidth size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Grid>

            {config.fields.includes("gender") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Gender
                </Typography>
                <Select fullWidth size="small" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </Grid>
            )}

            {config.fields.includes("maritalStatus") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Marital Status
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="All / Single / Divorced ..."
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                />
              </Grid>
            )}

            {config.fields.includes("religion") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Religion
                </Typography>
                <TextField fullWidth size="small" placeholder="All religions" value={religion} onChange={(e) => setReligion(e.target.value)} />
              </Grid>
            )}

            {config.fields.includes("country") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Country
                </Typography>
                <TextField fullWidth size="small" placeholder="All countries" value={country} onChange={(e) => setCountry(e.target.value)} />
              </Grid>
            )}

            {config.fields.includes("subscriptionStatus") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Subscription Status
                </Typography>
                <Select fullWidth size="small" value={subscriptionStatus} onChange={(e) => setSubscriptionStatus(Number(e.target.value))}>
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Active</MenuItem>
                  <MenuItem value={2}>Expired</MenuItem>
                </Select>
              </Grid>
            )}

            {config.fields.includes("paymentStatus") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Payment Status
                </Typography>
                <Select fullWidth size="small" value={paymentStatus} onChange={(e) => setPaymentStatus(Number(e.target.value))}>
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Pending</MenuItem>
                  <MenuItem value={2}>Approved</MenuItem>
                  <MenuItem value={3}>Rejected</MenuItem>
                </Select>
              </Grid>
            )}

            {config.fields.includes("preferredSearch") && (
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}>
                  Preferred Search
                </Typography>
                <Select fullWidth size="small" value={preferredSearch} onChange={(e) => setPreferredSearch(Number(e.target.value))}>
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Yes</MenuItem>
                  <MenuItem value={2}>No</MenuItem>
                </Select>
              </Grid>
            )}

            <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
              <Button onClick={handleClose} variant="contained" color="error">
                Close
              </Button>
              <a href={`${Report}/${docName}?${buildQueryParams()}`} target="_blank" rel="noopener noreferrer">
                <Button variant="contained" disabled={!isFormValid} aria-label="print" size="small">
                  Submit
                </Button>
              </a>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
