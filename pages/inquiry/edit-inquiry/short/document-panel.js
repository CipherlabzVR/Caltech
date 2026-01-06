import React, { useEffect, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import FrontLDocument from "./front-l-doc";
import FrontRDocument from "./front-r-doc";
import BackLDocument from "./back-l-doc";
import BackRDocument from "./back-r-doc";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import UploadingScreen from "../uploading";
import { ToastContainer } from "react-toastify";
import CommonFileUpload from "../common-file";

export default function DocumentPanel() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    if (inqId, optId) {
      fetchInquiryById();
    }
  }, []);

  const handleUploadStatus = (bool) => {
    setUploading(bool);
  }

  return (
    <>
      <ToastContainer />
      {uploading && <UploadingScreen />}

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Document Panel"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Document Panel</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/short/component/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href={`/inquiry/edit-inquiry/short/summary/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`}>
              <Button
                variant="outlined"
                color="primary"
                endIcon={<NavigateNextIcon />}
              >
                next
              </Button>
            </Link>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12}>
              <FrontLDocument inquiry={inquiry} onUpload={handleUploadStatus} />
            </Grid>
            <Grid item xs={12}>
              <FrontRDocument inquiry={inquiry} onUpload={handleUploadStatus} />
            </Grid>
            <Grid item xs={12}>
              <BackLDocument inquiry={inquiry} onUpload={handleUploadStatus} />
            </Grid>
            <Grid item xs={12}>
              <BackRDocument inquiry={inquiry} onUpload={handleUploadStatus} />
            </Grid>
            <Grid item xs={12}>
              <CommonFileUpload inquiry={inquiry} onUpload={handleUploadStatus} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
