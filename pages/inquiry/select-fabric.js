import React, { useEffect, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Checkbox,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import Card from "@mui/material/Card";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";

export default function SelectFabric() {
  const [isChecked, setIsChecked] = useState([false, false]);
  const router = useRouter();
  const inqType = router.query.inqType;
  const [fabricList, setFabricList] = useState([]);
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const inquiryDetails = JSON.parse(localStorage.getItem("InquiryDetails"));
  const customerName = inquiryDetails.customerName;
  const optionName = optionDetails.optionName;
  const [valueList, setValueList] = useState([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState(null);

  const fetchFabricList = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Fabric/GetAllFabric`, {
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
      const filteredFabricList = data.result.filter(
        (fabric) =>
          fabric.isActive &&
          fabric.inquiryCategoryFabrics.some(
            (categoryFabric) =>
              categoryFabric.isActive &&
              categoryFabric.inquiryCategoryId === parseInt(inqType)
          )
      );
      setFabricList(filteredFabricList);
      fetchValueList(filteredFabricList);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  

  const fetchValueList = async (filteredFabricList) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquiryFabric?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      if (data && data.result) {
        const equalArray = filteredFabricList.filter((fabric) =>
          data.result.some((value) => value.fabricId === fabric.id)
        );
        setValueList(equalArray);
      } else {
        console.error("Data or data.result is undefined or null");
      }
    } catch (error) {
      console.error("Error fetching Value List:", error);
    }
  };

  useEffect(() => {
    fetchFabricList();
  }, []);

  const navToSummary = (Inquiry) => {
    const routes = {
      1: "/inquiry/tshirt/summary/",
      2: "/inquiry/shirt/summary/",
      3: "/inquiry/cap/summary/",
      4: "/inquiry/visor/summary/",
      5: "/inquiry/hat/summary/",
      6: "/inquiry/bag/summary/",
      7: "/inquiry/bottom/summary/",
      8: "/inquiry/short/summary/",
    };
    router.push({
      pathname: routes[Inquiry],
      query: { inqType: Inquiry, from: "sf" },
    });
  };

  const handleCardClick = (fabricId, fabricName) => {
    setSelectedFabric({ fabricId, fabricName });
    setIsDialogOpen(true);
  };

  const handleDialogConfirm = async () => {
    if (!selectedFabric) return;
    const { fabricId, fabricName } = selectedFabric;
    setIsDialogOpen(false);

    try {
      // Determine if the selected fabric is already in the valueList
      const isChecked = valueList.some(
        (item) => item.id === selectedFabric.fabricId
      );
      const url = isChecked
        ? `${BASE_URL}/Inquiry/DeleteInquiryFabric`
        : `${BASE_URL}/Inquiry/CreateInquiryFabric`;

      // Configure request body based on action (add or remove fabric)
      const requestBody = {
        InquiryID: inquiryDetails.id,
        InqCode: inquiryDetails.inqCode,
        OptionId: optionDetails.id,
        InqOptionName: optionName,
        FabricId: fabricId,
        FabricName: fabricName,
        WindowType: optionDetails.windowType,
      };

      // Make the API call to either add or remove the fabric
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(
          isChecked ? "Failed to delete fabric" : "Failed to create fabric"
        );
      }

      // Update the local state based on the action
      if (isChecked) {
        setValueList((prevList) =>
          prevList.filter((item) => item.id !== fabricId)
        );
      } else {
        setValueList((prevList) => [
          ...prevList,
          { id: fabricId, name: fabricName },
        ]);
      }
    } catch (error) {
      console.error("Error handling card click:", error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <DashboardHeader
        customerName={customerName}
        optionName={optionName}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Select Fabric"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Select Fabric</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            {/* <Link href=""> */}
            <Button
              onClick={() => navToSummary(inqType)}
              variant="outlined"
              color="primary"
            >
              summary
            </Button>
            {/* </Link> */}
            <Link href="/inquiry/select-inquiry/">
              <Button variant="outlined" color="primary">
                main menu
              </Button>
            </Link>
            <Link
              href={{
                pathname: `/inquiry/color-code/`,
                query: {
                  inqType: inqType,
                },
              }}
            >
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
            {fabricList.length === 0 ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{ width: "100%", mt: 5, height: "50vh" }}
              >
                <Box sx={{ width: "50%", padding: "30px" }}>
                  <center>
                    <img width="100px" src="/images/empty-folder.png" />
                  </center>
                  <Typography
                    variant="h6"
                    align="center"
                    sx={{ color: "#BEBEBE", fontWeight: "bold" }}
                  >
                    No fabrics available for this category.
                  </Typography>
                  <Typography align="center" sx={{ color: "#BEBEBE" }}>
                    Please navigate to the Master Fabric section and add fabrics
                    by selecting this category.
                  </Typography>
                </Box>
              </Box>
            ) : (
              fabricList.map((fabric, index) => (
                <Grid item xs={12} key={index} p={1} md={4} lg={3}>
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
                    onClick={() =>
                      handleCardClick(
                        fabric.inquiryCategoryFabrics[0].fabricId,
                        fabric.name
                      )
                    }
                  >
                    <Grid container>
                      <Grid
                        item
                        display="flex"
                        justifyContent="space-between"
                        xs={12}
                      >
                        <Typography
                          alignItems="end"
                          as="h4"
                          fontWeight="500"
                          fontSize="17px"
                          mt="10px"
                        >
                          {fabric.name}
                        </Typography>
                        <Checkbox
                          checked={valueList.some(
                            (item) => item.id === fabric.id
                          )}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <p style={{ fontSize: "12px", color: "dodgerblue" }}>
                          Inquiry Categories
                        </p>
                        {fabric.inquiryCategoryFabrics.map(
                          (category, index) => (
                            <span key={index}>
                              {category.inquiryCategoryName},{" "}
                            </span>
                          )
                        )}
                      </Grid>
                      <Grid
                        mt={2}
                        item
                        display="flex"
                        justifyContent="center"
                        xs={12}
                      >
                        <img width="100px" src="/images/fabricnew.png" />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Fabric Selection</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ fontSize: "1rem", marginBottom: "1rem" }}>
            Do you want to{" "}
            {valueList.some((item) => item.id === selectedFabric?.fabricId)
              ? "remove"
              : "add"}{" "}
            this fabric to your selection?
          </DialogContentText>
          <DialogContentText color="text.secondary" sx={{ fontSize: "0.9rem" }}>
            <strong>Note:</strong> If you update your fabric, you will need to
            update the count of sizes on the sizes screen as well. Without
            updating, the summary will not reflect your new fabric. Are you sure
            you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: "1rem" }}>
          <Button
            onClick={handleCloseDialog}
            color="secondary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDialogConfirm}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
