import React, { useEffect, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import CachedIcon from "@mui/icons-material/Cached";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SHORT_TYPES = [1, 2, 3, 4, 10];
const LONG_TYPES = [5, 6, 7, 8, 10];
const SHORT_SIZES = [1, 2, 3];
const LONG_SIZES = [1, 2, 3, 4];

export default function Sleeve() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [selectedWN, setSelectedWN] = useState(0);
  const [isShortChecked, setIsShortChecked] = useState(false);
  const [isLongChecked, setIsLongChecked] = useState(false);
  const [selectedButtonShort, setSelectedButtonShort] = useState();
  const [shortSizeValue, setShortSizeValue] = useState(1);
  const [deleteId, setDeleteId] = useState();
  const [longSizeValue, setLongSizeValue] = useState(1);
  const [selectedButtonLong, setSelectedButtonLong] = useState();
  const [validationError, setValidationError] = useState("");
  const neck = router.query.neck;

  const fetchInquiryById = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetInquiryByInquiryId?id=${inqId}&optId=${optId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }

      const data = await response.json();
      const inq = data.result;
      setInquiry(inq);
      fetchSleeve(inq.inquiryId, inq.optionId, inq.windowType);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId && optId) {
      fetchInquiryById();
    }
  }, [inqId, optId]);

  const getSleeveValidationMessage = () => {
    if (!isShortChecked && !isLongChecked) {
      return "Please select at least Short or Long sleeve before proceeding.";
    }
    if (isShortChecked) {
      if (!SHORT_TYPES.includes(Number(selectedButtonShort))) {
        return "Please select a Short sleeve type.";
      }
      if (!SHORT_SIZES.includes(Number(shortSizeValue))) {
        return "Please select a Short sleeve size.";
      }
    }
    if (isLongChecked) {
      if (!LONG_TYPES.includes(Number(selectedButtonLong))) {
        return "Please select a Long sleeve type.";
      }
      if (!LONG_SIZES.includes(Number(longSizeValue))) {
        return "Please select a Long sleeve size.";
      }
    }
    return "";
  };

  const handleShortButtonClick = (index) => {
    setSelectedButtonShort(index === selectedButtonShort ? null : index);
    setValidationError("");
  };
  const handleShortChange = () => {
    setIsShortChecked(!isShortChecked);
    setValidationError("");
    if (isLongChecked == true && isShortChecked == false) {
      setIsLongChecked(false);
    }
  };
  const handleLongButtonClick = (index) => {
    setSelectedButtonLong(index === selectedButtonLong ? null : index);
    setValidationError("");
  };
  const handleLongChange = () => {
    setIsLongChecked(!isLongChecked);
    setValidationError("");
    if (isShortChecked == true && isLongChecked == false) {
      setIsShortChecked(false);
    }
  };
  const handleWNChange = (event) => {
    setSelectedWN(event.target.value);
    setValidationError("");
  };
  const handleShortSizeChange = (event) => {
    setShortSizeValue(event.target.value);
    setValidationError("");
  };
  const handleLongSizeChange = (event) => {
    setLongSizeValue(event.target.value);
    setValidationError("");
  };

  const generateLink = (neckValue) => {
    switch (neckValue) {
      case "1":
        return `/inquiry/edit-inquiry/tshirt/polo-neck/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`;
      case "2":
        return `/inquiry/edit-inquiry/tshirt/crew-neck/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`;
      case "3":
        return `/inquiry/edit-inquiry/tshirt/v-neck/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`;
      default:
        return `/inquiry/edit-inquiry/tshirt/neck/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`;
    }
  };

  const fetchSleeve = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (data.result[0].wrangler === "1") {
        setSelectedWN(1);
      } else if (data.result[0].normal === "1") {
        setSelectedWN(0);
      }
      if (data.result[0].short === 1) {
        setIsShortChecked(true);
      }
      if (data.result[0].long === 1) {
        setIsLongChecked(true);
      }
      setSelectedButtonShort(data.result[0].shortType);
      setSelectedButtonLong(data.result[0].longType);
      setShortSizeValue(data.result[0].shortSize);
      setLongSizeValue(data.result[0].longSize);
      setDeleteId(data.result[0].id);
    } catch (error) {
      //console.error("Error fetching Sleeve Details:", error);
    }
  };

  const handleSubmit = async () => {
    const message = getSleeveValidationMessage();
    if (message) {
      setValidationError(message);
      toast.error(message);
      return;
    }

    setValidationError("");

    const response = await fetch(
      `${BASE_URL}/InquirySleeve/AddOrUpdateSleeve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          OptionId: inquiry.optionId,
          InqOptionName: inquiry.optionName,
          WindowType: inquiry.windowType,
          Wrangler: selectedWN == 1 ? "1" : "0",
          Normal: selectedWN == 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: selectedButtonShort ? selectedButtonShort : 9,
          Long: isLongChecked ? 1 : 0,
          LongType: selectedButtonLong ? selectedButtonLong : 9,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed");
    }
    router.push(`/inquiry/edit-inquiry/tshirt/document-panel/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`);
  };

  const handleDelete = async (id) => {
    const response = await fetch(
      `${BASE_URL}/InquirySleeve/DeleteSleeve?id=${id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    window.location.reload();
  };

  return (
    <>
      <ToastContainer />
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Sleeve"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Sleeve</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button
              disabled={!deleteId}
              onClick={() => handleDelete(deleteId)}
              variant="outlined"
              color="error"
            >
              <CachedIcon />
            </Button>
            <Link href={generateLink(neck)}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={handleSubmit}
            >
              next
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          {validationError && (
            <Box p={1}>
              <Alert severity="error">{validationError}</Alert>
            </Box>
          )}
          <RadioGroup name="wn" value={selectedWN} onChange={handleWNChange}>
            <Grid container>
              <Grid item xs={12} p={1} md={4} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    borderRadius: "10px",
                    p: "20px",
                    mb: "15px",
                    position: "relative",
                    height: "auto",
                    cursor: "pointer",
                  }}
                >
                  <FormControlLabel
                    value={0}
                    control={<Radio />}
                    label="Normal Sleeve"
                  />
                </Card>
              </Grid>
              <Grid item xs={12} p={1} md={4} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    borderRadius: "10px",
                    p: "20px",
                    mb: "15px",
                    position: "relative",
                    height: "auto",
                    cursor: "pointer",
                  }}
                >
                  <FormControlLabel
                    value={1}
                    control={<Radio />}
                    label="Ranglan Sleeve"
                  />
                </Card>
              </Grid>
            </Grid>
          </RadioGroup>

          <Grid container>
            <Grid item xs={12} p={1}>
              <Grid container>
                <Grid item xs={12}>
                  <Button>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isShortChecked}
                          onChange={handleShortChange}
                        />
                      }
                      label="Short"
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} lg={9}>
                  <ButtonGroup
                    sx={{ height: "100%" }}
                    fullWidth
                    disabled={!isShortChecked}
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button
                      variant={
                        selectedButtonShort === 1 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(1)}
                    >
                      HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 2 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(2)}
                    >
                      Double HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 3 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(3)}
                    >
                      KNITTED CUFF
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 10 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(10)}
                    >
                      TIFFIN KNITTED CUFF
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 4 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(4)}
                    >
                      FABRIC CUFF
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Not Selected
                    </InputLabel>
                    <Select
                      disabled={!isShortChecked}
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Not Selected"
                      onChange={handleShortSizeChange}
                      value={isShortChecked ? shortSizeValue : ""}
                    >
                      <MenuItem value={1}>7/8</MenuItem>
                      <MenuItem value={2}>5/8</MenuItem>
                      <MenuItem value={3}>1"</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} p={1}>
              <Grid container>
                <Grid item xs={12}>
                  <Button>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLongChecked}
                          onChange={handleLongChange}
                        />
                      }
                      label="Long"
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} lg={9}>
                  <ButtonGroup
                    sx={{ height: "100%" }}
                    fullWidth
                    disabled={!isLongChecked}
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button
                      variant={
                        selectedButtonLong === 5 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(5)}
                    >
                      HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 6 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(6)}
                    >
                      Double HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 7 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(7)}
                    >
                      KNITTED CUFF
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 10 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(10)}
                    >
                      TIFFIN KNITTED CUFF
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 8 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(8)}
                    >
                      FABRIC CUFF
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Not Selected
                    </InputLabel>
                    <Select
                      disabled={!isLongChecked}
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Not Selected"
                      value={isLongChecked ? longSizeValue : ""}
                      onChange={handleLongSizeChange}
                    >
                      <MenuItem value={1}>7/8</MenuItem>
                      <MenuItem value={2}>8/5</MenuItem>
                      <MenuItem value={3}>1"</MenuItem>
                      <MenuItem value={4}>2"</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
