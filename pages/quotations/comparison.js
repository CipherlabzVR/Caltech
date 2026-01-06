import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import InitialSummaryTable from "./ini-sum-table";
import ApprovedSummaryTable from "./apr-sum-table";
import { Box, Button, Typography } from "@mui/material";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import TitlebarBelowMasonryImageList from "./image-list";

export default function Comparison() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);


  const fetchInquiryById = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetInquiryByInquiryId?id=${inqId}&optId=${optId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }

      const data = await response.json();
      const inq = data.result;
      setInquiry(inq);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId) {
      fetchInquiryById();
    }
  }, []);

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Comparison Quotations</h1>
        <ul>
          <li>
            <Link href="/quotations/approved-quotation">
              Approved Quotations
            </Link>
          </li>
          <li>Comparison</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} mb={1} display="flex" justifyContent="space-between">
          <Box display="flex" sx={{ gap: "10px" }}>
            {inquiry ? inquiry.customerName : ""} / {inquiry ? inquiry.inquiryCode : ""} / {inquiry ? inquiry.optionName : ""}
          </Box>
          <Link href="/quotations/approved-quotation/">
            <Button variant="outlined" color="primary">
              Go Back
            </Button>
          </Link>
        </Grid>
        <Grid item lg={6} xs={12} pr={1} sx={{ background: "#fff" }}>
          <InitialSummaryTable inquiry={inquiry}/>
        </Grid>
        <Grid item xs={6} pr={1}>
          <TitlebarBelowMasonryImageList inquiry={inquiry} />
        </Grid>
      </Grid>
    </>
  );
}
