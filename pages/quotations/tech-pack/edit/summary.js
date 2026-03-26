import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useRouter } from "next/router";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DashboardSummaryHeader } from "@/components/shared/dashboard-summary-header";
import TechPackSummaryTable from "./tech-pack-summary-table";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function TechPackSummary() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fabrics, setFabrics] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [summaryFormData, setSummaryFormData] = useState(null);
  const [isSummarySavedFromChild, setIsSummarySavedFromChild] = useState(false);

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

      if (!response.ok) {
        throw new Error("Failed to fetch ongoing data");
      }

      const data = await response.json();
      if (data.result) {
        setInquiry(data.result);
        await Promise.all([
          fetchFabrics(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType),
          fetchSizes(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType),
          fetchDocuments(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType),
        ]);
      }
    } catch (error) {
      console.error("Error fetching ongoing data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFabrics = async (ongoingId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingFabrics?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
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
        setFabrics(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching fabrics:", error);
    }
  };

  const fetchSizes = async (ongoingId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingSizes?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
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
        setSizes(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
    }
  };

  const fetchDocuments = async (ongoingId, optId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingDocumentPanels?ongoingInquiryId=${ongoingId}&optionId=${optId}&windowType=${windowType}`,
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
        setDocuments(data.result || []);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const navToPrevious = () => {
    const routes = {
      1: "/quotations/tech-pack/edit/tshirt/document-panel",
      2: "/quotations/tech-pack/edit/shirt/document-panel",
      3: "/quotations/tech-pack/edit/cap/document-panel",
      4: "/quotations/tech-pack/edit/visor/document-panel",
      5: "/quotations/tech-pack/edit/hat/document-panel",
      6: "/quotations/tech-pack/edit/bag/document-panel",
      7: "/quotations/tech-pack/edit/bottom/document-panel",
      8: "/quotations/tech-pack/edit/short/document-panel",
    };
    router.push({
      pathname: routes[inquiry?.windowType] || "/quotations/tech-pack/edit/sizes",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId },
    });
  };

  const handleSummaryChange = (data) => {
    setSummaryFormData(data);
  };

  const handleFinish = async () => {
    const windowTypeNum = inquiry?.windowType ?? (queryWindowType ? parseInt(queryWindowType, 10) : null);
    const isShirtOrTshirt = windowTypeNum === 1 || windowTypeNum === 2;

    if (isShirtOrTshirt && ongoingInquiryId && optionId) {
      if (!isSummarySavedFromChild && summaryFormData) {
        toast.warning("Please click Update in the summary table to save line changes, then click Finish & Save.");
      }
      const bodyData = summaryFormData
        ? {
          InquiryID: parseInt(ongoingInquiryId, 10),
          InqCode: inquiry?.inquiryCode ?? "",
          WindowType: windowTypeNum,
          OptionId: parseInt(optionId, 10),
          InqOptionName: inquiry?.optionName ?? "",
          TotalUnits: parseFloat(summaryFormData.totalUnits) || 0,
          UnitCost: parseFloat(summaryFormData.unitCost) || 0,
          TotalCost: parseFloat(summaryFormData.totalCost) || 0,
          ProfitPercentage: parseFloat(summaryFormData.profitPercentage) || 0,
          UnitProfit: parseFloat(summaryFormData.profit) || 0,
          TotalProfit: parseFloat(summaryFormData.totalProfit) || 0,
          SellingPrice: parseFloat(summaryFormData.sellingPrice) || 0,
          Revanue: parseFloat(summaryFormData.revenue) || 0,
          ApprovedStatus: 0,
          ApprvedUnitCost: parseFloat(summaryFormData.unitCost) || 0,
          ApprvedTotalCost: parseFloat(summaryFormData.totalCost) || 0,
          ApprvedProfitPercentage: parseFloat(summaryFormData.profitPercentage) || 0,
          ApprvedUnitProfit: parseFloat(summaryFormData.profit) || 0,
          ApprvedTotalProfit: parseFloat(summaryFormData.totalProfit) || 0,
          ApprvedSellingPrice: parseFloat(summaryFormData.sellingPrice) || 0,
          ApprvedRevanue: parseFloat(summaryFormData.revenue) || 0,
          ApprvedTotalUnits: parseFloat(summaryFormData.totalUnits) || 0,
          ProjectQty: parseFloat(summaryFormData.totalUnits) || 0,
        }
        : null;
      if (bodyData) {
        try {
          const response = await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSummeryHeader`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(bodyData),
          });
          const data = await response.json();
          if (data.statusCode !== 200) {
            toast.error(data.message || "Failed to save summary header");
            return;
          }
        } catch (err) {
          toast.error(err.message || "Failed to save summary");
          return;
        }
      }

      if (inquiryId && summaryFormData) {
        try {
          const linesRes = await fetch(
            `${BASE_URL}/Ongoing/GetAllOngoingSummeryLines?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowTypeNum}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
          const patternRes = await fetch(
            `${BASE_URL}/Ongoing/GetAllOngoingSummeryLinesPattern?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowTypeNum}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
          const linesData = await linesRes.json();
          const patternData = await patternRes.json();
          const lines = linesData.result || [];
          const patternLines = patternData.result || [];
          const allLines = [...lines, ...patternLines];

          const versionPayload = {
            InquiryID: parseInt(inquiryId, 10),
            OptionId: parseInt(optionId, 10),
            WindowType: windowTypeNum,
            InqCode: inquiry?.inquiryCode ?? "",
            InqOptionName: inquiry?.optionName ?? "",
            TotalUnits: parseFloat(summaryFormData.totalUnits) || 0,
            UnitCost: parseFloat(summaryFormData.unitCost) || 0,
            TotalCost: parseFloat(summaryFormData.totalCost) || 0,
            ProfitPercentage: parseFloat(summaryFormData.profitPercentage) || 0,
            UnitProfit: parseFloat(summaryFormData.profit) || 0,
            TotalProfit: parseFloat(summaryFormData.totalProfit) || 0,
            SellingPrice: parseFloat(summaryFormData.sellingPrice) || 0,
            Revanue: parseFloat(summaryFormData.revenue) || 0,
            ApprvedTotalUnits: parseFloat(summaryFormData.totalUnits) || 0,
            ApprvedUnitCost: parseFloat(summaryFormData.unitCost) || 0,
            ApprvedTotalCost: parseFloat(summaryFormData.totalCost) || 0,
            ApprvedProfitPercentage: parseFloat(summaryFormData.profitPercentage) || 0,
            ApprvedUnitProfit: parseFloat(summaryFormData.profit) || 0,
            ApprvedTotalProfit: parseFloat(summaryFormData.totalProfit) || 0,
            ApprvedSellingPrice: parseFloat(summaryFormData.sellingPrice) || 0,
            ApprvedRevanue: parseFloat(summaryFormData.revenue) || 0,
            ProjectQty: parseFloat(summaryFormData.totalUnits) || 0,
            Lines: allLines.map((line) => ({
              ItemName: line.itemName ?? "",
              UnitCost: line.unitCost,
              Quantity: line.quantity,
              TotalCost: line.totalCost,
              ApprovedUnitCost: line.approvedUnitCost ?? line.unitCost,
              ApprovedQuantity: line.approvedQuantity ?? line.quantity,
              ApprovedTotalCost: line.approvedTotalCost ?? line.totalCost,
              IsFabric: line.isFabric ?? false,
            })),
          };
          const versionResponse = await fetch(`${BASE_URL}/Inquiry/SaveTechPackToQuotationVersionHistory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(versionPayload),
          });
          const versionResult = await versionResponse.json();
          if (versionResult.statusCode !== 200) {
            toast.error(versionResult.message || "Failed to save to quotation version history");
            return;
          }
        } catch (err) {
          console.error("Error saving to quotation version history:", err);
          toast.error(err.message || "Failed to save version history");
          return;
        }
      }
    }

    if (sentQuotationId) {
      try {
        const statusRes = await fetch(
          `${BASE_URL}/Inquiry/UpdateProjectStatusType?sentQuotId=${sentQuotationId}&type=4&reason=Tech Pack completed - moved to Approved`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        const statusData = await statusRes.json();
        if (statusData.statusCode !== 200) {
          toast.error(statusData.message || "Failed to update status");
          return;
        }
      } catch (err) {
        console.error("Error updating project status:", err);
        toast.error(err.message || "Failed to move to Approved");
        return;
      }
    }

    toast.success("Tech Pack saved successfully!");
    setTimeout(() => {
      router.push("/quotations/tech-pack/");
    }, 1500);
  };

  const getTotalQuantity = () => {
    return sizes.reduce((sum, size) => sum + (size.totalQty || 0), 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const windowTypeNum = inquiry?.windowType ?? (queryWindowType ? parseInt(queryWindowType, 10) : null);
  const isShirtOrTshirt = windowTypeNum === 1 || windowTypeNum === 2;

  return (
    <>
      <ToastContainer />

      {isShirtOrTshirt ? (
        <DashboardSummaryHeader
          customerName={inquiry ? inquiry.customerName : ""}
          optionName={inquiry ? inquiry.optionName : ""}
          inquiryDetails={inquiry ? inquiry.styleName ?? inquiry.inquiryCode : ""}
          window={windowTypeNum}
          href="/quotations/tech-pack/"
          link="Tech Pack"
          title="Summary - Tech Pack"
        />
      ) : (
        <DashboardHeader
          customerName={inquiry ? inquiry.customerName : ""}
          optionName={inquiry ? inquiry.optionName : ""}
          windowType={inquiry ? inquiry.windowType : null}
          href="/quotations/tech-pack/"
          link="Tech Pack"
          title="Summary - Tech Pack"
        />
      )}

      <Grid
        container
        rowSpacing={2}
        columnSpacing={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Tech Pack Summary</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleFinish}
              startIcon={<CheckCircleIcon />}
            >
              Finish & Save
            </Button>
          </Box>
        </Grid>

        {/* Inquiry Info */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: "none", p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Inquiry Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Inquiry Code
                </Typography>
                <Typography fontWeight="bold">{inquiry?.inquiryCode || "-"}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Customer
                </Typography>
                <Typography fontWeight="bold">{inquiry?.customerName || "-"}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Option
                </Typography>
                <Typography fontWeight="bold">{inquiry?.optionName || "-"}</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Summary table for shirt/tshirt (tech-pack ongoing summary) - after Inquiry Information */}
        {isShirtOrTshirt && ongoingInquiryId && optionId && (
          <Grid item xs={12} lg={6} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TechPackSummaryTable
                  onIsSavedChange={setIsSummarySavedFromChild}
                  inquiry={{
                    inquiryId: parseInt(ongoingInquiryId, 10),
                    optionId: parseInt(optionId, 10),
                    windowType: windowTypeNum,
                    inquiryCode: inquiry?.inquiryCode ?? "",
                    optionName: inquiry?.optionName ?? "",
                  }}
                  onSummaryChange={handleSummaryChange}
                  originalInquiry={
                    inquiryId && optionId
                      ? {
                        inquiryId: parseInt(inquiryId, 10),
                        optionId: parseInt(optionId, 10),
                        windowType: windowTypeNum,
                      }
                      : undefined
                  }
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        <Grid item xs={12} lg={6} md={6}>
          <Grid container gap={2}>
            <Grid item xs={12}>
              {/* Fabrics */}
              <Card sx={{ boxShadow: "none", p: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Fabrics ({fabrics.length})
                </Typography>
                {fabrics.length === 0 ? (
                  <Typography color="textSecondary">No fabrics selected</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fabric</TableCell>
                          <TableCell>GSM</TableCell>
                          <TableCell>Composition</TableCell>
                          <TableCell>Color</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fabrics.map((fab, index) => (
                          <TableRow key={index}>
                            <TableCell>{fab.fabricName}</TableCell>
                            <TableCell>{fab.gsmName || "-"}</TableCell>
                            <TableCell>{fab.compositionName || "-"}</TableCell>
                            <TableCell>{fab.colorCodeName || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Grid>
            <Grid item xs={12}>
              {/* Sizes */}
              <Card sx={{ boxShadow: "none", p: 3, height: "100%" }}>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Sizes ({sizes.length}) - Total Qty: {getTotalQuantity()}
                </Typography>
                {sizes.length === 0 ? (
                  <Typography color="textSecondary">No sizes added</Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Size</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sizes.map((size, index) => (
                          <TableRow key={index}>
                            <TableCell>{size.sizeName}</TableCell>
                            <TableCell align="right">{size.totalQty}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Grid>
          </Grid>
        </Grid>


        {/* Documents */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: "none", p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Documents ({documents.length})
            </Typography>
            {documents.length === 0 ? (
              <Typography color="textSecondary">No documents uploaded</Typography>
            ) : (
              <Grid container spacing={2}>
                {documents.filter(doc => doc.documentURL).map((doc, index) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
                    <Box
                      sx={{
                        width: "100%",
                        height: "100px",
                        backgroundImage: `url(${doc.documentURL})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                      }}
                    />
                    <Typography fontSize="10px" textAlign="center" mt={0.5}>
                      {doc.fileName || "Document"}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
