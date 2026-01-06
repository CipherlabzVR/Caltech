import React, { useState, useEffect } from "react";
import {
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";

export default function SizesList({ inquiry }) {
  const QuotationDetails = JSON.parse(localStorage.getItem("QuotationDetails"));
  const [inquirySizeList, setInquirySizeList] = useState([]);

  const fetchInquirySizeList = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySize?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GSM List");
      }

      const data = await response.json();
      setInquirySizeList(data.result);
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    }
  };


  useEffect(() => {
    if (inquiry) {
      fetchInquirySizeList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Sizes
          </Typography>
          {inquiry && inquiry.windowType === 6 ? (
            <Button variant="contained" color="primary">
              Contrast
            </Button>
          ) : (
            ""
          )}
          <TableContainer sx={{ marginTop: "5vh" }} component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="center">Sleeve</TableCell>
                  <TableCell align="center">2XS</TableCell>
                  <TableCell align="center">XS</TableCell>
                  <TableCell align="center">S</TableCell>
                  <TableCell align="center">M</TableCell>
                  <TableCell align="center">L</TableCell>
                  <TableCell align="center">XL</TableCell>
                  <TableCell align="center">2XL</TableCell>
                  <TableCell align="center">3XL</TableCell>
                  <TableCell align="center">4XL</TableCell>
                  <TableCell align="center">5XL</TableCell>
                  <TableCell align="center">Width</TableCell>
                  <TableCell align="center">Lenght</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inquirySizeList.length === 0 ? (
                  <TableRow
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    <TableCell colSpan={3} component="th" scope="row">
                      <Typography color="error">
                        No Inquiry Sizes Added
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  inquirySizeList.map((inquirysize, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {index + 1}
                      </TableCell>
                      <TableCell>{inquirysize.sizeName}</TableCell>
                      <TableCell align="center">
                        {inquirysize.sleavetype}
                      </TableCell>
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
                      <TableCell align="center">
                        {inquirysize.fiveXL === 0 ? "-" : inquirysize.fiveXL}
                      </TableCell>
                      <TableCell align="center">
                        {inquirysize.width === 0 ? "-" : inquirysize.width}
                      </TableCell>
                      <TableCell align="center">
                        {inquirysize.length === 0 ? "-" : inquirysize.length}
                      </TableCell>
                      <TableCell align="center">
                        {inquirysize.totalQty}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
