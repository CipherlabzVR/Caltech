import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import CachedIcon from "@mui/icons-material/Cached";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function Sleeve() {
  const [selectedWN, setSelectedWN] = useState(0);
  const [isShortChecked, setIsShortChecked] = useState(false);
  const [isLongChecked, setIsLongChecked] = useState(false);
  const [selectedButtonShort, setSelectedButtonShort] = useState();
  const [shortSizeValue, setShortSizeValue] = useState(1);
  const [deleteId, setDeleteId] = useState();
  const [longSizeValue, setLongSizeValue] = useState(1);
  const [selectedButtonLong, setSelectedButtonLong] = useState();
  const router = useRouter();
  const inqType = router.query.inqType;
  const neck = router.query.neck;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;

  const handleShortButtonClick = (index) => {
    setSelectedButtonShort(index === selectedButtonShort ? null : index);
  };
  const handleShortChange = () => {
    setIsShortChecked(!isShortChecked);
    if (isLongChecked == true && isShortChecked == false) {
      setIsLongChecked(false);
    }
  };
  const handleLongButtonClick = (index) => {
    setSelectedButtonLong(index === selectedButtonLong ? null : index);
  };
  const handleLongChange = () => {
    setIsLongChecked(!isLongChecked);
    if (isShortChecked == true && isLongChecked == false) {
      setIsShortChecked(false);
    }
  };
  const handleWNChange = (event) => {
    setSelectedWN(event.target.value);
  };
  const handleShortSizeChange = (event) => {
    setShortSizeValue(event.target.value);
  };
  const handleLongSizeChange = (event) => {
    setLongSizeValue(event.target.value);
  };

  const generateLink = (neckValue) => {
    switch (neckValue) {
      case "1":
        return `/inquiry/tshirt/polo-neck/?inqType=${inqType}`;
      case "2":
        return `/inquiry/tshirt/crew-neck/?inqType=${inqType}`;
      case "3":
        return `/inquiry/tshirt/v-neck/?inqType=${inqType}`;
      default:
        return `/inquiry/tshirt/neck/?inqType=${inqType}`;
    }
  };

  const fetchSleeve = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (data.result[0].wrangler === "1") {
        setSelectedWN(1);
      } else if (data.result[0].normal === "1") {
        setSelectedWN(0);
      }
      if (data.result[0].short === 1) {
        setIsShortChecked(true);
      }
      if (data.result[0].long === 1) {
        setIsLongChecked(true);
      }
      setSelectedButtonShort(data.result[0].shortType);
      setSelectedButtonLong(data.result[0].longType);
      setShortSizeValue(data.result[0].shortSize);
      setLongSizeValue(data.result[0].longSize);
      setDeleteId(data.result[0].id);
    } catch (error) {
      //console.error("Error fetching Sleeve Details:", error);
    }
  };

  useEffect(() => {
    fetchSleeve();
  }, []);

  const handleSubmit = async () => {
    const response = await fetch(
      `${BASE_URL}/InquirySleeve/AddOrUpdateSleeve`,
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
          Wrangler: selectedWN == 1 ? "1" : "0",
          Normal: selectedWN == 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: selectedButtonShort ? selectedButtonShort : 9,
          Long: isLongChecked ? 1 : 0,
          LongType: selectedButtonLong ? selectedButtonLong : 9,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed");
    }
    router.push(`/inquiry/tshirt/document-panel/?inqType=${inqType}`);
  };

  const handleDelete = async (id) => {
    const response = await fetch(
      `${BASE_URL}/InquirySleeve/DeleteSleeve?id=${id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    window.location.reload();
  };

  return (
    <>
      <DashboardHeader
        customerName={customerName}
        optionName={optionName}
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
          <Typography fontWeight="bold">Sleeve</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button
              disabled={!deleteId}
              onClick={() => handleDelete(deleteId)}
              variant="outlined"
              color="error"
            >
              <CachedIcon />
            </Button>
            <Link href={generateLink(neck)}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href="/inquiry/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
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
          <RadioGroup name="wn" value={selectedWN} onChange={handleWNChange}>
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
                    value={0}
                    control={<Radio />}
                    label="Normal Sleeve"
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
                    value={1}
                    control={<Radio />}
                    label="Ranglan Sleeve"
                  />
                </Card>
              </Grid>
            </Grid>
          </RadioGroup>

          <Grid container>
            <Grid item xs={12} p={1}>
              <Grid container>
                <Grid item xs={12}>
                  <Button>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isShortChecked}
                          onChange={handleShortChange}
                        />
                      }
                      label="Short"
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} lg={9}>
                  <ButtonGroup
                    sx={{ height: "100%" }}
                    fullWidth
                    disabled={!isShortChecked}
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button
                      variant={
                        selectedButtonShort === 1 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(1)}
                    >
                      HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 2 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(2)}
                    >
                      Double HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 3 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(3)}
                    >
                      KNITTED CUFF
                    </Button>
                    <Button
                      variant={
                        selectedButtonShort === 4 ? "contained" : "outlined"
                      }
                      onClick={() => handleShortButtonClick(4)}
                    >
                      FABRIC CUFF
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Not Selected
                    </InputLabel>
                    <Select
                      disabled={!isShortChecked}
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Not Selected"
                      onChange={handleShortSizeChange}
                      value={isShortChecked ? shortSizeValue : ""}
                    >
                      <MenuItem value={1}>7/8</MenuItem>
                      <MenuItem value={2}>5/8</MenuItem>
                      <MenuItem value={3}>1"</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} p={1}>
              <Grid container>
                <Grid item xs={12}>
                  <Button>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isLongChecked}
                          onChange={handleLongChange}
                        />
                      }
                      label="Long"
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} lg={9}>
                  <ButtonGroup
                    sx={{ height: "100%" }}
                    fullWidth
                    disabled={!isLongChecked}
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button
                      variant={
                        selectedButtonLong === 5 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(5)}
                    >
                      HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 6 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(6)}
                    >
                      Double HEM
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 7 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(7)}
                    >
                      KNITTED CUFF
                    </Button>
                    <Button
                      variant={
                        selectedButtonLong === 8 ? "contained" : "outlined"
                      }
                      onClick={() => handleLongButtonClick(8)}
                    >
                      FABRIC CUFF
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Not Selected
                    </InputLabel>
                    <Select
                      disabled={!isLongChecked}
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Not Selected"
                      value={isLongChecked ? longSizeValue : ""}
                      onChange={handleLongSizeChange}
                    >
                      <MenuItem value={1}>7/8</MenuItem>
                      <MenuItem value={2}>8/5</MenuItem>
                      <MenuItem value={3}>1"</MenuItem>
                      <MenuItem value={4}>2"</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
