import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
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
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [selectedPKT, setSelectedPKT] = useState("");
  const [selectedPiePinTape, setSelectedPiePinTape] = useState("");
  const [isContrastChecked, setIsContrastChecked] = useState(false);
  const [isNumbersChecked, setIsNumbersChecked] = useState(false);
  const [isCordColorChecked, setIsCordColorChecked] = useState(false);
  const [contrastId, setContrastId] = useState();
  const [numbersId, setNumbersId] = useState();
  const [cordColorId, setCodeColorId] = useState();
  const [textFieldValue, setTextFieldValue] = useState("");

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
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId,optId) {
      fetchInquiryById();
    }
  }, []);

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
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          OptionId: inquiry.optionId,
          InqOptionName: inquiry.optionName,
          WindowType: inquiry.windowType,
          ComponentTypes: 17,
          ComponentFirstRows: 14,
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
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          OptionId: inquiry.optionId,
          InqOptionName: inquiry.optionName,
          WindowType: inquiry.windowType,
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
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          OptionId: inquiry.optionId,
          InqOptionName: inquiry.optionName,
          WindowType: inquiry.windowType,
          ComponentTypes: 17,
          ComponentFirstRows: index,
          ComponentValue: textFieldValue ? textFieldValue : "",
        }),
      }
    );
  };

  const fetchComponent = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/GetComponentPanelByInq?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
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
        }
        if (resultComponentTypes7) {
          setContrastId(resultComponentTypes7.id);
          setIsContrastChecked(true);
        }
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchComponent(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  const handleCheckBox = async (event, id, value) => {
    if (value == 7) {
      setIsContrastChecked(event.target.checked);
    } else if (value == 8) {
      setIsNumbersChecked(event.target.checked);
    } else {
      setIsCordColorChecked(event.target.checked);
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
            InquiryID: inquiry.inquiryId,
            InqCode: inquiry.inquiryCode,
            OptionId: inquiry.optionId,
            InqOptionName: inquiry.optionName,
            WindowType: inquiry.windowType,
            ComponentTypes: value,
            ComponentFirstRows: 10,
            ComponentValue: "",
          }),
        }
      );
    } else {
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
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
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
            <Link href={`/inquiry/edit-inquiry/sizes/?id=${inquiry ? inquiry.inquiryId: ""}&option=${inquiry ? inquiry.optionId: ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href={`/inquiry/edit-inquiry/short/document-panel/?id=${inquiry ? inquiry.inquiryId: ""}&option=${inquiry ? inquiry.optionId: ""}`}>
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
            {selectedPiePinTape === "Side Tape" && (
              <Grid item p={1} xs={12} lg={3} md={6}>
                <TextField
                  fullWidth
                  value={textFieldValue}
                  onChange={handleTextFieldChange}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
