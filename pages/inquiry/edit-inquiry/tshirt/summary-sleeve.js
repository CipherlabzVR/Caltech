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

const isFlag = (value) => value === 1 || value === "1";

const getSleevePatternName = (list) => {
  if (!list) return "Not Selected";
  if (isFlag(list.wrangler)) return "Ranglan";
  if (isFlag(list.normal)) return "Normal";
  return "Not Selected";
};

const getSleeveFinishName = (type) => {
  switch (Number(type)) {
    case 1:
    case 5:
      return "HEM";
    case 2:
    case 6:
      return "D / HEM";
    case 3:
    case 7:
      return "Knittde Cuff";
    case 4:
    case 8:
      return "Fabric Cuff";
    case 10:
      return "Tiffin Knitted Cuff";
    default:
      return "Not Selected";
  }
};

export default function SummarySleeve({ inquiry }) {
  const [sleeve, setSleeve] = useState({});
  const [sleeveName, setSleeveName] = useState("Not Selected");

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
      if (!response.ok) {
        throw new Error("Failed to fetch sleeve details");
      }

      const data = await response.json();
      const list = data.result?.[0];
      if (!list) {
        setSleeve({});
        setSleeveName("Not Selected");
        return;
      }

      setSleeveName(getSleevePatternName(list));
      setSleeve(list);
    } catch (error) {
      setSleeve({});
      setSleeveName("Not Selected");
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
                  <TableCell>Sleeve Pattern</TableCell>
                  {isFlag(sleeve.short) ? <TableCell>Short Sleeve</TableCell> : ""}
                  {isFlag(sleeve.long) ? <TableCell>Long Sleeve</TableCell> : ""}
                  {/* {sleeve.short === 1 ? <TableCell>Short Size</TableCell> : ""}
                  {sleeve.long === 1 ? <TableCell>Long Size</TableCell> : ""} */}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{sleeveName}</TableCell>

                  {isFlag(sleeve.short) ? (
                    <TableCell>{getSleeveFinishName(sleeve.shortType)}</TableCell>
                  ) : (
                    ""
                  )}
                  {isFlag(sleeve.long) ? (
                    <TableCell>{getSleeveFinishName(sleeve.longType)}</TableCell>
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
