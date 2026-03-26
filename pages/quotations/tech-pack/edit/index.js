import React, { useEffect, useState, useRef } from "react";
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
    CircularProgress,
} from "@mui/material";
import Card from "@mui/material/Card";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TechPackEdit() {
    const router = useRouter();
    const { inquiryId, optionId, sentQuotationId } = router.query;
    const [fabricList, setFabricList] = useState([]);
    const [valueList, setValueList] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFabric, setSelectedFabric] = useState(null);
    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ongoingInquiryId, setOngoingInquiryId] = useState(null);
    const initializingRef = useRef(false);

    // Initialize Tech Pack - Load inquiry data and create/get ongoing record
    const initializeTechPack = async () => {
        // Prevent multiple calls using ref (works better with React strict mode)
        if (initializingRef.current) return;
        initializingRef.current = true;
        
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            // First, try to get existing ongoing inquiry or create new one from inquiry data
            const response = await fetch(
                `${BASE_URL}/Ongoing/InitializeTechPack?inquiryId=${inquiryId}&optionId=${optionId}&sentQuotationId=${sentQuotationId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                initializingRef.current = false;
                throw new Error("Failed to initialize Tech Pack");
            }

            const data = await response.json();
            console.log("Tech Pack Init Response:", data);
            
            if (data.result) {
                setInquiry(data.result);
                setOngoingInquiryId(data.result.ongoingInquiryId);
                
                // Fetch fabric list based on window type
                if (data.result.windowType) {
                    await fetchFabricList(data.result.windowType);
                }
                
                // Load selected fabrics from ongoing
                if (data.result.fabricList && data.result.fabricList.length > 0) {
                    const selected = data.result.fabricList.map(f => ({
                        id: f.fabricId,
                        name: f.fabricName,
                    }));
                    console.log("Selected fabrics:", selected);
                    setValueList(selected);
                }
            } else {
                console.error("No result in response:", data);
                toast.error("Failed to load Tech Pack data");
                initializingRef.current = false;
            }
        } catch (error) {
            console.error("Error initializing Tech Pack:", error);
            toast.error("Failed to load Tech Pack data");
            initializingRef.current = false;
        } finally {
            setLoading(false);
        }
    };

    const fetchFabricList = async (type) => {
        try {
            const response = await fetch(`${BASE_URL}/Fabric/GetAllFabricByWindowType?type=${type}`, {
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
            console.log("Fabric List Response:", data);
            setFabricList(data.result || []);
        } catch (error) {
            console.error("Error fetching Fabric List:", error);
            setFabricList([]);
        }
    };

    useEffect(() => {
        if (router.isReady && inquiryId && optionId) {
            initializeTechPack();
        }
    }, [router.isReady, inquiryId, optionId]);

    const navToNext = () => {
        router.push({
            pathname: "/quotations/tech-pack/edit/color-code",
            query: { inquiryId, optionId, sentQuotationId, ongoingInquiryId, ...(inquiry?.windowType != null && { windowType: inquiry.windowType }) },
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
            const isChecked = valueList.some(
                (item) => item.id === selectedFabric.fabricId
            );
            const url = isChecked
                ? `${BASE_URL}/Ongoing/DeleteOngoingFabric`
                : `${BASE_URL}/Ongoing/CreateOngoingFabric`;

            const requestBody = {
                InquiryID: ongoingInquiryId,
                InqCode: inquiry.inquiryCode,
                OptionId: inquiry.optionId,
                InqOptionName: inquiry.optionName,
                FabricId: fabricId,
                FabricName: fabricName,
                WindowType: inquiry.windowType,
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(
                    isChecked ? "Failed to delete fabric" : "Failed to create fabric"
                );
            }

            if (isChecked) {
                setValueList((prevList) =>
                    prevList.filter((item) => item.id !== fabricId)
                );
                toast.success("Fabric removed");
            } else {
                setValueList((prevList) => [
                    ...prevList,
                    { id: fabricId, name: fabricName },
                ]);
                toast.success("Fabric added");
            }
        } catch (error) {
            console.error("Error handling card click:", error);
            toast.error("Failed to update fabric");
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <ToastContainer />
            <DashboardHeader
                customerName={inquiry ? inquiry.customerName : ""}
                optionName={inquiry ? inquiry.optionName : ""}
                windowType={inquiry ? inquiry.windowType : null}
                href="/quotations/tech-pack/"
                link="Tech Pack"
                title="Select Fabric - Tech Pack"
            />

            <Grid
                container
                rowSpacing={1}
                columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
            >
                <Grid item xs={12} display="flex" justifyContent="space-between">
                    <Typography>Select Fabric</Typography>
                    <Box display="flex" sx={{ gap: "10px" }}>
                        <Link href="/quotations/tech-pack/">
                            <Button variant="outlined" color="primary">
                                Back to List
                            </Button>
                        </Link>
                        <Button
                            onClick={() => navToNext()}
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
                                        onClick={() => {
                                            if (fabric.inquiryCategoryFabrics && fabric.inquiryCategoryFabrics[0]) {
                                                handleCardClick(
                                                    fabric.inquiryCategoryFabrics[0].fabricId,
                                                    fabric.name
                                                );
                                            }
                                        }}
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
                                                        (item) => item.id === fabric.inquiryCategoryFabrics[0]?.fabricId
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
