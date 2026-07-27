import React, { useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
} from "@mui/material";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
import Grid from "@mui/material/Grid";
import { Field, FieldArray, Form, Formik } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import {
  getNicBirthYearErrorMessage,
  getDateOfBirthYearErrorMessage,
  normalizeNicInput,
} from "@/components/utils/nicBirthYearValidation";
import { isValidContactPhone } from "@/components/utils/contactPhoneValidation";

const getValidationSchema = (
  isCustomerNICRequired,
  isCustomerCreditLimitRequired,
  birthdateForValidation = "",
  isSimpleCustomerForm = false
) => {
  const creditLimitSchema = isSimpleCustomerForm
    ? Yup.number().nullable()
    : isCustomerCreditLimitRequired
      ? Yup.number()
          .required("Credit Limit is required")
          .moreThan(0, "Credit Limit must be greater than 0")
      : Yup.number().min(0, "Credit Limit must be a positive number").nullable();

  const nicSchema = isSimpleCustomerForm
    ? Yup.string()
    : Yup.string()
        .test("nic-format", function (value) {
          const digits = String(value ?? "").replace(/\D/g, "");
          if (digits.length === 0) {
            if (isCustomerNICRequired) {
              return this.createError({ message: "NIC is required" });
            }
            return true;
          }
          if (!/^\d{9}(\d{3})?$/.test(digits)) {
            return this.createError({ message: "Invalid NIC" });
          }
          return true;
        })
        .test("nic-birth-year", function (value) {
          const digits = String(value ?? "").replace(/\D/g, "");
          if (digits.length === 0 || !/^\d{9}(\d{3})?$/.test(digits)) {
            return true;
          }
          const msg = getNicBirthYearErrorMessage(digits);
          if (msg) return this.createError({ message: msg });
          return true;
        });

  const dateOfBirthSchema = isSimpleCustomerForm
    ? Yup.mixed().nullable()
    : Yup.mixed()
        .nullable()
        .test("dob-year-plausible", function () {
          const raw =
            (birthdateForValidation && String(birthdateForValidation).trim()) ||
            (this.parent.DateOfBirth && String(this.parent.DateOfBirth).trim()) ||
            "";
          if (!raw) return true;
          const msg = getDateOfBirthYearErrorMessage(raw);
          if (msg) return this.createError({ message: msg });
          return true;
        });

  return Yup.object().shape({
  Title: Yup.string().required("Title is required"),
  FirstName: Yup.string().required("First Name is required").max(200, "First Name must be 200 characters or less"),
  LastName: Yup.string().max(200, "Last Name must be 200 characters or less"),
  DisplayName: Yup.string().max(100, "Display Name must be 100 characters or less"),
  AddressLine1: Yup.string().required("Address Line 1 is required").max(250, "Address Line 1 must be 250 characters or less"),
  AddressLine2: Yup.string().max(250, "Address Line 2 must be 250 characters or less"),
  AddressLine3: Yup.string().max(250, "Address Line 3 must be 250 characters or less"),
  Designation: Yup.string(),
  Company: Yup.string(),
  CreditLimit: creditLimitSchema,
  NIC: nicSchema,
  DateOfBirth: dateOfBirthSchema,
  CustomerContactDetails: Yup.array().of(
    Yup.object().shape({
      ContactName: Yup.string().required("Contact Name is required"),
      EmailAddress: Yup.string().email("Invalid email address"),
      ContactNo: Yup.string().test(
        "contact-phone",
        "Invalid contact number",
        (value) => isValidContactPhone(value)
      ),

    })
  ),
});
};

export default function AddCustomerDialog({ fetchItems, chartOfAccounts, externalOpen, onClose: externalOnClose, showButton = true }) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  
  // Use external open state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const [titleList, setTitleList] = useState([]);
  const [currencyList, setCurrencyList] = useState([]);
  const { data: isCustomerNICRequired } = IsAppSettingEnabled("IsCustomerNICRequired");
  const { data: isCustomerCreditLimit } = IsAppSettingEnabled("IsCustomerCreditLimit");
  const { data: isSimpleCustomerForm } = IsAppSettingEnabled("IsSimpleCustomerFormEnable");
  const [birthdate, setBirthdate] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [distributorList, setDistributorList] = useState([]);

  const customerValidationSchema = useMemo(
    () =>
      getValidationSchema(
        isCustomerNICRequired,
        isCustomerCreditLimit,
        birthdate,
        isSimpleCustomerForm
      ),
    [isCustomerNICRequired, isCustomerCreditLimit, birthdate, isSimpleCustomerForm]
  );

  const fetchTitleList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Customer/GetAllPersonTitle`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Customer List");
      }

      const data = await response.json();
      setTitleList(data.result);
    } catch (error) {
      console.error("Error fetching Customer List:", error);
    }
  };

  const fetchCurrencyList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Currency/GetAllCurrency?SkipCount=0&MaxResultCount=1000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Currency List");
      }

      const data = await response.json();
      // Extract currencies from paginated response
      let currencies = [];
      if (data.result && data.result.items) {
        currencies = data.result.items;
      } else if (Array.isArray(data.result)) {
        currencies = data.result;
      }
      
      // Filter only active currencies
      setCurrencyList(currencies.filter(currency => currency.isActive !== false));
    } catch (error) {
      console.error("Error fetching Currency List:", error);
    }
  };

  const fetchDistributorList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Distributor/GetAllDistributors?MaxResultCount=1000`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Distributor List");
      }

      const data = await response.json();
      let distributors = [];
      if (data.result && data.result.items) {
        distributors = data.result.items;
      } else if (Array.isArray(data.result)) {
        distributors = data.result;
      }
      setDistributorList(distributors);
    } catch (error) {
      console.error("Error fetching Distributor List:", error);
    }
  };


  const handleClickOpen = (scrollType) => () => {
    if (externalOpen === undefined) {
      setInternalOpen(true);
    }
    setScroll(scrollType);
    fetchTitleList();
    fetchCurrencyList();
    fetchDistributorList();
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else if (externalOpen === undefined) {
      setInternalOpen(false);
    }
    setBirthdate("");
    // Increment form key to reset Formik form (including contact rows)
    setFormKey(prev => prev + 1);
  };
  
  // Fetch data when externally opened
  React.useEffect(() => {
    if (open && externalOpen !== undefined) {
      fetchTitleList();
      fetchCurrencyList();
      fetchDistributorList();
    }
  }, [open, externalOpen]);

  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  const handleSubmit = (values) => {
    if (isSimpleCustomerForm) {
      values.NIC = "";
      values.DateOfBirth = null;
      values.Designation = "";
      values.Company = "";
      values.CreditLimit = 0;
      values.ReceivableAccount = null;
      values.CurrencyId = null;
      values.DistributorIds = [];
    } else {
      values.NIC = normalizeNicInput(values.NIC || "");
      values.DateOfBirth = birthdate || null;
    }
    values.LastName = values.LastName ? values.LastName : "-";
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Customer/CreateCustomer`, {
      method: "POST",
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          handleClose();
          if (fetchItems) {
            const newCustomer = data.result || data.data || { 
              id: data.id,
              firstName: values.FirstName,
              lastName: values.LastName,
              displayName: values.DisplayName || `${values.FirstName} ${values.LastName}`.trim(),
              company: values.Company,
            };
            // External modal usage (e.g. help-desk) needs created customer details.
            // Internal usage (master customer list) only needs a list refresh.
            if (externalOpen !== undefined) {
              fetchItems(newCustomer);
            } else {
              fetchItems();
            }
          }
        } else {
          let msg = data.message || "Customer creation failed.";
          if (/inner exception|saving the entity changes/i.test(msg)) {
            msg =
              "Save failed: date of birth is not always inferred from the NIC. Enter the correct date of birth manually, verify the NIC, and try again.";
          }
          toast.error(msg);
        }
      })
      .catch((error) => {
        toast.error(
          error.message || "Customer Creation failed. Please try again."
        );
      });
  };
  const calculateBirthdateFromNIC = (value, setFieldValue) => {
    const norm = normalizeNicInput(String(value ?? ""));
    const digits = norm.replace(/\D/g, "");

    if (!norm || digits.length === 0) {
      setBirthdate("");
      if (setFieldValue) setFieldValue("DateOfBirth", "");
      return;
    }

    if (digits.length !== 9 && digits.length !== 12) {
      return;
    }

    let year, number;
    if (digits.length === 9) {
      year = parseInt(digits.slice(0, 2), 10);
      number = parseInt(digits.slice(2, 5), 10);
      let currentYear = new Date().getFullYear();
      let prefix = Math.floor(currentYear / 100) * 100;
      let threshold = 50;

      if (year <= threshold) {
        year = prefix + year;
      } else {
        year = prefix - 100 + year;
      }
    } else {
      year = parseInt(digits.slice(0, 4), 10);
      number = parseInt(digits.slice(4, 7), 10);
    }

    if (getNicBirthYearErrorMessage(norm)) {
      setBirthdate("");
      if (setFieldValue) setFieldValue("DateOfBirth", "");
      return;
    }

    if (number > 500) {
      number -= 500;
      if (!isLeapYear(year)) {
        number -= 1;
      }
    } else {
      if (number > 59) {
        if (!isLeapYear(year)) {
          number -= 1;
        }
      }
    }

    const date = new Date(year, 0);
    date.setDate(number);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    setBirthdate(formattedDate);
    if (setFieldValue) setFieldValue("DateOfBirth", formattedDate);
    return formattedDate;
  };

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };
  const handleChange = (event, setFieldValue) => {
    const v = event.target.value;
    setBirthdate(v);
    if (setFieldValue) setFieldValue("DateOfBirth", v);
  };

  return (
    <>
      {showButton && (
        <Button variant="outlined" onClick={handleClickOpen("paper")}>
          <AddIcon
            sx={{
              position: "relative",
              top: "-2px",
            }}
            className="mr-5px"
          />{" "}
          Create New Customer
        </Button>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        maxWidth="md"
      >
        <div className="bg-black">
          <DialogTitle id="scroll-dialog-title">Create Customer</DialogTitle>
          <DialogContent>
            <Formik
              key={formKey}
              initialValues={{
                Title: "",
                FirstName: "",
                LastName: "",
                DisplayName: "",
                AddressLine1: "",
                AddressLine2: "",
                AddressLine3: "",
                Designation: "",
                Company: "",
                NIC: "",
                DateOfBirth: "",
                ReceivableAccount: null,
                CurrencyId: null,
                CreditLimit: 0,
                IsManufacture: false,
                DistributorIds: [],
                CustomerContactDetails: [
                  { ContactName: "", ContactNo: "", EmailAddress: "" },
                ],
              }}
              validationSchema={customerValidationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ errors, touched, values, setFieldValue, validateField }) => (
                <Form>
                  <Grid container>
                    <Grid item xs={12}>
                      <Box sx={{ height: '60vh', overflowY: 'scroll' }} mb={2}>
                        <Grid container spacing={1}>
                          <Grid item lg={2} xs={12}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              Title
                            </Typography>
                            <FormControl fullWidth>
                              <InputLabel id="demo-simple-select-label">
                                Title
                              </InputLabel>
                              <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                label="Title"
                                name="Title"
                                value={values.Title}
                                onChange={(e) =>
                                  setFieldValue("Title", e.target.value)
                                }
                              >
                                {titleList.map((title, index) => (
                                  <MenuItem key={index} value={title.title}>
                                    {title.title}
                                  </MenuItem>
                                ))}
                              </Select>
                              {errors.Title && touched.Title && (
                                <Typography variant="body2" color="error">
                                  {errors.Title}
                                </Typography>
                              )}
                            </FormControl>
                          </Grid>
                          <Grid item lg={5} xs={6}>
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
                          <Grid item lg={5} xs={6}>
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
                          <Grid item xs={12} lg={6}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              Display Name
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="DisplayName"
                            />
                          </Grid>
                          <Grid item xs={12} lg={6}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              Address Line 01
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="AddressLine1"
                              error={
                                touched.AddressLine1 && Boolean(errors.AddressLine1)
                              }
                              helperText={touched.AddressLine1 && errors.AddressLine1}
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
                              Address Line 02
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="AddressLine2"
                              error={
                                touched.AddressLine2 && Boolean(errors.AddressLine2)
                              }
                              helperText={touched.AddressLine2 && errors.AddressLine2}
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
                              Address Line 03
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="AddressLine3"
                              error={
                                touched.AddressLine3 && Boolean(errors.AddressLine3)
                              }
                              helperText={touched.AddressLine3 && errors.AddressLine3}
                            />
                          </Grid>
                          {!isSimpleCustomerForm && (
                          <Grid lg={6} item xs={12}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              NIC
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="NIC"
                              error={touched.NIC && Boolean(errors.NIC)}
                              helperText={touched.NIC && errors.NIC}
                              onChange={async (e) => {
                                const nicValue = normalizeNicInput(
                                  e.target.value ?? ""
                                );
                                await setFieldValue("NIC", nicValue, true);
                                calculateBirthdateFromNIC(
                                  nicValue,
                                  setFieldValue
                                );
                                await Promise.resolve();
                                await validateField("NIC");
                                await validateField("DateOfBirth");
                              }}
                            />
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
                          <Grid lg={6} item xs={12}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              Date Of Birth
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              type="date"
                              name="DateOfBirth"
                              error={
                                touched.DateOfBirth && Boolean(errors.DateOfBirth)
                              }
                              helperText={touched.DateOfBirth && errors.DateOfBirth}
                              value={birthdate}
                              onChange={(e) => handleChange(e, setFieldValue)}
                            />
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
                          <Grid lg={6} item xs={12}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              Receivable Account
                            </Typography>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                select
                                fullWidth
                                name="ReceivableAccount"
                                onChange={(e) => {
                                  setFieldValue("ReceivableAccount", e.target.value);
                                }}
                              >
                                {chartOfAccounts.length === 0 ? (
                                  <MenuItem disabled>
                                    No Accounts Available
                                  </MenuItem>
                                ) : (
                                  chartOfAccounts.map((acc, index) => (
                                    <MenuItem key={index} value={acc.id}>
                                      {acc.code} - {acc.description}
                                    </MenuItem>
                                  ))
                                )}
                              </Field>
                            </FormControl>
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
                          <Grid lg={6} item xs={12}>
                            <Typography
                              component="label"
                              sx={{
                                fontWeight: "500",
                                fontSize: "14px",
                                mb: "10px",
                                display: "block",
                              }}
                            >
                              Select Currency
                            </Typography>
                            <FormControl fullWidth>
                              <Field
                                as={TextField}
                                select
                                fullWidth
                                name="CurrencyId"
                                onChange={(e) => {
                                  setFieldValue("CurrencyId", e.target.value);
                                }}
                              >
                                {currencyList.length === 0 ? (
                                  <MenuItem disabled>
                                    No Currencies Available
                                  </MenuItem>
                                ) : (
                                  currencyList.map((currency, index) => (
                                    <MenuItem key={index} value={currency.id}>
                                      {currency.code} - {currency.name}
                                    </MenuItem>
                                  ))
                                )}
                              </Field>
                            </FormControl>
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
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
                              Designation
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="Designation"
                              error={
                                touched.Designation && Boolean(errors.Designation)
                              }
                              helperText={touched.Designation && errors.Designation}
                            />
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
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
                              Credit Limit {isCustomerCreditLimit && <span style={{ color: "red" }}>*</span>}
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="CreditLimit"
                              type="number"
                              inputProps={{ min: 0, step: "0.01" }}
                              error={
                                touched.CreditLimit && Boolean(errors.CreditLimit)
                              }
                              helperText={touched.CreditLimit && errors.CreditLimit}
                            />
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
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
                              Organization
                            </Typography>
                            <Field
                              as={TextField}
                              fullWidth
                              name="Company"
                              error={touched.Company && Boolean(errors.Company)}
                              helperText={touched.Company && errors.Company}
                            />
                          </Grid>
                          )}
                          {!isSimpleCustomerForm && (
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
                              Distributors
                            </Typography>
                            <FormControl fullWidth>
                              <InputLabel id="distributors-label">Select Distributors</InputLabel>
                              <Select
                                labelId="distributors-label"
                                multiple
                                value={values.DistributorIds || []}
                                onChange={(e) => setFieldValue("DistributorIds", e.target.value)}
                                label="Select Distributors"
                                renderValue={(selected) => (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                      const distributor = distributorList.find(d => d.id === value);
                                      return <Chip key={value} label={distributor ? distributor.name : value} size="small" />;
                                    })}
                                  </Box>
                                )}
                              >
                                {distributorList.map((distributor) => (
                                  <MenuItem key={distributor.id} value={distributor.id}>
                                    {distributor.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          )}
                          <FieldArray name="CustomerContactDetails">
                            {(arrayHelpers) => (
                              <>
                          {values.CustomerContactDetails.map((contact, index) => (
                            <React.Fragment key={index}>
                              <Grid item xs={12} md={6} lg={4}>
                                <Typography
                                  component="label"
                                  sx={{
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    mb: "10px",
                                    display: "block",
                                  }}
                                >
                                  Contact Name
                                </Typography>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  name={`CustomerContactDetails.${index}.ContactName`}
                                  error={
                                    touched.CustomerContactDetails?.[index]
                                      ?.ContactName &&
                                    Boolean(
                                      errors.CustomerContactDetails?.[index]
                                        ?.ContactName
                                    )
                                  }
                                  helperText={
                                    touched.CustomerContactDetails?.[index]
                                      ?.ContactName &&
                                    errors.CustomerContactDetails?.[index]
                                      ?.ContactName
                                  }
                                />
                              </Grid>
                              <Grid item xs={12} md={6} lg={4}>
                                <Typography
                                  component="label"
                                  sx={{
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    mb: "10px",
                                    display: "block",
                                  }}
                                >
                                  Contact No
                                </Typography>
                                <Field
                                  as={TextField}
                                  fullWidth
                                  name={`CustomerContactDetails.${index}.ContactNo`}

                                  error={
                                    touched.CustomerContactDetails?.[index]
                                      ?.ContactNo &&
                                    Boolean(
                                      errors.CustomerContactDetails?.[index]
                                        ?.ContactNo
                                    )
                                  }
                                  helperText={
                                    touched.CustomerContactDetails?.[index]
                                      ?.ContactNo &&
                                    errors.CustomerContactDetails?.[index]?.ContactNo
                                  }
                                />
                              </Grid>
                              <Grid item xs={12} md={6} lg={4}>
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
                                  name={`CustomerContactDetails.${index}.EmailAddress`}
                                  error={
                                    touched.CustomerContactDetails?.[index]
                                      ?.EmailAddress &&
                                    Boolean(
                                      errors.CustomerContactDetails?.[index]
                                        ?.EmailAddress
                                    )
                                  }
                                  helperText={
                                    touched.CustomerContactDetails?.[index]
                                      ?.EmailAddress &&
                                    errors.CustomerContactDetails?.[index]
                                      ?.EmailAddress
                                  }
                                />
                              </Grid>
                            </React.Fragment>
                          ))}
                          <Grid
                            item
                            display="flex"
                            justifyContent="space-between"
                            xs={12}
                          >
                            <Button
                              type="button"
                              onClick={() =>
                                arrayHelpers.push({
                                  ContactName: "",
                                  ContactNo: "",
                                  EmailAddress: "",
                                })
                              }
                            >
                              + add new
                            </Button>
                            {values.CustomerContactDetails.length > 1 && (
                              <Button
                                type="button"
                                color="error"
                                onClick={() =>
                                  arrayHelpers.remove(
                                    values.CustomerContactDetails.length - 1
                                  )
                                }
                              >
                                - Remove
                              </Button>
                            )}
                          </Grid>
                              </>
                            )}
                          </FieldArray>
                        </Grid>
                      </Box>
                    </Grid>

                    <Grid item xs={12} display="flex" justifyContent="space-between">
                      <Button
                        type="button"
                        color="error"
                        variant="contained"
                        onClick={handleClose}  // <-- This is what was missing
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                      >
                        Create Customer
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}
