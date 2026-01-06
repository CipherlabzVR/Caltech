import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
    Box,
    Button,
    Typography,
    Card,
    FormControlLabel,
    Checkbox,
    IconButton,
    Tooltip,
} from "@mui/material";
import ViewImage from "@/components/UIElements/Modal/ViewImage";
import BASE_URL from "Base/api";
import AddFileRemark from "@/components/utils/AddFileRemark";
import DeleteIcon from '@mui/icons-material/Delete';

export default function CommonFileUpload({ inquiry, onUpload }) {
    const [uploading, setUploading] = useState(false);
    const [commonImage, setCommonImage] = useState(null);
    const [commonImageID, setCommonImageID] = useState(null);
    const [isCommonChecked, setIsCommonChecked] = useState(false);

    const fetchDocuments = async (inquiryId, optionId, windowType) => {
        try {
            const response = await fetch(
                `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
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
            const result = data.result.find(
                (item) =>
                    item.documentType === 4 &&
                    item.documentContentType === 6 &&
                    item.documentSubContentType === 7
            );
            if (result) {
                setIsCommonChecked(true);
                setCommonImage(result.documentURL);
                setCommonImageID(result.id);
            }
        } catch (error) {
            console.error("Error fetching:", error);
        }
    };

    useEffect(() => {
        if (inquiry) {
            fetchDocuments(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
        }
        if (onUpload) {
            onUpload(uploading);
        }
    }, [inquiry, uploading]);

    const handleCommonCheckboxChange = async (event, id) => {
        setIsCommonChecked(event.target.checked);
        if (event.target.checked === true) {
            try {
                const data = {
                    InquiryID: inquiry.inquiryId,
                    InqCode: inquiry.inquiryCode,
                    WindowType: inquiry.windowType,
                    OptionId: inquiry.optionId,
                    DocumentType: 4,
                    DocumentContentType: 6,
                    DocumentSubContentType: 7,
                };

                const response = await fetch(
                    `${BASE_URL}/AWS/CreateDocumentWithoutURL`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(data),
                    }
                );
            } catch (error) {
                console.error("Error uploading PDF:", error);
            }
        } else {
            const response = await fetch(
                `${BASE_URL}/AWS/DeleteDocument?docId=${id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        }
    };
    const handleCommonImageUpload = async (event) => {
        const file = event.target.files[0];
        setCommonImage(URL.createObjectURL(file));
        try {
            const formData = new FormData();
            setUploading(true);
            formData.append("File", file);
            formData.append("InquiryID", inquiry.inquiryId);
            formData.append("InqCode", inquiry.inquiryCode);
            formData.append("WindowType", inquiry.windowType);
            formData.append("OptionId", inquiry.optionId);
            formData.append("DocumentType", 4);
            formData.append("DocumentContentType", 6);
            formData.append("DocumentSubContentType", 7);
            formData.append("FileName", `Common.png`);

            const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData,
            });
        } catch (error) {
            console.error("Error uploading PDF:", error);
        } finally {
            setUploading(false);
        }
    };
    const handleRemoveCommonImage = async (id) => {
        setCommonImage(null);
        const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
        });
    };

    return (
        <>
            <Grid item xs={12}>
                <Grid container>
                    <Grid mt={2} item xs={12} lg={3}>
                        <Card
                            sx={{
                                boxShadow: "none",
                                p: "10px",
                                height: "100%",
                                position: "relative",
                                cursor: "pointer",
                                backgroundImage: commonImage
                                    ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${commonImage})`
                                    : "none",
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        >
                            <Box display="flex" justifyContent="space-between">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={isCommonChecked || commonImage ? true : false}
                                            onChange={(event) =>
                                                handleCommonCheckboxChange(event, commonImageID)
                                            }
                                        />
                                    }
                                />
                                <ViewImage imageURL={commonImage} />
                            </Box>
                            <Typography variant="h5" fontWeight="bold">
                                Special
                            </Typography>
                            <Box mt={1}>
                                <input
                                    type="file"
                                    id="commonImage"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleCommonImageUpload}
                                />
                                <label htmlFor="commonImage">
                                    <Button
                                        disabled={!isCommonChecked && !commonImage}
                                        fullWidth
                                        variant="contained"
                                        component="span"
                                    >
                                        {commonImage ? "Change Image" : "Add Image"}
                                    </Button>
                                </label>
                                <Box mt={1} display="flex" justifyContent="space-between">
                                    <AddFileRemark id={commonImageID} checked={isCommonChecked} />
                                    <Tooltip onClick={() => handleRemoveCommonImage(commonImageID)} title="Remove" placement="top">
                                        <span>
                                            <IconButton disabled={!isCommonChecked && !commonImage} aria-label="edit">
                                                <DeleteIcon color={isCommonChecked ? "error" : ""} fontSize="medium" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
}
