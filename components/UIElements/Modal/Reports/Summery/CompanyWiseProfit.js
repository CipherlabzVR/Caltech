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
import BASE_URL from "Base/api";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

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

export default function CompanyWiseProfit({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState();
  const [persons, setPersons] = useState([]);
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

  const { data: supplierList } = useApi("/Supplier/GetAllSupplier");

  const fetchSalesPerson = async (supplierId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/SalesPerson/GetSalesPersonsBySupplier?supplierId=${supplierId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }
      const data = await response.json();
      setPersons(data);
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    if (supplierList) {
      setSuppliers(supplierList);
    }
  }, [supplierList]);

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
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Supplier
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    fetchSalesPerson(e.target.value);
                  }}
                >
                  {/* <MenuItem value={0}>All</MenuItem> */}
                  {suppliers.length === 0 ? <MenuItem value="">No Suppliers Available</MenuItem>
                    : (suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                    )))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Sales Person
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  {persons.length === 0 ? <MenuItem value="">No Sales Persons Available</MenuItem>
                    : (persons.map((persons) => (
                      <MenuItem key={persons.id} value={persons.id}>{persons.name}</MenuItem>
                    )))}
                </Select>
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
