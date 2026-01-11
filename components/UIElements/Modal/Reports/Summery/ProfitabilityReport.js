import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import "react-toastify/dist/ReactToastify.css";
import { Visibility } from "@mui/icons-material";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Report } from "Base/report";
import useApi from "@/components/utils/useApi";
import { Catelogue } from "Base/catelogue";
import BASE_URL from "Base/api";
import { DEFAULT_PAGE_SIZE, filterTopMatchesWithLoadMore, withAllOption } from "@/components/utils/autocompleteTopMatches";

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
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(0);
  const { data: ProfitabilityReport } = GetReportSettingValueByName(reportName);
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState(0);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(0);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoryId, setSubCategoryId] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(0);

  const [customerLimit, setCustomerLimit] = useState(DEFAULT_PAGE_SIZE);
  const [supplierLimit, setSupplierLimit] = useState(DEFAULT_PAGE_SIZE);
  const [categoryLimit, setCategoryLimit] = useState(DEFAULT_PAGE_SIZE);
  const [subCategoryLimit, setSubCategoryLimit] = useState(DEFAULT_PAGE_SIZE);
  const [itemLimit, setItemLimit] = useState(DEFAULT_PAGE_SIZE);

  const handleOpen = () => {
    setCustomerLimit(DEFAULT_PAGE_SIZE);
    setSupplierLimit(DEFAULT_PAGE_SIZE);
    setCategoryLimit(DEFAULT_PAGE_SIZE);
    setSubCategoryLimit(DEFAULT_PAGE_SIZE);
    setItemLimit(DEFAULT_PAGE_SIZE);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);


  const isFormValid = fromDate && toDate;

  const { data: customerList } = useApi("/Customer/GetAllCustomer");
  const { data: itemList } = useApi("/Items/GetAllItems");
  const { data: supplierList } = useApi("/Supplier/GetAllSupplier");
  const { data: categoryList } = useApi("/Category/GetAllCategory");

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
    if (itemList) {
      setItems(itemList);
    }
    if (supplierList) {
      setSuppliers(supplierList);
    }
    if (categoryList) {
      setCategories(categoryList);
    }
  }, [customerList, itemList, supplierList, categoryList]);

  const handleGetSupplierItems = async (id) => {
    setItemId(0);
    handleGetFilteredItems(id, categoryId, subCategoryId);
  }

  const handleGetSubCategories = async (id) => {
    setItemId(0);
    setSubCategoryId(0);
    handleGetFilteredItems(supplierId, id, subCategoryId);
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/SubCategory/GetAllSubCategoriesByCategoryId?categoryId=${id}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setSubCategories(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleGetFilteredItems = async (supplier, category, subCategory) => {
    setItemId(0);
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Items/GetFilteredItems?supplier=${supplier}&category=${category}&subCategory=${subCategory}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setItems(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  }

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
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Customer
                </Typography>
                <Autocomplete
                disableCloseOnSelect
                  fullWidth
                  size="small"
                  options={withAllOption(
                    customers.map((c) => ({
                      id: c.id,
                      label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || String(c.id),
                    }))
                  )}
                  value={
                    withAllOption(
                      customers.map((c) => ({
                        id: c.id,
                        label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || String(c.id),
                      }))
                    ).find((o) => o.id === customerId) || null
                  }
                  onChange={(_, opt) => {
                    if (opt?.__loadMore) {
                      setCustomerLimit((v) => v + DEFAULT_PAGE_SIZE);
                      return;
                    }
                    setCustomerId(opt?.id ?? 0);
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  filterOptions={(options, state) =>
                    filterTopMatchesWithLoadMore(options, state.inputValue, customerLimit)
                  }
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={
                        option?.__loadMore ? { justifyContent: "center", fontWeight: 600 } : props.style
                      }
                    >
                      {option.label}
                    </li>
                  )}
                  noOptionsText="No matches"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Type to search..." />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Supplier
                </Typography>
                <Autocomplete
                disableCloseOnSelect
                  fullWidth
                  size="small"
                  options={withAllOption(suppliers.map((s) => ({ id: s.id, label: s.name || String(s.id) })))}
                  value={
                    withAllOption(suppliers.map((s) => ({ id: s.id, label: s.name || String(s.id) }))).find(
                      (o) => o.id === supplierId
                    ) || null
                  }
                  onChange={(_, opt) => {
                    if (opt?.__loadMore) {
                      setSupplierLimit((v) => v + DEFAULT_PAGE_SIZE);
                      return;
                    }
                    const id = opt?.id ?? 0;
                    setSupplierId(id);
                    handleGetSupplierItems(id);
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  filterOptions={(options, state) =>
                    filterTopMatchesWithLoadMore(options, state.inputValue, supplierLimit)
                  }
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={
                        option?.__loadMore ? { justifyContent: "center", fontWeight: 600 } : props.style
                      }
                    >
                      {option.label}
                    </li>
                  )}
                  noOptionsText="No matches"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Type to search..." />
                  )}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Category
                </Typography>
                <Autocomplete
                disableCloseOnSelect
                  fullWidth
                  size="small"
                  options={withAllOption(categories.map((c) => ({ id: c.id, label: c.name || String(c.id) })))}
                  value={
                    withAllOption(categories.map((c) => ({ id: c.id, label: c.name || String(c.id) }))).find(
                      (o) => o.id === categoryId
                    ) || null
                  }
                  onChange={(_, opt) => {
                    if (opt?.__loadMore) {
                      setCategoryLimit((v) => v + DEFAULT_PAGE_SIZE);
                      return;
                    }
                    const id = opt?.id ?? 0;
                    setCategoryId(id);
                    handleGetSubCategories(id);
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  filterOptions={(options, state) =>
                    filterTopMatchesWithLoadMore(options, state.inputValue, categoryLimit)
                  }
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={
                        option?.__loadMore ? { justifyContent: "center", fontWeight: 600 } : props.style
                      }
                    >
                      {option.label}
                    </li>
                  )}
                  noOptionsText="No matches"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Type to search..." />
                  )}
                />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Sub Category
                </Typography>
                <Autocomplete
                disableCloseOnSelect
                  fullWidth
                  size="small"
                  options={withAllOption(subCategories.map((c) => ({ id: c.id, label: c.name || String(c.id) })))}
                  value={
                    withAllOption(subCategories.map((c) => ({ id: c.id, label: c.name || String(c.id) }))).find(
                      (o) => o.id === subCategoryId
                    ) || null
                  }
                  onChange={(_, opt) => {
                    if (opt?.__loadMore) {
                      setSubCategoryLimit((v) => v + DEFAULT_PAGE_SIZE);
                      return;
                    }
                    const id = opt?.id ?? 0;
                    setSubCategoryId(id);
                    handleGetFilteredItems(supplierId, categoryId, id);
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  filterOptions={(options, state) =>
                    filterTopMatchesWithLoadMore(options, state.inputValue, subCategoryLimit)
                  }
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={
                        option?.__loadMore ? { justifyContent: "center", fontWeight: 600 } : props.style
                      }
                    >
                      {option.label}
                    </li>
                  )}
                  noOptionsText="No matches"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Type to search..." />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Item
                </Typography>
                <Autocomplete
                disableCloseOnSelect
                  fullWidth
                  size="small"
                  options={withAllOption(items.map((i) => ({ id: i.id, label: i.name || String(i.id) })))}
                  value={
                    withAllOption(items.map((i) => ({ id: i.id, label: i.name || String(i.id) }))).find(
                      (o) => o.id === itemId
                    ) || null
                  }
                  onChange={(_, opt) => {
                    if (opt?.__loadMore) {
                      setItemLimit((v) => v + DEFAULT_PAGE_SIZE);
                      return;
                    }
                    setItemId(opt?.id ?? 0);
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  filterOptions={(options, state) =>
                    filterTopMatchesWithLoadMore(options, state.inputValue, itemLimit)
                  }
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={
                        option?.__loadMore ? { justifyContent: "center", fontWeight: 600 } : props.style
                      }
                    >
                      {option.label}
                    </li>
                  )}
                  noOptionsText="No matches"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Type to search..." />
                  )}
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
