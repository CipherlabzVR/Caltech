import React, { useEffect, useState } from "react";
import { Grid, Tabs, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TextField from "@mui/material/TextField";
import Tab from "@mui/material/Tab";
import PropTypes from "prop-types";
import BASE_URL from "Base/api";
import { Field, Form, Formik } from "formik";
import { useRouter } from "next/router";
import {
  buildNormalSizeValidationSchema,
  buildSpecialSizeValidationSchema,
  calculateNormalSizeTotal,
  isDecimalInput,
  isWholeNumberInput,
  parseDecimalInput,
} from "@/components/utils/sizeInquiryHelpers";

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

export default function EditSizesToInquiry({ fetchItems,inquiry }) {
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
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [quantity, setQuantity] = useState("");
  const [value, setValue] = React.useState(0);
  const [sizeList, setSizeList] = useState([]);
  const inqId = inquiry ? inquiry.inquiryId : 1;
  const inqCode = inquiry ? inquiry.inquiryCode : 1;
  const optionName = inquiry ? inquiry.optionName : 1;
  const OptId = inquiry ? inquiry.optionId : 1;
  const WinType = inquiry ? inquiry.windowType : 1;
  const inqType = inquiry ? inquiry.windowType : 1;

  const validationSchemaNormalSize = buildNormalSizeValidationSchema();
  const validationSchemaSpecialSize = buildSpecialSizeValidationSchema();

  const refreshSizeList = () => {
    if (inquiry) {
      fetchItems(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    } else {
      fetchItems();
    }
  };

  const getNormalSizeValues = (overrides = {}) => ({
    inqType,
    twoXS: overrides.twoXS ?? twoXSValue,
    xs: overrides.xs ?? xSValue,
    s: overrides.s ?? sValue,
    m: overrides.m ?? mValue,
    l: overrides.l ?? lValue,
    xl: overrides.xl ?? xLValue,
    twoXL: overrides.twoXL ?? twoXLValue,
    threeXL: overrides.threeXL ?? threeXLValue,
    fourXL: overrides.fourXL ?? fourXLValue,
    fiveXL: overrides.fiveXL ?? fiveXLValue,
    width: overrides.width ?? width,
    length: overrides.length ?? length,
  });

  const syncNormalTotal = (overrides, setFieldValue) => {
    const sum = calculateNormalSizeTotal(getNormalSizeValues(overrides));
    setTotal(sum);
    setFinalTotal(sum);
    if (setFieldValue) {
      setFieldValue("TotalQty", sum);
    }
    return sum;
  };

  const onTotalDirectChange = (raw, setFieldValue) => {
    if (!isWholeNumberInput(raw)) return;
    const num = raw === "" ? 0 : parseInt(raw, 10);
    setTotal(num);
    setFinalTotal(num);
    setFieldValue("TotalQty", raw === "" ? "" : num);
  };

  const onNormalSizeChange = (raw, sizeCode, setFieldValue) => {
    if (!isWholeNumberInput(raw)) return;
    const num = raw === "" ? 0 : parseInt(raw, 10);
    const overrides = {};

    switch (sizeCode) {
      case 1:
        setTwoXSValue(num);
        setFieldValue("TwoXS", num);
        overrides.twoXS = num;
        break;
      case 2:
        setXsValue(num);
        setFieldValue("XS", num);
        overrides.xs = num;
        break;
      case 3:
        setSValue(num);
        setFieldValue("S", num);
        overrides.s = num;
        break;
      case 4:
        setMValue(num);
        setFieldValue("M", num);
        overrides.m = num;
        break;
      case 5:
        setLValue(num);
        setFieldValue("L", num);
        overrides.l = num;
        break;
      case 6:
        setXLValue(num);
        setFieldValue("XL", num);
        overrides.xl = num;
        break;
      case 7:
        setTwoXLValue(num);
        setFieldValue("TwoXL", num);
        overrides.twoXL = num;
        break;
      case 8:
        setThreeXLValue(num);
        setFieldValue("ThreeXL", num);
        overrides.threeXL = num;
        break;
      case 9:
        setFourXLValue(num);
        setFieldValue("FourXL", num);
        overrides.fourXL = num;
        break;
      case 10:
        setFiveXLValue(num);
        setFieldValue("FiveXL", num);
        overrides.fiveXL = num;
        break;
      case 12:
        setLength(num);
        setFieldValue("Length", num);
        overrides.length = num;
        break;
      case 13:
        setWidth(num);
        setFieldValue("Width", num);
        overrides.width = num;
        break;
      default:
        break;
    }

    syncNormalTotal(overrides, setFieldValue);
  };

  const onSpecialSizeChange = (raw, field, setFieldValue) => {
    if (field === "quantity") {
      if (!isWholeNumberInput(raw)) return;
      setQuantity(raw);
      setFieldValue("TotalQty", raw === "" ? "" : parseInt(raw, 10));
      setFinalTotal(raw === "" ? 0 : parseInt(raw, 10) || 0);
      return;
    }

    if (!isDecimalInput(raw)) return;

    if (field === "width") {
      setWidth(raw);
      const parsed = parseDecimalInput(raw);
      setFieldValue("Width", parsed.valid ? parsed.value : 0);
    } else if (field === "length") {
      setLength(raw);
      const parsed = parseDecimalInput(raw);
      setFieldValue("Length", parsed.valid ? parsed.value : 0);
    }
  };

  const blockInvalidNumericKeys = (event) => {
    if (["e", "E", "+", "-", "."].includes(event.key)) {
      event.preventDefault();
    }
  };

  const blockInvalidDecimalKeys = (event) => {
    if (["e", "E", "+", "-"].includes(event.key)) {
      event.preventDefault();
    }
  };

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
    setLength("");
    setWidth("");
    setQuantity("");
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
    const finalQty = parseInt(total, 10) || 0;
    if (finalQty < 1) {
      toast.error("Total quantity must be at least 1.");
      return;
    }

    const intValues = {
      ...values,
      TwoXS: parseInt(twoXSValue, 10) || 0,
      XS: parseInt(xSValue, 10) || 0,
      S: parseInt(sValue, 10) || 0,
      M: parseInt(mValue, 10) || 0,
      L: parseInt(lValue, 10) || 0,
      XL: parseInt(xLValue, 10) || 0,
      TwoXL: parseInt(twoXLValue, 10) || 0,
      ThreeXL: parseInt(threeXLValue, 10) || 0,
      FourXL: parseInt(fourXLValue, 10) || 0,
      FiveXL: parseInt(fiveXLValue, 10) || 0,
      TotalQty: finalQty,
      Length: parseInt(length, 10) || 0,
      Width: parseInt(width, 10) || 0,
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
          handleClose();
          refreshSizeList();
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "Size Creation failed. Please try again.");
      });
  };

  const handleSubmitSpecial = (values) => {
    const parsedWidth = parseDecimalInput(width || values.Width).value ?? 0;
    const parsedLength = parseDecimalInput(length || values.Length).value ?? 0;
    const finalQty = parseInt(quantity || values.TotalQty, 10) || 0;

    if (finalQty < 1) {
      toast.error("Quantity must be at least 1.");
      return;
    }

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
      TotalQty: finalQty,
      SizeID: values.SizeID ? parseInt(values.SizeID, 10) : null,
      Length: parsedLength,
      Width: parsedWidth,
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
          handleClose();
          refreshSizeList();
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 1, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 2, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 3, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 4, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 5, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 6, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 7, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 8, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 9, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 10, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 13, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                            onChange={(e) => onNormalSizeChange(e.target.value, 12, setFieldValue)}
                            onKeyDown={blockInvalidNumericKeys}
                            inputProps={{ inputMode: "numeric" }}
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
                          helperText={
                            touched.TotalQty && errors.TotalQty
                              ? errors.TotalQty
                              : "Enter total directly, or sum of all size quantities"
                          }
                          error={touched.TotalQty && Boolean(errors.TotalQty)}
                          onChange={(e) =>
                            onTotalDirectChange(e.target.value, setFieldValue)
                          }
                          onKeyDown={blockInvalidNumericKeys}
                          inputProps={{ inputMode: "numeric" }}
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
                          onChange={(e) => onSpecialSizeChange(e.target.value, "width", setFieldValue)}
                          onKeyDown={blockInvalidDecimalKeys}
                          inputProps={{ inputMode: "decimal" }}
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
                          onChange={(e) => onSpecialSizeChange(e.target.value, "length", setFieldValue)}
                          onKeyDown={blockInvalidDecimalKeys}
                          inputProps={{ inputMode: "decimal" }}
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
                          onChange={(e) => onSpecialSizeChange(e.target.value, "quantity", setFieldValue)}
                          onKeyDown={blockInvalidNumericKeys}
                          inputProps={{ inputMode: "numeric" }}
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
