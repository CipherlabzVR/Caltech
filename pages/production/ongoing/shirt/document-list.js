import React, { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Grid,
  Typography,
} from "@mui/material";
import DocImageList from "@/components/UIElements/SwiperSlider/DocImageList";
import BASE_URL from "Base/api";
import DocType from "../Types/docType";
import DocSubType from "../Types/docSubType";

export default function DocumentListShirt() {
  const [isFullCLRSelected, setIsFullCLRSelected] = useState(false);
  const [isChineseCLRSelected, setIsChineseCLRSelected] = useState(false);
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [isShortChecked, setIsShortChecked] = useState(false);
  const [isLongChecked, setIsLongChecked] = useState(false);
  const [doclist, setDoclist] = useState([]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      const responseData = await response.json();
      if (!responseData.result || !Array.isArray(responseData.result)) {
        throw new Error("Data is not in the expected format");
      }
      const data = responseData.result;
      const filtered = data.filter(
        (item) => item.documentType !== 7 && item.documentSubContentType !== 5
      );

      setDoclist(filtered);
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };
  const fetchFullColor = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}&necKTypes=4`,
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
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };
  const fetchChineseColor = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}&necKTypes=5`,
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
      }
    } catch (error) {
      //console.error("Error fetching Neck Body List:", error);
    }
  };
  const fetchSleeve = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const result = data.result[0];

      if (result.short === 1) {
        setIsShortChecked(true);
      }
      if (result.long === 1) {
        setIsLongChecked(true);
      }
    } catch (error) {
      //console.error("Error fetching Sleeve Details:", error);
    }
  };
  useEffect(() => {
    fetchFullColor();
    fetchChineseColor();
    fetchSleeve();
    fetchDocuments();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={5} pr={1}>
          <Grid container>
            <Grid item xs={12}>
              <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                Coller
              </Typography>
              <ButtonGroup fullWidth>
                <Button
                  size="small"
                  variant={isFullCLRSelected ? "contained" : "outlined"}
                >
                  Full Coller
                </Button>
                <Button
                  size="small"
                  variant={isChineseCLRSelected ? "contained" : "outlined"}
                >
                  Chinese Coller
                </Button>
              </ButtonGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
                Sleeve
              </Typography>
              <ButtonGroup fullWidth>
                <Button
                  size="small"
                  variant={isShortChecked ? "contained" : "outlined"}
                >
                  Short Sleeve
                </Button>
                <Button
                  size="small"
                  variant={isLongChecked ? "contained" : "outlined"}
                >
                  Long Sleeve
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={7}>
          <DocImageList />
        </Grid>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Documents
          </Typography>
          <Grid container>
            {doclist.length == 0 ? (
              <Typography color="error">Documents Not Selected</Typography>
            ) : (
              doclist.map((image, index) => (
                <Grid key={index} item lg={3} md={6} xs={6}>
                  <Button
                    fullWidth
                    sx={{ borderRadius: 0, height: "50px" }}
                    variant="contained"
                  >
                    {" "}
                    <DocType type={image.documentContentType}/> - <DocSubType type={image.documentSubContentType}/>
                  </Button>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
