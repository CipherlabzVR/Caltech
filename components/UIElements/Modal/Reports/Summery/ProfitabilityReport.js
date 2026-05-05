import React, { useState } from "react";
import {
  Button,
  Grid,
  IconButton,
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

export default function ProfitabilityReport({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerId, setCustomerId] = useState(0);
  const { data: ProfitabilityReport } = GetReportSettingValueByName(reportName);
  const [itemId, setItemId] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [subCategoryId, setSubCategoryId] = useState(0);
  const [supplierId, setSupplierId] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const isFormValid = fromDate && toDate;

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
                  Profitability Report
                </Typography>
              </Grid>
              <Grid item lg={6} xs={12}>
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
              <Grid lg={6} item xs={12}>
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
                  filterType="customer"
                  extraParams={{}}
                  value={customerId}
                  onChange={(id) => setCustomerId(id ?? 0)}
                  allowAll={true}
                  label="Select Customer"
                  placeholder="Type to search..."
                />
              </Grid>
              <Grid item xs={12}>
                <ReportSearchField
                  filterType="supplier"
                  extraParams={{}}
                  value={supplierId}
                  onChange={(id) => {
                    setSupplierId(id ?? 0);
                    setItemId(0);
                  }}
                  allowAll={true}
                  label="Select Supplier"
                  placeholder="Type to search..."
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ReportSearchField
                  filterType="category"
                  extraParams={{}}
                  value={categoryId}
                  onChange={(id) => {
                    setCategoryId(id ?? 0);
                    setSubCategoryId(0);
                    setItemId(0);
                  }}
                  allowAll={true}
                  label="Select Category"
                  placeholder="Type to search..."
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <ReportSearchField
                  filterType="subCategory"
                  extraParams={{ categoryId: categoryId || undefined }}
                  value={subCategoryId}
                  onChange={(id) => {
                    setSubCategoryId(id ?? 0);
                    setItemId(0);
                  }}
                  allowAll={true}
                  label="Select Sub Category"
                  placeholder="Type to search..."
                />
              </Grid>
              <Grid item xs={12}>
                <ReportSearchField
                  filterType="item"
                  extraParams={{ supplierId: supplierId || undefined, categoryId: categoryId || undefined, subCategoryId: subCategoryId || undefined }}
                  value={itemId}
                  onChange={(id) => setItemId(id ?? 0)}
                  allowAll={true}
                  label="Select Item"
                  placeholder="Type to search..."
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${ProfitabilityReport}&customerId=${customerId}&fromDate=${fromDate}&toDate=${toDate}&warehouseId=${warehouseId}&currentUser=${name}&item=${itemId}&supplier=${supplierId}&category=${categoryId}&subCategory=${subCategoryId}`} target="_blank">
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
