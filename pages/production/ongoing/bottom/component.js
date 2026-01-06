import React, { useEffect, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function Component() {
  const router = useRouter();
  const inqType = router.query.inqType;
  const [selectedPKT, setSelectedPKT] = useState("");
  const [selectedPiePinTape, setSelectedPiePinTape] = useState("");
  const [selectedBottom, setSelectedBottom] = useState(false);
  const [textBoxView, setTextBoxView] = useState(false);
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const [isContrastChecked, setIsContrastChecked] = useState(false);
  const [isNumbersChecked, setIsNumbersChecked] = useState(false);
  const [isCordColorChecked, setIsCordColorChecked] = useState(false);
  const [isBottomChecked, setIsBottomChecked] = useState(false);
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;
  const [contrastId, setContrastId] = useState();
  const [numbersId, setNumbersId] = useState();
  const [cordColorId, setCodeColorId] = useState();
  const [bottomId, setBottomId] = useState();
  const [selectedBottomValue, setSelectedBottomValue] = useState("");
  const [textFieldValue, setTextFieldValue] = useState("");

  const handleTextFieldChange = async (event) => {
    setTextFieldValue(event.target.value);
    const response = await fetch(
      `${BASE_URL}/ComponentPanel/CreateComponentPanel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          OptionId: optionDetails.id,
          InqOptionName: optionName,
          WindowType: optionDetails.windowType,
          ComponentTypes: 9,
          ComponentFirstRows: 10,
          ComponentValue: event.target.value,
        }),
      }
    );
  };

  const handleChange = async (event) => {
    setSelectedBottomValue(event.target.value);
    const response = await fetch(
      `${BASE_URL}/ComponentPanel/CreateComponentPanel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          OptionId: optionDetails.id,
          InqOptionName: optionName,
          WindowType: optionDetails.windowType,
          ComponentTypes: 12,
          ComponentFirstRows: 10,
          ComponentValue: event.target.value,
        }),
      }
    );
  };

  const handlePKTChange = async (event, index) => {
    setSelectedPKT(event.target.value);
    const response = await fetch(
      `${BASE_URL}/ComponentPanel/CreateComponentPanel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          OptionId: optionDetails.id,
          InqOptionName: optionName,
          WindowType: optionDetails.windowType,
          ComponentTypes: 16,
          ComponentFirstRows: index,
          ComponentValue: "",
        }),
      }
    );
  };
  const handlePiePinTapeChange = async (event, index) => {
    setSelectedPiePinTape(event.target.value);
    const response = await fetch(
      `${BASE_URL}/ComponentPanel/CreateComponentPanel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          OptionId: optionDetails.id,
          InqOptionName: optionName,
          WindowType: optionDetails.windowType,
          ComponentTypes: 17,
          ComponentFirstRows: index,
          ComponentValue: "",
        }),
      }
    );
  };

  const fetchComponent = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/GetComponentPanelByInq?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }
      const data = await response.json();
      const dataresult = data.result.result;
      if (dataresult) {
        const resultoption = dataresult.find(
          (item) => item.componentTypes === 16
        );
        const resultpiepin = dataresult.find(
          (item) => item.componentTypes === 17
        );
        const resultComponentTypes8 = dataresult.find(
          (item) => item.componentTypes === 8
        );
        const resultComponentTypes9 = dataresult.find(
          (item) => item.componentTypes === 9
        );
        const resultComponentTypes7 = dataresult.find(
          (item) => item.componentTypes === 7
        );
        const resultComponentTypes12 = dataresult.find(
          (item) => item.componentTypes === 12
        );

        if (resultoption) {
          setSelectedPKT(
            resultoption.componentFirstRows == 11 ? "Straight PKT" : "Angle PKT"
          );
        }
        if (resultpiepin) {
          setSelectedPiePinTape(
            resultpiepin.componentFirstRows == 13 ? "Side Pie Pin" : "Side Tape"
          );
        }
        if (resultComponentTypes8) {
          setNumbersId(resultComponentTypes8.id);
          setIsNumbersChecked(true);
        }
        if (resultComponentTypes9) {
          setCodeColorId(resultComponentTypes9.id);
          setIsCordColorChecked(true);
          setTextBoxView(true);
          setTextFieldValue(resultComponentTypes9.componentValue);
        }
        if (resultComponentTypes7) {
          setContrastId(resultComponentTypes7.id);
          setIsContrastChecked(true);
        }
        if (resultComponentTypes12) {
          setBottomId(resultComponentTypes12.id);
          setIsBottomChecked(true);
          setSelectedBottomValue(resultComponentTypes12.componentValue);
          setSelectedBottom(true);
        }
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchComponent();
  }, []);

  const handleCheckBox = async (event, id, value) => {
    if (value == 7) {
      setIsContrastChecked(event.target.checked);
    } else if (value == 8) {
      setIsNumbersChecked(event.target.checked);
    } else if (value == 9) {
      setIsCordColorChecked(event.target.checked);
      setTextBoxView(true);
    } else {
      setIsBottomChecked(event.target.checked);
      setSelectedBottom(true);
    }

    const isChecked = event.target.checked;
    if (isChecked) {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/CreateComponentPanel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
            ComponentTypes: value,
            ComponentFirstRows: 10,
            ComponentValue:
              value == 9
                ? textFieldValue
                : value == 12
                ? selectedBottomValue
                : "",
          }),
        }
      );
    } else {
      if (value == 12) {
        setSelectedBottom(false);
        setSelectedBottomValue("");
      }
      if (value == 9) {
        setTextBoxView(false);
      }
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/DeleteComponent?compId=${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    fetchComponent();
  };

  return (
    <>
      <DashboardHeader
        customerName={customerName}
        optionName={optionName}
        href="/production/ongoing/"
        link="Ongoing Inquiries"
        title="Components"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Components</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/production/ongoing/sizes/?inqType=${inqType}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href="/production/ongoing/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Link
              href={`/production/ongoing/bottom/document-panel/?inqType=${inqType}`}
            >
              <Button
                variant="outlined"
                color="primary"
                endIcon={<NavigateNextIcon />}
              >
                next
              </Button>
            </Link>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item p={1} xs={12} lg={3} md={6}>
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
                <RadioGroup
                  name="bag"
                  value={selectedPKT}
                  onChange={(event) => handlePKTChange(event, 11)}
                >
                  <FormControlLabel
                    value="Straight PKT"
                    control={<Radio />}
                    label="Straight PKT"
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item p={1} xs={12} lg={3} md={6}>
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
                <RadioGroup
                  name="bag"
                  value={selectedPKT}
                  onChange={(event) => handlePKTChange(event, 12)}
                >
                  <FormControlLabel
                    value="Angle PKT"
                    control={<Radio />}
                    label="Angle PKT"
                  />
                </RadioGroup>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item p={1} xs={12} lg={4} md={6}>
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
                  control={
                    <Checkbox
                      checked={isContrastChecked}
                      onChange={(event) => handleCheckBox(event, contrastId, 7)}
                    />
                  }
                  label="Contrast"
                />
              </Card>
            </Grid>
            <Grid item p={1} xs={12} lg={4} md={6}>
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
                  control={
                    <Checkbox
                      checked={isNumbersChecked}
                      onChange={(event) => handleCheckBox(event, numbersId, 8)}
                    />
                  }
                  label="Numbers"
                />
              </Card>
            </Grid>
            <Grid item p={1} xs={12} lg={4} md={6}>
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
                  control={
                    <Checkbox
                      checked={isCordColorChecked}
                      onChange={(event) =>
                        handleCheckBox(event, cordColorId, 9)
                      }
                    />
                  }
                  label="Cord Color"
                />
                {textBoxView ? (
                  <TextField
                    value={textFieldValue}
                    onChange={handleTextFieldChange}
                    fullWidth
                  />
                ) : (
                  ""
                )}
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item p={1} xs={12} lg={2} md={6}>
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
                <RadioGroup
                  name="piepintape"
                  value={selectedPiePinTape}
                  onChange={(event) => handlePiePinTapeChange(event, 13)}
                >
                  <FormControlLabel
                    value="Side Pie Pin"
                    control={<Radio />}
                    label="Side Pie Pin"
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item p={1} xs={12} lg={2} md={6}>
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
                <RadioGroup
                  name="piepintape"
                  value={selectedPiePinTape}
                  onChange={(event) => handlePiePinTapeChange(event, 14)}
                >
                  <FormControlLabel
                    value="Side Tape"
                    control={<Radio />}
                    label="Side Tape"
                  />
                </RadioGroup>
              </Card>
            </Grid>
            {/* {selectedPiePinTape === "Side Tape" && (
              <Grid item p={1} xs={12} lg={3} md={6}>
                <TextField
                  fullWidth
                  value={textFieldValue}
                  onChange={handleTextFieldChange}
                />
              </Grid>
            )} */}
          </Grid>
          <Grid item xs={12}>
            <Grid container>
              <Grid item p={1} xs={12} lg={2} md={6}>
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
                    control={
                      <Checkbox
                        checked={isBottomChecked}
                        onChange={(event) =>
                          handleCheckBox(event, bottomId, 12)
                        }
                      />
                    }
                    label="Bottom"
                  />
                </Card>
              </Grid>
              {selectedBottom && (
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <FormControl fullWidth>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={selectedBottomValue}
                      onChange={handleChange}
                    >
                      <MenuItem value="Hem">Hem</MenuItem>
                      <MenuItem value="Elastic">Elastic</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
