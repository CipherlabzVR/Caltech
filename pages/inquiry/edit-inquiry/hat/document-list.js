import React, { useEffect, useState } from "react";
import {
  Button,
  Grid,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import DocEditImageList from "@/components/UIElements/SwiperSlider/DocEditImageList";
import DocType from "pages/inquiry/Types/docType";
import DocSubType from "pages/inquiry/Types/docSubType";

export default function DocumentListHat({ inquiry }) {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [doclist, setDoclist] = useState([]);

  const fetchDocuments = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
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
    if (inquiry) {
      fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  return (
    <>
      <Grid container>
        <Grid item xs={12} lg={12}>
          <DocEditImageList inquiry={inquiry} />
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
                    <DocType type={image.documentContentType} /> - <DocSubType type={image.documentSubContentType} />
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
