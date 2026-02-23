import React, { useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
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
  width: { xs: "94vw", sm: "80vw", md: 520, lg: 600 },
  maxWidth: 720,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: { xs: 2, sm: 3 },
};

export default function StockBalance({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [supplierId, setSupplierId] = useState(0);
  const [itemId, setItemId] = useState(0);
  const { data: StockBalanceReport } = GetReportSettingValueByName(reportName);
  const [categoryId, setCategoryId] = useState(0);
  const [subCategoryId, setSubCategoryId] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemId(0);
    setSupplierId(0);
  };

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
                  Stock Balance Report
                </Typography>
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
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${StockBalanceReport}&supplierId=${supplierId}&categoryId=${categoryId}&subCategoryid=${subCategoryId}&productId=${itemId}&warehouseId=${warehouseId}&currentUser=${name}`} target="_blank">
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
