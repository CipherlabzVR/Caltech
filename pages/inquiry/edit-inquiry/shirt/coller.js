import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function SelectColler() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [isFullCLRSelected, setIsFullCLRSelected] = useState(false);
  const [fullClrId, setFullClrId] = useState();
  const [isChineseCLRSelected, setIsChineseCLRSelected] = useState(false);
  const [chineseClrId, setChineseClrId] = useState();

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

  const fetchFullColor = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=4`,
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
      if (data.result.length != 0) {
        setIsFullCLRSelected(true);
        setFullClrId(data.result[0].id);
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };
  const fetchChineseColor = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=5`,
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
      if (data.result.length != 0) {
        setIsChineseCLRSelected(true);
        setChineseClrId(data.result[0].id);
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchFullColor(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      fetchChineseColor(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  const handleFullCLRChange = async (event, value) => {
    setIsFullCLRSelected(event.target.checked);
    const isChecked = event.target.checked;
    if (isChecked) {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/AddOrUpdateNeckType`,
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
            NecKTypes: 4,
            NeckFirstRows: 10,
            Neck2ndRowS: 9,
            Neck3rdRowS: 6,
            POLOlength: String(0),
            POLOWidth: String(0),
            POLOButton: String(0),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
    } else {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/DeleteNeckTypes?id=${value}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
    }
  };

  const handleChineseCLRChange = async (event, value) => {
    setIsChineseCLRSelected(event.target.checked);
    const isChecked = event.target.checked;
    if (isChecked) {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/AddOrUpdateNeckType`,
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
            NecKTypes: 5,
            NeckFirstRows: 10,
            Neck2ndRowS: 9,
            Neck3rdRowS: 6,
            POLOlength: String(0),
            POLOWidth: String(0),
            POLOButton: String(0),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
    } else {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/DeleteNeckTypes?id=${value}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
    }
  };

  return (
    <>
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Coller"
      />
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Coller</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/sizes/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href={`/inquiry/edit-inquiry/shirt/sleeve/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
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
            <Grid item xs={12} p={1}>
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
                      control={
                        <Checkbox
                          checked={isFullCLRSelected}
                          onChange={(event) =>
                            handleFullCLRChange(event, fullClrId)
                          }
                        />
                      }
                      label="Full Coller"
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
                      control={<Checkbox checked={isChineseCLRSelected} onChange={(event) =>
                        handleChineseCLRChange(event, chineseClrId)
                      } />}
                      label="Chinese Coller"
                    />
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
