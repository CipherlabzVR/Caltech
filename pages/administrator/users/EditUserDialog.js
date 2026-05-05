import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Modal from "@mui/material/Modal";
import AddIcon from "@mui/icons-material/Add";
import Grid from "@mui/material/Grid";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import logoutUser from "@/components/utils/logoutUser";
import { getDeviceId, resolveDeviceDisplayId } from "@/components/utils/getDeviceId";

const validationSchema = Yup.object().shape({
  FirstName: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, "First Name must contain only letters")
    .required("First Name is required"),
  LastName: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, "Last Name must contain only letters")
    .required("Last Name is required"),
  Email: Yup.string().email("Invalid email").required("Email is required"),
  Address: Yup.string().required("Address is required"),
  MobileNumber: Yup.string()
    .matches(/^[0-9]{10}$/, "Mobile Number must be a 10-digit number")
    .required("Mobile Number is required"),
  WarehouseId: Yup.string().required("Warehouse is required"),
  UserRole: Yup.string().required("User Role is required"),
  SalesPersonId: Yup.number().when("UserType", {
    is: 24,
    then: (schema) => schema.required("Sales Person is required."),
    otherwise: (schema) => schema.nullable(),
  }),
});

const confirmModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  maxWidth: "90vw",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 1,
};

export default function EditUserDialog({ item, fetchItems, warehouses, roles }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  const [userTypes, setUserTypes] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [removingDeviceId, setRemovingDeviceId] = useState(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setActiveTab(0);
    fetchUserTypes();
    fetchSalesPersons();
    fetchLoggedInDevices();
    setScroll(scrollType);
  };

  const fetchUserTypes = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/User/GetAllUserTypes`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setUserTypes(data);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const fetchSalesPersons = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/SalesPerson/GetAllSalesPersonCRM`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      if (data.statusCode === 200 && data.result) {
        setSalesPersons(data.result);
      }
    } catch (error) {
      console.error("Error fetching sales persons:", error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setActiveTab(0);
    setConfirmRemoveOpen(false);
    setSelectedDevice(null);
  };

  const parseResponseBody = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(responseText);
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        return null;
      }
    }

    return null;
  };

  const buildErrorMessage = (response, data, fallbackMessage) => {
    if (data?.message) {
      return data.message;
    }

    if (response.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (response.status === 403) {
      return "You do not have permission to perform this action.";
    }

    return fallbackMessage;
  };

  const fetchLoggedInDevices = async () => {
    try {
      setLoadingDevices(true);
      const response = await fetch(
        `${BASE_URL}/User/GetLoggedInDevicesByUserId?userId=${item.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await parseResponseBody(response);

      if (!response.ok || data?.statusCode !== 200) {
        throw new Error(
          buildErrorMessage(response, data, "Failed to fetch devices")
        );
      }

      setDevices(data.result || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch devices");
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleConfirmRemoveOpen = (device) => {
    setSelectedDevice(device);
    setConfirmRemoveOpen(true);
  };

  const handleConfirmRemoveClose = () => {
    if (removingDeviceId) {
      return;
    }

    setConfirmRemoveOpen(false);
    setSelectedDevice(null);
  };

  const handleRemoveDevice = async () => {
    if (!selectedDevice) {
      return;
    }

    try {
      setRemovingDeviceId(selectedDevice.id);
      const removeDeviceUrl = `${BASE_URL}/User/RemoveLoggedInDeviceByUserId?userId=${item.id}&deviceId=${selectedDevice.id}`;
      const requestHeaders = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(removeDeviceUrl, {
        method: "POST",
        headers: requestHeaders,
      });

      const data = await parseResponseBody(response);

      if (!response.ok || data?.statusCode !== 200) {
        throw new Error(
          buildErrorMessage(response, data, "Failed to remove device")
        );
      }

      toast.success(data?.message || "Device removed successfully");

      if (selectedDevice?.isCurrentDevice) {
        toast.info("Current device removed. Signing out...");
        await logoutUser({ router });
        return;
      }

      setConfirmRemoveOpen(false);
      setSelectedDevice(null);
      fetchLoggedInDevices();
    } catch (error) {
      toast.error(error.message || "Failed to remove device");
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString();
  };
  
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verificationLink = `${baseUrl}/userverified`;

  const handleSubmit = (values) => {
    fetch(`${BASE_URL}/User/UpdateUser`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          setOpen(false);
          fetchItems();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "Sign up failed. Please try again.");
      });
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleClickOpen("paper")} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Update User</DialogTitle>
        <DialogContent sx={{ minWidth: { xs: 320, sm: 600 } }}>
          <Formik
            initialValues={{
              Id: item.id,
              FirstName: item.firstName || "",
              LastName: item.lastName || "",
              Email: item.userName || "",
              Address: item.address || "",
              MobileNumber: item.phoneNumber || "",
              UserType: item.userType || null,
              UserRole: item.userRole || null,
              IsAgeVerified: 1,
              EmailConfirmed: 0,
              WarehouseId: item.warehouseId || "",
              SalesPersonId: item.salesPersonId || null,
              VerifyLink: verificationLink
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values }) => (
              <Form>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  variant="fullWidth"
                  sx={{ mb: 2 }}
                >
                  <Tab label="Details" />
                  <Tab label={`Logged In Devices (${devices.length})`} />
                </Tabs>

                {activeTab === 0 ? (
                <Grid container spacing={2}>
                  <Grid item lg={6} xs={12}>
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                      }}
                    >
                      First Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="FirstName"
                      error={touched.FirstName && Boolean(errors.FirstName)}
                      helperText={touched.FirstName && errors.FirstName}
                    />
                  </Grid>
                  <Grid item lg={6} xs={12}>
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                      }}
                    >
                      Last Name
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="LastName"
                      error={touched.LastName && Boolean(errors.LastName)}
                      helperText={touched.LastName && errors.LastName}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                      }}
                    >
                      Email
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Email"
                      error={touched.Email && Boolean(errors.Email)}
                      helperText={touched.Email && errors.Email}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                      }}
                    >
                      Address
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Address"
                      error={touched.Address && Boolean(errors.Address)}
                      helperText={touched.Address && errors.Address}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                      }}
                    >
                      Mobile Number
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="MobileNumber"
                      error={
                        touched.MobileNumber && Boolean(errors.MobileNumber)
                      }
                      helperText={touched.MobileNumber && errors.MobileNumber}
                    />
                  </Grid>
                  <Grid item xs={12} mt={1}>
                    <Typography
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "5px",
                      }}
                    >
                      Warehouse
                    </Typography>
                    <FormControl fullWidth>
                      <Field as={TextField} select fullWidth name="WarehouseId">
                        {warehouses.length === 0 ? (
                          <MenuItem disabled>No Warehouses Available</MenuItem>
                        ) : (
                          warehouses.map((warehouse, index) => (
                            <MenuItem key={index} value={warehouse.id}>
                              {warehouse.code}-{warehouse.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.WarehouseId && Boolean(errors.WarehouseId) && (
                        <Typography variant="caption" color="error">
                          {errors.WarehouseId}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      component="label"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "10px",
                        display: "block",
                      }}
                    >
                      User Role
                    </Typography>
                    <FormControl fullWidth>
                      <Field as={TextField} select fullWidth name="UserRole">
                        {roles.length === 0 ? (
                          <MenuItem disabled>No Roles Available</MenuItem>
                        ) : (
                          roles.map((role, index) => (
                            <MenuItem key={index} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.UserRole && Boolean(errors.UserRole) && (
                        <Typography variant="caption" color="error">
                          {errors.UserRole}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      as="h5"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "12px",
                      }}
                    >
                      User Type
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">
                        User Type
                      </InputLabel>
                      <Field
                        as={Select}
                        labelId="category-select-label"
                        id="category-select"
                        name="UserType"
                        label="User Type"
                        value={values.UserType}
                        onChange={(e) => {
                          const newUserType = e.target.value;
                          setFieldValue("UserType", newUserType);
                          if (newUserType !== 24) {
                            setFieldValue("SalesPersonId", null);
                          }
                        }}
                      >
                        {userTypes.length === 0 ? (
                          <MenuItem disabled color="error">
                            No User Types Available
                          </MenuItem>
                        ) : (
                          userTypes.map((type, index) => (
                            <MenuItem
                              key={index}
                              value={type.id}
                            >
                              {type.name}
                            </MenuItem>
                          ))
                        )}
                      </Field>
                      {touched.UserType && Boolean(errors.UserType) && (
                        <Typography variant="caption" color="error">
                          {errors.UserType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  {values.UserType === 24 && (
                    <Grid item xs={12}>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                      >
                        Sales Person
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel id="sales-person-select-label">
                          Sales Person
                        </InputLabel>
                        <Field
                          as={Select}
                          labelId="sales-person-select-label"
                          id="sales-person-select"
                          name="SalesPersonId"
                          label="Sales Person"
                          value={values.SalesPersonId}
                          onChange={(e) =>
                            setFieldValue("SalesPersonId", e.target.value)
                          }
                        >
                          {salesPersons.length === 0 ? (
                            <MenuItem disabled color="error">
                              No Sales Persons Available
                            </MenuItem>
                          ) : (
                            salesPersons.map((person, index) => (
                              <MenuItem
                                key={index}
                                value={person.id}
                              >
                                {person.code} - {person.name}
                              </MenuItem>
                            ))
                          )}
                        </Field>
                        {touched.SalesPersonId && Boolean(errors.SalesPersonId) && (
                          <Typography variant="caption" color="error">
                            {errors.SalesPersonId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        textTransform: "capitalize",
                        borderRadius: "8px",
                        fontWeight: "500",
                        fontSize: "16px",
                        padding: "12px 10px",
                        color: "#fff !important",
                      }}
                    >
                      Update User
                    </Button>
                  </Grid>
                </Grid>
                ) : (
                  <Box sx={{ minHeight: 320 }}>
                    {loadingDevices ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          py: 4,
                        }}
                      >
                        <CircularProgress size={28} />
                      </Box>
                    ) : devices.length === 0 ? (
                      <Alert severity="info">No logged in devices found for this user.</Alert>
                    ) : (
                      devices.map((device) => (
                        <Box
                          key={device.id}
                          sx={{
                            border: "1px solid #E5E7EB",
                            borderRadius: "10px",
                            p: 2,
                            mb: 2,
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={8}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                                <Typography fontWeight="600">
                                  {device.deviceName || "Unknown Device"}
                                </Typography>
                                <Alert
                                  icon={false}
                                  severity={device.isCurrentDevice || device.isActive ? "success" : "info"}
                                  sx={{
                                    py: 0,
                                    px: 1,
                                    minHeight: "auto",
                                    alignItems: "center",
                                    "& .MuiAlert-message": {
                                      p: 0,
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                    },
                                  }}
                                >
                                  {device.isCurrentDevice ? "Current Device" : device.isActive ? "Active" : "Inactive"}
                                </Alert>
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ wordBreak: "break-all" }}
                              >
                                Device ID: {resolveDeviceDisplayId(device, getDeviceId())}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                First Logged In: {formatDate(device.createdOn)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Last Active: {formatDate(device.updatedOn || device.createdOn)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleConfirmRemoveOpen(device)}
                                  disabled={removingDeviceId === device.id}
                                  sx={{ textTransform: "capitalize" }}
                                >
                                  {removingDeviceId === device.id ? "Removing..." : "Remove Device"}
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      ))
                    )}
                  </Box>
                )}
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      <Modal
        open={confirmRemoveOpen}
        onClose={handleConfirmRemoveClose}
        aria-labelledby="remove-device-modal-title"
        aria-describedby="remove-device-modal-description"
      >
        <Box sx={confirmModalStyle}>
          <Typography
            id="remove-device-modal-title"
            sx={{ fontWeight: "500", fontSize: "16px", mb: 1.5 }}
          >
            Remove Logged In Device
          </Typography>
          <Typography
            id="remove-device-modal-description"
            sx={{ fontSize: "14px", color: "text.secondary" }}
          >
            Are you sure you want to remove
            {" "}
            <strong>{selectedDevice?.deviceName || "this device"}</strong>
            ?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleConfirmRemoveClose}
              disabled={Boolean(removingDeviceId)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleRemoveDevice}
              disabled={Boolean(removingDeviceId)}
              sx={{ color: "#fff !important" }}
            >
              {removingDeviceId ? "Removing..." : "Remove"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
