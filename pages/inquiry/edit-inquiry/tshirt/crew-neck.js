import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function CrewNeck() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [selectedButtonCCCN, setSelectedButtonCCCN] = useState(0);
  const [isCCCNChecked, setIsCCCNChecked] = useState(false);
  const [cCCNId, setCCCNId] = useState();
  const [cNId, setCNId] = useState();
  const [selectedButtonCN, setSelectedButtonCN] = useState(0);
  const [isCNChecked, setIsCNChecked] = useState(false);

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
      fetchNeckTypes(inq.inquiryId, inq.optionId, inq.windowType);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId,optId) {
      fetchInquiryById();
    }
  }, []);

  const handleCCCNChange = async (event, value) => {
    setIsCCCNChecked(event.target.checked);
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
            NecKTypes: 2,
            NeckFirstRows: 5,
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
      fetchNeckTypes(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
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
      fetchNeckTypes(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  };

  const handleCCCNButtonClick = async (index) => {
    setSelectedButtonCCCN(index === selectedButtonCCCN ? null : index);
    if (selectedButtonCCCN === index) {
      setSelectedButtonCCCN(null);
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
            NecKTypes: 2,
            NeckFirstRows: 5,
            Neck2ndRowS: 9,
            Neck3rdRowS: 6,
            POLOlength: String(0),
            POLOWidth: String(0),
            POLOButton: String(0),
          }),
        }
      );
    } else {
      setSelectedButtonCCCN(index === selectedButtonCCCN ? null : index);
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
            NecKTypes: 2,
            NeckFirstRows: 5,
            Neck2ndRowS: index,
            Neck3rdRowS: 6,
            POLOlength: String(0),
            POLOWidth: String(0),
            POLOButton: String(0),
          }),
        }
      );
    }
  };

  const handleCNChange = async (event, value) => {
    setIsCNChecked(event.target.checked);
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
            NecKTypes: 2,
            NeckFirstRows: 6,
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
  const handleCNButtonClick = async (index) => {
    setSelectedButtonCN(index === selectedButtonCN ? null : index);
    if (selectedButtonCN === index) {
      setSelectedButtonCN(null);
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
            NecKTypes: 2,
            NeckFirstRows: 6,
            Neck2ndRowS: 9,
            Neck3rdRowS: 6,
            POLOlength: String(0),
            POLOWidth: String(0),
            POLOButton: String(0),
          }),
        }
      );
    } else {
      setSelectedButtonCN(index === selectedButtonCN ? null : index);
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
            NecKTypes: 2,
            NeckFirstRows: 6,
            Neck2ndRowS: index,
            Neck3rdRowS: 6,
            POLOlength: String(0),
            POLOWidth: String(0),
            POLOButton: String(0),
          }),
        }
      );
    }
  };

  const fetchNeckTypes = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=2`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck types");
      }

      const data = await response.json();

      const resultWithNeckFirstRows5 = data.result.find(
        (item) => item.neckFirstRows === 5
      );

      const resultWithNeckFirstRows6 = data.result.find(
        (item) => item.neckFirstRows === 6
      );

      if (resultWithNeckFirstRows5) {
        setCCCNId(resultWithNeckFirstRows5.id);
        setIsCCCNChecked(true);
        setSelectedButtonCCCN(resultWithNeckFirstRows5.neck2ndRowS);
      }
      if (resultWithNeckFirstRows6) {
        setCNId(resultWithNeckFirstRows6.id);
        setIsCNChecked(true);
        setSelectedButtonCN(resultWithNeckFirstRows6.neck2ndRowS);
      }
    } catch (error) {
      console.error("Error fetching Neck types:", error);
    }
  };

  const handleSubmit = async () => {
    router.push(`/inquiry/edit-inquiry/tshirt/sleeve/?id=${inquiry ? inquiry.inquiryId : ""}&neck=2&option=${inquiry ? inquiry.optionId: ""}`);
  };

  return (
    <>
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Crew Neck"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Crew Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/tshirt/neck/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
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
                  control={
                    <Checkbox
                      checked={isCCCNChecked}
                      onChange={(event) => handleCCCNChange(event, cCCNId)}
                    />
                  }
                  label="CHINESE COLLAR CREW NECK"
                />
                {isCCCNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      disableElevation
                      aria-label="Disabled button group"
                      fullWidth
                    >
                      <Button
                        variant={
                          selectedButtonCCCN === 3 ? "contained" : "outlined"
                        }
                        onClick={() => handleCCCNButtonClick(3, cCCNId)}
                      >
                        Normal
                      </Button>
                      <Button
                        variant={
                          selectedButtonCCCN === 4 ? "contained" : "outlined"
                        }
                        onClick={() => handleCCCNButtonClick(4, cCCNId)}
                      >
                        1/8 Line
                      </Button>
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
                  control={
                    <Checkbox
                      checked={isCNChecked}
                      onChange={(event) => handleCNChange(event, cNId)}
                    />
                  }
                  label="CREW NECK"
                />
                {isCNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonCN === 5 ? "contained" : "outlined"
                        }
                        onClick={() => handleCNButtonClick(5)}
                      >
                        RIB
                      </Button>
                      <Button
                        variant={
                          selectedButtonCN === 6 ? "contained" : "outlined"
                        }
                        onClick={() => handleCNButtonClick(6)}
                      >
                        Fabric
                      </Button>
                    </ButtonGroup>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
