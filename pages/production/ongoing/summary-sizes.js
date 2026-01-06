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
import { useRouter } from "next/router";

export default function SizesList() {
  const router = useRouter();
  const inqType = router.query.inqType;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [inquirySizeList, setInquirySizeList] = useState([]);

  const fetchInquirySizeList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySize?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
    fetchInquirySizeList();
  }, []);

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Sizes
          </Typography>
          {inqType === 6 ? (
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
                  {inqType == 1 || inqType == 2 ? (
                        <TableCell align="center">Sleeve</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 ? (
                        <TableCell align="center">2XS</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8? (
                        <TableCell align="center">XS</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8? (
                        <TableCell align="center">S</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8? (
                        <TableCell align="center">M</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8? (
                        <TableCell align="center">L</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8? (
                        <TableCell align="center">XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8? (
                        <TableCell align="center">2XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 ? (
                        <TableCell align="center">3XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 ? (
                        <TableCell align="center">4XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 || inqType == 6? (
                        <TableCell align="center">{inqType ==6 ? "Side Width" : "5XL"}</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 || inqType == 6? (
                        <TableCell align="center">Width</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 7 || inqType == 8 || inqType == 6? (
                        <TableCell align="center">{inqType ==6 ? "Height" : "Length"}</TableCell>
                      ) : (
                        ""
                      )}
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
                      {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.sleavetype === null
                                ? "-"
                                : inquirysize.sleavetype}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.twoXS === 0
                                ? "-"
                                : inquirysize.twoXS}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.xs === 0 ? "-" : inquirysize.xs}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.s === 0 ? "-" : inquirysize.s}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.m === 0 ? "-" : inquirysize.m}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.l === 0 ? "-" : inquirysize.l}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.xl === 0 ? "-" : inquirysize.xl}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.twoXL === 0
                                ? "-"
                                : inquirysize.twoXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.threeXL === 0
                                ? "-"
                                : inquirysize.threeXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 ? (
                            <TableCell align="center">
                              {inquirysize.fourXL === 0
                                ? "-"
                                : inquirysize.fourXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 || inqType == 6? (
                            <TableCell align="center">
                              {inquirysize.fiveXL === 0
                                ? "-"
                                : inquirysize.fiveXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 || inqType == 6? (
                            <TableCell align="center">
                              {inquirysize.width === 0
                                ? "-"
                                : inquirysize.width}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 || inqType == 6 ? (
                            <TableCell align="center">
                              {inquirysize.length === 0
                                ? "-"
                                : inquirysize.length}
                            </TableCell>
                          ) : (
                            ""
                          )}
                      <TableCell align="right">
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
