import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import PropTypes from "prop-types";
import { formatDate } from "@/components/utils/formatHelper";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import useGetList from "@/components/utils/getList";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: 400 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const tabPanelStyle = {
  maxHeight: "60vh",
  overflowY: "auto",
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function AddReservation({ fetchItems, documentNo ,approve1}) {
  const [open, setOpen] = useState(false);
  const [isGoingAway, setIsGoingAway] = useState(false);
  const [isHomeComing, setIsHomeComing] = useState(false);
  const handleOpen = () => setOpen(true);
  const theme = useTheme();
  const textFieldRef = useRef(null);
  const [value, setValue] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [homeComingDateValue, setHomeComingDateValue] = useState("");
  const [homeComingBridalTypeValue, setHomeComingBridalTypeValue] = useState(1);
  const [homeComingLocationValue, setHomeComingLocationValue] = useState(1);
  const [homeComingPreferedTimeValue, setHomeComingPreferedTimeValue] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [textFieldWidth, setTextFieldWidth] = useState(0);
  const [paymentCode, setPaymentCode] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const { data, getCustomersByName } = useGetList();
  const [dressingRows, setDressingRows] = useState([
    { DressingType: 1, label: "Bride", StartTime: "", EndTime: "", Remark: "" },
    { DressingType: 2, label: "Maids", StartTime: "", EndTime: "", Remark: "" },
    { DressingType: 3, label: "Touch Up", StartTime: "", EndTime: "", Remark: "" },
    {
      DressingType: 4,
      label: "Touch Up 2",
      StartTime: "",
      EndTime: "",
      Remark: "",
    },
    {
      DressingType: 5,
      label: "Going Away",
      StartTime: "",
      EndTime: "",
      Remark: "",
    },
    {
      DressingType: 6,
      label: "Home Coming",
      StartTime: "",
      EndTime: "",
      Remark: "",
    },
  ]);
  const [nextAppointment, setNextAppointment] = useState(1);

  const [appointments, setAppointments] = useState([
    {
      AppointmentType: 1,
      label: "First",
      StartDate: "",
      EndDate: "",
      IsAppointmentTypeChecked: false,
      Remark: "",
      isDisabled: false,
    },
    {
      AppointmentType: 2,
      label: "Show Saree",
      StartDate: "",
      EndDate: "",
      IsAppointmentTypeChecked: false,
      Remark: "",
      isDisabled: true,
    },
    {
      AppointmentType: 3,
      label: "Fabric & Design",
      StartDate: "",
      EndDate: "",
      IsAppointmentTypeChecked: false,
      Remark: "",
      isDisabled: true,
    },
    {
      AppointmentType: 4,
      label: "Measurement",
      StartDate: "",
      EndDate: "",
      IsAppointmentTypeChecked: false,
      Remark: "",
      isDisabled: true,
    },
    {
      AppointmentType: 5,
      label: "Fiton",
      StartDate: "",
      EndDate: "",
      IsAppointmentTypeChecked: false,
      Remark: "",
      isDisabled: true,
    },
    {
      AppointmentType: 6,
      label: "Trail",
      StartDate: "",
      EndDate: "",
      IsAppointmentTypeChecked: false,
      Remark: "",
      isDisabled: true,
    },
  ]);

  const handleInputChange = (index, field, value) => {
    const updatedRows = dressingRows.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    );
    setDressingRows(updatedRows);
  };


  const handleAppointmentChange = async (index, field, value) => {
    const updatedRows = appointments.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      if (field === "IsAppointmentTypeChecked") {
        if (i === index + 1) {
          return { ...row, isDisabled: !value };
        }
        if (i > index + 1) {
          return { ...row, isDisabled: true };
        }
      }
      setNextAppointment(index + 1);
      return row;
    });

    await setAppointments(updatedRows);
  };

  const handleSubmit = async (values) => {

    const messages = [
      {
        condition: !selectedCustomer,
        message: "Please Search and Select Reservation",
      },
    ];

    const invalidField = messages.find(({ condition }) => condition);
    if (invalidField) {
      toast.info(invalidField.message);
      return;
    }

    const postData = {
      Id: selectedCustomer.id,
      DocumentNo: documentNo,
      ReservationDate: selectedCustomer.reservationDate,
      CustomerName: selectedCustomer.customerName,
      GroomName: selectedCustomer.groomName,
      ReservationFunctionType: values.ReservationFunctionType ? values.ReservationFunctionType : selectedCustomer.reservationFunctionType,
      Description: selectedCustomer.description,
      MobileNo: selectedCustomer.mobileNo,
      EmergencyContactNo: values.EmergencyContactNo.toString(),
      NIC: selectedCustomer.nic,
      PaymentCode: paymentCode,
      PreferdTime: values.PreferdTime ? values.PreferdTime : selectedCustomer.preferdTime,
      BridleType: values.BridleType ? values.BridleType : selectedCustomer.bridleType,
      Location: values.Location ? values.Location : selectedCustomer.location,
      GroomName: values.GroomName || "",
      Type: selectedCustomer.type,
      HomeComingDate: isHomeComing ? homeComingDateValue : null,
      HomeComingBridleType: isHomeComing ? values.HomeComingBridleType : null,
      HomeComingLocation: isHomeComing ? values.HomeComingLocation : null,
      HomeComingPreferredTime: isHomeComing ? values.HomeComingPreferredTime : null,
      IsExpire: selectedCustomer.isExpire,
      ExpireProcessDate: selectedCustomer.ExpireProcessDate,
      NextAppointmentType: nextAppointment,
      PaymentCode: paymentCode || "",
      ReservationDetails: {
        WeddingVenue: values.ReservationDetails.WeddingVenue || null,
        DressingVenue: values.ReservationDetails.DressingVenue || null,
        AddressLine1: values.ReservationDetails.AddressLine1 || null,
        AddressLine2: values.ReservationDetails.AddressLine2 || null,
        AddressLine3: values.ReservationDetails.AddressLine3 || null,
        WeddingDayContactPerson:
          values.ReservationDetails.WeddingDayContactPerson || null,
        WeddingDayContactPersonNo:
          values.ReservationDetails.WeddingDayContactPersonNo.toString() || null,
        Remark: values.ReservationDetails.Remark || null,
        IsGoingAway: isGoingAway,
        IsHomeComing: isHomeComing,
        HomeComingDate: isHomeComing ? homeComingDateValue : null,
        HomeComingVenue: isHomeComing ? values.ReservationDetails.HomeComingVenue : null,
        HomeComingOutfit: isHomeComing ? values.ReservationDetails.HomeComingOutfit : null,
        HomeComingOutfitBy: isHomeComing ? values.ReservationDetails.HomeComingOutfitBy : null,
        GoingAwayDressingVenue:
          values.ReservationDetails.GoingAwayDressingVenue || null,
        GoingAwayOutfit: values.ReservationDetails.GoingAwayOutfit || null,
        GoingAwayOutfitBy: values.ReservationDetails.GoingAwayOutfitBy || null,
        GroomsOutfit: values.ReservationDetails.GroomsOutfit || null,
        GroomsOutfitBy: values.ReservationDetails.GroomsOutfitBy || null,
        MaidsOutfitBy: values.ReservationDetails.MaidsOutfitBy || null,
        GAOutfitBy: values.ReservationDetails.GAOutfitBy || null,
        BouquetsBy: values.ReservationDetails.BouquetsBy || null,
        WedOutfit: values.ReservationDetails.WedOutfit || null,
        WedOutfitBy: values.ReservationDetails.WedOutfitBy || null,
        FGOutfit: values.ReservationDetails.FGOutfit || null,
        FGOutfitBy: values.ReservationDetails.FGOutfitBy || null,
        HCOutfitBy: values.ReservationDetails.HCOutfitBy || null,
        Photographer: values.ReservationDetails.Photographer || null,
        Maids: values.ReservationDetails.Maids || null,
        LittleMaids: values.ReservationDetails.LittleMaids || null,
        FlowerGirls: values.ReservationDetails.FlowerGirls || null,
        PupilMaids: values.ReservationDetails.PupilMaids || null,
      },
      ReservationAppointment: appointments.map((appointment) => ({
        IsAppointmentTypeChecked: appointment.IsAppointmentTypeChecked,
        AppointmentType: appointment.AppointmentType,
        StartDate: appointment.StartDate ? appointment.StartDate : null,
        EndDate: appointment.EndDate ? appointment.EndDate : null,
        Remark: appointment.Remark,
      })),
      ReservationDressingTime: dressingRows.map((dressing) => ({
        DressingType: dressing.DressingType,
        StartTime: dressing.StartTime ? dressing.StartTime : null,
        EndTime: dressing.EndTime ? dressing.EndTime : null,
        Remark: dressing.Remark,
      })),
    };

    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/UpdateReservation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      const responseData = await response.json();

      if (responseData.statusCode === 200) {
        toast.success(responseData.message || responseData.result?.message || "Success");
        setOpen(false);
        setSelectedCustomer(null);
        fetchItems();
      } else {
        toast.error(responseData.message || responseData.result?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("An error occurred while processing the request");
    }
  };


  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCustomerChange = (field, value) => {
    setSelectedCustomer(prev => ({
      ...prev,
      [field]: value,
    }));
  };


  useEffect(() => {
    if (textFieldRef.current) {
      setTextFieldWidth(textFieldRef.current.offsetWidth);
    }
  }, [textFieldRef.current]);

  const handleClose = () => {
    setOpen(false);
    resetFields();
  };

  const resetFields = () => {
    setSearchValue("");
    setCustomers([]);
    setSelectedCustomer(null);
    setShowDropdown(false);
    setPaymentCode("");
    setPaymentDate("");
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    var isHomecoming = customer.reservationFunctionType === 3 ? true : false;
    setIsHomeComing(isHomecoming);
    var value = customer.homeComingDate ? customer.homeComingDate : "";
    var bridal = customer.homeComingBridleType ? customer.homeComingBridleType : 1;
    var location = customer.homeComingLocation ? customer.homeComingLocation : 1;
    var pref = customer.homeComingPreferredTime ? customer.homeComingPreferredTime : 1;
    setHomeComingDateValue(formatDate(value))
    setHomeComingBridalTypeValue(bridal);
    setHomeComingLocationValue(location);
    setHomeComingPreferedTimeValue(pref);
    setPaymentCode(customer.paymentCode || "");
    setPaymentDate(customer.initialPaymentDate ? formatDate(customer.initialPaymentDate) : "");
    setShowDropdown(false);
    setSearchValue(customer.customerName);
  };

  const handleSearchCustomer = async (value) => {
    setSearchValue(value);
    if (!value.trim()) {
      resetFields();
      return;
    }
    await getCustomersByName(value, 4);
    setCustomers(data);
    setShowDropdown(true);
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add new
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: 0,
              DocumentNo: documentNo,
              ReservationDate: selectedCustomer ? selectedCustomer.reservationDate : "",
              ReservationFunctionType: selectedCustomer ? selectedCustomer.reservationFunctionType : null,
              CustomerName: selectedCustomer ? selectedCustomer.customerName : "",
              GroomName: "",
              Description: "",
              MobileNo: selectedCustomer ? selectedCustomer.mobileNo : "",
              EmergencyContactNo: "",
              NIC: selectedCustomer?.nic || "",
              PreferdTime: 0,
              BridleType: 0,
              Location: 0,
              HomeComingBridleType: 1,
              HomeComingLocation: 1,
              HomeComingPreferredTime: 1,
              Type: 0,
              IsExpire: false,
              ExpireProcessDate: "",
              NextAppointmentType: 0,
              ReservationDetails: {
                WeddingVenue: "",
                DressingVenue: "",
                AddressLine1: "",
                AddressLine2: "",
                AddressLine3: "",
                WeddingDayContactPerson: "",
                WeddingDayContactPersonNo: "",
                Remark: "",
                IsGoingAway: false,
                IsHomeComing: false,
                HomeComingDate: "",
                HomeComingVenue: "",
                HomeComingOutfit: "",
                HomeComingOutfitBy: "",
                GoingAwayDressingVenue: "",
                GroomsOutfit: "",
                GroomsOutfitBy: "",
                MaidsOutfitBy: "",
                GAOutfitBy: "",
                BouquetsBy: "",
                WedOutfit: "",
                WedOutfitBy: "",
                FGOutfit: "",
                FGOutfitBy: "",
                HCOutfitBy: "",
                Photographer: "",
                Maids: 0,
                LittleMaids: 0,
                FlowerGirls: 0,
                PupilMaids: 0,
              }
            }}
            onSubmit={(values) => {
              handleSubmit(values);
            }}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                <Box>
                  <Grid container>
                    <Grid item xs={12} mb={2}>
                      <Typography variant="h6">Document No : {documentNo}</Typography>
                    </Grid>
                    <Grid item xs={12} mb={2}>
                      <TextField
                        ref={textFieldRef}
                        value={searchValue}
                        onChange={(e) => handleSearchCustomer(e.target.value)}
                        placeholder="Search customer by name"
                        fullWidth
                      />
                      {showDropdown && (
                        <List
                          style={{
                            border: "1px solid #ccc",
                            maxHeight: 200,
                            width: `${textFieldWidth}px`,
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
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                <ListItemText primary={customer.customerName} />
                              </ListItem>
                            ))
                          ) : (
                            <ListItem>
                              <ListItemText primary="No customers found" />
                            </ListItem>
                          )}
                        </List>
                      )}
                    </Grid>
                  </Grid>
                  <AppBar
                    sx={{ background: "#e5e5e5", boxShadow: "none" }}
                    position="static"
                  >
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      indicatorColor="white"
                      variant="fullWidth"
                      aria-label="full width tabs example"
                    >
                      <Tab
                        label="General"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(0)}
                      />
                      <Tab
                        label="Outfit/Accessories & Retinue"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(1)}
                      />
                      <Tab
                        label="Dressing Time"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(2)}
                      />
                      <Tab
                        label="Appointments"
                        sx={{ fontSize: "0.9rem" }}
                        {...a11yProps(3)}
                      />
                    </Tabs>
                  </AppBar>
                  <Box sx={tabPanelStyle}>
                    <TabPanel value={value} index={0} dir={theme.direction}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Payment Code</Typography>
                          <TextField
                            value={paymentCode}
                            disabled={!approve1}
                            onChange={(e) => setPaymentCode(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Payment Date</Typography>
                          <TextField
                            type="date"
                            value={paymentDate}
                            disabled
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding Date</Typography>
                          <Field
                            as={TextField}
                            type="date"
                            value={selectedCustomer
                              ? formatDate(selectedCustomer.reservationDate)
                              : ""}
                            disabled
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={2}>
                          <Typography>Event Type</Typography>
                          <FormControl fullWidth>
                            <Field as={Select} value={values.ReservationFunctionType ?? selectedCustomer?.reservationFunctionType ?? ''} name="ReservationFunctionType">
                              <MenuItem value={1}>Wedding</MenuItem>
                              <MenuItem value={2}>Home Coming</MenuItem>
                              <MenuItem value={3}>Wedding & Home Coming</MenuItem>
                              <MenuItem value={4}>Normal Dressing</MenuItem>
                              <MenuItem value={5}>Photo Shoot</MenuItem>
                              <MenuItem value={6}>Outfit Only</MenuItem>
                              <MenuItem value={7}>Engagement</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Name of Bride</Typography>
                          <TextField
                            fullWidth
                            name="CustomerName"
                            type="text"
                            value={selectedCustomer?.customerName || ""}
                            onChange={(e) => handleCustomerChange("customerName", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Name of Groom</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="GroomName"
                            value={values.GroomName}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>NIC/Passport No</Typography>
                          <TextField
                            fullWidth
                            name="NIC"
                            type="text"
                            value={selectedCustomer?.nic || ""}
                            onChange={(e) => handleCustomerChange("nic", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Contact No</Typography>
                          <TextField
                            fullWidth
                            name="mobileNo"
                            type="text"
                            value={selectedCustomer?.mobileNo || ""}
                            onChange={(e) => handleCustomerChange("mobileNo", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Emergency Contact No</Typography>
                          <Field
                            as={TextField}
                            value={values.EmergencyContactNo}
                            fullWidth
                            name="EmergencyContactNo"
                            type="number"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding Venue</Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.WeddingVenue"
                            value={values.ReservationDetails.WeddingVenue}
                            error={
                              touched.WeddingVenue &&
                              Boolean(errors.WeddingVenue)
                            }
                            helperText={
                              touched.WeddingVenue && errors.WeddingVenue
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Dressing Venue</Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.DressingVenue"
                            value={values.ReservationDetails.DressingVenue}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Prefered Time</Typography>
                          <Field
                            as={Select}
                            name="PreferdTime"
                            fullWidth
                            value={
                              values.PreferdTime ||
                              (selectedCustomer
                                ? selectedCustomer.preferdTime
                                : "")
                            }
                          >
                            <MenuItem value={1}>Morning</MenuItem>
                            <MenuItem value={2}>Evening</MenuItem>
                          </Field>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bridal Type</Typography>
                          <Field
                            as={Select}
                            name="BridleType"
                            fullWidth
                            value={
                              values.BridleType ||
                              (selectedCustomer
                                ? selectedCustomer.bridleType
                                : "")
                            }
                          >
                            <MenuItem value={1}>Kandyan</MenuItem>
                            <MenuItem value={2}>Indian</MenuItem>
                            <MenuItem value={3}>Western</MenuItem>
                            <MenuItem value={4}>Hindu</MenuItem>
                          </Field>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Location</Typography>
                          <Field
                            as={Select}
                            name="Location"
                            fullWidth
                            value={
                              values.Location ||
                              (selectedCustomer
                                ? selectedCustomer.location
                                : "")
                            }
                          >
                            <MenuItem value={1}>Studio</MenuItem>
                            <MenuItem value={2}>Away</MenuItem>
                            <MenuItem value={3}>Overseas</MenuItem>
                          </Field>
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography>Address Line 1</Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.AddressLine1"
                            value={values.ReservationDetails.AddressLine1}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 2</Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.AddressLine2"
                            value={values.ReservationDetails.AddressLine2}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 3</Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.AddressLine3"
                            value={values.ReservationDetails.AddressLine3}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography variant="h6">
                            Wedding Day Contact Details
                          </Typography>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Field
                            as={TextField}
                            name="ReservationDetails.WeddingDayContactPerson"
                            value={
                              values.ReservationDetails.WeddingDayContactPerson
                            }
                            fullWidth
                            placeholder="Contact Name"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Field
                            as={TextField}
                            name="ReservationDetails.WeddingDayContactPersonNo"
                            fullWidth
                            type="number"
                            placeholder="Contact No"
                            value={
                              values.ReservationDetails
                                .WeddingDayContactPersonNo
                            }
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <FormGroup>
                            <FormControlLabel
                              control={<Checkbox checked={isGoingAway} />}
                              name="ReservationDetails.IsGoingAway"
                              label="Going Away"
                              onChange={(e) => setIsGoingAway(e.target.checked)}
                            />
                            <FormControlLabel
                              control={<Checkbox checked={isHomeComing} />}
                              name="ReservationDetails.IsHomeComing"
                              label="Home Coming"
                              onChange={(e) => setIsHomeComing(e.target.checked)}
                            />
                          </FormGroup>
                        </Grid>
                        {isHomeComing ? (
                          <>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Date</Typography>
                              <Field
                                as={TextField}
                                type="date"
                                value={homeComingDateValue}
                                fullWidth
                                onChange={(e) => {
                                  setHomeComingDateValue(e.target.value);
                                  setFieldValue("ReservationDetails.HomeComingDate", e.target.value);
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Venue</Typography>
                              <Field
                                as={TextField}
                                name="ReservationDetails.HomeComingVenue"
                                value={values.ReservationDetails.HomeComingVenue}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Outfit</Typography>
                              <Field
                                as={TextField}
                                name="ReservationDetails.HomeComingOutfit"
                                value={values.ReservationDetails.HomeComingOutfit}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Outfit By</Typography>
                              <Field
                                as={TextField}
                                name="ReservationDetails.HomeComingOutfitBy"
                                value={values.ReservationDetails.HomeComingOutfitBy}
                                fullWidth
                              />
                            </Grid>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Preferred Time</Typography>
                              <Field
                                as={Select}
                                fullWidth
                                value={homeComingPreferedTimeValue}
                                onChange={(e) => {
                                  setFieldValue("HomeComingPreferredTime", e.target.value);
                                  setHomeComingPreferedTimeValue(e.target.value);
                                }}
                              >
                                <MenuItem value={1}>Morning</MenuItem>
                                <MenuItem value={2}>Evening</MenuItem>
                              </Field>
                            </Grid>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Bridal Type</Typography>
                              <Field
                                as={Select}
                                name="HomeComingBridleType"
                                fullWidth
                                value={homeComingBridalTypeValue}
                                onChange={(e) => {
                                  setFieldValue("HomeComingBridleType", e.target.value);
                                  setHomeComingBridalTypeValue(e.target.value);
                                }}
                              >
                                <MenuItem value={1}>Kandyan</MenuItem>
                                <MenuItem value={2}>Indian</MenuItem>
                                <MenuItem value={3}>Western</MenuItem>
                                <MenuItem value={4}>Hindu</MenuItem>
                              </Field>

                            </Grid>
                            <Grid item xs={12} lg={6} mb={1}>
                              <Typography>Home Coming Dressing Location</Typography>
                              <Field
                                as={Select}
                                name="HomeComingLocation"
                                fullWidth
                                value={homeComingLocationValue}
                                onChange={(e) => {
                                  setFieldValue("HomeComingLocation", e.target.value);
                                  setHomeComingLocationValue(e.target.value);
                                }}
                              >
                                <MenuItem value={1}>Studio</MenuItem>
                                <MenuItem value={2}>Away</MenuItem>
                                <MenuItem value={3}>Overseas</MenuItem>
                              </Field>
                            </Grid>
                          </>
                        ) : (
                          ""
                        )}
                        {isGoingAway ? (
                          <Grid item xs={12} lg={6} mb={1}>
                            <Typography>Going Away Dressing Venue</Typography>
                            <Field
                              as={TextField}
                              name="ReservationDetails.GoingAwayDressingVenue"
                              value={
                                values.ReservationDetails.GoingAwayDressingVenue
                              }
                              fullWidth
                            />
                          </Grid>
                        ) : (
                          ""
                        )}
                        {isGoingAway ? (
                          <Grid item xs={12} lg={6} mb={1}>
                            <Typography>Going Away Outfit</Typography>
                            <Field
                              as={TextField}
                              name="ReservationDetails.GoingAwayOutfit"
                              value={values.ReservationDetails.GoingAwayOutfit}
                              fullWidth
                            />
                          </Grid>
                        ) : (
                          ""
                        )}
                        {isGoingAway ? (
                          <Grid item xs={12} lg={6} mb={1}>
                            <Typography>Going Away Outfit By</Typography>
                            <Field
                              as={TextField}
                              name="ReservationDetails.GoingAwayOutfitBy"
                              value={
                                values.ReservationDetails.GoingAwayOutfitBy
                              }
                              fullWidth
                            />
                          </Grid>
                        ) : (
                          ""
                        )}
                        <Grid
                          item
                          xs={12}
                          lg={isGoingAway || isHomeComing ? 6 : 12}
                          mb={1}
                        >
                          <Typography>Remark</Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.Remark"
                            value={values.ReservationDetails.Remark}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Groom's Outfit</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.GroomsOutfit"
                            value={values.ReservationDetails.GroomsOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Groom's Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.GroomsOutfitBy"
                            value={values.ReservationDetails.GroomsOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wed Outfit</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={values.ReservationDetails.WedOutfit}
                            name="ReservationDetails.WedOutfit"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wed Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={values.ReservationDetails.WedOutfitBy}
                            name="ReservationDetails.WedOutfitBy"
                            fullWidth
                          />
                        </Grid>

                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.FGOutfit"
                            value={values.ReservationDetails.FGOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.FGOutfitBy"
                            value={values.ReservationDetails.FGOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids Outfit By</Typography>
                          <Field
                            as={TextField}
                            value={values.ReservationDetails.MaidsOutfitBy}
                            type="text"
                            name="ReservationDetails.MaidsOutfitBy"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>G/A Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.GAOutfitBy"
                            value={values.ReservationDetails.GAOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>H/C Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.HCOutfitBy"
                            value={values.ReservationDetails.HCOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bouquets By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            value={values.ReservationDetails.BouquetsBy}
                            name="ReservationDetails.BouquetsBy"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Photographer</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.Photographer"
                            value={values.ReservationDetails.Photographer}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} mb={1}>
                          <Typography variant="h6" fontWeight="700">
                            Retinue
                          </Typography>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            name="ReservationDetails.Maids"
                            value={values.ReservationDetails.Maids}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Flower Girls</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            name="ReservationDetails.FlowerGirls"
                            value={values.ReservationDetails.FlowerGirls}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Little Maids</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            name="ReservationDetails.LittleMaids"
                            value={values.ReservationDetails.LittleMaids}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Pupil Maids</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.PupilMaids"
                            value={values.ReservationDetails.PupilMaids}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={2} dir={theme.direction}>
                      <Grid container>
                        <Grid item xs={12}>
                          <TableContainer>
                            <Table fullWidth aria-label="simple table">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Dressing</TableCell>
                                  <TableCell>Start Time</TableCell>
                                  <TableCell>End Time</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {dressingRows.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="datetime-local"
                                        fullWidth
                                        value={row.StartTime}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "StartTime",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="datetime-local"
                                        fullWidth
                                        value={row.EndTime}
                                        onChange={(e) =>
                                          handleInputChange(
                                            index,
                                            "EndTime",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={3} dir={theme.direction}>
                      <Grid container>
                        <Grid item xs={12}>
                          <TableContainer>
                            <Table fullWidth aria-label="simple table">
                              <TableHead>
                                <TableRow>
                                  <TableCell></TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Remark</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {appointments.map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <Checkbox
                                        checked={row.IsAppointmentTypeChecked}
                                        disabled={row.isDisabled}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "IsAppointmentTypeChecked",
                                            e.target.checked
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        value={row.StartDate}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "StartDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                    {/* <TableCell>
                                      <TextField
                                        size="small"
                                        type="date"
                                        fullWidth
                                        value={row.EndDate}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "EndDate",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell> */}
                                    <TableCell>
                                      <TextField
                                        size="small"
                                        type="text"
                                        fullWidth
                                        value={row.Remark}
                                        onChange={(e) =>
                                          handleAppointmentChange(
                                            index,
                                            "Remark",
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </TabPanel>
                  </Box>
                </Box>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    color="error"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    Save
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
