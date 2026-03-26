import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Card,
  Radio,
  FormControlLabel,
  Typography,
  CircularProgress,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackShirtSleeve() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState("short");
  const [saving, setSaving] = useState(false);

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
        await fetchSleeveData(ongoingInquiryId, optionId, data.result.windowType, data.result);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };

  const setSleeveFromResult = (result) => {
    if (!result) return "short";
    const shortVal = result.short ?? result.Short;
    const longVal = result.long ?? result.Long;
    if (longVal === 1 || longVal === "1") return "long";
    if (shortVal === 1 || shortVal === "1") return "short";
    return "short";
  };

  const fetchInquirySleeve = async (inqId, optId, windowType) => {
    try {
      const res = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}`,
        { method: "GET", headers }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const list = data.result;
      const result = list && list[0] ? list[0] : null;
      return result;
    } catch {
      return null;
    }
  };

  const fetchSleeveData = async (ongoId, optId, windowType, inq) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingSleeve?ongoingInquiryId=${ongoId}&optionId=${optId}&windowType=${windowType}`,
        { method: "GET", headers }
      );

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        if (result) {
          setSelectedValue(setSleeveFromResult(result));
          return;
        }
      }

      if (!inquiryId || !inq) {
        setSelectedValue("short");
        return;
      }
      const inquiryResult = await fetchInquirySleeve(inquiryId, optId, windowType);
      const value = setSleeveFromResult(inquiryResult);
      setSelectedValue(value);
      const payload = {
        InquiryID: parseInt(ongoingInquiryId, 10),
        InqCode: inq.inquiryCode || "",
        OptionId: parseInt(optionId, 10),
        InqOptionName: inq.optionName || "",
        WindowType: inq.windowType ?? 0,
        Wrangler: "0",
        Normal: "0",
        Short: value === "short" ? 1 : 0,
        ShortType: 9,
        Long: value === "long" ? 1 : 0,
        LongType: 9,
        ShortSize: 0,
        LongSize: 0,
        UpdateRowNumber: 1,
      };
      try {
        await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } catch (_) {}
    } catch (error) {
      console.error("Error fetching sleeve data:", error);
      setSelectedValue("short");
    }
  };

  const buildSleevePayload = (sleeveValue) => ({
    InquiryID: parseInt(ongoingInquiryId, 10),
    InqCode: inquiry.inquiryCode || "",
    OptionId: parseInt(optionId, 10),
    InqOptionName: inquiry.optionName || "",
    WindowType: inquiry.windowType ?? 0,
    Wrangler: "0",
    Normal: "0",
    Short: sleeveValue === "short" ? 1 : 0,
    ShortType: 9,
    Long: sleeveValue === "long" ? 1 : 0,
    LongType: 9,
    ShortSize: 0,
    LongSize: 0,
    UpdateRowNumber: 1,
  });

  const handleSleeveChange = async (event) => {
    const value = event.target.value;
    if (!inquiry) return;
    setSaving(true);
    try {
      const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSleeve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSleevePayload(value)),
      });
      if (!response.ok) throw new Error("Failed to update sleeve");
      setSelectedValue(value);
      toast.success("Sleeve updated");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/shirt/coller",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/shirt/document-panel",
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
        title="Sleeve - Tech Pack"
      />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Sleeve</Typography>
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
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <FormControlLabel
                  value="short"
                  control={
                    <Radio
                      value="short"
                      checked={selectedValue === "short"}
                      disabled={saving}
                      onChange={handleSleeveChange}
                    />
                  }
                  label="Short Sleeve"
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
                  value="long"
                  control={
                    <Radio
                      value="long"
                      checked={selectedValue === "long"}
                      disabled={saving}
                      onChange={handleSleeveChange}
                    />
                  }
                  label="Long Sleeve"
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
