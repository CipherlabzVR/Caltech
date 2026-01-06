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
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

export default function FiscalPeriodReport({docName,reportName}) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState(0);
  const { data: FiscalPeriodReport } = GetReportSettingValueByName(reportName);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const {
    data: periodList,
    loading: Loading,
    error: Error,
  } = useApi("/Fiscal/GetAllFiscalPeriods");

  useEffect(() => {
      if (periodList) {
        setPeriods(periodList);
      }
    }, [periodList]);

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
                  Fiscal Period Report
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Fiscal Period
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  {periods.length === 0 ? <MenuItem value="">No Fiscal Periods Available</MenuItem>
                    : (periods.map((period) => (
                      <MenuItem key={period.id} value={period.id}>{formatDate(period.startDate)} - {period.endDate ? formatDate(period.endDate) : "Still Active"}</MenuItem>
                    )))}
                </Select>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${FiscalPeriodReport}&periodId=${periodId}&warehouseId=${warehouseId}&currentUser=${name}`} target="_blank">
                  <Button variant="contained" aria-label="print" size="small">
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
