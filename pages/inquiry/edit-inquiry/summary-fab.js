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

export default function FabListInq({inquiry}) {
  const [fabList, setFabList] = useState([]);

  const fetchFabricList = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquiryFabric?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Value List");
      }

      const data = await response.json();
      setFabList(data.result);
    } catch (error) {
      console.error("Error fetching Value List:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchFabricList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography fontWeight="bold" sx={{ mt: 1, mb: 1 }}>
            Fabric
          </Typography>
          <TableContainer component={Paper}>
            <Table
              size="small"
              aria-label="simple table"
              className="dark-table"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Fabric</TableCell>
                  <TableCell>GSM</TableCell>
                  <TableCell>Composition</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Color Code</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {fabList.length === 0 ? (
                  <TableRow
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    <TableCell colSpan={3} component="th" scope="row">
                      <Typography color="error">
                        Fabric not selected
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  fabList.map((fab, index) => (
                    <TableRow key={index}>
                      <TableCell>{fab.fabricName}</TableCell>
                      <TableCell>{fab.gsmName === "" ? "-" : fab.gsmName}</TableCell>
                      <TableCell>{fab.compositionName === "" ? "-" : fab.compositionName}</TableCell>
                      <TableCell>{fab.supplierName === "" ? "-" : fab.supplierName}</TableCell>
                      <TableCell>{fab.colorCodeName === "" ? "-" : fab.colorCodeName}</TableCell>
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
