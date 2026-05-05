import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Card,
  Checkbox,
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

export default function TechPackShirtColler() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullCLRSelected, setIsFullCLRSelected] = useState(false);
  const [fullClrId, setFullClrId] = useState(null);
  const [isChineseCLRSelected, setIsChineseCLRSelected] = useState(false);
  const [chineseClrId, setChineseClrId] = useState(null);
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
        const winType = data.result.windowType;
        const hadFull = await fetchFullCollar(ongoingInquiryId, optionId, winType);
        const hadChinese = await fetchChineseCollar(ongoingInquiryId, optionId, winType);
        if (!hadFull && !hadChinese && inquiryId) {
          await syncCollarFromInquiry(inquiryId, optionId, winType, data.result);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFullCollar = async (ongoId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoId}&optionId=${optId}&windowType=${windowType}&necKTypes=4`,
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
        const list = data.result || (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setIsFullCLRSelected(true);
          setFullClrId(list[0].id);
          return true;
        }
        setIsFullCLRSelected(false);
        setFullClrId(null);
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error fetching full collar:", error);
      return false;
    }
  };

  const fetchChineseCollar = async (ongoId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoId}&optionId=${optId}&windowType=${windowType}&necKTypes=5`,
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
        const list = data.result || (Array.isArray(data) ? data : []);
        if (list.length > 0) {
          setIsChineseCLRSelected(true);
          setChineseClrId(list[0].id);
          return true;
        }
        setIsChineseCLRSelected(false);
        setChineseClrId(null);
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error fetching chinese collar:", error);
      return false;
    }
  };

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };

  const fetchInquiryNeckTypes = async (inqId, optId, windowType, necKTypes) => {
    try {
      const res = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inqId}&OptionId=${optId}&WindowType=${windowType}&necKTypes=${necKTypes}`,
        { method: "GET", headers }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.result || (Array.isArray(data) ? data : []);
    } catch {
      return [];
    }
  };

  const syncCollarFromInquiry = async (inqId, optId, windowType, inq) => {
    if (!inq) return;
    const [inquiryFullList, inquiryChineseList] = await Promise.all([
      fetchInquiryNeckTypes(inqId, optId, windowType, 4),
      fetchInquiryNeckTypes(inqId, optId, windowType, 5),
    ]);
    const payload = (necKTypes) => ({
      InquiryID: parseInt(ongoingInquiryId, 10),
      InqCode: inq.inquiryCode || "",
      OptionId: parseInt(optionId, 10),
      InqOptionName: inq.optionName || "",
      WindowType: windowType ?? 0,
      NecKTypes: necKTypes,
      NeckFirstRows: 10,
      Neck2ndRowS: 9,
      Neck3rdRowS: 6,
      POLOlength: "0",
      POLOWidth: "0",
      POLOButton: "0",
    });
    if (inquiryFullList.length > 0) {
      const res = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingNeckType`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload(4)),
      });
      if (res.ok) await fetchFullCollar(ongoingInquiryId, optionId, windowType);
    }
    if (inquiryChineseList.length > 0) {
      const res = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingNeckType`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload(5)),
      });
      if (res.ok) await fetchChineseCollar(ongoingInquiryId, optionId, windowType);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const buildNeckPayload = (necKTypes) => ({
    InquiryID: parseInt(ongoingInquiryId, 10),
    InqCode: inquiry.inquiryCode || "",
    OptionId: parseInt(optionId, 10),
    InqOptionName: inquiry.optionName || "",
    WindowType: inquiry.windowType ?? 0,
    NecKTypes: necKTypes,
    NeckFirstRows: 10,
    Neck2ndRowS: 9,
    Neck3rdRowS: 6,
    POLOlength: "0",
    POLOWidth: "0",
    POLOButton: "0",
  });

  const handleFullCLRChange = async (event) => {
    const checked = event.target.checked;
    if (!inquiry) return;
    setSaving(true);
    try {
      if (checked) {
        const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingNeckType`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildNeckPayload(4)),
        });
        if (!response.ok) throw new Error("Failed to save");
        const data = await response.json();
        setIsFullCLRSelected(true);
        const listRes = await fetch(
          `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${inquiry.windowType}&necKTypes=4`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (listRes.ok) {
          const listData = await listRes.json();
          const list = listData.result || [];
          if (list.length > 0) setFullClrId(list[0].id);
        }
        toast.success("Full Collar saved");
      } else {
        if (!fullClrId) {
          setIsFullCLRSelected(false);
          setSaving(false);
          return;
        }
        const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${fullClrId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to remove");
        setIsFullCLRSelected(false);
        setFullClrId(null);
        toast.success("Full Collar removed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChineseCLRChange = async (event) => {
    const checked = event.target.checked;
    if (!inquiry) return;
    setSaving(true);
    try {
      if (checked) {
        const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingNeckType`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildNeckPayload(5)),
        });
        if (!response.ok) throw new Error("Failed to save");
        setIsChineseCLRSelected(true);
        const listRes = await fetch(
          `${BASE_URL}/Ongoing/GetAllOngoingNeckTypes?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${inquiry.windowType}&necKTypes=5`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (listRes.ok) {
          const listData = await listRes.json();
          const list = listData.result || [];
          if (list.length > 0) setChineseClrId(list[0].id);
        }
        toast.success("Chinese Collar saved");
      } else {
        if (!chineseClrId) {
          setIsChineseCLRSelected(false);
          setSaving(false);
          return;
        }
        const response = await fetch(`${BASE_URL}/Ongoing/DeleteOngoingNeckType?id=${chineseClrId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to remove");
        setIsChineseCLRSelected(false);
        setChineseClrId(null);
        toast.success("Chinese Collar removed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Request failed");
    } finally {
      setSaving(false);
    }
  };

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const navToNext = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/shirt/sleeve",
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
        title="Collar - Tech Pack"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Collar</Typography>
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
            <Grid item xs={12} p={1}>
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
                      control={
                        <Checkbox
                          checked={isFullCLRSelected}
                          disabled={saving}
                          onChange={handleFullCLRChange}
                        />
                      }
                      label="Full Collar"
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
                      control={
                        <Checkbox
                          checked={isChineseCLRSelected}
                          disabled={saving}
                          onChange={handleChineseCLRChange}
                        />
                      }
                      label="Chinese Collar"
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
