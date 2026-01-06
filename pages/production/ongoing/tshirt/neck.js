import React, { useEffect, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Alert,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function SelectFabric() {
  const [selectedNeck, setSelectedNeck] = useState("");
  const [errorAlert, setErrorAlert] = useState(false);
  const [neckSelected, setNeckSelected] = useState("");
  const router = useRouter();
  const inqType = router.query.inqType;
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;
  const [isChecked, setIsChecked] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [neckTypeIds, setNeckTypeIds] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
  });

  const handleNeckChange = (event) => {
    setSelectedNeck(event.target.value);
  };

  const fetchNeckBodyList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetAllNeckBody?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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

      const updatedChecked = {};
      const updatedNeckTypeIds = {};

      data.result.forEach((item) => {
        updatedChecked[item.neckBodyTypes] = true;
        updatedNeckTypeIds[item.neckBodyTypes] = item.id;
      });
      setIsChecked(updatedChecked);
      setNeckTypeIds(updatedNeckTypeIds);
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchNeckBodyList();
  }, []);

  const handleSubmit = () => {
    if (!selectedNeck) {
      setErrorAlert(true);
      return;
    } else {
      setErrorAlert(false);
      if (selectedNeck === "POLO") {
        router.push(`/production/ongoing/tshirt/polo-neck/?inqType=${inqType}`);
      } else if (selectedNeck === "Crew Neck") {
        router.push(`/production/ongoing/tshirt/crew-neck/?inqType=${inqType}`);
      } else if (selectedNeck === "V Neck") {
        router.push(`/production/ongoing/tshirt/v-neck/?inqType=${inqType}`);
      }
    }
  };

  const handleCheckboxChange = (id, neckTypeId) => async (event) => {
    const updatedChecked = { ...isChecked, [id]: event.target.checked };
    setIsChecked(updatedChecked);
    if (event.target.checked) {
      const response = await fetch(`${BASE_URL}/InquiryNeck/AddNeckBodyType`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          InqOptionName: optionName,
          NeckBodyTypes: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
    } else {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/DeleteNeckBody?id=${neckTypeId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete fabric");
      }
    }
  };

  const fetchNeckTypes = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/InquiryNeck/GetNeckType?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck types");
      }

      const data = await response.json();

      if (data.result != null) {
        const type = data.result.necKTypes;
        setSelectedNeck(
          type === 1 ? "POLO" : type === 2 ? "Crew Neck" : "V Neck"
        );
        setNeckSelected(
          type === 1 ? "POLO" : type === 2 ? "Crew Neck" : "V Neck"
        );
      }
    } catch (error) {
      console.error("Error fetching Neck types:", error);
    }
  };

  useEffect(() => {
    fetchNeckTypes();
  }, []);

  return (
    <>
      <DashboardHeader
        customerName={customerName}
        optionName={optionName}
        href="/production/ongoing/"
        link="Ongoing Inquiries"
        title="Neck"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Neck</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/production/ongoing/sizes/?inqType=${inqType}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Link href="/production/ongoing/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={handleSubmit}
            >
              next
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            {errorAlert && (
              <Grid item xs={12} p={1}>
                <Alert severity="error">
                  Please select a neck option before proceeding.
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup
                  name="neck"
                  value={selectedNeck}
                  onChange={handleNeckChange}
                >
                  <FormControlLabel
                    value="POLO"
                    control={<Radio />}
                    label={
                      <Typography style={{ fontSize: "25px" }}>POLO</Typography>
                    }
                    disabled={
                      neckSelected === "Crew Neck" || neckSelected === "V Neck"
                    }
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup
                  name="neck"
                  value={selectedNeck}
                  onChange={handleNeckChange}
                >
                  <FormControlLabel
                    value="Crew Neck"
                    control={<Radio />}
                    label={
                      <Typography style={{ fontSize: "25px" }}>
                        Crew Neck
                      </Typography>
                    }
                    disabled={
                      neckSelected === "POLO" || neckSelected === "V Neck"
                    }
                  />
                </RadioGroup>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "25px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                  paddingY: "40px",
                }}
              >
                <RadioGroup
                  name="neck"
                  value={selectedNeck}
                  onChange={handleNeckChange}
                >
                  <FormControlLabel
                    value="V Neck"
                    control={<Radio />}
                    label={
                      <Typography style={{ fontSize: "25px" }}>
                        V Neck
                      </Typography>
                    }
                    disabled={
                      neckSelected === "Crew Neck" || neckSelected === "POLO"
                    }
                  />
                </RadioGroup>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <Typography>Other Details</Typography>
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
                  control={
                    <Checkbox
                      checked={isChecked[1]}
                      onChange={handleCheckboxChange(1, neckTypeIds[1])}
                    />
                  }
                  label="Contrast"
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
                  control={
                    <Checkbox
                      checked={isChecked[2]}
                      onChange={handleCheckboxChange(2, neckTypeIds[2])}
                    />
                  }
                  label="A/H Pie Pin"
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
                  control={
                    <Checkbox
                      checked={isChecked[3]}
                      onChange={handleCheckboxChange(3, neckTypeIds[3])}
                    />
                  }
                  label="Cuff Pie Pin"
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
                  control={
                    <Checkbox
                      checked={isChecked[4]}
                      onChange={handleCheckboxChange(4, neckTypeIds[4])}
                    />
                  }
                  label="Bottom D / Hem "
                />
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
