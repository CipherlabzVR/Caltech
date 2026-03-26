import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackVisorComponents() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPeekChecked, setIsPeekChecked] = useState(false);
  const [selectedButtonPeek, setSelectedButtonPeek] = useState(0);
  const [isBackChecked, setIsBackChecked] = useState(false);
  const [selectedButtonBack, setSelectedButtonBack] = useState(0);
  const [isContrastChecked, setIsContrastChecked] = useState(false);

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
          const resultComponentTypes2 = dataresult.find((item) => item.componentTypes === 2);
          const resultComponentTypes3 = dataresult.find((item) => item.componentTypes === 3);
          const resultComponentTypes7 = dataresult.find((item) => item.componentTypes === 7);

          if (resultComponentTypes2) {
            setIsPeekChecked(true);
            setSelectedButtonPeek(resultComponentTypes2.componentFirstRows);
          }
          if (resultComponentTypes3) {
            setIsBackChecked(true);
            setSelectedButtonBack(resultComponentTypes3.componentFirstRows);
          }
          if (resultComponentTypes7) {
            setIsContrastChecked(true);
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
      pathname: "/quotations/tech-pack/edit/visor/document-panel",
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
                <FormControlLabel
                  control={<Checkbox checked={isPeekChecked} disabled />}
                  label="Peek"
                />
                {isPeekChecked && (
                  <Box mt={5}>
                    <ButtonGroup disableElevation fullWidth disabled>
                      <Button variant={selectedButtonPeek === 4 ? "contained" : "outlined"}>Sandwitch</Button>
                    </ButtonGroup>
                  </Box>
                )}
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
                <FormControlLabel
                  control={<Checkbox checked={isBackChecked} disabled />}
                  label="Back"
                />
                {isBackChecked && (
                  <Box mt={5}>
                    <ButtonGroup disableElevation fullWidth disabled>
                      <Button variant={selectedButtonBack === 6 ? "contained" : "outlined"}>Velcro</Button>
                      <Button variant={selectedButtonBack === 7 ? "contained" : "outlined"}>Adj/Buckle</Button>
                    </ButtonGroup>
                  </Box>
                )}
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
                <FormControlLabel
                  control={<Checkbox checked={isContrastChecked} disabled />}
                  label="Contrast"
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
