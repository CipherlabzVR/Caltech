import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { Box, Button, Card, Checkbox, FormControlLabel, Radio, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";

export default function SelectSleeve() {
  const router = useRouter();
  const inqType = router.query.inqType;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;
  const [isShortChecked, setIsShortChecked] = useState(false);
  const [isLongChecked, setIsLongChecked] = useState(false);
  const [sleeveID, setSleeveID] = useState(); 
  const [selectedValue, setSelectedValue] = useState('short');


  const fetchSleeve = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquirySleeve/GetSleeve?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      const result = data.result[0];
      setSleeveID(result.id);
      if(result.short === 1){
        setIsShortChecked(true);
      }
      if(result.long === 1){
        setIsLongChecked(true);
      }
    } catch (error) {
      //console.error("Error fetching Sleeve Details:", error);
    }
  };

  useEffect(() => {
    fetchSleeve();
  }, []);

  const handleSelectionChange = async (event) => {
    setSelectedValue(event.target.value);
    const response = await fetch(
      `${BASE_URL}/InquirySleeve/AddOrUpdateSleeve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          OptionId: optionDetails.id,
          InqOptionName: optionName,
          WindowType: optionDetails.windowType,
          Wrangler: "0",
          Normal: "0",
          Short: event.target.value === 'short' ? 1 : 0,
          ShortType: 9,
          Long: event.target.value === 'long' ? 1 : 0,
          LongType: 9,
          ShortSize: 0,
          LongSize: 0,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete fabric");
    }
  };

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
          <li>Sleeve</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Sleeve</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/shirt/coller/?inqType=${inqType}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href="/inquiry/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Link href={`/inquiry/shirt/document-panel/?inqType=${inqType}`}>
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
              <Grid item xs={12} p={1} md={4} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    borderRadius: "10px",
                    p: "20px",
                    mb: "15px",
                    position: "relative",
                    height: "auto",
                    cursor: "pointer",
                  }}
                >
                  <FormControlLabel
                    value="short"
                    control={<Radio checked={selectedValue === 'short'} onChange={handleSelectionChange} />}
                    label="Short Sleeve"
                  />
                </Card>
              </Grid>
              <Grid item xs={12} p={1} md={4} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    borderRadius: "10px",
                    p: "20px",
                    mb: "15px",
                    position: "relative",
                    height: "auto",
                    cursor: "pointer",
                  }}
                >
                  <FormControlLabel
                    value="long"
                    control={<Radio checked={selectedValue === 'long'} onChange={handleSelectionChange} />}
                    label="Long Sleeve"
                  />
                </Card>
              </Grid>
              </Grid>
        </Grid>
      </Grid>
    </>
  );
}
