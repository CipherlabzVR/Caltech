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
  FormControlLabel,
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
  const [isPeekChecked, setIsPeekChecked] = useState(false);
  const [selectedButtonPeek, setSelectedButtonPeek] = useState(0);
  const [isBackChecked, setIsBackChecked] = useState(false);
  const [selectedButtonBack, setSelectedButtonBack] = useState(0);
  const [isContrastChecked, setIsContrastChecked] = useState(false);
  const [peekId, setPeekId] = useState();
  const [backId, setBackId] = useState();
  const [contrastId, setContrastId] = useState();

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
      const resultComponentTypes2 = dataresult.find(
        (item) => item.componentTypes === 2
      );
      const resultComponentTypes3 = dataresult.find(
        (item) => item.componentTypes === 3
      );
      const resultComponentTypes7 = dataresult.find(
        (item) => item.componentTypes === 7
      );
      if (resultComponentTypes2) {
        setPeekId(resultComponentTypes2.id);
        setIsPeekChecked(true);
        setSelectedButtonPeek(resultComponentTypes2.componentFirstRows);
      }
      if (resultComponentTypes3) {
        setBackId(resultComponentTypes3.id);
        setIsBackChecked(true);
        setSelectedButtonBack(resultComponentTypes3.componentFirstRows);
      }
      if (resultComponentTypes7) {
        setContrastId(resultComponentTypes7.id);
        setIsContrastChecked(true);
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


  const handleCheckPeek = async (event, id) => {
    setIsPeekChecked(event.target.checked);
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
            ComponentTypes: 2,
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

  const handlePeekButtonClick = async (index) => {
    setSelectedButtonPeek(index === selectedButtonPeek ? null : index);
    if (selectedButtonPeek === index) {
      setSelectedButtonPeek(null);
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
            ComponentTypes: 2,
            ComponentFirstRows: 10,
            ComponentValue: "",
          }),
        }
      );
    } else {
      setSelectedButtonPeek(index === selectedButtonPeek ? null : index);
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
            ComponentTypes: 2,
            ComponentFirstRows: index,
            ComponentValue: "",
          }),
        }
      );
    }
  };
  const handleCheckBack = async (event, id) => {
    setIsBackChecked(event.target.checked);
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
            ComponentTypes: 3,
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
  const handleBackButtonClick = async (index) => {
    setSelectedButtonBack(index === selectedButtonBack ? null : index);
    if (selectedButtonBack === index) {
      setSelectedButtonBack(null);
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
            ComponentTypes: 3,
            ComponentFirstRows: 10,
            ComponentValue: "",
          }),
        }
      );
    } else {
      setSelectedButtonBack(index === selectedButtonBack ? null : index);
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
            ComponentTypes: 3,
            ComponentFirstRows: index,
            ComponentValue: "",
          }),
        }
      );
    }
  };

  const handleCheckContrast = async (event, id) => {
    setIsContrastChecked(event.target.checked);
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
            ComponentTypes: 7,
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
        title="Info Panel"
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
            <Link href={`/inquiry/edit-inquiry/visor/document-panel/?id=${inquiry ? inquiry.inquiryId: ""}&option=${inquiry ? inquiry.optionId: ""}`}>
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
                <FormControlLabel
                  control={<Checkbox checked={isPeekChecked} onChange={(event) => handleCheckPeek(event, peekId)} />}
                  label="Peek"
                />
                {isPeekChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      disableElevation
                      fullWidth
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonPeek === 4 ? "contained" : "outlined"
                        }
                        onClick={() => handlePeekButtonClick(4)}
                      >
                        Sandwitch
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
                  control={<Checkbox checked={isBackChecked} onChange={(event) => handleCheckBack(event, backId)} />}
                  label="Back"
                />
                {isBackChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      disableElevation
                      fullWidth
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonBack === 6 ? "contained" : "outlined"
                        }
                        onClick={() => handleBackButtonClick(6)}
                      >
                        Velcro
                      </Button>
                      <Button
                        variant={
                          selectedButtonBack === 7 ? "contained" : "outlined"
                        }
                        onClick={() => handleBackButtonClick(7)}
                      >
                        Adj/Buckle
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
                  control={<Checkbox checked={isContrastChecked} onChange={(event) => handleCheckContrast(event, contrastId)} />}
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
