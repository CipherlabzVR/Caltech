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
  const [selectedButtonType, setSelectedButtonType] = useState(0);
  const [neckTypeId, setNeckTypeId] = useState(null);
  const [colorCodeList, setColorCodeList] = useState([]);
  const [innerPlacketColorCodeId, setInnerPlacketColorCodeId] = useState(0);
  const [outerPlacketColorCodeId, setOuterPlacketColorCodeId] = useState(0);
  const [sideVent, setSideVent] = useState("2");
  const [shoulderOutline, setShoulderOutline] = useState("2");
  const [aHoleOutline, setAHoleOutline] = useState("2");

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
        fetchColorCodes();
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

  const applyPoloNeckValues = (neckData, { resetNeckTypeId = false } = {}) => {
    if (!neckData) return;
    setSelectedCLR(neckData.neckFirstRows?.toString() || "");
    setSelectedButton(neckData.neck2ndRowS || 0);
    setSelectedButtonPlacket(neckData.neck3rdRowS || 0);
    setSelectedButtonValue(parseInt(neckData.poloButton || neckData.pOLOButton) || 2);
    setSelectedButtonType(
      Number(
        neckData.buttonType ??
          neckData.buttonTypes ??
          neckData.ButtonType ??
          neckData.ButtonTypes ??
          0
      ) || 0
    );
    setSelectedLength(parseFloat(neckData.poloLength || neckData.pOLOlength) || 6);
    setSelectedWidth(parseFloat(neckData.poloWidth || neckData.pOLOWidth) || 1.25);
    setInnerPlacketColorCodeId(
      Number(
        neckData.innerPlacketColorCodeId ??
          neckData.innerPlacketColorId ??
          neckData.innerPlacketColorCodeID ??
          0
      ) || 0
    );
    setOuterPlacketColorCodeId(
      Number(
        neckData.outerPlacketColorCodeId ??
          neckData.outerPlacketColorId ??
          neckData.outerPlacketColorCodeID ??
          0
      ) || 0
    );
    const sideVentValue =
      neckData.sideVent ??
      neckData.sideVents ??
      neckData.sideVentType ??
      neckData.sideVentStatus ??
      2;
    const normalizedSideVent =
      sideVentValue === true ||
      sideVentValue === "true" ||
      sideVentValue === "True" ||
      Number(sideVentValue) === 1
        ? "1"
        : "2";
    setSideVent(normalizedSideVent);
    const shoulderOutlineValue =
      neckData.shoulderOutline ??
      neckData.shoulderOutlines ??
      neckData.ShoulderOutline ??
      neckData.ShoulderOutlines ??
      2;
    setShoulderOutline(String(Number(shoulderOutlineValue) === 1 ? 1 : 2));
    const aHoleOutlineValue =
      neckData.aHoleOutline ??
      neckData.aholeOutline ??
      neckData.AHoleOutline ??
      neckData.AholeOutline ??
      2;
    setAHoleOutline(String(Number(aHoleOutlineValue) === 1 ? 1 : 2));
    if (resetNeckTypeId) {
      setNeckTypeId(null);
    } else {
      setNeckTypeId(neckData.id || null);
    }
  };

  const fetchInquiryPoloDefaults = async (windowType) => {
    if (!inquiryId || !optionId || !windowType) return;
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
      if (!response.ok) return;
      const data = await response.json();
      const inquiryPolo = Array.isArray(data?.result) ? data.result[0] : null;
      if (!inquiryPolo) return;
      applyPoloNeckValues(inquiryPolo, { resetNeckTypeId: true });
    } catch (error) {
      console.error("Error fetching inquiry polo defaults:", error);
    }
  };

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
          applyPoloNeckValues(data.result);
        } else {
          await fetchInquiryPoloDefaults(windowType);
        }
      } else {
        await fetchInquiryPoloDefaults(windowType);
      }
    } catch (error) {
      console.error("Error fetching neck types:", error);
      await fetchInquiryPoloDefaults(windowType);
    }
  };

  const fetchColorCodes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/ColorCode/GetAllColorCode`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return;
      const data = await response.json();
      const list = Array.isArray(data?.result) ? data.result : [];
      setColorCodeList(
        list
          .filter((item) => item?.isActive !== false)
          .map((item) => ({ id: Number(item.id) || 0, name: item.name || "" }))
          .filter((item) => item.id > 0 && item.name)
      );
    } catch (error) {
      console.error("Error fetching color codes:", error);
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

  const handleButtonTypeChange = (event) => {
    setSelectedButtonType(event.target.value);
  };

  const getColorCodeNameById = (id) => {
    const targetId = Number(id);
    if (!targetId) return "";
    return colorCodeList.find((item) => item.id === targetId)?.name || "";
  };

  const savePoloNeck = async ({ showSuccessToast = true } = {}) => {
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
          ButtonType: Number(selectedButtonType) || null,
          InnerPlacketColorCodeId: Number(innerPlacketColorCodeId) || 0,
          InnerPlacketColorCodeName: getColorCodeNameById(innerPlacketColorCodeId),
          OuterPlacketColorCodeId: Number(outerPlacketColorCodeId) || 0,
          OuterPlacketColorCodeName: getColorCodeNameById(outerPlacketColorCodeId),
          SideVent: Number(sideVent) === 1,
          ShoulderOutline: Number(shoulderOutline) === 1,
          AHoleOutline: Number(aHoleOutline) === 1,
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        if (showSuccessToast) {
          toast.success("Polo neck details saved successfully");
        }
        fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        return true;
      } else {
        toast.error(data.message || "Failed to save");
        return false;
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save polo neck details");
      return false;
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
            ButtonType: null,
            InnerPlacketColorCodeId: 0,
            InnerPlacketColorCodeName: "",
            OuterPlacketColorCodeId: 0,
            OuterPlacketColorCodeName: "",
            SideVent: false,
            ShoulderOutline: false,
            AHoleOutline: false,
          }),
        }
      );

      if (response.ok) {
        toast.success("Polo neck details reset");
        setSelectedButtonType(0);
        setInnerPlacketColorCodeId(0);
        setOuterPlacketColorCodeId(0);
        setSideVent("2");
        setShoulderOutline("2");
        setAHoleOutline("2");
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

  const navToNext = async () => {
    if (!innerPlacketColorCodeId || !outerPlacketColorCodeId) {
      toast.warning("Please select both Inner and Outer Placket Color before next.");
      return;
    }
    const isSaved = await savePoloNeck({ showSuccessToast: false });
    if (!isSaved) return;
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
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <Typography
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Button Type
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="button-type-label">Button Type</InputLabel>
                    <Select
                      labelId="button-type-label"
                      id="button-type"
                      label="Button Type"
                      value={selectedButtonType}
                      onChange={handleButtonTypeChange}
                    >
                      <MenuItem value={0}>None</MenuItem>
                      <MenuItem value={1}>Glass</MenuItem>
                      <MenuItem value={2}>Client&apos;s</MenuItem>
                    </Select>
                  </FormControl>
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
                    Inner Placket Color
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="inner-placket-color-label">Inner Placket Color</InputLabel>
                    <Select
                      labelId="inner-placket-color-label"
                      id="inner-placket-color"
                      label="Inner Placket Color"
                      value={innerPlacketColorCodeId}
                      onChange={(event) =>
                        setInnerPlacketColorCodeId(Number(event.target.value) || 0)
                      }
                    >
                      <MenuItem value={0}>None</MenuItem>
                      {colorCodeList.map((color) => (
                        <MenuItem key={`inner-color-${color.id}`} value={color.id}>
                          {color.name}
                        </MenuItem>
                      ))}
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
                    Outer Placket Color
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="outer-placket-color-label">Outer Placket Color</InputLabel>
                    <Select
                      labelId="outer-placket-color-label"
                      id="outer-placket-color"
                      label="Outer Placket Color"
                      value={outerPlacketColorCodeId}
                      onChange={(event) =>
                        setOuterPlacketColorCodeId(Number(event.target.value) || 0)
                      }
                    >
                      <MenuItem value={0}>None</MenuItem>
                      {colorCodeList.map((color) => (
                        <MenuItem key={`outer-color-${color.id}`} value={color.id}>
                          {color.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                    Side Vent
                  </Typography>
                  <RadioGroup
                    row
                    name="side-vent"
                    value={sideVent}
                    onChange={(event) => setSideVent(event.target.value)}
                  >
                    <FormControlLabel value="1" control={<Radio />} label="Yes" />
                    <FormControlLabel value="2" control={<Radio />} label="No" />
                  </RadioGroup>
                </Grid>
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <Typography
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    Shoulder Outline
                  </Typography>
                  <RadioGroup
                    row
                    name="shoulder-outline"
                    value={shoulderOutline}
                    onChange={(event) => setShoulderOutline(event.target.value)}
                  >
                    <FormControlLabel value="1" control={<Radio />} label="Yes" />
                    <FormControlLabel value="2" control={<Radio />} label="No" />
                  </RadioGroup>
                </Grid>
                <Grid item p={1} xs={12} lg={3} md={6}>
                  <Typography
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "12px",
                    }}
                  >
                    A/Hole Outline
                  </Typography>
                  <RadioGroup
                    row
                    name="a-hole-outline"
                    value={aHoleOutline}
                    onChange={(event) => setAHoleOutline(event.target.value)}
                  >
                    <FormControlLabel value="1" control={<Radio />} label="Yes" />
                    <FormControlLabel value="2" control={<Radio />} label="No" />
                  </RadioGroup>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}

