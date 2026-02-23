import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
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

export default function TechPackShirtColler() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullCLRSelected, setIsFullCLRSelected] = useState(false);
  const [isChineseCLRSelected, setIsChineseCLRSelected] = useState(false);

  const fetchOngoingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingInquiryById?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}`,
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
        fetchFullColor(inquiryId, optionId, data.result.windowType);
        fetchChineseColor(inquiryId, optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullColor = async (inqId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}&necKTypes=4`,
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
        if (data.result && data.result.length !== 0) {
          setIsFullCLRSelected(true);
        }
      }
    } catch (error) {
      console.error("Error fetching full color:", error);
    }
  };

  const fetchChineseColor = async (inqId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}&necKTypes=5`,
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
        if (data.result && data.result.length !== 0) {
          setIsChineseCLRSelected(true);
        }
      }
    } catch (error) {
      console.error("Error fetching chinese color:", error);
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
      pathname: "/quotations/tech-pack/edit/shirt/sleeve",
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
        title="Collar - Tech Pack"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Collar</Typography>
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
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isFullCLRSelected} disabled />}
                  label={<Typography style={{ fontSize: "25px" }}>Full Collar</Typography>}
                />
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <FormControlLabel
                  control={<Checkbox checked={isChineseCLRSelected} disabled />}
                  label={<Typography style={{ fontSize: "25px" }}>Chinese Collar</Typography>}
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
