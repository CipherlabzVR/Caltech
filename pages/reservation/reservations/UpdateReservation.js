import React, { useEffect, useState } from "react";
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
import { getAppointment } from "@/components/types/types";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "min(96vw, 520px)", sm: "min(92vw, 720px)", lg: "min(96vw, 980px)" },
  maxHeight: "92vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 2, sm: 3 },
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
  outline: "none",
};

const tabPanelStyle = {
  flex: 1,
  minHeight: 0,
  maxHeight: { xs: "min(62vh, 520px)", sm: "min(65vh, 560px)", lg: "min(62vh, 580px)" },
  overflowY: "auto",
  px: { xs: 0.5, sm: 0 },
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
      {value === index && <Box sx={{ py: 1 }}>{children}</Box>}
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
    const isHomecoming = reservation.reservationFunctionType === 3;
    setIsHomeComing(isHomecoming);
    const bridal = reservation.homeComingBridleType ? reservation.homeComingBridleType : 1;
    const location = reservation.homeComingLocation ? reservation.homeComingLocation : 1;
    const pref = reservation.homeComingPreferredTime ? reservation.homeComingPreferredTime : 1;
    setHomeComingBridalTypeValue(bridal);
    setHomeComingLocationValue(location);
    setHomeComingPreferedTimeValue(pref);
  }, [reservation]);

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
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2, flexShrink: 0 }}>
            Document No : {reservation.documentNo}
          </Typography>
          <Formik
            enableReinitialize
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
            {({ values, setFieldValue }) => {
              const canEditPayment = !!approve1;
              return (
              <Form>
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                  <AppBar
                    position="static"
                    elevation={0}
                    sx={{ bgcolor: "transparent", color: "text.primary" }}
                  >
                    <Tabs
                      value={value}
                      onChange={handleChange}
                      indicatorColor="primary"
                      variant="scrollable"
                      scrollButtons="auto"
                      allowScrollButtonsMobile
                      sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44 } }}
                      aria-label="Reservation tabs"
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
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                        Customer details
                      </Typography>
                      <Grid container spacing={2} rowSpacing={1.75}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Payment code
                          </Typography>
                          <TextField
                            variant="standard"
                            value={paymentCode}
                            disabled={!canEditPayment}
                            onChange={(e) => setPaymentCode(e.target.value)}
                            fullWidth
                            size="small"
                          />
                          {!canEditPayment && (
                            <Typography variant="caption" color="text.secondary">
                              Edit permission required
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Initial payment date
                          </Typography>
                          <TextField
                            variant="standard"
                            type="date"
                            value={initialPaymentDate}
                            disabled={!canEditPayment}
                            onChange={(e) => setInitialPaymentDate(e.target.value)}
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Wedding date
                          </Typography>
                          <TextField
                            type="date"
                            value={formatDate(values.ReservationDate)}
                            disabled
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Event type
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Field as={Select} name="ReservationFunctionType" value={values.ReservationFunctionType ?? ""}>
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
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Name of bride
                          </Typography>
                          <Field as={TextField} name="CustomerName" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Name of groom
                          </Typography>
                          <Field as={TextField} name="GroomName" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            NIC / passport
                          </Typography>
                          <Field as={TextField} name="NIC" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Contact no.
                          </Typography>
                          <Field as={TextField} name="MobileNo" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Emergency contact
                          </Typography>
                          <Field as={TextField} name="EmergencyContactNo" type="number" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Wedding venue
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.WeddingVenue" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Dressing venue
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.DressingVenue" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Preferred time
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Field as={Select} name="PreferedTime" value={values.PreferedTime || ""}>
                              <MenuItem value={1}>Morning</MenuItem>
                              <MenuItem value={2}>Evening</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Bridal type
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Field as={Select} name="BridalType" value={values.BridalType || ""}>
                              <MenuItem value={1}>Kandyan</MenuItem>
                              <MenuItem value={2}>Indian</MenuItem>
                              <MenuItem value={3}>Western</MenuItem>
                              <MenuItem value={4}>Hindu</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Location
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Field as={Select} name="Location" value={values.Location || ""}>
                              <MenuItem value={1}>Studio</MenuItem>
                              <MenuItem value={2}>Away</MenuItem>
                              <MenuItem value={3}>Overseas</MenuItem>
                            </Field>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Address line 1
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.AddressLine1" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Address line 2
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.AddressLine2" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Address line 3
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.AddressLine3" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Wedding day contact
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.WeddingDayContactPerson" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Wedding day contact no.
                          </Typography>
                          <Field
                            as={TextField}
                            name="ReservationDetails.WeddingDayContactPersonNo"
                            type="number"
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormGroup row>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isGoingAway}
                                  onChange={(e) => setIsGoingAway(e.target.checked)}
                                />
                              }
                              label="Going away"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isHomeComing}
                                  onChange={(e) => setIsHomeComing(e.target.checked)}
                                />
                              }
                              label="Home coming"
                            />
                          </FormGroup>
                        </Grid>
                        {isHomeComing ? (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming date
                              </Typography>
                              <Field
                                as={TextField}
                                type="date"
                                name="ReservationDetails.HomeComingDate"
                                value={formatDate(values.ReservationDetails.HomeComingDate)}
                                fullWidth
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                onChange={(e) => setFieldValue("ReservationDetails.HomeComingDate", e.target.value)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming venue
                              </Typography>
                              <Field as={TextField} name="ReservationDetails.HomeComingVenue" fullWidth size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming outfit
                              </Typography>
                              <Field as={TextField} name="ReservationDetails.HomeComingOutfit" fullWidth size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming outfit by
                              </Typography>
                              <Field as={TextField} name="ReservationDetails.HomeComingOutfitBy" fullWidth size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming preferred time
                              </Typography>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={homeComingPreferedTimeValue}
                                  onChange={(e) => {
                                    setFieldValue("HomeComingPreferredTime", e.target.value);
                                    setHomeComingPreferedTimeValue(e.target.value);
                                  }}
                                >
                                  <MenuItem value={1}>Morning</MenuItem>
                                  <MenuItem value={2}>Evening</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming bridal type
                              </Typography>
                              <FormControl fullWidth size="small">
                                <Select
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
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Home coming dressing location
                              </Typography>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={homeComingLocationValue}
                                  onChange={(e) => {
                                    setFieldValue("HomeComingLocation", e.target.value);
                                    setHomeComingLocationValue(e.target.value);
                                  }}
                                >
                                  <MenuItem value={1}>Studio</MenuItem>
                                  <MenuItem value={2}>Away</MenuItem>
                                  <MenuItem value={3}>Overseas</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </>
                        ) : null}
                        {isGoingAway ? (
                          <>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Going away dressing venue
                              </Typography>
                              <Field as={TextField} name="ReservationDetails.GoingAwayDressingVenue" fullWidth size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Going away outfit
                              </Typography>
                              <Field as={TextField} name="ReservationDetails.GoingAwayOutfit" fullWidth size="small" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                                Going away outfit by
                              </Typography>
                              <Field as={TextField} name="ReservationDetails.GoingAwayOutfitBy" fullWidth size="small" />
                            </Grid>
                          </>
                        ) : null}
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Remark
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.Remark" fullWidth size="small" multiline minRows={2} />
                        </Grid>
                      </Grid>
                    </TabPanel>
                    <TabPanel value={value} index={1} dir={theme.direction}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                        Outfit, accessories &amp; retinue
                      </Typography>
                      <Grid container spacing={2} rowSpacing={1.75}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Groom&apos;s outfit
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.GroomsOutfit" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Groom&apos;s outfit by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.GroomsOutfitBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Wed outfit by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.WedOutfitBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            F/G outfit
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.FGOutfit" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            F/G outfit by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.FGOutfitBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Maids outfit by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.MaidsOutfitBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            G/A outfit by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.GAOutfitBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            H/C outfit by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.HCOutfitBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Bouquets by
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.BouquetsBy" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Photographer
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.Photographer" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ mt: 0.5, mb: 0 }}>
                            Retinue
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Maids
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.Maids" type="number" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Flower girls
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.FlowerGirls" type="number" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Little maids
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.LittleMaids" type="number" fullWidth size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            Pupil maids
                          </Typography>
                          <Field as={TextField} name="ReservationDetails.PupilMaids" fullWidth size="small" />
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
                <Box
                  sx={{
                    mt: "auto",
                    pt: 2,
                    flexShrink: 0,
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                  display="flex"
                  justifyContent="space-between"
                >
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
              );
            }}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
