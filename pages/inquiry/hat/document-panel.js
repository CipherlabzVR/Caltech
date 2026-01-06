import React, { useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import FrontDocument from "./front-doc";
import BackDocument from "./back-doc";
import LSideDocument from "./l-side-doc";
import RSideDocument from "./r-side-doc";
import { useRouter } from "next/router";

export default function DocumentPanel() {
  const router = useRouter();
  const inqType = router.query.inqType;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;

  return (
    <>
      <div className={styles.pageTitle}>
        <Typography color="primary" variant="h6">
        {customerName}'s Inquiry ({optionName})
        </Typography>
        <ul>
          <li>
            <Link href="/inquiry/inquries/">Inquries</Link>
          </li>
          <li>Document Panel</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">Document Panel</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/sizes/?inqType=${inqType}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href="/inquiry/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Link href={`/inquiry/hat/summary/?inqType=${inqType}`}>
              <Button
                variant="outlined"
                color="primary"
                endIcon={<NavigateNextIcon />}
              >
                next
              </Button>
            </Link>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12}>
              <FrontDocument />
            </Grid>
            <Grid item xs={12}>
              <BackDocument />
            </Grid>            
            <Grid item xs={12}>
              <LSideDocument />
            </Grid>
            <Grid item xs={12}>
              <RSideDocument/>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
