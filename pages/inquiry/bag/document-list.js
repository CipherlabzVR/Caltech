import React, { useEffect, useState } from "react";
import { Button, Grid, Typography } from "@mui/material";
import DocImageList from "@/components/UIElements/SwiperSlider/DocImageList";
import BASE_URL from "Base/api";
import DocType from "../Types/docType";
import DocSubType from "../Types/docSubType";

export default function DocumentListBag() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [doclist, setDoclist] = useState([]);
  const [info, setInfo] = useState();

  const fetchComponent = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/GetComponentPanelByInq?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      if (data.result.result != null) {
        const type = data.result.result[0].componentFirstRows;
        setInfo(
          type == 7
            ? "Contrast"
            : type == 13
            ? "Flap"
            : type == 14
            ? "Zipper"
            : "Pockets"
        );
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

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

  useEffect(() => {
    fetchDocuments();
    fetchComponent();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <DocImageList />
        </Grid>

        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Component
          </Typography>
          {info ? (
            <Button variant="contained" sx={{ height: "50px", width: "120px" }}>
              {info}
            </Button>
          ) : (
            <Typography color="error">Not Selected</Typography>
          )}
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
                    <DocType type={image.documentContentType} /> -{" "}
                    <DocSubType type={image.documentSubContentType} />
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
