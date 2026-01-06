import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/router";
import SizesList from "../summary-sizes";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DocumentListBag from "./document-list";
import FabListInq from "../summary-fab";
import SumTable from "../summary-table";
import { DashboardSummaryHeader } from "@/components/shared/dashboard-summary-header";

export default function Summary() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const from = router.query.from;
  const [formData, setFormData] = useState(null);
  const [isSavedFromChild, setIsSavedFromChild] = React.useState(false);

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
    if (inqId,optId) {
      fetchInquiryById();
    }
  }, []);

  const handleIsSavedChange = (value) => {
    setIsSavedFromChild(value);
  };

  const handleSetData = (data) => {
    setFormData(data);
  };

  const navToPrev = () => {
    if (from) {
      router.push({
        pathname: "/inquiry/edit-inquiry/",
        query: { id: inquiry ? inquiry.inquiryId : "",option: inquiry ? inquiry.optionId : "" },
      });
    } else {
      router.push({
        pathname: `/inquiry/edit-inquiry/bag/document-panel/`,
        query: { id: inquiry ? inquiry.inquiryId : "",option: inquiry ? inquiry.optionId : "" },
      });
    }
  };

  const handleSaveValues = () => {
    if (!isSavedFromChild) {
      toast.warning("Please Update Changes");
      return;
    }
    const token = localStorage.getItem("token");
    const bodyData = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      WindowType: inquiry.windowType,
      OptionId: inquiry.optionId,
      InqOptionName: inquiry.optionName,
      TotalUnits: parseFloat(formData.totalUnits) || 0,
      UnitCost: parseFloat(formData.unitCost) || 0,
      TotalCost: parseFloat(formData.totalCost) || 0,
      ProfitPercentage: parseFloat(formData.profitPercentage) || 0,
      UnitProfit: parseFloat(formData.profit) || 0,
      TotalProfit: parseFloat(formData.totalProfit) || 0,
      SellingPrice: parseFloat(formData.sellingPrice) || 0,
      Revanue: parseFloat(formData.revenue) || 0,
      ApprovedStatus: 0,
      ApprvedUnitCost: parseFloat(formData.unitCost) || 0,
      ApprvedTotalCost: parseFloat(formData.totalCost) || 0,
      ApprvedProfitPercentage:
        parseFloat(formData.profitPercentage) || 0,
      ApprvedUnitProfit: parseFloat(formData.profit) || 0,
      ApprvedTotalProfit: parseFloat(formData.totalProfit) || 0,
      ApprvedSellingPrice: parseFloat(formData.sellingPrice) || 0,
      ApprvedRevanue: parseFloat(formData.revenue) || 0,
      ApprvedTotalUnits: parseFloat(formData.totalUnits) || 0,
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
           router.push("/inquiry/inquries/");
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

      <DashboardSummaryHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        inquiryDetails={inquiry ? inquiry.styleName : ""}
        window={inquiry ? inquiry.windowType : ""}
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
            <Button
              onClick={handleSaveValues}
              variant="outlined"
              color="primary"
            >
              done
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1} lg={5}>
              <SumTable onIsSavedChange={handleIsSavedChange} inquiry={inquiry} onSummaryChange={handleSetData} />
            </Grid>
            <Grid item xs={12} p={1} lg={7}>
              <Grid container>
                <Grid item xs={12}>
                  <DocumentListBag inquiry={inquiry} />
                </Grid>
                <Grid item xs={12}>
                  <FabListInq inquiry={inquiry} />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} p={1}>
              <SizesList inquiry={inquiry} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
