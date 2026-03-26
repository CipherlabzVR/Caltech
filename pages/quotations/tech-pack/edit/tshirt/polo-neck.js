import React, { useEffect, useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import BASE_URL from "Base/api";
import CachedIcon from "@mui/icons-material/Cached";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackPoloNeck() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCLR, setSelectedCLR] = useState("");
  const [selectedButton, setSelectedButton] = useState(0);
  const [selectedButtonPlacket, setSelectedButtonPlacket] = useState(0);
  const [selectedLength, setSelectedLength] = useState(6);
  const [message, setMessage] = useState("");
  const [selectedWidth, setSelectedWidth] = useState(1.25);
  const [selectedButtonValue, setSelectedButtonValue] = useState(2);
  const [neckTypeId, setNeckTypeId] = useState(null);

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
        fetchNeckTypes(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const fetchNeckTypes = async (ongoingId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingNeckType?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
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
        if (data.result != null && data.result.necKTypes === 1) {
          setSelectedCLR(data.result.neckFirstRows?.toString() || "");
          setSelectedButton(data.result.neck2ndRowS || 0);
          setSelectedButtonPlacket(data.result.neck3rdRowS || 0);
          setSelectedButtonValue(parseInt(data.result.poloButton || data.result.pOLOButton) || 2);
          setSelectedLength(parseFloat(data.result.poloLength || data.result.pOLOlength) || 6);
          setSelectedWidth(parseFloat(data.result.poloWidth || data.result.pOLOWidth) || 1.25);
          setNeckTypeId(data.result.id);
        }
      }
    } catch (error) {
      console.error("Error fetching neck types:", error);
    }
  };

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

  const handleLengthChange = (event) => {
    setSelectedLength(event.target.value);
  };

  const handleWidthChange = (event) => {
    setSelectedWidth(event.target.value);
  };

  const handleButtonValueChange = (event) => {
    setSelectedButtonValue(event.target.value);
  };

  const handleSave = async () => {
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingNeckType`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: inquiry.ongoingInquiryId,
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
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Polo neck details saved successfully");
        fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save polo neck details");
    }
  };

  const handleDelete = async () => {
    if (!neckTypeId || !inquiry) return;

    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/CreateOrUpdateOngoingNeckType`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            InquiryID: inquiry.ongoingInquiryId,
            InqCode: inquiry.inquiryCode,
            OptionId: inquiry.optionId,
            InqOptionName: inquiry.optionName,
            WindowType: inquiry.windowType,
            NecKTypes: 1,
            NeckFirstRows: 10,
            Neck2ndRowS: 9,
            Neck3rdRowS: 6,
            POLOlength: "0",
            POLOWidth: "0",
            POLOButton: "0",
          }),
        }
      );

      if (response.ok) {
        toast.success("Polo neck details reset");
        fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      }
    } catch (error) {
      console.error("Error resetting:", error);
      toast.error("Failed to reset");
    }
  };

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/neck",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/sleeve",
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
        title="Polo Neck"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">POLO - Coller</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button
              disabled={!neckTypeId}
              onClick={handleDelete}
              variant="outlined"
              color="error"
            >
              <CachedIcon />
            </Button>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button variant="outlined" color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={navToNext}
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
                    <Grid item display="flex" justifyContent="space-between" xs={12}>
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
                    <Grid item display="flex" justifyContent="space-between" xs={12}>
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
                    <Grid item display="flex" justifyContent="space-between" xs={12}>
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
                    <Grid item display="flex" justifyContent="space-between" xs={12}>
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
                      variant={selectedButtonPlacket === 1 ? "contained" : "outlined"}
                      onClick={() => handlePlacketButtonClick(1)}
                    >
                      Single Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={selectedButtonPlacket === 2 ? "contained" : "outlined"}
                      onClick={() => handlePlacketButtonClick(2)}
                    >
                      Piping Single Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={selectedButtonPlacket === 3 ? "contained" : "outlined"}
                      onClick={() => handlePlacketButtonClick(3)}
                    >
                      Single Color Double Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={selectedButtonPlacket === 4 ? "contained" : "outlined"}
                      onClick={() => handlePlacketButtonClick(4)}
                    >
                      Double Color Double Placket
                    </Button>
                    <Button
                      fullWidth
                      variant={selectedButtonPlacket === 5 ? "contained" : "outlined"}
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
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Length (Inches)
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Length</InputLabel>
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
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Buttons
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Buttons</InputLabel>
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

