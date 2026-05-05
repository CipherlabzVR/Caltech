import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
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
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackBottomComponent() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPKT, setSelectedPKT] = useState("");
  const [selectedPiePinTape, setSelectedPiePinTape] = useState("");
  const [selectedBottom, setSelectedBottom] = useState(false);
  const [textBoxView, setTextBoxView] = useState(false);
  const [isContrastChecked, setIsContrastChecked] = useState(false);
  const [isNumbersChecked, setIsNumbersChecked] = useState(false);
  const [isCordColorChecked, setIsCordColorChecked] = useState(false);
  const [isBottomChecked, setIsBottomChecked] = useState(false);
  const [selectedBottomValue, setSelectedBottomValue] = useState("");
  const [textFieldValue, setTextFieldValue] = useState("");

  const fetchOngoingData = async () => {
    try {
      setLoading(true);
      const windowParam = queryWindowType != null && queryWindowType !== "" ? `&windowType=${queryWindowType}` : "";
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingInquiryById?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}${windowParam}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch ongoing data");

      const data = await response.json();
      if (data.result) {
        setInquiry(data.result);
        fetchComponent(inquiryId, optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponent = async (inqId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/GetComponentPanelByInq?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.result) {
          const dataresult = data.result.result;

          const resultoption = dataresult.find((item) => item.componentTypes === 16);
          const resultpiepin = dataresult.find((item) => item.componentTypes === 17);
          const resultComponentTypes8 = dataresult.find((item) => item.componentTypes === 8);
          const resultComponentTypes9 = dataresult.find((item) => item.componentTypes === 9);
          const resultComponentTypes7 = dataresult.find((item) => item.componentTypes === 7);
          const resultComponentTypes12 = dataresult.find((item) => item.componentTypes === 12);

          if (resultoption) {
            setSelectedPKT(resultoption.componentFirstRows == 11 ? "Straight PKT" : "Angle PKT");
          }
          if (resultpiepin) {
            setSelectedPiePinTape(resultpiepin.componentFirstRows == 13 ? "Side Pie Pin" : "Side Tape");
          }
          if (resultComponentTypes8) {
            setIsNumbersChecked(true);
          }
          if (resultComponentTypes9) {
            setIsCordColorChecked(true);
            setTextBoxView(true);
            setTextFieldValue(resultComponentTypes9.componentValue);
          }
          if (resultComponentTypes7) {
            setIsContrastChecked(true);
          }
          if (resultComponentTypes12) {
            setIsBottomChecked(true);
            setSelectedBottomValue(resultComponentTypes12.componentValue);
            setSelectedBottom(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching component data:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/bottom/document-panel",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
        href="/quotations/tech-pack/"
        link="Tech Pack"
        title="Components - Tech Pack"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Components</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button variant="outlined" color="primary" endIcon={<NavigateNextIcon />} onClick={navToNext}>
              next
            </Button>
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
                <RadioGroup name="bag" value={selectedPKT}>
                  <FormControlLabel
                    value="Straight PKT"
                    control={<Radio checked={selectedPKT === "Straight PKT"} disabled />}
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
                <RadioGroup name="bag" value={selectedPKT}>
                  <FormControlLabel
                    value="Angle PKT"
                    control={<Radio checked={selectedPKT === "Angle PKT"} disabled />}
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
                  control={<Checkbox checked={isContrastChecked} disabled />}
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
                  control={<Checkbox checked={isNumbersChecked} disabled />}
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
                  control={<Checkbox checked={isCordColorChecked} disabled />}
                  label="Cord Color"
                />
                {textBoxView && <TextField value={textFieldValue} fullWidth disabled />}
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
                <RadioGroup name="piepintape" value={selectedPiePinTape}>
                  <FormControlLabel
                    value="Side Pie Pin"
                    control={<Radio checked={selectedPiePinTape === "Side Pie Pin"} disabled />}
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
                <RadioGroup name="piepintape" value={selectedPiePinTape}>
                  <FormControlLabel
                    value="Side Tape"
                    control={<Radio checked={selectedPiePinTape === "Side Tape"} disabled />}
                    label="Side Tape"
                  />
                </RadioGroup>
              </Card>
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
                  <FormControlLabel
                    control={<Checkbox checked={isBottomChecked} disabled />}
                    label="Bottom"
                  />
                </Card>
              </Grid>
              {selectedBottom && (
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <FormControl fullWidth disabled>
                    <Select value={selectedBottomValue}>
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
