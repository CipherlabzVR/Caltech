import React, { useState } from "react";
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
import { Catelogue } from "Base/catelogue";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import ReportSearchField from "@/components/utils/ReportSearchField";

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

export default function CompanyWiseProfit({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [supplierId, setSupplierId] = useState();
  const [personId, setPersonId] = useState(0);
  const [itemType, setItemType] = useState(null);
  const { data: CompanyWiseProfit } = GetReportSettingValueByName(reportName);
  const { data: CompanyWiseProfitItem } = GetReportSettingValueByName("CompanyWiseProfitItem");
  const { data: CompanyWiseProfitOutlet } = GetReportSettingValueByName("CompanyWiseProfitOutlet");
  const { data: CompanyWiseProfitDBR } = GetReportSettingValueByName("CompanyWiseProfitDBR");
  const { data: enableItemTypeFilter } = IsAppSettingEnabled("EnableItemTypeFilter");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const isFormValid = fromDate && toDate && supplierId;

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
                  Company Profit Report
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
                <ReportSearchField
                  filterType="supplier"
                  extraParams={{}}
                  value={supplierId}
                  onChange={(id) => {
                    setSupplierId(id);
                    setPersonId(0);
                  }}
                  allowAll={false}
                  label="Select Supplier"
                  placeholder="Type to search..."
                />
              </Grid>
              <Grid item xs={12}>
                <ReportSearchField
                  filterType="salesPerson"
                  extraParams={{ supplierId: supplierId || undefined }}
                  value={personId}
                  onChange={(id) => setPersonId(id ?? 0)}
                  allowAll={true}
                  label="Select Sales Person"
                  placeholder="Type to search..."
                />
              </Grid>
              {enableItemTypeFilter && (
                <Grid item xs={12}>
                  <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                    Select Item Type
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                  >
                    <MenuItem value={1}>Item</MenuItem>
                    <MenuItem value={2}>Outlet</MenuItem>
                    <MenuItem value={3}>DBR</MenuItem>
                  </Select>
                </Grid>
              )}
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${itemType === 1 ? CompanyWiseProfitItem : (itemType === 2 ? CompanyWiseProfitOutlet : (itemType === 3 ? CompanyWiseProfitDBR : CompanyWiseProfit))}&supplierId=${supplierId}&fromDate=${fromDate}&toDate=${toDate}&warehouseId=${warehouseId}&currentUser=${name}&salesPerson=${personId}`} target="_blank">
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
