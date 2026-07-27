import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SelectColler() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [isFullCLRSelected, setIsFullCLRSelected] = useState(false);
  const [fullClrId, setFullClrId] = useState();
  const [isChineseCLRSelected, setIsChineseCLRSelected] = useState(false);
  const [chineseClrId, setChineseClrId] = useState();
  const [validationError, setValidationError] = useState("");

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
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId && optId) {
      fetchInquiryById();
    }
  }, [inqId, optId]);

  const getCollerValidationMessage = () => {
    if (!isFullCLRSelected && !isChineseCLRSelected) {
      return "Please select a coller option before proceeding.";
    }
    if (isFullCLRSelected && isChineseCLRSelected) {
      return "Please select only one coller option.";
    }
    return "";
  };

  const deleteNeckTypeById = async (id) => {
    if (!id) return;
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
    if (!response.ok) {
      throw new Error("Failed to delete neck type");
    }
  };

  const deselectOtherColler = async (selected) => {
    if (selected === "full" && isChineseCLRSelected && chineseClrId) {
      await deleteNeckTypeById(chineseClrId);
      setIsChineseCLRSelected(false);
      setChineseClrId(undefined);
    }
    if (selected === "chinese" && isFullCLRSelected && fullClrId) {
      await deleteNeckTypeById(fullClrId);
      setIsFullCLRSelected(false);
      setFullClrId(undefined);
    }
  };

  const fetchFullColor = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=4`,
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
      if (data.result.length != 0) {
        setIsFullCLRSelected(true);
        setFullClrId(data.result[0].id);
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };
  const fetchChineseColor = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=5`,
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
      if (data.result.length != 0) {
        setIsChineseCLRSelected(true);
        setChineseClrId(data.result[0].id);
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchFullColor(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      fetchChineseColor(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  const saveDefaultSleeveAndNext = async () => {
    if (!inquiry) return;

    const message = getCollerValidationMessage();
    if (message) {
      setValidationError(message);
      toast.error(message);
      return;
    }

    setValidationError("");
    try {
      await fetch(
        `${BASE_URL}/InquirySleeve/AddOrUpdateSleeve`,
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
            Wrangler: "0",
            Normal: "0",
            Short: 1,
            ShortType: 9,
            Long: 0,
            LongType: 9,
            ShortSize: 0,
            LongSize: 0,
          }),
        }
      );
    } catch (error) {
      console.error("Error saving default sleeve:", error);
    }
    router.push(`/inquiry/edit-inquiry/shirt/sleeve/?id=${inquiry.inquiryId}&option=${inquiry.optionId}`);
  };

  const handleFullCLRChange = async (event, value) => {
    const isChecked = event.target.checked;
    setValidationError("");

    if (isChecked) {
      try {
        await deselectOtherColler("full");
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
              NecKTypes: 4,
              NeckFirstRows: 10,
              Neck2ndRowS: 9,
              Neck3rdRowS: 6,
              POLOlength: String(0),
              POLOWidth: String(0),
              POLOButton: String(0),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save coller");
        }
        setIsFullCLRSelected(true);
        fetchFullColor(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      } catch (error) {
        console.error(error);
        setIsFullCLRSelected(false);
      }
    } else {
      try {
        await deleteNeckTypeById(value);
        setIsFullCLRSelected(false);
        setFullClrId(undefined);
      } catch (error) {
        console.error(error);
        setIsFullCLRSelected(true);
      }
    }
  };

  const handleChineseCLRChange = async (event, value) => {
    const isChecked = event.target.checked;
    setValidationError("");

    if (isChecked) {
      try {
        await deselectOtherColler("chinese");
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
              NecKTypes: 5,
              NeckFirstRows: 10,
              Neck2ndRowS: 9,
              Neck3rdRowS: 6,
              POLOlength: String(0),
              POLOWidth: String(0),
              POLOButton: String(0),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save coller");
        }
        setIsChineseCLRSelected(true);
        fetchChineseColor(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      } catch (error) {
        console.error(error);
        setIsChineseCLRSelected(false);
      }
    } else {
      try {
        await deleteNeckTypeById(value);
        setIsChineseCLRSelected(false);
        setChineseClrId(undefined);
      } catch (error) {
        console.error(error);
        setIsChineseCLRSelected(true);
      }
    }
  };

  return (
    <>
      <ToastContainer />
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Coller"
      />
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Coller</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/sizes/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={saveDefaultSleeveAndNext}
              disabled={!inquiry}
            >
              next
            </Button>
          </Box>
        </Grid>
        {validationError && (
          <Grid item xs={12} p={1}>
            <Alert severity="error">{validationError}</Alert>
          </Grid>
        )}
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
                          onChange={(event) =>
                            handleFullCLRChange(event, fullClrId)
                          }
                        />
                      }
                      label="Full Coller"
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
                      control={<Checkbox checked={isChineseCLRSelected} onChange={(event) =>
                        handleChineseCLRChange(event, chineseClrId)
                      } />}
                      label="Chinese Coller"
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
