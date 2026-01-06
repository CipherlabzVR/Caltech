import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Typography,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import BASE_URL from "Base/api";
import CachedIcon from "@mui/icons-material/Cached";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function PoloNeck() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [selectedCLR, setSelectedCLR] = useState("");
  const [selectedButton, setSelectedButton] = useState(0);
  const [selectedButtonPlacket, setSelectedButtonPlacket] = useState(0);
  const [selectedLength, setSelectedLength] = useState(6);
  const [message, setMessage] = useState("");
  const [selectedWidth, setSelectedWidth] = useState(1.25);
  const [selectedButtonValue, setSelectedButtonValue] = useState(2);
  const [deleteId, setDeleteId] = useState();

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

  const handleButtonClick = (index) => {
    setSelectedButton(index === selectedButton ? null : index);
    setMessage("");
  };

  const handlePlacketButtonClick = (index) => {
    setSelectedButtonPlacket(index === selectedButtonPlacket ? null : index);
  };

  const handleCLRChange = (event) => {
    setSelectedCLR(event.target.value);
  };

  const fetchNeckTypes = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=1`,
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

      setSelectedCLR(data.result[0].neckFirstRows);
      setSelectedButton(data.result[0].neck2ndRowS);
      setSelectedButtonPlacket(data.result[0].neck3rdRowS);
      setSelectedButtonValue(data.result[0].poloButton);
      setSelectedLength(data.result[0].polOlength);
      setSelectedWidth(data.result[0].poloWidth);
      setDeleteId(data.result[0].id);
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };

  const handleLengthChange = (event) => {
    setSelectedLength(event.target.value);
  };

  const handleWidthChange = (event) => {
    setSelectedWidth(event.target.value);
  };

  const handleButtonValueChange = (event) => {
    setSelectedButtonValue(event.target.value);
  };

  const handleSubmit = async () => {
    if (selectedButton != null) {
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
            NecKTypes: 1,
            NeckFirstRows: parseInt(selectedCLR ? selectedCLR : 10),
            Neck2ndRowS: selectedButton ? selectedButton : 9,
            Neck3rdRowS: selectedButtonPlacket ? selectedButtonPlacket : 6,
            POLOlength: String(selectedLength),
            POLOWidth: String(selectedWidth),
            POLOButton: String(selectedButtonValue),
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
      setMessage("");
      router.push(`/inquiry/edit-inquiry/tshirt/sleeve/?id=${inquiry ? inquiry.inquiryId : ""}&neck=1&option=${inquiry ? inquiry.optionId: ""}`);
    } else {
      setMessage("Required *");
    }
  };

  const handleDelete = async (id) => {
    const response = await fetch(
      `${BASE_URL}/InquiryNeck/DeleteNeckTypes?id=${id}`,
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
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Polo Neck"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">POLO - Coller</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button
              disabled={!deleteId}
              onClick={() => handleDelete(deleteId)}
              variant="outlined"
              color="error"
            >
              <CachedIcon />
            </Button>
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
          <RadioGroup name="clr" value={selectedCLR} onChange={handleCLRChange}>
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
                  <Grid container>
                    <Grid
                      item
                      display="flex"
                      justifyContent="space-between"
                      xs={12}
                    >
                      <FormControlLabel
                        value="1"
                        control={<Radio />}
                        label="PLAIN KNITTED COLLAR"
                      />
                    </Grid>
                  </Grid>
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
                  <Grid container>
                    <Grid
                      item
                      display="flex"
                      justifyContent="space-between"
                      xs={12}
                    >
                      <FormControlLabel
                        value="2"
                        control={<Radio />}
                        label="TIFFIN KNITTED COLLAR"
                      />
                    </Grid>
                  </Grid>
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
                  <Grid container>
                    <Grid
                      item
                      display="flex"
                      justifyContent="space-between"
                      xs={12}
                    >
                      <FormControlLabel
                        value="3"
                        control={<Radio />}
                        label="SELF FABRIC COLLAR"
                      />
                    </Grid>
                  </Grid>
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
                  <Grid container>
                    <Grid
                      item
                      display="flex"
                      justifyContent="space-between"
                      xs={12}
                    >
                      <FormControlLabel
                        value="4"
                        control={<Radio />}
                        label="SELF FABRIC COLLAR WITH PIE PIN"
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </RadioGroup>
        </Grid>

        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <Typography color="error">{message ? message : ""}</Typography>
              <ButtonGroup disableElevation aria-label="Disabled button group">
                <Button
                  variant={selectedButton === 1 ? "contained" : "outlined"}
                  onClick={() => handleButtonClick(1)}
                >
                  Full Collar
                </Button>
                <Button
                  variant={selectedButton === 2 ? "contained" : "outlined"}
                  onClick={() => handleButtonClick(2)}
                >
                  Chinese Collar
                </Button>
              </ButtonGroup>
            </Grid>
            <Grid item xs={12}>
              <Grid container>
                <Grid item p={1} xs={12}>
                  <Typography fontWeight="bold">Placket</Typography>
                </Grid>
                <Grid item p={1} xs={12} lg={12}>
                  <ButtonGroup
                    fullWidth
                    disableElevation
                    aria-label="Disabled button group"
                  >
                    <Button
                      fullWidth
                      variant={
                        selectedButtonPlacket === 1 ? "contained" : "outlined"
                      }
                      onClick={() => handlePlacketButtonClick(1)}
                    >
                      Single Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={
                        selectedButtonPlacket === 2 ? "contained" : "outlined"
                      }
                      onClick={() => handlePlacketButtonClick(2)}
                    >
                      Piping Single Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={
                        selectedButtonPlacket === 3 ? "contained" : "outlined"
                      }
                      onClick={() => handlePlacketButtonClick(3)}
                    >
                      Single Color Double Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={
                        selectedButtonPlacket === 4 ? "contained" : "outlined"
                      }
                      onClick={() => handlePlacketButtonClick(4)}
                    >
                      Double Color Double Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={
                        selectedButtonPlacket === 5 ? "contained" : "outlined"
                      }
                      onClick={() => handlePlacketButtonClick(5)}
                    >
                      Zipper
                    </Button>
                  </ButtonGroup>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Grid container>
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Length (Inches)
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Length
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Length"
                      value={selectedLength}
                      onChange={handleLengthChange}
                    >
                      <MenuItem value={4}>4</MenuItem>
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={6}>6</MenuItem>
                      <MenuItem value={7}>7</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Width (Inches)
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Width</InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Width"
                      value={selectedWidth}
                      onChange={handleWidthChange}
                    >
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={1.25}>1.25</MenuItem>
                      <MenuItem value={1.5}>1.5</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Buttons
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Buttons
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Buttons"
                      value={selectedButtonValue}
                      onChange={handleButtonValueChange}
                    >
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={4}>4</MenuItem>
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
