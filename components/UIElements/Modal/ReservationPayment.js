import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import MakePayment from "./MakePayment";
import useGetList from "@/components/utils/getList";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 400 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function ReservationPayment({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [originalCustomer, setOriginalCustomer] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [textFieldWidth, setTextFieldWidth] = useState(0);
  const textFieldRef = useRef(null);
  const { data, getCustomersByName } = useGetList();

  const [formData, setFormData] = useState({
    customerName: "",
    reservationDate: "",
    mobileNo: "",
    nic: "",
    preferdTime: "",
    bridleType: "",
    location: "",
    description: "",
    reservationFunctionType: "",
  });

  const [isUpdated, setIsUpdated] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    resetFields();
  };

  const resetFields = () => {
    setSearchValue("");
    setCustomers([]);
    setSelectedCustomer(null);
    setOriginalCustomer(null);
    setShowDropdown(false);
    setFormData({
      customerName: "",
      reservationDate: "",
      mobileNo: "",
      nic: "",
      preferdTime: "",
      bridleType: "",
      location: "",
      description: "",
      reservationFunctionType: "",
    });
    setIsUpdated(false);
  };

  const handleSearchCustomer = async (value) => {
    setSearchValue(value);
    if (!value.trim()) {
      resetFields();
      return;
    }
    await getCustomersByName(value, 1);
    setCustomers(data);
    setShowDropdown(true);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setOriginalCustomer(customer);
    setFormData({
      customerName: customer.customerName || "",
      reservationDate: customer.reservationDate
        ? customer.reservationDate.split("T")[0]
        : "",
      mobileNo: customer.mobileNo || "",
      nic: customer.nic || "",
      preferdTime: customer.preferdTime || "",
      bridleType: customer.bridleType || "",
      location: customer.location || "",
      homeComingDate: formatDate(customer.homeComingDate) || "",
      homeComingPreferredTime: customer.homeComingPreferredTime || "",
      homeComingBridleType: customer.homeComingBridleType || "",
      homeComingLocation: customer.homeComingLocation || "",
      description: customer.description || "",
      reservationFunctionType: customer.reservationFunctionType || ""
    });
    setSearchValue(customer.customerName);
    setShowDropdown(false);
    setIsUpdated(false);
  };

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (originalCustomer) {
      const isChanged = Object.keys(updated).some((key) => {
        const originalValue =
          key === "reservationDate" && originalCustomer[key]
            ? originalCustomer[key].split("T")[0]
            : originalCustomer[key];
        return updated[key] !== (originalValue || "");
      });
      setIsUpdated(isChanged);
    }
  };

  const handleUpdate = async () => {
    const data = {
      Id: selectedCustomer.id,
      ReservationDate: formData.reservationDate,
      CustomerName: formData.customerName,
      Description: formData.description,
      MobileNo: formData.mobileNo,
      PreferdTime: formData.preferdTime,
      BridleType: formData.bridleType,
      Location: formData.location,
      NIC: formData.nic,
      IsExpire: selectedCustomer.isExpire,
      ReservationExpiryDate: selectedCustomer.reservationExpiryDate,
      ReservationFunctionType: formData.reservationFunctionType,
      HomeComingDate: formData.homeComingDate || null,
      HomeComingPreferredTime: formData.homeComingPreferredTime || null,
      HomeComingBridleType: formData.homeComingBridleType || null,
      HomeComingLocation: formData.homeComingLocation || null,
    }

    const response = await fetch(`${BASE_URL}/Reservation/UpdatePencilNoteReservation`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const result = await response.json();
    if (result.statusCode === 200) {
      toast.success(result.message);
      setIsUpdated(false);
    } else {
      toast.error(data.message);
    }

  };

  useEffect(() => {
    if (textFieldRef.current) {
      setTextFieldWidth(textFieldRef.current.offsetWidth);
    }
  }, [textFieldRef.current]);

  return (
    <>
      <Button onClick={handleOpen} variant="outlined" color="primary">
        + Add Payment
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Box mt={2}>
            <Grid container spacing={1}>
              <Grid item xs={12} my={1}>
                <Box sx={{ position: "relative" }}>
                  <TextField
                    ref={textFieldRef}
                    value={searchValue}
                    onChange={(e) => handleSearchCustomer(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder="Search customer by name"
                    fullWidth
                  />
                  {showDropdown && (
                    <List
                      style={{
                        border: "1px solid #ccc",
                        maxHeight: 200,
                        width: "100%",
                        overflowY: "auto",
                        position: "absolute",
                        background: "#fff",
                        zIndex: 10,
                      }}
                    >
                      {customers.length > 0 ? (
                        customers.map((customer, index) => (
                          <ListItem
                            sx={{ paddingY: 0, cursor: "pointer" }}
                            key={index}
                            onMouseDown={() => handleCustomerSelect(customer)}
                          >
                            <ListItemText
                              primary={
                                <>
                                  <span>{customer.customerName}</span>
                                  {customer.type === 11 && (
                                    <span style={{ color: "red", marginLeft: 8 }}>
                                      Final Payment
                                    </span>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary="No customers found" />
                        </ListItem>
                      )}
                    </List>
                  )}
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
              <Grid container spacing={1}>
                <Grid item xs={12} lg={6}>
                  <Typography as="h5">Event Type</Typography>
                  <TextField
                    select
                    value={formData.reservationFunctionType}
                    onChange={(e) => handleChange("reservationFunctionType", e.target.value)}
                    fullWidth
                  >
                    <MenuItem value={1}>Wedding</MenuItem>
                    <MenuItem value={2}>Home Coming</MenuItem>
                    <MenuItem value={3}>Wedding & Home Coming</MenuItem>
                    <MenuItem value={4}>Normal Dressing</MenuItem>
                    <MenuItem value={5}>Photo Shoot</MenuItem>
                    <MenuItem value={6}>Outfit Only</MenuItem>
                    <MenuItem value={7}>Engagement</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <Typography as="h5">Customer Name</Typography>
                  <TextField
                    value={formData.customerName}
                    onChange={(e) => handleChange("customerName", e.target.value)}
                    fullWidth
                  />
                </Grid>                
                <Grid item xs={12} lg={6}>
                  <Typography as="h5">Phone No</Typography>
                  <TextField
                    value={formData.mobileNo}
                    onChange={(e) => handleChange("mobileNo", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} lg={6}>
                  <Typography as="h5">NIC/Passport No</Typography>
                  <TextField
                    value={formData.nic}
                    onChange={(e) => handleChange("nic", e.target.value)}
                    fullWidth
                  />
                </Grid>
                {formData.reservationFunctionType === 3 ?
                  <Grid item xs={12} lg={12} mt={2}>
                    <Typography color="primary">Wedding Details</Typography>
                  </Grid>
                  : ""}
                <Grid item xs={12} lg={3}>
                  <Typography as="h5">Reservation Date</Typography>
                  <TextField
                    type="date"
                    value={formData.reservationDate}
                    onChange={(e) => handleChange("reservationDate", e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} lg={3}>
                  <Typography as="h5">Preferred Time</Typography>
                  <TextField
                    select
                    value={formData.preferdTime}
                    onChange={(e) => handleChange("preferdTime", e.target.value)}
                    fullWidth
                  >
                    <MenuItem value={1}>Morning</MenuItem>
                    <MenuItem value={2}>Evening</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} lg={3}>
                  <Typography as="h5">Bridal Type</Typography>
                  <TextField
                    select
                    value={formData.bridleType}
                    onChange={(e) => handleChange("bridleType", e.target.value)}
                    fullWidth
                  >
                    <MenuItem value={1}>Kandyan</MenuItem>
                    <MenuItem value={2}>Indian</MenuItem>
                    <MenuItem value={3}>Western</MenuItem>
                    <MenuItem value={4}>Hindu</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} lg={3}>
                  <Typography as="h5">Location</Typography>
                  <TextField
                    select
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    fullWidth
                  >
                    <MenuItem value={1}>Studio</MenuItem>
                    <MenuItem value={2}>Away</MenuItem>
                    <MenuItem value={3}>Overseas</MenuItem>
                  </TextField>
                </Grid>
                {formData.reservationFunctionType === 3 ?
                  <>
                    <Grid item xs={12} lg={12} mt={2}>
                      <Typography color="primary">Home Coming Details</Typography>
                    </Grid>
                    <Grid item xs={12} lg={3} mt={1}>
                      <Typography>Home Coming Date</Typography>
                      <TextField
                        value={formData.homeComingDate}
                        onChange={(e) => handleChange("homeComingDate", e.target.value)}
                        type="date"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} lg={3} mt={1}>
                      <Typography>Preferred Time</Typography>
                      <TextField
                        select
                        value={formData.homeComingPreferredTime}
                        onChange={(e) => handleChange("homeComingPreferredTime", e.target.value)}
                        fullWidth
                      >
                        <MenuItem value={1}>Morning</MenuItem>
                        <MenuItem value={2}>Evening</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} lg={3} mt={1}>
                      <Typography>Bridal Type</Typography>
                      <TextField
                        select
                        value={formData.homeComingBridleType}
                        onChange={(e) => handleChange("homeComingBridleType", e.target.value)}
                        fullWidth
                      >
                        <MenuItem value={1}>Kandyan</MenuItem>
                        <MenuItem value={2}>Indian</MenuItem>
                        <MenuItem value={3}>Western</MenuItem>
                        <MenuItem value={4}>Hindu</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} lg={3} mt={1}>
                      <Typography>Location</Typography>
                      <TextField
                        select
                        fullWidth
                        value={formData.homeComingLocation}
                        onChange={(e) => handleChange("homeComingLocation", e.target.value)}
                      >
                        <MenuItem value={1}>Studio</MenuItem>
                        <MenuItem value={2}>Away</MenuItem>
                        <MenuItem value={3}>Overseas</MenuItem>
                      </TextField>
                    </Grid>
                  </> : ""}
                <Grid item lg={12} xs={12} mb={3}>
                  <Typography as="h5">Description</Typography>
                  <TextField
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Box display="flex" mt={2} justifyContent="space-between">
            <Button variant="contained" onClick={handleClose} color="error">
              Cancel
            </Button>
            {isUpdated ? <Button
              variant="outlined"
              onClick={handleUpdate}
              color="primary"
            >
              Update
            </Button> : <MakePayment
              customer={selectedCustomer ? selectedCustomer.id : null}
              closeParentModal={handleClose}
              fetchItems={fetchItems}
              type={1}
              item={null}
              res={selectedCustomer}
            />}
          </Box>
        </Box>
      </Modal>
    </>
  );
}
