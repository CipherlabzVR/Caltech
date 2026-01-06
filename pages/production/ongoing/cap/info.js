import React, { useEffect, useState } from "react";
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

export default function DocumentPanel() {
  const router = useRouter();
  const inqType = router.query.inqType;
  const [panelId, setPanelId] = useState();
  const [peekId, setPeekId] = useState();
  const [backId, setBackId] = useState();
  const [holesId, setHolesId] = useState();
  const [contrastId, setContrastId] = useState();
  const [isPanelChecked, setIsPanelChecked] = useState(false);
  const [selectedButtonPanel, setSelectedButtonPanel] = useState(0);
  const [isPeekChecked, setIsPeekChecked] = useState(false);
  const [selectedButtonPeek, setSelectedButtonPeek] = useState(0);
  const [isBackChecked, setIsBackChecked] = useState(false);
  const [selectedButtonBack, setSelectedButtonBack] = useState(0);
  const [isHolesChecked, setIsHolesChecked] = useState(false);
  const [isContrastChecked, setIsContrastChecked] = useState(false);
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;

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
      const resultComponentTypes1 = dataresult.find(
        (item) => item.componentTypes === 1
      );
      const resultComponentTypes2 = dataresult.find(
        (item) => item.componentTypes === 2
      );
      const resultComponentTypes3 = dataresult.find(
        (item) => item.componentTypes === 3
      );
      const resultComponentTypes4 = dataresult.find(
        (item) => item.componentTypes === 4
      );
      const resultComponentTypes7 = dataresult.find(
        (item) => item.componentTypes === 7
      );
      if (resultComponentTypes1) {
        setPanelId(resultComponentTypes1.id);
        setIsPanelChecked(true);
        setSelectedButtonPanel(resultComponentTypes1.componentFirstRows);
      }
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
      if (resultComponentTypes4) {
        setHolesId(resultComponentTypes4.id);
        setIsHolesChecked(true);
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
    fetchComponent();
  }, []);

  const handleCheckPanel = async (event, id) => {
    setIsPanelChecked(event.target.checked);
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
            ComponentTypes: 1,
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
  const handlePanelButtonClick = async (index) => {
    setSelectedButtonPanel(index === selectedButtonPanel ? null : index);

    if (selectedButtonPanel === index) {
      setSelectedButtonPanel(null);
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
            ComponentTypes: 1,
            ComponentFirstRows: 10,
            ComponentValue: "",
          }),
        }
      );
    } else {
      setSelectedButtonPanel(index === selectedButtonPanel ? null : index);
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
            ComponentTypes: 1,
            ComponentFirstRows: index,
            ComponentValue: "",
          }),
        }
      );
    }
  };
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
            ComponentTypes: 3,
            ComponentFirstRows: index,
            ComponentValue: "",
          }),
        }
      );
    }
  };

  const handleCheckHoles = async (event, id) => {
    setIsHolesChecked(event.target.checked);
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
            ComponentTypes: 4,
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
            InquiryID: optionDetails.inquiryID,
            InqCode: optionDetails.inqCode,
            OptionId: optionDetails.id,
            InqOptionName: optionName,
            WindowType: optionDetails.windowType,
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
        customerName={customerName}
        optionName={optionName}
        href="/production/ongoing/"
        link="Ongoing Inquiries"
        title="Info Panel"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Info Panel</Typography>
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
              href={`/production/ongoing/cap/document-panel/?inqType=${inqType}`}
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPanelChecked}
                      onChange={(event) => handleCheckPanel(event, panelId)}
                    />
                  }
                  label="Panel"
                />
                {isPanelChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      disableElevation
                      fullWidth
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonPanel === 1 ? "contained" : "outlined"
                        }
                        onClick={() => handlePanelButtonClick(1)}
                      >
                        3
                      </Button>
                      <Button
                        variant={
                          selectedButtonPanel === 2 ? "contained" : "outlined"
                        }
                        onClick={() => handlePanelButtonClick(2)}
                      >
                        5
                      </Button>
                      <Button
                        variant={
                          selectedButtonPanel === 3 ? "contained" : "outlined"
                        }
                        onClick={() => handlePanelButtonClick(3)}
                      >
                        6
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
                      checked={isPeekChecked}
                      onChange={(event) => handleCheckPeek(event, peekId)}
                    />
                  }
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
                  control={
                    <Checkbox
                      checked={isBackChecked}
                      onChange={(event) => handleCheckBack(event, backId)}
                    />
                  }
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
                          checked={isHolesChecked}
                          onChange={(event) => handleCheckHoles(event, holesId)}
                        />
                      }
                      label="Ventilation Holes"
                    />
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
                          checked={isContrastChecked}
                          onChange={(event) =>
                            handleCheckContrast(event, contrastId)
                          }
                        />
                      }
                      label="Contrast"
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
