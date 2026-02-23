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
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function TechPackSummary() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fabrics, setFabrics] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [documents, setDocuments] = useState([]);

  const fetchOngoingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingInquiryById?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}`,
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

  const handleFinish = () => {
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

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        windowType={inquiry ? inquiry.windowType : null}
        href="/quotations/tech-pack/"
        link="Tech Pack"
        title="Summary - Tech Pack"
      />

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

        {/* Fabrics */}
        <Grid item xs={12} md={6}>
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

        {/* Sizes */}
        <Grid item xs={12} md={6}>
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
