import React, { useEffect, useState } from "react";
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
import Link from "next/link";

export default function EditFabric() {
    const router = useRouter();
    const inqId = router.query.id;
    const optId = router.query.option;
    const from = router.query.from;
    const [fabricList, setFabricList] = useState([]);
    const [valueList, setValueList] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedFabric, setSelectedFabric] = useState(null);
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
            await setInquiry(data.result);

            fetchFabricList(data.result.windowType);
            if (data.result.fabricList) {
                const selected = data.result.fabricList.map(f => ({
                    id: f.fabricId,
                    name: f.fabricName,
                }));
                setValueList(selected);
            }
        } catch (error) {
            console.error("Error fetching Fabric List:", error);
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
            setFabricList(data.result);
        } catch (error) {
            console.error("Error fetching Fabric List:", error);
        }
    };

    useEffect(() => {
        if (inqId,optId) {
            fetchInquiryById();
        }
    }, []);

    const navToSummary = () => {
        const routes = {
            1: "/inquiry/edit-inquiry/tshirt/summary/",
            2: "/inquiry/edit-inquiry/shirt/summary/",
            3: "/inquiry/edit-inquiry/cap/summary/",
            4: "/inquiry/edit-inquiry/visor/summary/",
            5: "/inquiry/edit-inquiry/hat/summary/",
            6: "/inquiry/edit-inquiry/bag/summary/",
            7: "/inquiry/edit-inquiry/bottom/summary/",
            8: "/inquiry/edit-inquiry/short/summary/",
        };
        router.push({
            pathname: routes[inquiry.windowType],
            query: { id: inquiry.inquiryId, from: "sf", option: inquiry.optionId },
        });
    };

    const navToNext = () => {
        router.push({
            pathname: "/inquiry/edit-inquiry/color-code",
            query: { id: inquiry.inquiryId, option: inquiry.optionId },
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
                ? `${BASE_URL}/Inquiry/DeleteInquiryFabric`
                : `${BASE_URL}/Inquiry/CreateInquiryFabric`;

            const requestBody = {
                InquiryID: inquiry.inquiryId,
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
                customerName={inquiry ? inquiry.customerName : ""}
                optionName={inquiry ? inquiry.optionName : ""}
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
                        <Button
                            onClick={() => navToSummary()}
                            variant="outlined"
                            color="primary"
                        >
                            summary
                        </Button>
                        {from === "1" ?
                            <Link href="/inquiry/select-inquiry/">
                                <Button variant="outlined" color="primary">
                                    main menu
                                </Button>
                            </Link> : ""}
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
