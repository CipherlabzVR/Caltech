import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { Box, Button, Card, Checkbox, FormControlLabel, Radio, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function SelectSleeve() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [selectedValue, setSelectedValue] = useState('short');

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
      const result = data.result[0];
      if (result.short === 1) {
        setSelectedValue('short');
      }
      if (result.long === 1) {
        setSelectedValue('long');
      }
    } catch (error) {
      //console.error("Error fetching Sleeve Details:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchSleeve(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  const handleSelectionChange = async (event) => {
    setSelectedValue(event.target.value);
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
          Wrangler: "0",
          Normal: "0",
          Short: event.target.value === 'short' ? 1 : 0,
          ShortType: 9,
          Long: event.target.value === 'long' ? 1 : 0,
          LongType: 9,
          ShortSize: 0,
          LongSize: 0,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete fabric");
    }
  };

  return (
    <>
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
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
          <Typography>Sleeve</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/shirt/coller/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href={`/inquiry/edit-inquiry/shirt/document-panel/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
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
                  value="short"
                  control={<Radio checked={selectedValue === 'short'} onChange={handleSelectionChange} />}
                  label="Short Sleeve"
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
                  value="long"
                  control={<Radio checked={selectedValue === 'long'} onChange={handleSelectionChange} />}
                  label="Long Sleeve"
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
