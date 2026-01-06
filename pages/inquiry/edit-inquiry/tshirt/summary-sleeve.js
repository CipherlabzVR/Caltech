import React, { useEffect, useState } from "react";
import {
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

export default function SummarySleeve({ inquiry }) {
  const [sleeve, setSleeve] = useState({});
  const [sleeveName, setSleeveName] = useState("");

  const fetchSleeve = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const list = data.result[0];
      if (list.normal === "1" && list.wrangler === "0") {
        setSleeveName(1);
      } else if (list.normal === "0" && list.wrangler === "1") {
        setSleeveName(2);
      } else {
        setSleeveName(3);
      }
      setSleeve(data.result[0]);
    } catch (error) {
      //console.error("Error fetching Sleeve Details:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchSleeve(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);
  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Sleeve
          </Typography>
          <TableContainer component={Paper}>
            <Table
              size="small"
              aria-label="simple table"
              className="dark-table"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Sleeve</TableCell>
                  {sleeve.short === 1 ? <TableCell>Short</TableCell> : ""}
                  {sleeve.long === 1 ? <TableCell>Long</TableCell> : ""}
                  {/* {sleeve.short === 1 ? <TableCell>Short Size</TableCell> : ""}
                  {sleeve.long === 1 ? <TableCell>Long Size</TableCell> : ""} */}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {sleeveName === 1
                      ? "Normal"
                      : sleeveName === 2
                        ? "Ranglan"
                        : "Not Selected"}
                  </TableCell>

                  {sleeve.short === 1 ? (
                    <TableCell>
                      {sleeve.shortType === 1
                        ? "HEM"
                        : sleeve.shortType === 2
                          ? "D / HEM"
                          : sleeve.shortType === 3
                            ? "Knittde Cuff"
                            : sleeve.shortType === 4
                              ? "Fabric Cuff"
                              : sleeve.shortType === 10
                                ? "Tiffin Fabric Cuff"
                                : "Not Selected"}
                    </TableCell>
                  ) : (
                    ""
                  )}
                  {sleeve.long === 1 ? (
                    <TableCell>
                      {sleeve.longType === 1
                        ? "HEM"
                        : sleeve.longType === 2
                          ? "D / HEM"
                          : sleeve.longType === 3
                            ? "Knittde Cuff"
                            : sleeve.longType === 4
                              ? "Fabric Cuff"
                              : sleeve.shortType === 10
                                ? "Tiffin Fabric Cuff"
                                : "Not Selected"}
                    </TableCell>
                  ) : (
                    ""
                  )}
                  {/* {sleeve.short === 1 ? <TableCell>{sleeve.shortSize}</TableCell> : ""}
                  {sleeve.long === 1 ? <TableCell>{sleeve.longSize}</TableCell> : ""} */}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
