import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
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
import DocImageList from "@/components/UIElements/SwiperSlider/DocImageList";
import ViewImages from "@/components/UIElements/Modal/ViewImages";

export default function FabList() {
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
                <TableRow>
                  <TableCell>Wetlook</TableCell>
                  <TableCell>GSM 1</TableCell>
                  <TableCell>Com 1</TableCell>
                  <TableCell>Supplier 1</TableCell>
                  <TableCell>Color 1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Wetlook</TableCell>
                  <TableCell>GSM 1</TableCell>
                  <TableCell>Com 1</TableCell>
                  <TableCell>Supplier 1</TableCell>
                  <TableCell>Color 1</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
