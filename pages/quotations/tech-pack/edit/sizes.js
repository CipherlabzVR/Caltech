import React, { useEffect, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Table,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Card,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import AddOngoingSize from "@/components/UIElements/Modal/AddOngoingSize";
import EditOngoingSize from "@/components/UIElements/Modal/EditOngoingSize";

export default function TechPackSizes() {
  const router = useRouter();
  const { inquiryId, optionId, sentQuotationId, ongoingInquiryId, windowType: queryWindowType } = router.query;
  const [inquiry, setInquiry] = useState(null);
  const [inqType, setInqType] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [inquirySizeList, setInquirySizeList] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setInqType(data.result.windowType);
        fetchInquirySizeList(data.result.ongoingInquiryId, data.result.optionId, data.result.windowType);
      }
    } catch (error) {
      console.error("Error fetching ongoing data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchInquirySizeList = async (ongoingId, optId, windowType) => {
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

      if (!response.ok) {
        throw new Error("Failed to fetch Size List");
      }

      const data = await response.json();
      setInquirySizeList(data.result || []);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  useEffect(() => {
    if (router.isReady && ongoingInquiryId && optionId) {
      fetchOngoingData();
    }
  }, [router.isReady, ongoingInquiryId, optionId]);

  const NavigationNext = () => {
    // Match the original inquiry flow
    const routes = {
      1: "/quotations/tech-pack/edit/tshirt/neck",           // T-Shirt: sizes → neck → sleeve → document-panel
      2: "/quotations/tech-pack/edit/shirt/coller",          // Shirt: sizes → coller → sleeve → document-panel
      3: "/quotations/tech-pack/edit/cap/info",              // Cap: sizes → info → document-panel
      4: "/quotations/tech-pack/edit/visor/components",      // Visor: sizes → components → document-panel
      5: "/quotations/tech-pack/edit/hat/document-panel",    // Hat: sizes → document-panel
      6: "/quotations/tech-pack/edit/bag/document-panel",    // Bag: sizes → document-panel
      7: "/quotations/tech-pack/edit/bottom/component",      // Bottom: sizes → component → document-panel
      8: "/quotations/tech-pack/edit/short/component",       // Short: sizes → component → document-panel
    };
    router.push({
      pathname: routes[inquiry.windowType],
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId, ...(inquiry.windowType != null && { windowType: inquiry.windowType }) },
    });
  };

  const navToPrevious = () => {
    router.push({
      pathname: "/quotations/tech-pack/edit/color-code",
      query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId, ...(inquiry?.windowType != null && { windowType: inquiry.windowType }) },
    });
  };

  const DeleteInquirySize = async (sizeID) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/DeleteOngoingSize?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&sizeId=${sizeID}&windowType=${inquiry.windowType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete size");
      }

      const data = await response.json();
      toast.success(data.message);
      fetchInquirySizeList(ongoingInquiryId, optionId, inquiry.windowType);
    } catch (error) {
      console.error("Error deleting size:", error);
      toast.error("Failed to delete size");
    }
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
        title="Sizes - Tech Pack"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Box display="flex" alignItems="center" sx={{ gap: "10px" }}>
            <Typography>Sizes</Typography>
            {inquiry && (
              <AddOngoingSize
                fetchItems={() => fetchInquirySizeList(ongoingInquiryId, optionId, inquiry.windowType)}
                inquiry={inquiry}
              />
            )}
          </Box>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Button variant="outlined" color="primary" onClick={navToPrevious}>
              previous
            </Button>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={() => NavigationNext()}
            >
              next
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <TableContainer component={Paper}>
                <Table aria-label="simple table" className="dark-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Size</TableCell>
                      {(inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8) && (
                        <>
                          <TableCell align="center">2XS</TableCell>
                          <TableCell align="center">XS</TableCell>
                          <TableCell align="center">S</TableCell>
                          <TableCell align="center">M</TableCell>
                          <TableCell align="center">L</TableCell>
                          <TableCell align="center">XL</TableCell>
                          <TableCell align="center">2XL</TableCell>
                          <TableCell align="center">3XL</TableCell>
                          <TableCell align="center">4XL</TableCell>
                        </>
                      )}
                      {(inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 || inqType == 6) && (
                        <TableCell align="center">
                          {inqType == 6 ? "Side Width" : "5XL"}
                        </TableCell>
                      )}
                      {(inqType == 1 || inqType == 2 || inqType == 6) && (
                        <>
                          <TableCell align="center">Width</TableCell>
                          <TableCell align="center">
                            {inqType == 6 ? "Height" : "Length"}
                          </TableCell>
                        </>
                      )}
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inquirySizeList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={15} component="th" scope="row">
                          <Typography color="error">
                            No Sizes Added
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      inquirySizeList.map((inquirysize, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {index + 1}
                          </TableCell>
                          <TableCell>{inquirysize.sizeName}</TableCell>
                          {(inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8) && (
                            <>
                              <TableCell align="center">
                                {inquirysize.twoXS === 0 ? "-" : inquirysize.twoXS}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.xs === 0 ? "-" : inquirysize.xs}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.s === 0 ? "-" : inquirysize.s}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.m === 0 ? "-" : inquirysize.m}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.l === 0 ? "-" : inquirysize.l}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.xl === 0 ? "-" : inquirysize.xl}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.twoXL === 0 ? "-" : inquirysize.twoXL}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.threeXL === 0 ? "-" : inquirysize.threeXL}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.fourXL === 0 ? "-" : inquirysize.fourXL}
                              </TableCell>
                            </>
                          )}
                          {(inqType == 1 || inqType == 2 || inqType == 6 || inqType == 7 || inqType == 8) && (
                            <TableCell align="center">
                              {inquirysize.fiveXL === 0 ? "-" : inquirysize.fiveXL}
                            </TableCell>
                          )}
                          {(inqType == 1 || inqType == 2 || inqType == 6) && (
                            <>
                              <TableCell align="center">
                                {inquirysize.width === 0 ? "-" : inquirysize.width}
                              </TableCell>
                              <TableCell align="center">
                                {inquirysize.length === 0 ? "-" : inquirysize.length}
                              </TableCell>
                            </>
                          )}
                          <TableCell align="center">
                            {inquirysize.totalQty}
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" gap={1} justifyContent="flex-end">
                              {inquiry && (
                                <EditOngoingSize
                                  fetchItems={() => fetchInquirySizeList(ongoingInquiryId, optionId, inquiry.windowType)}
                                  inquiry={inquiry}
                                  sizeItem={inquirysize}
                                />
                              )}
                              <Tooltip title="Delete" placement="top">
                                <IconButton
                                  onClick={() => DeleteInquirySize(inquirysize.sizeID)}
                                  aria-label="delete"
                                  size="small"
                                >
                                  <DeleteIcon color="error" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
