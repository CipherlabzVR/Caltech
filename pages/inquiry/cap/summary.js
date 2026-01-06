import React, { useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/router";
import SizesList from "../summary-sizes";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DocumentListCap from "./document-list";
import FabListInq from "../summary-fab";
import SumTable from "../summary-table";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function Summary() {
  const router = useRouter();
  const status = localStorage.getItem("status");
  const inqType = router.query.inqType;
  const from = router.query.from;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;
  const [isSavedFromChild, setIsSavedFromChild] = React.useState(false);

  const handleIsSavedChange = (value) => {
    setIsSavedFromChild(value);
  };

  const navToPrev = () => {
    if (from) {
      router.push({
        pathname: "/inquiry/select-fabric/",
        query: { inqType: inqType },
      });
    } else {
      router.push({
        pathname: `/inquiry/cap/document-panel/`,
        query: { inqType: inqType },
      });
    }
  };

  const handleSaveValues = () => {
    if (!isSavedFromChild) {
      toast.warning("Please Save Updated Values")
      return;
    }
    const dataFromLocalStorage = JSON.parse(localStorage.getItem("data"));
    const token = localStorage.getItem("token");
    const bodyData = {
      InquiryID: optionDetails.inquiryID,
      InqCode: optionDetails.inqCode,
      WindowType: optionDetails.windowType,
      OptionId: optionDetails.id,
      InqOptionName: optionDetails.optionName,
      TotalUnits: parseFloat(dataFromLocalStorage.totalUnits) || 0,
      UnitCost: parseFloat(dataFromLocalStorage.unitCost) || 0,
      TotalCost: parseFloat(dataFromLocalStorage.totalCost) || 0,
      ProfitPercentage: parseFloat(dataFromLocalStorage.profitPercentage) || 0,
      UnitProfit: parseFloat(dataFromLocalStorage.profit) || 0,
      TotalProfit: parseFloat(dataFromLocalStorage.totalProfit) || 0,
      SellingPrice: parseFloat(dataFromLocalStorage.sellingPrice) || 0,
      Revenue: parseFloat(dataFromLocalStorage.revenue) || 0,
      ApprovedStatus: 0,
      ApprvedUnitCost: parseFloat(dataFromLocalStorage.unitCost) || 0,
      ApprvedTotalCost: parseFloat(dataFromLocalStorage.totalCost) || 0,
      ApprvedProfitPercentage:
        parseFloat(dataFromLocalStorage.profitPercentage) || 0,
      ApprvedUnitProfit: parseFloat(dataFromLocalStorage.profit) || 0,
      ApprvedTotalProfit: parseFloat(dataFromLocalStorage.totalProfit) || 0,
      ApprvedSellingPrice: parseFloat(dataFromLocalStorage.sellingPrice) || 0,
      ApprvedRevanue: parseFloat(dataFromLocalStorage.revenue) || 0,
      ApprvedTotalUnits: parseFloat(dataFromLocalStorage.totalUnits) || 0,
    };
    fetch(`${BASE_URL}/Inquiry/CreateOrUpdateInquirySummeryHeader`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  };

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={customerName}
        optionName={optionName}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Summary"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Summary</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button onClick={navToPrev} variant="outlined" color="primary">
              previous
            </Button>
            <Link href="/inquiry/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Button
              onClick={handleSaveValues}
              variant="outlined"
              color="primary"
              disabled={status == 1 ? true : false}
            >
              done
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1} lg={5}>
              <SumTable onIsSavedChange={handleIsSavedChange} />
            </Grid>
            <Grid item xs={12} p={1} lg={7}>
              <Grid container>
                <Grid item xs={12}>
                  <DocumentListCap />
                </Grid>
                <Grid item xs={12}>
                  <FabListInq />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} p={1}>
              <SizesList />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
