import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
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
import BASE_URL from "Base/api";
import useGetList from "@/components/utils/getList";

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

export default function ReservationSalesReport({ docName, reportName }) {
  const warehouseId = localStorage.getItem("warehouse");
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reservationId, setReservationId] = useState(0);
  const [reservations, setReservations] = useState([]);
  const { data: ReservationSalesReport } = GetReportSettingValueByName(reportName);
  const name = localStorage.getItem("name");
  const { data, getCustomersByName } = useGetList();
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInputChange = async (value) => {
    setSearchValue(value);
    await getCustomersByName(value, 5);
    setReservations(data);
    setShowDropdown(true);
  };

  const handleItemSelect = async (item) => {
    setReservationId(item.id);
    setShowDropdown(false);
    setSearchValue(item.customerName);
  };

  const handleAllSelect = async () => {
    setReservationId(0);
    setShowDropdown(false);
    setSearchValue("All");
  };

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
                  Reservation Sales Report
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
                  Select Reservation
                </Typography>
                <div style={{ position: "relative", width: "100%" }}>
                  <TextField
                    label="Search"
                    size="small"
                    value={searchValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    fullWidth
                    autoComplete="off"
                  />
                  {showDropdown && reservations.length > 0 && (
                    <Paper
                      style={{
                        position: "absolute",
                        zIndex: 1,
                        top: "100%",
                        left: 0,
                        right: 0,
                        maxHeight: 200,
                        overflowY: "auto",
                      }}
                    >
                      <List>
                        <ListItem>
                          <ListItemText onClick={() => handleAllSelect()} primary="All" />
                        </ListItem>
                        {reservations.map((item, index) => (
                          <ListItem
                            button
                            key={index}
                            onClick={() => handleItemSelect(item)}
                          >

                            <ListItemText
                              primary={`${item.documentNo || ""} - ${item.customerName}`}
                            />

                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </div>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button onClick={handleClose} variant="contained" color="error">
                  Close
                </Button>
                <a href={`${Report}/${docName}?InitialCatalog=${Catelogue}&reportName=${ReservationSalesReport}&reservationId=${reservationId}&fromDate=${fromDate}&toDate=${toDate}&warehouseId=${warehouseId}&currentUser=${name}`} target="_blank">
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
