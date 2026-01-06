import React, { useEffect, useState } from "react";
import { Grid, Tabs, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import * as Yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextField from "@mui/material/TextField";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import BASE_URL from "Base/api";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/router";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
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
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function AddSizesToInquiry({ fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const [total, setTotal] = useState(0);
  const [twoXSValue, setTwoXSValue] = useState(0);
  const [xSValue, setXsValue] = useState(0);
  const [sValue, setSValue] = useState(0);
  const [mValue, setMValue] = useState(0);
  const [lValue, setLValue] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [xLValue, setXLValue] = useState(0);
  const [twoXLValue, setTwoXLValue] = useState(0);
  const [threeXLValue, setThreeXLValue] = useState(0);
  const [fourXLValue, setFourXLValue] = useState(0);
  const [fiveXLValue, setFiveXLValue] = useState(0);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [value, setValue] = React.useState(0);
  const [sizeList, setSizeList] = useState([]);
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const inqId = inquiryDetails.id;
  const inqCode = inquiryDetails.inqCode;
  const optionName = optionDetails.optionName;
  const OptId = optionDetails.id;
  const WinType = optionDetails.windowType;
  const router = useRouter();
  const inqType = router.query.inqType;

  const validationSchemaNormalSize = Yup.object().shape({
    TwoXS: Yup.number().typeError("Invalid"),
    XS: Yup.number().typeError("Invalid"),
    S: Yup.number().integer().typeError("Invalid"),
    M: Yup.number().typeError("Invalid"),
    L: Yup.number().typeError("Invalid"),
    XL: Yup.number().typeError("Invalid"),
    TwoXL: Yup.number().typeError("Invalid"),
    ThreeXL: Yup.number().typeError("Invalid"),
    FourXL: Yup.number().typeError("Invalid"),
    FiveXL: Yup.number().typeError("Invalid"),
    TotalQty: Yup.number().typeError("Invalid"),
    SizeName: Yup.string().required("Required"),
    Sleavetype: Yup.string(),
    // Sleavetype: Yup.string().test(
    //   "isRequired",
    //   "Sleavetype is required",
    //   function (value) {
    //     if (inqType === "1" || inqType === "2") {
    //       return !!value;
    //     }
    //     return true;
    //   }
    // ),
  });

  const validationSchemaSpecialSize = Yup.object().shape({
    SizeName: Yup.string().required("Required"),
    Width: Yup.number().typeError("Invalid"),
    Length: Yup.number().typeError("Invalid"),
    TotalQty: Yup.number().typeError("Invalid").required("Required"),
    Sleavetype: Yup.string(),
    // Sleavetype: Yup.string().test(
    //   "isRequired",
    //   "Sleavetype is required",
    //   function (value) {
    //     if (inqType === "1" || inqType === "2") {
    //       return !!value;
    //     }
    //     return true;
    //   }
    // ),
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFinalTotal(0);
    setTotal(0);
    setTwoXSValue(0);
    setXsValue(0);
    setSValue(0);
    setMValue(0);
    setLValue(0);
    setXLValue(0);
    setTwoXLValue(0);
    setThreeXLValue(0);
    setFourXLValue(0);
    setFiveXLValue(0);
    setLength(0);
    setWidth(0);
    setQuantity(0);
  };

  const fetchSizeList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Size/GetAllSize`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Size List");
      }

      const data = await response.json();
      setSizeList(data.result);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  useEffect(() => {
    fetchSizeList();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSubmitNormal = (values) => {
    const intValues = {
      ...values,
      TwoXS: parseInt(twoXSValue) || 0,
      XS: parseInt(xSValue) || 0,
      S: parseInt(sValue) || 0,
      M: parseInt(mValue) || 0,
      L: parseInt(lValue) || 0,
      XL: parseInt(xLValue) || 0,
      TwoXL: parseInt(twoXLValue) || 0,
      ThreeXL: parseInt(threeXLValue) || 0,
      FourXL: parseInt(fourXLValue) || 0,
      FiveXL: parseInt(fiveXLValue) || 0,
      TotalQty: parseInt(total) || 0,
      Length: parseInt(length) || 0,
      Width: parseInt(width) || 0,
    };
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Inquiry/CreateInquirySize`, {
      method: "POST",
      body: JSON.stringify(intValues),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
        toast.error(error.message || "Size Creation failed. Please try again.");
      });
  };

  const handleSubmitSpecial = (values) => {
    const intValues = {
      ...values,
      TwoXS: 0,
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      TwoXL: 0,
      ThreeXL: 0,
      FourXL: 0,
      FiveXL: 0,
      TotalQty: parseInt(quantity) || 0,
      SizeID: values.SizeID ? parseInt(values.SizeID) : null,
      Length: parseInt(length) || 0,
      Width: parseInt(width) || 0,
    };
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/Inquiry/CreateInquirySize`, {
      method: "POST",
      body: JSON.stringify(intValues),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
        toast.error(error.message || "Size Creation failed. Please try again.");
      });
  };

  const handleSizeChange = (event, setFieldValue) => {
    const selectedSizeId = event.target.value;
    const selectedSize = sizeList.find((size) => size.id === selectedSizeId);
    if (selectedSize) {
      setFieldValue("SizeName", selectedSize.name);
      setFieldValue("SizeID", selectedSize.id);
    }
  };

  const handleCalcTotal = (value, size) => {
    let newTwoXSValue = twoXSValue;
    let newXSValue = xSValue;
    let newSValue = sValue;
    let newMValue = mValue;
    let newLValue = lValue;
    let newXLValue = xLValue;
    let newTwoXLValue = twoXLValue;
    let newThreeXLValue = threeXLValue;
    let newFourXLValue = fourXLValue;
    let newFiveXLValue = fiveXLValue;
    let newLength = length;
    let newWidth = width;

    switch (size) {
      case 1:
        setTwoXSValue(value);
        newTwoXSValue = value;
        break;
      case 2:
        setXsValue(value);
        newXSValue = value;
        break;
      case 3:
        setSValue(value);
        newSValue = value;
        break;
      case 4:
        setMValue(value);
        newMValue = value;
        break;
      case 5:
        setLValue(value);
        newLValue = value;
        break;
      case 6:
        setXLValue(value);
        newXLValue = value;
        break;
      case 7:
        setTwoXLValue(value);
        newTwoXLValue = value;
        break;
      case 8:
        setThreeXLValue(value);
        newThreeXLValue = value;
        break;
      case 9:
        setFourXLValue(value);
        newFourXLValue = value;
        break;
      case 10:
        setFiveXLValue(value);
        newFiveXLValue = value;
        break;
      case 11:
        setTotal(value);
        return;
      case 12:
        setLength(value);
        newLength = value;
        break;
      case 13:
        setWidth(value);
        newWidth = value;
        break;
      default:
        break;
    }

    const sum =
      parseInt(newTwoXSValue) +
      parseInt(newXSValue) +
      parseInt(newSValue) +
      parseInt(newMValue) +
      parseInt(newLValue) +
      parseInt(newXLValue) +
      parseInt(newTwoXLValue) +
      parseInt(newThreeXLValue) +
      parseInt(newFourXLValue) +
      parseInt(newFiveXLValue) +
      parseInt(newLength) +
      parseInt(newWidth);

    setTotal(sum);
    setFinalTotal(sum);
  };

  const handleCalcQuantity = (value, size) => {
    let newLength = length;
    let newWidth = width;

    switch (size) {
      case 12:
        setLength(value);
        newLength = value;
        break;
      case 13:
        setWidth(value);
        newWidth = value;
        break;
      case 14:
        setQuantity(value);
        return;
      default:
        break;
    }

    const sum = parseInt(newLength) + parseInt(newWidth);

    setQuantity(sum);
    setFinalTotal(sum);
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + add size
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                <Tab label="Normal Size" {...a11yProps(0)} />
                {inqType == 1 ||
                inqType == 2 ||
                inqType == 7 ||
                inqType == 8 ? (
                  <Tab label="Special Size" {...a11yProps(1)} />
                ) : (
                  ""
                )}
              </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
              <Formik
                initialValues={{
                  SizeName: "",
                  SizeID: "",
                  Sleavetype: "",
                  TwoXS: "",
                  XS: "",
                  S: "",
                  M: "",
                  L: "",
                  TwoXL: "",
                  ThreeXL: "",
                  FourXL: "",
                  FiveXL: "",
                  TotalQty: "",
                  InquiryID: inqId,
                  InqCode: inqCode,
                  WindowType: WinType,
                  OptionId: OptId,
                  InqOptionName: optionName,
                  IsSpecialSize: false,
                  Width: "",
                  Length: "",
                }}
                validationSchema={validationSchemaNormalSize}
                onSubmit={handleSubmitNormal}
              >
                {({ errors, touched, setFieldValue, values }) => (
                  <Form>
                    <Grid mt={2} container spacing={2}>
                      {/* <Grid
                        p={inqType == 1 || inqType == 2 ? "" : 1}
                        item
                        lg={inqType == 1 || inqType == 2 ? 6 : 12}
                        xs={12}
                      > */}
                      <Grid item xs={12} p={1}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "12px",
                          }}
                        >
                          Size Name
                        </Typography>
                        <FormControl fullWidth size="small">
                          <InputLabel id="sizeNameLabel">Size Name</InputLabel>
                          <Select
                            labelId="sizeNameLabel"
                            id="sizeNameSelect"
                            name="SizeName"
                            label="Size Name"
                            value={values.SizeID}
                            onChange={(event) =>
                              handleSizeChange(event, setFieldValue)
                            }
                            error={touched.SizeName && Boolean(errors.SizeName)}
                            helperText={touched.SizeName && errors.SizeName}
                          >
                            {sizeList.map((size) => (
                              <MenuItem key={size.id} value={size.id}>
                                {size.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="TwoXS"
                            label="2XS"
                            value={twoXSValue}
                            size="small"
                            error={touched.TwoXS && Boolean(errors.TwoXS)}
                            helperText={touched.TwoXS && errors.TwoXS}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 1);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="XS"
                            label="XS"
                            value={xSValue}
                            size="small"
                            error={touched.XS && Boolean(errors.XS)}
                            helperText={touched.XS && errors.XS}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 2);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="S"
                            label="S"
                            value={sValue}
                            size="small"
                            error={touched.S && Boolean(errors.S)}
                            helperText={touched.S && errors.S}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 3);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="M"
                            label="M"
                            value={mValue}
                            size="small"
                            error={touched.M && Boolean(errors.M)}
                            helperText={touched.M && errors.M}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 4);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="L"
                            label="L"
                            size="small"
                            value={lValue}
                            error={touched.L && Boolean(errors.L)}
                            helperText={touched.L && errors.L}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 5);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="XL"
                            label="XL"
                            size="small"
                            value={xLValue}
                            error={touched.XL && Boolean(errors.XL)}
                            helperText={touched.XL && errors.XL}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 6);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="TwoXL"
                            label="2XL"
                            size="small"
                            value={twoXLValue}
                            error={touched.TwoXL && Boolean(errors.TwoXL)}
                            helperText={touched.TwoXL && errors.TwoXL}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 7);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="ThreeXL"
                            label="3XL"
                            size="small"
                            value={threeXLValue}
                            error={touched.ThreeXL && Boolean(errors.ThreeXL)}
                            helperText={touched.ThreeXL && errors.ThreeXL}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 8);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="FourXL"
                            label="4XL"
                            size="small"
                            value={fourXLValue}
                            error={touched.FourXL && Boolean(errors.FourXL)}
                            helperText={touched.FourXL && errors.FourXL}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 9);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                      inqType == 2 ||
                      inqType == 6 ||
                      inqType == 7 ||
                      inqType == 8 ? (
                        <Grid item lg={inqType == 6 ? 12 : 4} p={1} xs={6}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="FiveXL"
                            label={inqType == 6 ? "Side Width" : "5XL"}
                            size="small"
                            value={fiveXLValue}
                            error={touched.FiveXL && Boolean(errors.FiveXL)}
                            helperText={touched.FiveXL && errors.FiveXL}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 10);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}

                      {inqType == 6 ? (
                        <Grid item lg={12} p={1} xs={12}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Width"
                            label="Width"
                            value={width}
                            size="small"
                            error={touched.Width && Boolean(errors.Width)}
                            helperText={touched.Width && errors.Width}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 13);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}
                      {inqType == 6 ? (
                        <Grid item lg={12} p={1} xs={12}>
                          <Field
                            as={TextField}
                            fullWidth
                            name="Length"
                            label="Height"
                            size="small"
                            value={length}
                            error={touched.Length && Boolean(errors.Length)}
                            helperText={touched.Length && errors.Length}
                            onChange={(e) => {
                              handleCalcTotal(e.target.value, 12);
                              setFieldValue("TotalQty", finalTotal);
                            }}
                          />
                        </Grid>
                      ) : (
                        ""
                      )}

                      <Grid item p={1} xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="TotalQty"
                          value={total}
                          label="Total"
                          size="small"
                          error={touched.TotalQty && Boolean(errors.TotalQty)}
                          helperText={touched.TotalQty && errors.TotalQty}
                          onChange={(e) => {
                            handleCalcTotal(e.target.value, 11);
                            setFieldValue("TotalQty", e.target.value);
                          }}
                          
                        />
                      </Grid>
                      <Grid item p={1} xs={12}>
                        <Button
                          type="submit"
                          size="small"
                          variant="contained"
                          sx={{
                            mt: 2,
                            textTransform: "capitalize",
                            borderRadius: "5px",
                            fontWeight: "500",
                            fontSize: "13px",
                            color: "#fff !important",
                          }}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleClose}
                          color="error"
                          sx={{
                            mt: 2,
                            ml: 1,
                            textTransform: "capitalize",
                            borderRadius: "5px",
                            fontWeight: "500",
                            fontSize: "13px",
                          }}
                        >
                          Close
                        </Button>
                      </Grid>
                    </Grid>
                  </Form>
                )}
              </Formik>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <Formik
                initialValues={{
                  SizeName: "",
                  SizeID: "",
                  Sleavetype: "",
                  TwoXS: "",
                  XS: "",
                  S: "",
                  M: "",
                  L: "",
                  TwoXL: "",
                  ThreeXL: "",
                  FourXL: "",
                  FiveXL: "",
                  TotalQty: "",
                  InquiryID: inqId,
                  InqCode: inqCode,
                  WindowType: WinType,
                  OptionId: OptId,
                  InqOptionName: optionName,
                  IsSpecialSize: true,
                  Width: "",
                  Length: "",
                }}
                validationSchema={validationSchemaSpecialSize}
                onSubmit={handleSubmitSpecial}
              >
                {({ values, errors, touched, setFieldValue }) => (
                  <Form>
                    <Grid container>
                      <Grid item lg={12} p={1} xs={12}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "12px",
                          }}
                        >
                          Size Name
                        </Typography>
                        <Field
                          as={TextField}
                          fullWidth
                          name="SizeName"
                          label="Size Name"
                          size="small"
                          error={touched.SizeName && Boolean(errors.SizeName)}
                          helperText={touched.SizeName && errors.SizeName}
                        />
                      </Grid>
                      {/* {inqType == 7  || inqType == 8 ? "" : <Grid item lg={6} p={1} xs={12}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: "500",
                            fontSize: "14px",
                            mb: "12px",
                          }}
                        >
                          Sleeve
                        </Typography>
                        <FormControl fullWidth size="small">
                          <InputLabel id="sleeveLabelspe">Sleeve</InputLabel>
                          <Select
                            labelId="sleeveLabelspe"
                            id="sleeveSelect"
                            name="Sleavetype"
                            label="Sleeve"
                            value={values.Sleavetype}
                            onChange={(event) =>
                              setFieldValue("Sleavetype", event.target.value)
                            }
                            error={
                              touched.Sleavetype && Boolean(errors.Sleavetype)
                            }
                            helperText={touched.Sleavetype && errors.Sleavetype}
                          >
                            <MenuItem value="Long">Long</MenuItem>
                            <MenuItem value="Short">Short</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>} */}

                      <Grid item lg={6} p={1} xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Width"
                          label="Width"
                          size="small"
                          value={width}
                          error={touched.Width && Boolean(errors.Width)}
                          helperText={touched.Width && errors.Width}
                          onChange={(e) => {
                            handleCalcQuantity(e.target.value, 13);
                            setFieldValue("TotalQty", finalTotal);
                          }}
                        />
                      </Grid>
                      <Grid item lg={6} p={1} xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="Length"
                          label="Length"
                          value={length}
                          size="small"
                          error={touched.Length && Boolean(errors.Length)}
                          helperText={touched.Length && errors.Length}
                          onChange={(e) => {
                            handleCalcQuantity(e.target.value, 12);
                            setFieldValue("TotalQty", finalTotal);
                          }}
                        />
                      </Grid>
                      <Grid item p={1} xs={12}>
                        <Field
                          as={TextField}
                          fullWidth
                          name="TotalQty"
                          value={quantity}
                          label="Quantity"
                          size="small"
                          error={touched.TotalQty && Boolean(errors.TotalQty)}
                          helperText={touched.TotalQty && errors.TotalQty}
                          onChange={(e) => {
                            handleCalcQuantity(e.target.value, 14);
                            setFieldValue("TotalQty", e.target.value);
                          }}
                        />
                      </Grid>
                      <Grid item p={1} xs={12}>
                        <Button
                          type="submit"
                          size="small"
                          variant="contained"
                          sx={{
                            mt: 2,
                            textTransform: "capitalize",
                            borderRadius: "5px",
                            fontWeight: "500",
                            fontSize: "13px",
                            color: "#fff !important",
                          }}
                        >
                          Add
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleClose}
                          color="error"
                          sx={{
                            mt: 2,
                            ml: 1,
                            textTransform: "capitalize",
                            borderRadius: "5px",
                            fontWeight: "500",
                            fontSize: "13px",
                          }}
                        >
                          Close
                        </Button>
                      </Grid>
                    </Grid>
                  </Form>
                )}
              </Formik>
            </TabPanel>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
