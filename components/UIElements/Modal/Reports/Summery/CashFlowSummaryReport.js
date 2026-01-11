import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import useApi from "@/components/utils/useApi";
import { Catelogue } from "Base/catelogue";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "94vw", sm: "86vw", md: 600 },
  maxWidth: 720,
  maxHeight: "90vh",
  overflowY: "auto",
  overflowX: "hidden",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
  outline: "none",
};

export default function CashFlowSummaryReport({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cashFlowTypes, setCashFlowTypes] = useState([]);
  const [cashFlowTypeId, setCashFlowTypeId] = useState(0);
  const [cashType, setCashType] = useState(0);
  const { data: CashFlowSummaryReport } = GetReportSettingValueByName(reportName);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const isFormValid = fromDate && toDate;

  const {data: cashFlowTypeList} = useApi("/CashFlowType/GetCashFlowTypes");

  useEffect(() => {
    if (cashFlowTypeList) {
      setCashFlowTypes(cashFlowTypeList);
    }
  }, [cashFlowTypeList]);

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleOpen} aria-label="View" size="small">
          <Visibility color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container spacing={1}>
              <Grid item xs={12} my={2} display="flex" justifyContent="space-between">
                <Typography variant="h5" fontWeight="bold">
                  Cash Flow Summary Report
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  From
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  To
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Cash Flow Type
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={cashFlowTypeId}
                  onChange={(e) => setCashFlowTypeId(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  {cashFlowTypes.length === 0 ? <MenuItem value="">No Cash Flow Types Available</MenuItem>
                    : (cashFlowTypes.map((cashFlow) => (
                      <MenuItem key={cashFlow.id} value={cashFlow.id}>{cashFlow.name}</MenuItem>
                    )))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Cash Type
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={cashType}
                  onChange={(e) => setCashType(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  <MenuItem value={1}>Cash In</MenuItem>
                  <MenuItem value={2}>Cash Out</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${CashFlowSummaryReport}&cashFlowTypeId=${cashFlowTypeId}&cashType=${cashType}&fromDate=${fromDate}&toDate=${toDate}&warehouseId=${warehouseId}&currentUser=${name}`} target="_blank">
                  <Button variant="contained" disabled={!isFormValid} aria-label="print" size="small">
                    Submit
                  </Button>
                </a>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
