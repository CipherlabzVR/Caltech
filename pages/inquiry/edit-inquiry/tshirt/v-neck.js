import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  FormControlLabel,
  Checkbox,
  ButtonGroup,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function VNeck() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [selectedButtonVN, setSelectedButtonVN] = useState(0);
  const [isVNChecked, setIsVNChecked] = useState(false);
  const [selectedButtonCVN, setSelectedButtonCVN] = useState(0);
  const [isCVNChecked, setIsCVNChecked] = useState(false);
  const [selectedButtonFCVN, setSelectedButtonFCVN] = useState(0);
  const [isFCVNChecked, setIsFCVNChecked] = useState(false);
  const [vNId, setVNId] = useState();
  const [cVNId, setCVNId] = useState();
  const [fCVNId, setFCVNId] = useState();

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
      fetchNeckTypes(inq.inquiryId, inq.optionId, inq.windowType);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    if (inqId,optId) {
      fetchInquiryById();
    }
  }, []);

  const handleSubmit = async () => {
    const firstRow = isVNChecked
      ? 7
      : isCVNChecked
        ? 8
        : isFCVNChecked
          ? 9
          : 10;

    let secondRow;
    if (isVNChecked) {
      secondRow = selectedButtonVN ? selectedButtonVN : 9;
    } else if (isCVNChecked) {
      secondRow = selectedButtonCVN ? selectedButtonCVN : 9;
    } else if (isFCVNChecked) {
      secondRow = selectedButtonFCVN ? selectedButtonFCVN : 9;
    } else {
      secondRow = 9;
    }
    const bodyData = {
      InquiryID: inquiry.inquiryId,
      InqCode: inquiry.inquiryCode,
      OptionId: inquiry.optionId,
      InqOptionName: inquiry.optionName,
      WindowType: inquiry.windowType,
      NecKTypes: 3,
      NeckFirstRows: firstRow,
      Neck2ndRowS: secondRow,
      Neck3rdRowS: 6,
      POLOlength: String(0),
      POLOWidth: String(0),
      POLOButton: String(0),
    };

    const response = await fetch(
      `${BASE_URL}/InquiryNeck/AddOrUpdateNeckType`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete fabric");
    }
    fetchNeckTypes(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    router.push(`/inquiry/edit-inquiry/tshirt/sleeve/?id=${inquiry ? inquiry.inquiryId : ""}&neck=3&option=${inquiry ? inquiry.optionId: ""}`);
  };

  const handleVNChange = async (event, value) => {
    setIsVNChecked(event.target.checked);
    if (
      (isFCVNChecked == true || isCVNChecked == true) &&
      isVNChecked == false
    ) {
      setIsCVNChecked(false);
      setIsFCVNChecked(false);
    }
  };
  const handleCVNChange = async (event, value) => {
    setIsCVNChecked(event.target.checked);
    if (
      (isFCVNChecked == true || isVNChecked == true) &&
      isCVNChecked == false
    ) {
      setIsVNChecked(false);
      setIsFCVNChecked(false);
    }
  };
  const handleFCVNChange = async (event, value) => {
    setIsFCVNChecked(event.target.checked);

    if (
      (isCVNChecked == true || isVNChecked == true) &&
      isFCVNChecked == false
    ) {
      setIsVNChecked(false);
      setIsCVNChecked(false);
    }
  };
  const handleVNButtonClick = async (index) => {
    setSelectedButtonVN(index);
  };
  const handleCVNButtonClick = async (index) => {
    setSelectedButtonCVN(index);
  };
  const handleFCVNButtonClick = async (index) => {
    setSelectedButtonFCVN(index);
  };
  const fetchNeckTypes = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckTypes?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}&necKTypes=3`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }

      const data = await response.json();

      const resultWithNeckFirstRows7 = data.result.find(
        (item) => item.neckFirstRows === 7
      );
      const resultWithNeckFirstRows8 = data.result.find(
        (item) => item.neckFirstRows === 8
      );
      const resultWithNeckFirstRows9 = data.result.find(
        (item) => item.neckFirstRows === 9
      );

      if (resultWithNeckFirstRows7) {
        setVNId(resultWithNeckFirstRows7.id);
        setIsVNChecked(true);
        setSelectedButtonVN(resultWithNeckFirstRows7.neck2ndRowS);
      }

      if (resultWithNeckFirstRows8) {
        setCVNId(resultWithNeckFirstRows8.id);
        setIsCVNChecked(true);
        setSelectedButtonCVN(resultWithNeckFirstRows8.neck2ndRowS);
      }

      if (resultWithNeckFirstRows9) {
        setFCVNId(resultWithNeckFirstRows9.id);
        setIsFCVNChecked(true);
        setSelectedButtonFCVN(resultWithNeckFirstRows9.neck2ndRowS);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  return (
    <>
      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="V Neck"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography fontWeight="bold">V Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/tshirt/neck/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId: ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
            >
              next
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item p={1} xs={12} lg={3} md={6}>
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
                  control={
                    <Checkbox
                      checked={isVNChecked}
                      onChange={(event) => handleVNChange(event, vNId)}
                    />
                  }
                  label="V Neck"
                />
                {isVNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonVN === 5 ? "contained" : "outlined"
                        }
                        onClick={() => handleVNButtonClick(5)}
                      >
                        RIB
                      </Button>
                      <Button
                        variant={
                          selectedButtonVN === 6 ? "contained" : "outlined"
                        }
                        onClick={() => handleVNButtonClick(6)}
                      >
                        Fabric
                      </Button>
                    </ButtonGroup>
                  </Box>
                )}
              </Card>
            </Grid>
            <Grid item p={1} xs={12} lg={3} md={6}>
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
                  control={
                    <Checkbox
                      checked={isCVNChecked}
                      onChange={(event) => handleCVNChange(event, cVNId)}
                    />
                  }
                  label="Chinese V Neck"
                />
                {isCVNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonCVN === 3 ? "contained" : "outlined"
                        }
                        onClick={() => handleCVNButtonClick(3)}
                      >
                        Normal
                      </Button>
                      <Button
                        variant={
                          selectedButtonCVN === 4 ? "contained" : "outlined"
                        }
                        onClick={() => handleCVNButtonClick(4)}
                      >
                        1/8 Line
                      </Button>
                    </ButtonGroup>
                  </Box>
                )}
              </Card>
            </Grid>
            <Grid item p={1} xs={12} lg={3} md={6}>
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
                  control={
                    <Checkbox
                      checked={isFCVNChecked}
                      onChange={(event) => handleFCVNChange(event, fCVNId)}
                    />
                  }
                  label="Full Collar V Neck"
                />
                {isFCVNChecked && (
                  <Box mt={5}>
                    <ButtonGroup
                      fullWidth
                      disableElevation
                      aria-label="Disabled button group"
                    >
                      <Button
                        variant={
                          selectedButtonFCVN === 3 ? "contained" : "outlined"
                        }
                        onClick={() => handleFCVNButtonClick(3)}
                      >
                        Normal
                      </Button>
                      <Button
                        variant={
                          selectedButtonFCVN === 4 ? "contained" : "outlined"
                        }
                        onClick={() => handleFCVNButtonClick(4)}
                      >
                        1/8 Line
                      </Button>
                    </ButtonGroup>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
