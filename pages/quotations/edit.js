import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { Box, Button, Modal, Typography } from "@mui/material";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SummarySleeve from "pages/inquiry/tshirt/summary-sleeve";
import FabList from "./summary-fab";
import SizesList from "./summary-sizes";
import { useRouter } from "next/router";
import TableData from "./table";
import DocumentListTShirt from "pages/inquiry/edit-inquiry/tshirt/document-list";
import DocumentListShirt from "pages/inquiry/edit-inquiry/shirt/document-list";
import DocumentListCap from "pages/inquiry/edit-inquiry/cap/document-list";
import DocumentListVisor from "pages/inquiry/edit-inquiry/visor/document-list";
import DocumentListHat from "pages/inquiry/edit-inquiry/hat/document-list";
import DocumentListBag from "pages/inquiry/edit-inquiry/bag/document-list";
import DocumentListBottom from "pages/inquiry/edit-inquiry/bottom/document-list";
import DocumentListShort from "pages/inquiry/edit-inquiry/short/document-list";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function EditQuotation() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [isSavedFromChild, setIsSavedFromChild] = React.useState(false);
  const [formData, setFormData] = useState(null);


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
    if (inqId) {
      fetchInquiryById();
    }
  }, []);


  const handleSetData = (data) => {
    setFormData(data);
  };

  const handleIsSavedChange = (value) => {
    setIsSavedFromChild(value);
  };

  const status = router.query.status;
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);


  const handleSaveApprovedValues = () => {
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
      TotalUnits: inquiry.totalUnits,
      UnitCost: inquiry.unitCost,
      TotalCost: inquiry.totalCost,
      ProfitPercentage: inquiry.profitPercentage,
      UnitProfit: inquiry.unitProfit,
      TotalProfit: inquiry.totalProfit,
      SellingPrice: inquiry.sellingPrice,
      Revanue: inquiry.revenue,
      ApprovedStatus: 1,
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
          if (status == "1") {
            router.push({
              pathname: "/quotations/approved-quotation",
            });
          } else {
            router.push({
              pathname: "/quotations/pending-quotation",
            });
          }
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });

  };

  const navigateToBack = () => {
    if (status == "1") {
      router.push({
        pathname: "/quotations/approved-quotation",
      });
    } else {
      router.push({
        pathname: "/quotations/pending-quotation",
      });
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Edit Quotations</h1>
        <ul>
          <li>
            {status == "1" ? (
              <Link href="/quotations/approved-quotation">
                Approved Quotations
              </Link>
            ) : (
              <Link href="/quotations/pending-quotation">
                Pending Quotations
              </Link>
            )}
          </li>
          <li>Edit Quotation</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Box display="flex" sx={{ gap: "10px" }}>
            {inquiry ?
              inquiry.customerName
              : (
                <Typography color="error">Customer Not Fount</Typography>
              )}
            / {inquiry ? inquiry.inquiryCode : ""} / {inquiry ? inquiry.optionName : ""} /{" "}
            {inquiry ? inquiry.styleName : ""}
          </Box>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button
              onClick={() => navigateToBack()}
              variant="outlined"
              color="primary"
            >
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outlined"
              color="error"
            >
              Reset
            </Button>
            <Button
              onClick={() => handleSaveApprovedValues()}
              variant="contained"
              color="primary"
            >
              approve
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1} lg={5}>
              <TableData onIsSavedChange={handleIsSavedChange} inquiry={inquiry} onSummaryChange={handleSetData} />
              {inquiry && inquiry.windowType === 1 ? <SummarySleeve /> : ""}
            </Grid>
            <Grid item xs={12} p={1} lg={7}>
              <Grid container>
                <Grid item xs={12}>
                  {inquiry && inquiry.windowType === 1 ? (
                    <DocumentListTShirt inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 2 ? (
                    <DocumentListShirt inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 3 ? (
                    <DocumentListCap inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 4 ? (
                    <DocumentListVisor inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 5 ? (
                    <DocumentListHat inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 6 ? (
                    <DocumentListBag inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 7 ? (
                    <DocumentListBottom inquiry={inquiry}/>
                  ) : inquiry && inquiry.windowType === 8 ? (
                    <DocumentListShort inquiry={inquiry}/>
                  ) : null}
                </Grid>
                <Grid item xs={12}>
                  <FabList inquiry={inquiry}/>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} p={1}>
              <SizesList inquiry={inquiry}/>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box mt={2}>
            <Grid container>
              <Grid item xs={12} mt={2}>
                <Typography
                  as="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "12px",
                  }}
                >
                  You have uncalculated items. Please click "Calculate" after
                  making any edits, or reset all.
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Button
              variant="contained"
              color="error"
              onClick={handleClose}
              sx={{
                mt: 2,
                textTransform: "capitalize",
                borderRadius: "8px",
                fontWeight: "500",
                fontSize: "13px",
                padding: "12px 20px",
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
