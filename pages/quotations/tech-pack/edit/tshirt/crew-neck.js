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

export default function TechPackCrewNeck() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedButtonCCCN, setSelectedButtonCCCN] = useState(0);
  const [isCCCNChecked, setIsCCCNChecked] = useState(false);
  const [cCCNId, setCCCNId] = useState(null);
  const [cNId, setCNId] = useState(null);
  const [selectedButtonCN, setSelectedButtonCN] = useState(0);
  const [isCNChecked, setIsCNChecked] = useState(false);

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
        `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}&necKTypes=2`,
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
            if (item.neckFirstRows === 5) {
              setCCCNId(item.id);
              setIsCCCNChecked(true);
              setSelectedButtonCCCN(item.neck2ndRowS || 0);
            }
            if (item.neckFirstRows === 6) {
              setCNId(item.id);
              setIsCNChecked(true);
              setSelectedButtonCN(item.neck2ndRowS || 0);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching neck types:", error);
    }
  };

  const handleCCCNChange = async (event) => {
    const isChecked = event.target.checked;
    setIsCCCNChecked(isChecked);
    
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
            NecKTypes: 2,
            NeckFirstRows: 5,
            Neck2ndRowS: selectedButtonCCCN || 9,
            Neck3rdRowS: 6,
            POLOlength: "0",
            POLOWidth: "0",
            POLOButton: "0",
          }),
        });

        const data = await response.json();
        if (data.statusCode === 200) {
          toast.success("Chinese Collar Crew Neck added");
          fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        } else {
          toast.error(data.message || "Failed to add");
          setIsCCCNChecked(false);
        }
      } else {
        if (cCCNId) {
          const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${cCCNId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Removed");
            setCCCNId(null);
            setSelectedButtonCCCN(0);
            fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
          } else {
            toast.error(data.message || "Failed to remove");
            setIsCCCNChecked(true);
          }
        }
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
      setIsCCCNChecked(!isChecked);
    }
  };

  const handleCCCNButtonClick = async (index) => {
    setSelectedButtonCCCN(index);
    
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
          NecKTypes: 2,
          NeckFirstRows: 5,
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

  const handleCNChange = async (event) => {
    const isChecked = event.target.checked;
    setIsCNChecked(isChecked);
    
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
            NecKTypes: 2,
            NeckFirstRows: 6,
            Neck2ndRowS: selectedButtonCN || 9,
            Neck3rdRowS: 6,
            POLOlength: "0",
            POLOWidth: "0",
            POLOButton: "0",
          }),
        });

        const data = await response.json();
        if (data.statusCode === 200) {
          toast.success("Crew Neck added");
          fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        } else {
          toast.error(data.message || "Failed to add");
          setIsCNChecked(false);
        }
      } else {
        if (cNId) {
          const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${cNId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Removed");
            setCNId(null);
            setSelectedButtonCN(0);
            fetchNeckTypes(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
          } else {
            toast.error(data.message || "Failed to remove");
            setIsCNChecked(true);
          }
        }
      }
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Failed to update");
      setIsCNChecked(!isChecked);
    }
  };

  const handleCNButtonClick = async (index) => {
    setSelectedButtonCN(index);
    
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
          NecKTypes: 2,
          NeckFirstRows: 6,
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
        title="Crew Neck"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Crew Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
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
                    <Checkbox checked={isCCCNChecked} onChange={handleCCCNChange} />
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
                        variant={selectedButtonCCCN === 3 ? "contained" : "outlined"}
                        onClick={() => handleCCCNButtonClick(3)}
                      >
                        Normal
                      </Button>
                      <Button
                        variant={selectedButtonCCCN === 4 ? "contained" : "outlined"}
                        onClick={() => handleCCCNButtonClick(4)}
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
                    <Checkbox checked={isCNChecked} onChange={handleCNChange} />
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
                        variant={selectedButtonCN === 5 ? "contained" : "outlined"}
                        onClick={() => handleCNButtonClick(5)}
                      >
                        RIB
                      </Button>
                      <Button
                        variant={selectedButtonCN === 6 ? "contained" : "outlined"}
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

