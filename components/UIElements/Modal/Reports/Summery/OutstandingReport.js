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

export default function OutstandingReport({docName,reportName}) {
  const warehouseId = localStorage.getItem("warehouse");
  const name = localStorage.getItem("name");
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(0);
  const [customerLimit, setCustomerLimit] = useState(DEFAULT_PAGE_SIZE);
  const { data: OutstandingReport } = GetReportSettingValueByName(reportName);

  const handleOpen = () => {
    setCustomerLimit(DEFAULT_PAGE_SIZE);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const {
    data: customerList,
    loading: Loading,
    error: Error,
  } = useApi("/Customer/GetAllCustomer");

  useEffect(() => {
      if (customerList) {
        setCustomers(customerList);
      }
    }, [customerList]);

  const customerOptions = withAllOption(
    customers.map((c) => ({
      id: c.id,
      label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || String(c.id),
    })),
    true
  );
  const customerValue = customerOptions.find((o) => o.id === customerId) || null;

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
                  Outstanding Report
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography as="h5" sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Select Customer
                </Typography>
                <Autocomplete
                  disableCloseOnSelect
                  fullWidth
                  size="small"
                  options={customerOptions}
                  value={customerValue}
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
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${OutstandingReport}&customerId=${customerId}&warehouseId=${warehouseId}&currentUser=${name}`} target="_blank">
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
