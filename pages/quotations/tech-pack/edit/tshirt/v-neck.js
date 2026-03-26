import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackVNeck() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedButtonVN, setSelectedButtonVN] = useState(0);
  const [isVNChecked, setIsVNChecked] = useState(false);
  const [selectedButtonCVN, setSelectedButtonCVN] = useState(0);
  const [isCVNChecked, setIsCVNChecked] = useState(false);
  const [selectedButtonFCVN, setSelectedButtonFCVN] = useState(0);
  const [isFCVNChecked, setIsFCVNChecked] = useState(false);
  const [vNId, setVNId] = useState(null);
  const [cVNId, setCVNId] = useState(null);
  const [fCVNId, setFCVNId] = useState(null);

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
        `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}&necKTypes=3`,
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
        if (data.result && Array.isArray(data.result)) {
          data.result.forEach((item) => {
            if (item.neckFirstRows === 7) {
              setVNId(item.id);
              setIsVNChecked(true);
              setSelectedButtonVN(item.neck2ndRowS || 0);
            }
            if (item.neckFirstRows === 8) {
              setCVNId(item.id);
              setIsCVNChecked(true);
              setSelectedButtonCVN(item.neck2ndRowS || 0);
            }
            if (item.neckFirstRows === 9) {
              setFCVNId(item.id);
              setIsFCVNChecked(true);
              setSelectedButtonFCVN(item.neck2ndRowS || 0);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching neck types:", error);
    }
  };

  const handleVNChange = async (event) => {
    const isChecked = event.target.checked;
    setIsVNChecked(isChecked);
    
    if (!inquiry) return;

    try {
      if (isChecked) {
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
            NecKTypes: 3,
            NeckFirstRows: 7,
            Neck2ndRowS: selectedButtonVN || 9,
            Neck3rdRowS: 6,
            POLOlength: "0",
            POLOWidth: "0",
            POLOButton: "0",
          }),
        });

        const data = await response.json();
        if (data.statusCode === 200) {
          toast.success("V Neck added");
          fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        } else {
          toast.error(data.message || "Failed to add");
          setIsVNChecked(false);
        }
      } else {
        if (vNId) {
          const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${vNId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Removed");
            setVNId(null);
            setSelectedButtonVN(0);
            fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
          } else {
            toast.error(data.message || "Failed to remove");
            setIsVNChecked(true);
          }
        }
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
      setIsVNChecked(!isChecked);
    }
  };

  const handleCVNChange = async (event) => {
    const isChecked = event.target.checked;
    setIsCVNChecked(isChecked);
    
    if (!inquiry) return;

    try {
      if (isChecked) {
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
            NecKTypes: 3,
            NeckFirstRows: 8,
            Neck2ndRowS: selectedButtonCVN || 9,
            Neck3rdRowS: 6,
            POLOlength: "0",
            POLOWidth: "0",
            POLOButton: "0",
          }),
        });

        const data = await response.json();
        if (data.statusCode === 200) {
          toast.success("Chinese V Neck added");
          fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        } else {
          toast.error(data.message || "Failed to add");
          setIsCVNChecked(false);
        }
      } else {
        if (cVNId) {
          const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${cVNId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Removed");
            setCVNId(null);
            setSelectedButtonCVN(0);
            fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
          } else {
            toast.error(data.message || "Failed to remove");
            setIsCVNChecked(true);
          }
        }
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
      setIsCVNChecked(!isChecked);
    }
  };

  const handleFCVNChange = async (event) => {
    const isChecked = event.target.checked;
    setIsFCVNChecked(isChecked);
    
    if (!inquiry) return;

    try {
      if (isChecked) {
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
            NecKTypes: 3,
            NeckFirstRows: 9,
            Neck2ndRowS: selectedButtonFCVN || 9,
            Neck3rdRowS: 6,
            POLOlength: "0",
            POLOWidth: "0",
            POLOButton: "0",
          }),
        });

        const data = await response.json();
        if (data.statusCode === 200) {
          toast.success("Full Collar V Neck added");
          fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        } else {
          toast.error(data.message || "Failed to add");
          setIsFCVNChecked(false);
        }
      } else {
        if (fCVNId) {
          const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${fCVNId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Removed");
            setFCVNId(null);
            setSelectedButtonFCVN(0);
            fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
          } else {
            toast.error(data.message || "Failed to remove");
            setIsFCVNChecked(true);
          }
        }
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
      setIsFCVNChecked(!isChecked);
    }
  };

  const handleVNButtonClick = async (index) => {
    setSelectedButtonVN(index);
    
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
          NecKTypes: 3,
          NeckFirstRows: 7,
          Neck2ndRowS: index,
          Neck3rdRowS: 6,
          POLOlength: "0",
          POLOWidth: "0",
          POLOButton: "0",
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Updated successfully");
        fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleCVNButtonClick = async (index) => {
    setSelectedButtonCVN(index);
    
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
          NecKTypes: 3,
          NeckFirstRows: 8,
          Neck2ndRowS: index,
          Neck3rdRowS: 6,
          POLOlength: "0",
          POLOWidth: "0",
          POLOButton: "0",
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Updated successfully");
        fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
    }
  };

  const handleFCVNButtonClick = async (index) => {
    setSelectedButtonFCVN(index);
    
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
          NecKTypes: 3,
          NeckFirstRows: 9,
          Neck2ndRowS: index,
          Neck3rdRowS: 6,
          POLOlength: "0",
          POLOWidth: "0",
          POLOButton: "0",
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Updated successfully");
        fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
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
        title="V Neck"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">V Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button
              onClick={navToNext}
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
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
                    <Checkbox checked={isVNChecked} onChange={handleVNChange} />
                  }
                  label="V Neck"
                />
                {isVNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={selectedButtonVN === 5 ? "contained" : "outlined"}
                        onClick={() => handleVNButtonClick(5)}
                      >
                        RIB
                      </Button>
                      <Button
                        variant={selectedButtonVN === 6 ? "contained" : "outlined"}
                        onClick={() => handleVNButtonClick(6)}
                      >
                        Fabric
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
                    <Checkbox checked={isCVNChecked} onChange={handleCVNChange} />
                  }
                  label="Chinese V Neck"
                />
                {isCVNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={selectedButtonCVN === 3 ? "contained" : "outlined"}
                        onClick={() => handleCVNButtonClick(3)}
                      >
                        Normal
                      </Button>
                      <Button
                        variant={selectedButtonCVN === 4 ? "contained" : "outlined"}
                        onClick={() => handleCVNButtonClick(4)}
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
                    <Checkbox checked={isFCVNChecked} onChange={handleFCVNChange} />
                  }
                  label="Full Collar V Neck"
                />
                {isFCVNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={selectedButtonFCVN === 3 ? "contained" : "outlined"}
                        onClick={() => handleFCVNButtonClick(3)}
                      >
                        Normal
                      </Button>
                      <Button
                        variant={selectedButtonFCVN === 4 ? "contained" : "outlined"}
                        onClick={() => handleFCVNButtonClick(4)}
                      >
                        1/8 Line
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

