import React, { useEffect, useRef, useState } from "react";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  AppBar,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
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
  Tooltip,
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
import {
  getAppointment,
  getBridal,
  getLocation,
  getPreferedTime,
} from "@/components/types/types";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: 400 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
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

export default function UpdateReservation({ reservation, fetchItems, approve1 }) {
  const [open, setOpen] = useState(false);
  const [isGoingAway, setIsGoingAway] = useState(
    reservation.reservationDetails.isGoingAway
  );
  const [isHomeComing, setIsHomeComing] = useState(
    reservation.reservationDetails.isHomeComing
  );

  const handleOpen = () => setOpen(true);
  const theme = useTheme();
  const [homeComingBridalTypeValue, setHomeComingBridalTypeValue] = useState(1);
  const [homeComingLocationValue, setHomeComingLocationValue] = useState(1);
  const [homeComingPreferedTimeValue, setHomeComingPreferedTimeValue] = useState();
  const [paymentCode, setPaymentCode] = useState(reservation?.paymentCode || "");
  const [initialPaymentDate, setInitialPaymentDate] = useState(
    reservation?.initialPaymentDate ? formatDate(reservation.initialPaymentDate) : ""
  );
  const textFieldRef = useRef(null);
  const [value, setValue] = useState(0);
  const [dressingRows, setDressingRows] = useState(() => {
    const initialRows = [
      {
        DressingType: 1,
        label: "Bride",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
      {
        DressingType: 2,
        label: "Maids",
        StartTime: "",
        EndTime: "",
        Remark: "",
      },
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
    ];

    if (reservation?.reservationDressingTime) {
      return initialRows.map((row) => {
        const matchingReservation = reservation.reservationDressingTime.find(
          (res) => res.dressingType === row.DressingType
        );

        if (matchingReservation) {
          return {
            ...row,
            StartTime: matchingReservation.startTime,
            EndTime: matchingReservation.endTime,
            Remark: matchingReservation.remark,
          };
        }

        return row;
      });
    }

    return initialRows;
  });
  const [nextAppointment, setNextAppointment] = useState(1);
  const [appointments, setAppointments] = useState(() => {
    const initialAppointments = [
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
    ];

    if (reservation?.reservationAppointment) {
      return initialAppointments.map((appointment) => {
        const matchingAppointment = reservation.reservationAppointment.find(
          (res) => res.appointmentType === appointment.AppointmentType
        );

        if (matchingAppointment) {
          return {
            ...appointment,
            StartDate: formatDate(matchingAppointment.startDate),
            EndDate: formatDate(matchingAppointment.endDate),
            Remark: matchingAppointment.remark,
            IsAppointmentTypeChecked:
              matchingAppointment.isAppointmentTypeChecked,
            isDisabled: matchingAppointment.isAppointmentTypeChecked,
          };
        }

        return appointment;
      });
    }

    return initialAppointments;
  });

  const handleInputChange = (index, field, value) => {
    const updatedRows = dressingRows.map((row, i) => {
      if (i === index || (index === 0 && i === 1)) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setDressingRows(updatedRows);
  };

  const handleAppointmentChange = async (index, field, value) => {
    const updatedRows = appointments.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }

      setNextAppointment(index + 1);
      return row;
    });

    await setAppointments(updatedRows);
  };

  const handleSubmit = async (values) => {
    const uncheckedLabelsInMiddle = [];
    let foundUnchecked = false;

    for (let i = 0; i < appointments.length; i++) {
      if (!appointments[i].IsAppointmentTypeChecked) {
        foundUnchecked = true;
        uncheckedLabelsInMiddle.push(appointments[i].AppointmentType);
      } else if (foundUnchecked) {
        const readableLabels = uncheckedLabelsInMiddle.map(getAppointment).join(", ");
        toast.warning(`Please select ${readableLabels} appointment(s) to continue.`);
        return;
      }
    }
    const postData = {
      Id: reservation.id,
      DocumentNo: reservation.documentNo,
      ReservationFunctionType: values.ReservationFunctionType,
      ReservationDate: values.ReservationDate,
      CustomerName: values.CustomerName,
      GroomName: values.GroomName,
      Description: reservation.description,
      MobileNo: values.MobileNo.toString(),
      NIC: values.NIC.toString(),
      EmergencyContactNo: values.EmergencyContactNo.toString(),
      PreferdTime: values.PreferedTime,
      BridleType: values.BridalType,
      Location: values.Location,
      Type: reservation.type,
      IsExpire: reservation.isExpire,
      ExpireProcessDate: null,
      NextAppointmentType: nextAppointment,
      PaymentCode: paymentCode || "",
      InitialPaymentDate: initialPaymentDate || null,
      HomeComingDate: isHomeComing ? values.ReservationDetails.HomeComingDate : null,
      HomeComingBridleType: isHomeComing ? values.HomeComingBridleType : null,
      HomeComingLocation: isHomeComing ? values.HomeComingLocation : null,
      HomeComingPreferredTime: isHomeComing ? values.HomeComingPreferredTime : null,
      ReservationDetails: {
        WeddingVenue: values.ReservationDetails.WeddingVenue || null,
        DressingVenue: values.ReservationDetails.DressingVenue || null,
        AddressLine1: values.ReservationDetails.AddressLine1 || null,
        AddressLine2: values.ReservationDetails.AddressLine2 || null,
        AddressLine3: values.ReservationDetails.AddressLine3 || null,
        WeddingDayContactPerson:
          values.ReservationDetails.WeddingDayContactPerson,
        WeddingDayContactPersonNo:
          values.ReservationDetails.WeddingDayContactPersonNo.toString(),
        Remark: values.ReservationDetails.Remark || null,
        IsGoingAway: isGoingAway,
        IsHomeComing: isHomeComing,
        GoingAwayOutfit: values.ReservationDetails.GoingAwayOutfit || null,
        GoingAwayOutfitBy: values.ReservationDetails.GoingAwayOutfitBy || null,
        HomeComingDate: values.ReservationDetails.HomeComingDate || null,
        HomeComingOutfit: values.ReservationDetails.HomeComingOutfit || null,
        HomeComingOutfitBy: values.ReservationDetails.HomeComingOutfitBy || null,
        HomeComingVenue: values.ReservationDetails.HomeComingVenue || null,
        GoingAwayDressingVenue:
          values.ReservationDetails.GoingAwayDressingVenue || null,
        GroomsOutfit: values.ReservationDetails.GroomsOutfit || null,
        GroomsOutfitBy: values.ReservationDetails.GroomsOutfitBy || null,
        MaidsOutfitBy: values.ReservationDetails.MaidsOutfitBy || null,
        GAOutfitBy: values.ReservationDetails.GAOutfitBy || null,
        BouquetsBy: values.ReservationDetails.BouquetsBy || null,
        WedOutfitBy: values.ReservationDetails.WedOutfitBy || null,
        FGOutfitBy: values.ReservationDetails.FGOutfitBy || null,
        FGOutfit: values.ReservationDetails.FGOutfit || null,
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

  useEffect(() => {
    if (textFieldRef.current) {
      setTextFieldWidth(textFieldRef.current.offsetWidth);
    }
    var isHomecoming = reservation.reservationFunctionType === 3 ? true : false;
    setIsHomeComing(isHomecoming);
    var bridal = reservation.homeComingBridleType ? reservation.homeComingBridleType : 1;
    var location = reservation.homeComingLocation ? reservation.homeComingLocation : 1;
    var pref = reservation.homeComingPreferredTime ? reservation.homeComingPreferredTime : 1;

    setHomeComingBridalTypeValue(bridal);
    setHomeComingLocationValue(location);
    setHomeComingPreferedTimeValue(pref);

  }, [textFieldRef.current,reservation]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip sx={{ width: '30px', height: '30px' }} title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Formik
            initialValues={{
              Id: reservation?.id || "",
              ReservationFunctionType:
                reservation.reservationFunctionType || null,
              ReservationDate: reservation?.reservationDate || "",
              CustomerName: reservation?.customerName || "",
              GroomName: reservation?.groomName || "",
              Description: reservation?.description || "",
              MobileNo: reservation?.mobileNo || "",
              EmergencyContactNo: reservation?.emergencyContactNo || "",
              NIC: reservation?.nic || "",
              PreferedTime: reservation?.preferdTime || 1,
              BridalType: reservation?.bridleType || 1,
              Location: reservation?.location || 1,
              Type: reservation?.type || "",
              IsExpire: false,
              HomeComingBridleType: reservation?.homeComingBridleType || 1,
              HomeComingPreferredTime: reservation?.homeComingPreferredTime || 1,
              HomeComingLocation: reservation?.homeComingLocation || 1,
              ExpireProcessDate: reservation?.expireProcessDate || "",
              NextAppointmentType: reservation?.nextAppointmentType || "",
              ReservationDetails: {
                WeddingVenue: reservation.reservationDetails.weddingVenue || "",
                DressingVenue:
                  reservation?.reservationDetails?.dressingVenue || "",
                AddressLine1:
                  reservation?.reservationDetails?.addressLine1 || "",
                AddressLine2:
                  reservation?.reservationDetails?.addressLine2 || "",
                AddressLine3:
                  reservation?.reservationDetails?.addressLine3 || "",
                WeddingDayContactPerson:
                  reservation?.reservationDetails?.weddingDayContactPerson ||
                  "",
                WeddingDayContactPersonNo:
                  reservation?.reservationDetails?.weddingDayContactPersonNo ||
                  "",
                Remark: reservation?.reservationDetails?.remark || "",
                IsGoingAway: false,
                IsHomeComing: false,
                HomeComingDate:
                  reservation?.reservationDetails?.homeComingDate || "",
                HomeComingVenue:
                  reservation?.reservationDetails?.homeComingVenue || "",
                HomeComingOutfit:
                  reservation?.reservationDetails?.homeComingOutfit || "",
                HomeComingOutfitBy:
                  reservation?.reservationDetails?.homeComingOutfitBy || "",
                GoingAwayDressingVenue:
                  reservation?.reservationDetails?.goingAwayDressingVenue || "",
                GoingAwayOutfit:
                  reservation?.reservationDetails?.goingAwayOutfit || "",
                GoingAwayOutfitBy:
                  reservation?.reservationDetails?.goingAwayOutfitBy || "",
                GroomsOutfit:
                  reservation?.reservationDetails?.groomsOutfit || "",
                GroomsOutfitBy:
                  reservation?.reservationDetails?.groomsOutfitBy || "",
                MaidsOutfitBy:
                  reservation?.reservationDetails?.maidsOutfitBy || "",
                GAOutfitBy: reservation?.reservationDetails?.gaOutfitBy || "",
                BouquetsBy: reservation?.reservationDetails?.bouquetsBy || "",
                WedOutfitBy: reservation?.reservationDetails?.wedOutfitBy || "",
                FGOutfitBy: reservation?.reservationDetails?.fgOutfitBy || "",
                FGOutfit: reservation?.reservationDetails?.fgOutfit || "",
                HCOutfitBy: reservation?.reservationDetails?.hcOutfitBy || "",
                Photographer:
                  reservation?.reservationDetails?.photographer || "",
                Maids: reservation?.reservationDetails?.maids || "",
                LittleMaids: reservation?.reservationDetails?.littleMaids || "",
                FlowerGirls: reservation?.reservationDetails?.flowerGirls || "",
                PupilMaids: reservation?.reservationDetails?.pupilMaids || "",
              },
            }}
            onSubmit={(values, { resetForm }) => {
              handleSubmit(values);
              resetForm();
            }}
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form>
                <Box>
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
                          <Typography>Initial Payment Date</Typography>
                          <TextField
                            type="date"
                            value={initialPaymentDate}
                            disabled
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wedding Date</Typography>
                          <Field
                            as={TextField}
                            type="date"
                            name="ReservationDate"
                            value={formatDate(values.ReservationDate)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Event Type</Typography>
                          <FormControl fullWidth>
                            <Field
                              as={Select}
                              name="ReservationFunctionType"
                              value={values.ReservationFunctionType}
                            >
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
                          <Field
                            as={TextField}
                            value={values.CustomerName}
                            fullWidth
                            name="CustomerName"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Name of Groom</Typography>
                          <Field
                            as={TextField}
                            value={values.GroomName}
                            fullWidth
                            name="GroomName"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>NIC/Passport No</Typography>
                          <Field
                            as={TextField}
                            value={values.NIC}
                            fullWidth
                            name="NIC"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Contact No</Typography>
                          <Field
                            as={TextField}
                            value={values.MobileNo}
                            fullWidth
                            name="MobileNo"
                            type="number"
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
                            value={values.ReservationDetails.WeddingVenue}
                            fullWidth
                            name="ReservationDetails.WeddingVenue"
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Dressing Venue</Typography>
                          <Field
                            as={TextField}
                            value={values.ReservationDetails.DressingVenue}
                            name="ReservationDetails.DressingVenue"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Prefered Time</Typography>
                          <Field
                            as={Select}
                            name="PreferedTime"
                            fullWidth
                            value={values.PreferedTime}
                          >
                            <MenuItem value={1}>Morning</MenuItem>
                            <MenuItem value={2}>Evening</MenuItem>
                          </Field>
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bridal Type</Typography>
                          <Field
                            as={Select}
                            name="BridalType"
                            fullWidth
                            value={values.BridalType}
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
                            value={values.Location}
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
                            value={values.ReservationDetails.AddressLine1}
                            name="ReservationDetails.AddressLine1"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 2</Typography>
                          <Field
                            as={TextField}
                            value={values.ReservationDetails.AddressLine2}
                            name="ReservationDetails.AddressLine2"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Address Line 3</Typography>
                          <Field
                            as={TextField}
                            value={values.ReservationDetails.AddressLine3}
                            name="ReservationDetails.AddressLine3"
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
                            fullWidth
                            placeholder="Contact Name"
                            value={
                              values.ReservationDetails.WeddingDayContactPerson
                            }
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Field
                            as={TextField}
                            name="ReservationDetails.WeddingDayContactPersonNo"
                            fullWidth
                            type="number"
                            value={
                              values.ReservationDetails
                                .WeddingDayContactPersonNo
                            }
                            placeholder="Contact No"
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
                              onChange={(e) =>
                                setIsHomeComing(e.target.checked)
                              }
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
                                name="ReservationDetails.HomeComingDate"
                                value={formatDate(values.ReservationDetails.HomeComingDate)}
                                fullWidth
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
                                name="HomeComingPreferredTime"
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
                            value={values.ReservationDetails.Remark}
                            name="ReservationDetails.Remark"
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
                            vales={values.ReservationDetails.GroomsOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Groom's Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.GroomsOutfitBy"
                            vales={values.ReservationDetails.GroomsOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Wed Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.WedOutfitBy"
                            vales={values.ReservationDetails.WedOutfitBy}
                            fullWidth
                          />
                        </Grid>

                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.FGOutfit"
                            vales={values.ReservationDetails.FGOutfit}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>F/G Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.FGOutfitBy"
                            vales={values.ReservationDetails.FGOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Maids Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.MaidsOutfitBy"
                            vales={values.ReservationDetails.MaidsOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>G/A Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.GAOutfitBy"
                            vales={values.ReservationDetails.GAOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>H/C Outfit By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.HCOutfitBy"
                            vales={values.ReservationDetails.HCOutfitBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Bouquets By</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.BouquetsBy"
                            vales={values.ReservationDetails.BouquetsBy}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Photographer</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.Photographer"
                            vales={values.ReservationDetails.Photographer}
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
                            vales={values.ReservationDetails.Maids}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Flower Girls</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            name="ReservationDetails.FlowerGirls"
                            vales={values.ReservationDetails.FlowerGirls}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Little Maids</Typography>
                          <Field
                            as={TextField}
                            type="number"
                            name="ReservationDetails.LittleMaids"
                            vales={values.ReservationDetails.LittleMaids}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} lg={6} mb={1}>
                          <Typography>Pupil Maids</Typography>
                          <Field
                            as={TextField}
                            type="text"
                            name="ReservationDetails.PupilMaids"
                            vales={values.ReservationDetails.PupilMaids}
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
                                  <TableCell>Completed</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell>First Reserve Date</TableCell>
                                  <TableCell>Second Reserve Date</TableCell>
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
                                    <TableCell>
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
                                    </TableCell>
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
