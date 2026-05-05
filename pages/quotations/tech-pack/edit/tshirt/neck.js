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
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackTshirtNeck() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNeck, setSelectedNeck] = useState("");
  const [neckSelected, setNeckSelected] = useState("");
  const [isChecked, setIsChecked] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [neckBodyIds, setNeckBodyIds] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
  });

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
        fetchNeckData(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNeckData = async (ongoingId, optId, windowType) => {
    try {
      const mapNeckTypeToValue = (type) => {
        const n = Number(type);
        return n === 1 ? "POLO" : n === 2 ? "Crew Neck" : n === 3 ? "V Neck" : "";
      };
      let resolvedNeckValue = "";

      // Fetch neck type
      const neckTypeRes = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingNeckType?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (neckTypeRes.ok) {
        const data = await neckTypeRes.json();
        if (data.result != null) {
          const type =
            Array.isArray(data.result) && data.result.length > 0
              ? Number(data.result[0]?.necKTypes)
              : Number(data.result?.necKTypes);
          const neckValue = mapNeckTypeToValue(type);
          setSelectedNeck(neckValue);
          setNeckSelected(neckValue);
          resolvedNeckValue = neckValue;
        }
      }

      // Fallback for old/inconsistent records:
      // detect existing type via GetAllOngoingNeckTypes if GetOngoingNeckType is empty.
      if (!resolvedNeckValue) {
        const [poloRes, crewRes, vRes] = await Promise.all([
          fetch(
            `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}&necKTypes=1`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}&necKTypes=2`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}&necKTypes=3`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          ),
        ]);

        const [poloJson, crewJson, vJson] = await Promise.all([
          poloRes.ok ? poloRes.json() : Promise.resolve({}),
          crewRes.ok ? crewRes.json() : Promise.resolve({}),
          vRes.ok ? vRes.json() : Promise.resolve({}),
        ]);

        const hasPolo = Array.isArray(poloJson?.result) && poloJson.result.length > 0;
        const hasCrew = Array.isArray(crewJson?.result) && crewJson.result.length > 0;
        const hasV = Array.isArray(vJson?.result) && vJson.result.length > 0;

        const fallbackType = hasPolo ? 1 : hasCrew ? 2 : hasV ? 3 : 0;
        const neckValue = mapNeckTypeToValue(fallbackType);
        if (neckValue) {
          setSelectedNeck(neckValue);
          setNeckSelected(neckValue);
          resolvedNeckValue = neckValue;
        }
      }

      // Final fallback: read from InquiryNeck source (original inquiry data).
      if (!resolvedNeckValue && inquiryId && optId) {
        const inquiryNeckRes = await fetch(
          `${BASE_URL}/InquiryNeck/GetNeckType?InquiryID=${inquiryId}&OptionId=${optId}&WindowType=${windowType}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (inquiryNeckRes.ok) {
          const inquiryNeckJson = await inquiryNeckRes.json();
          if (inquiryNeckJson?.result?.necKTypes != null) {
            const neckValue = mapNeckTypeToValue(inquiryNeckJson.result.necKTypes);
            if (neckValue) {
              setSelectedNeck(neckValue);
              setNeckSelected(neckValue);
              resolvedNeckValue = neckValue;
            }
          }
        }
      }

      // Fetch neck body types
      const neckBodyRes = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingNeckBody?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (neckBodyRes.ok) {
        const data = await neckBodyRes.json();
        const updatedChecked = { 1: false, 2: false, 3: false, 4: false };
        const updatedNeckBodyIds = { 1: null, 2: null, 3: null, 4: null };
        if (data.result) {
          data.result.forEach((item) => {
            updatedChecked[item.neckBodyTypes] = true;
            updatedNeckBodyIds[item.neckBodyTypes] = item.id;
          });
        }
        setIsChecked(updatedChecked);
        setNeckBodyIds(updatedNeckBodyIds);
      }
    } catch (error) {
      console.error("Error fetching neck data:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    if (!selectedNeck) {
      toast.error("Please select a neck type first");
      return;
    }

    let nextPath = "";
    if (selectedNeck === "POLO") {
      nextPath = "/quotations/tech-pack/edit/tshirt/polo-neck";
    } else if (selectedNeck === "Crew Neck") {
      nextPath = "/quotations/tech-pack/edit/tshirt/crew-neck";
    } else if (selectedNeck === "V Neck") {
      nextPath = "/quotations/tech-pack/edit/tshirt/v-neck";
    } else {
      toast.error("Invalid neck type selected");
      return;
    }

    router.push({
      pathname: nextPath,
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const handleNeckChange = async (event) => {
    const newNeckValue = event.target.value;
    
    if (!inquiry) return;

    const neckTypeMap = {
      "POLO": 1,
      "Crew Neck": 2,
      "V Neck": 3,
    };

    const neckType = neckTypeMap[newNeckValue];
    if (!neckType) return;

    // If switching to a different neck type, delete all existing neck type records first
    if (selectedNeck && selectedNeck !== newNeckValue) {
      try {
        // Get all existing neck types to delete them
        const oldNeckType = neckTypeMap[selectedNeck];
        const getAllResponse = await fetch(
          `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${inquiry.ongoingInquiryId}&optionId=${inquiry.optionId}&windowType=${inquiry.windowType}&necKTypes=${oldNeckType}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (getAllResponse.ok) {
          const getAllData = await getAllResponse.json();
          if (getAllData.result && Array.isArray(getAllData.result)) {
            // Delete all old neck type records
            for (const oldRecord of getAllData.result) {
              await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${oldRecord.id}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "Content-Type": "application/json",
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Error deleting old neck types:", error);
        // Continue anyway
      }
    }

    // Update UI state immediately
    setSelectedNeck(newNeckValue);

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
          NecKTypes: neckType,
          NeckFirstRows: neckType === 1 ? 10 : 0, // Default for POLO
          Neck2ndRowS: 0,
          Neck3rdRowS: 0,
          POLOlength: "",
          POLOWidth: "",
          POLOButton: "",
        }),
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Neck type updated successfully");
        setNeckSelected(newNeckValue);
        // Refresh neck data after a short delay to ensure backend has processed
        setTimeout(() => {
          fetchNeckData(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        }, 300);
      } else {
        toast.error(data.message || "Failed to update neck type");
        // Revert UI state on error
        setSelectedNeck(selectedNeck);
      }
    } catch (error) {
      console.error("Error updating neck type:", error);
      toast.error("Failed to update neck type");
      // Revert UI state on error
      setSelectedNeck(selectedNeck);
    }
  };

  const handleCheckboxChange = (neckBodyType) => async (event) => {
    const isCheckedValue = event.target.checked;
    const updatedChecked = { ...isChecked, [neckBodyType]: isCheckedValue };
    setIsChecked(updatedChecked);

    if (!inquiry) return;

    try {
      if (isCheckedValue) {
        // Add neck body
        const response = await fetch(`${BASE_URL}/Ongoing/CreateOngoingNeckBody`, {
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
            NeckBodyTypes: neckBodyType,
          }),
        });

        const data = await response.json();
        if (data.statusCode === 200) {
          toast.success("Neck body added successfully");
          // Refresh to get the new ID
          fetchNeckData(inquiry.ongoingInquiryId, inquiry.optionId, inquiry.windowType);
        } else {
          toast.error(data.message || "Failed to add neck body");
          // Revert checkbox state
          setIsChecked({ ...isChecked });
        }
      } else {
        // Delete neck body
        const neckBodyId = neckBodyIds[neckBodyType];
        if (neckBodyId) {
          const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckBody?id=${neckBodyId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (data.statusCode === 200) {
            toast.success("Neck body removed successfully");
            // Update IDs
            setNeckBodyIds({ ...neckBodyIds, [neckBodyType]: null });
          } else {
            toast.error(data.message || "Failed to remove neck body");
            // Revert checkbox state
            setIsChecked({ ...isChecked, [neckBodyType]: true });
          }
        }
      }
    } catch (error) {
      console.error("Error updating neck body:", error);
      toast.error("Failed to update neck body");
      // Revert checkbox state
      setIsChecked({ ...isChecked, [neckBodyType]: !isCheckedValue });
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
        title="Neck"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button variant="outlined" color="primary" endIcon={<NavigateNextIcon />} onClick={navToNext}>
              next
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup name="neck" value={selectedNeck} onChange={handleNeckChange}>
                  <FormControlLabel
                    value="POLO"
                    control={<Radio />}
                    label={<Typography style={{ fontSize: "25px" }}>POLO</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup name="neck" value={selectedNeck} onChange={handleNeckChange}>
                  <FormControlLabel
                    value="Crew Neck"
                    control={<Radio />}
                    label={<Typography style={{ fontSize: "25px" }}>Crew Neck</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup name="neck" value={selectedNeck} onChange={handleNeckChange}>
                  <FormControlLabel
                    value="V Neck"
                    control={<Radio />}
                    label={<Typography style={{ fontSize: "25px" }}>V Neck</Typography>}
                  />
                </RadioGroup>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <Typography>Other Details</Typography>
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
                  control={<Checkbox checked={isChecked[1]} onChange={handleCheckboxChange(1)} />}
                  label="Contrast"
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
                  control={<Checkbox checked={isChecked[2]} onChange={handleCheckboxChange(2)} />}
                  label="A/H Pie Pin"
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
                  control={<Checkbox checked={isChecked[3]} onChange={handleCheckboxChange(3)} />}
                  label="Cuff Pie Pin"
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
                  control={<Checkbox checked={isChecked[4]} onChange={handleCheckboxChange(4)} />}
                  label="Bottom D / Hem "
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
