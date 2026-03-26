import React, { useEffect, useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CachedIcon from "@mui/icons-material/Cached";

export default function TechPackTshirtSleeve() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWN, setSelectedWN] = useState(0);
  const [isShortChecked, setIsShortChecked] = useState(false);
  const [isLongChecked, setIsLongChecked] = useState(false);
  const [selectedButtonShort, setSelectedButtonShort] = useState();
  const [shortSizeValue, setShortSizeValue] = useState(1);
  const [longSizeValue, setLongSizeValue] = useState(1);
  const [selectedButtonLong, setSelectedButtonLong] = useState();
  const [sleeveId, setSleeveId] = useState(null);

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
        fetchSleeveData(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSleeveData = async (ongoingId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingSleeve?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
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
        if (data.result) {
          if (data.result.wrangler === "1") {
            setSelectedWN(1);
          } else if (data.result.normal === "1") {
            setSelectedWN(0);
          }
          if (data.result.short === 1) {
            setIsShortChecked(true);
          }
          if (data.result.long === 1) {
            setIsLongChecked(true);
          }
          setSelectedButtonShort(data.result.shortType);
          setSelectedButtonLong(data.result.longType);
          setShortSizeValue(data.result.shortSize || 1);
          setLongSizeValue(data.result.longSize || 1);
          setSleeveId(data.result.id);
        }
      }
    } catch (error) {
      console.error("Error fetching sleeve data:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/neck",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/tshirt/document-panel",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const handleWNChange = async (event) => {
    const newValue = parseInt(event.target.value);
    setSelectedWN(newValue);
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: newValue === 1 ? "1" : "0",
          Normal: newValue === 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: selectedButtonShort || 9,
          Long: isLongChecked ? 1 : 0,
          LongType: selectedButtonLong || 9,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Sleeve type updated successfully");
        fetchSleeveData(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch (error) {
      console.error("Error updating sleeve:", error);
      toast.error("Failed to update sleeve type");
    }
  };

  const handleShortChange = async () => {
    const newValue = !isShortChecked;
    setIsShortChecked(newValue);
    
    if (newValue && isLongChecked) {
      setIsLongChecked(false);
    }
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: selectedWN === 1 ? "1" : "0",
          Normal: selectedWN === 1 ? "0" : "1",
          Short: newValue ? 1 : 0,
          ShortType: selectedButtonShort || 9,
          Long: isLongChecked && !newValue ? 1 : 0,
          LongType: selectedButtonLong || 9,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Short sleeve updated");
        fetchSleeveData(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleLongChange = async () => {
    const newValue = !isLongChecked;
    setIsLongChecked(newValue);
    
    if (newValue && isShortChecked) {
      setIsShortChecked(false);
    }
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: selectedWN === 1 ? "1" : "0",
          Normal: selectedWN === 1 ? "0" : "1",
          Short: isShortChecked && !newValue ? 1 : 0,
          ShortType: selectedButtonShort || 9,
          Long: newValue ? 1 : 0,
          LongType: selectedButtonLong || 9,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Long sleeve updated");
        fetchSleeveData(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleShortButtonClick = async (index) => {
    setSelectedButtonShort(index);
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: selectedWN === 1 ? "1" : "0",
          Normal: selectedWN === 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: index,
          Long: isLongChecked ? 1 : 0,
          LongType: selectedButtonLong || 9,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Short sleeve type updated");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleLongButtonClick = async (index) => {
    setSelectedButtonLong(index);
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: selectedWN === 1 ? "1" : "0",
          Normal: selectedWN === 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: selectedButtonShort || 9,
          Long: isLongChecked ? 1 : 0,
          LongType: index,
          ShortSize: shortSizeValue,
          LongSize: longSizeValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Long sleeve type updated");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleShortSizeChange = async (event) => {
    const newValue = parseInt(event.target.value);
    setShortSizeValue(newValue);
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: selectedWN === 1 ? "1" : "0",
          Normal: selectedWN === 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: selectedButtonShort || 9,
          Long: isLongChecked ? 1 : 0,
          LongType: selectedButtonLong || 9,
          ShortSize: newValue,
          LongSize: longSizeValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Short size updated");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleLongSizeChange = async (event) => {
    const newValue = parseInt(event.target.value);
    setLongSizeValue(newValue);
    
    if (!inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
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
          Wrangler: selectedWN === 1 ? "1" : "0",
          Normal: selectedWN === 1 ? "0" : "1",
          Short: isShortChecked ? 1 : 0,
          ShortType: selectedButtonShort || 9,
          Long: isLongChecked ? 1 : 0,
          LongType: selectedButtonLong || 9,
          ShortSize: shortSizeValue,
          LongSize: newValue,
          UpdateRowNumber: 0,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Long size updated");
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!sleeveId || !inquiry) return;

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingSleeve?id=${sleeveId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Sleeve deleted successfully");
        // Reset state
        setSelectedWN(0);
        setIsShortChecked(false);
        setIsLongChecked(false);
        setSelectedButtonShort(null);
        setSelectedButtonLong(null);
        setShortSizeValue(1);
        setLongSizeValue(1);
        setSleeveId(null);
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete sleeve");
    }
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
        title="Sleeve - Tech Pack"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Sleeve</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button
              disabled={!sleeveId}
              onClick={handleDelete}
              variant="outlined"
              color="error"
            >
              <CachedIcon />
            </Button>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button variant="outlined" color="primary" endIcon={<NavigateNextIcon />} onClick={navToNext}>
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
                    control={<Radio checked={selectedWN === 0} />}
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
                    control={<Radio checked={selectedWN === 1} />}
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
                      control={<Checkbox checked={isShortChecked} onChange={handleShortChange} />}
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
                      variant={selectedButtonShort === 1 ? "contained" : "outlined"}
                      onClick={() => handleShortButtonClick(1)}
                    >
                      HEM
                    </Button>
                    <Button 
                      variant={selectedButtonShort === 2 ? "contained" : "outlined"}
                      onClick={() => handleShortButtonClick(2)}
                    >
                      Double HEM
                    </Button>
                    <Button 
                      variant={selectedButtonShort === 3 ? "contained" : "outlined"}
                      onClick={() => handleShortButtonClick(3)}
                    >
                      KNITTED CUFF
                    </Button>
                    <Button 
                      variant={selectedButtonShort === 10 ? "contained" : "outlined"}
                      onClick={() => handleShortButtonClick(10)}
                    >
                      TIFFIN KNITTED CUFF
                    </Button>
                    <Button 
                      variant={selectedButtonShort === 4 ? "contained" : "outlined"}
                      onClick={() => handleShortButtonClick(4)}
                    >
                      FABRIC CUFF
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth disabled={!isShortChecked}>
                    <InputLabel>Size</InputLabel>
                    <Select 
                      label="Size" 
                      value={isShortChecked ? shortSizeValue : ""}
                      onChange={handleShortSizeChange}
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
                      control={<Checkbox checked={isLongChecked} onChange={handleLongChange} />}
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
                      variant={selectedButtonLong === 5 ? "contained" : "outlined"}
                      onClick={() => handleLongButtonClick(5)}
                    >
                      HEM
                    </Button>
                    <Button 
                      variant={selectedButtonLong === 6 ? "contained" : "outlined"}
                      onClick={() => handleLongButtonClick(6)}
                    >
                      Double HEM
                    </Button>
                    <Button 
                      variant={selectedButtonLong === 7 ? "contained" : "outlined"}
                      onClick={() => handleLongButtonClick(7)}
                    >
                      KNITTED CUFF
                    </Button>
                    <Button 
                      variant={selectedButtonLong === 10 ? "contained" : "outlined"}
                      onClick={() => handleLongButtonClick(10)}
                    >
                      TIFFIN KNITTED CUFF
                    </Button>
                    <Button 
                      variant={selectedButtonLong === 8 ? "contained" : "outlined"}
                      onClick={() => handleLongButtonClick(8)}
                    >
                      FABRIC CUFF
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item pl={1} xs={12} lg={3}>
                  <FormControl fullWidth disabled={!isLongChecked}>
                    <InputLabel>Size</InputLabel>
                    <Select 
                      label="Size" 
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
