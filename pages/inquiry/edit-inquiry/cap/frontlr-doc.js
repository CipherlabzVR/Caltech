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

export default function FrontLRDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [frontLImage, setFrontLImage] = useState(null);
  const [frontRImage, setFrontRImage] = useState(null);
  const [frontLREMBImage, setFrontLREMBImage] = useState(null);
  const [frontLRSUBImage, setFrontLRSUBImage] = useState(null);
  const [frontLRSPrintImage, setFrontLRSPrintImage] = useState(null);
  const [frontLRDTFImage, setFrontLRDTFImage] = useState(null);

  const [frontLImageID, setFrontLImageID] = useState();
  const [frontRImageID, setFrontRImageID] = useState();
  const [frontLREMBImageID, setFrontLREMBImageID] = useState();
  const [frontLRSUBImageID, setFrontLRSUBImageID] = useState();
  const [frontLRSPrintImageID, setFrontLRSPrintImageID] = useState();
  const [frontLRDTFImageID, setFrontLRDTFImageID] = useState();

  const [isFrontLChecked, setIsFrontLChecked] = useState(false);
  const [isFrontRChecked, setIsFrontRChecked] = useState(false);
  const [isFrontLREMBChecked, setIsFrontLREMBChecked] = useState(false);
  const [isFrontLRSUBChecked, setIsFrontLRSUBChecked] = useState(false);
  const [isFrontLRSPrintChecked, setIsFrontLRSPrintChecked] = useState(false);
  const [isFrontLRDTFChecked, setIsFrontLRDTFChecked] = useState(false);

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

      const resultFrontL = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 11 &&
          item.documentSubContentType === 5
      );

      const resultFrontR = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 12 &&
          item.documentSubContentType === 5
      );

      const resultFrontLREMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 13 &&
          item.documentSubContentType === 1
      );
      const resultFrontLRSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 13 &&
          item.documentSubContentType === 2
      );
      const resultFrontLRSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 13 &&
          item.documentSubContentType === 3
      );
      const resultFrontLRDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 13 &&
          item.documentSubContentType === 4
      );
      if (resultFrontL) {
        setIsFrontLChecked(true);
        setFrontLImage(resultFrontL.documentURL);
        setFrontLImageID(resultFrontL.id);
      }
      if (resultFrontR) {
        setIsFrontRChecked(true);
        setFrontRImage(resultFrontR.documentURL);
        setFrontRImageID(resultFrontR.id);
      }
      if (resultFrontLREMB) {
        setIsFrontLREMBChecked(true);
        setFrontLREMBImage(resultFrontLREMB.documentURL);
        setFrontLREMBImageID(resultFrontLREMB.id);
      }
      if (resultFrontLRSUB) {
        setIsFrontLRSUBChecked(true);
        setFrontLRSUBImage(resultFrontLRSUB.documentURL);
        setFrontLRSUBImageID(resultFrontLRSUB.id);
      }
      if (resultFrontLRSPrint) {
        setIsFrontLRSPrintChecked(true);
        setFrontLRSPrintImage(resultFrontLRSPrint.documentURL);
        setFrontLRSPrintImageID(resultFrontLRSPrint.id);
      }
      if (resultFrontLRDTF) {
        setIsFrontLRDTFChecked(true);
        setFrontLRDTFImage(resultFrontLRDTF.documentURL);
        setFrontLRDTFImageID(resultFrontLRDTF.id);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
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

  const handleFrontLCheckboxChange = async (event, id) => {
    setIsFrontLChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 11,
          DocumentSubContentType: 5,
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

  const handleFrontRCheckboxChange = async (event, id) => {
    setIsFrontRChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 12,
          DocumentSubContentType: 5,
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

  const handleFrontLREMBCheckboxChange = async (event, id) => {
    setIsFrontLREMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 13,
          DocumentSubContentType: 1,
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
  const handleFrontLRSUBCheckboxChange = async (event, id) => {
    setIsFrontLRSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 13,
          DocumentSubContentType: 2,
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
  const handleFrontLRSPrintCheckboxChange = async (event, id) => {
    setIsFrontLRSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 13,
          DocumentSubContentType: 3,
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
  const handleFrontLRDTFCheckboxChange = async (event, id) => {
    setIsFrontLRDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 13,
          DocumentSubContentType: 4,
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

  //fornt L image start
  const handleFrontLImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 11);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `FrontL.png`);

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
  const handleRemoveFrontLImage = async (id) => {
    setFrontLImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //front L image end

  //fornt R image start
  const handleFrontRImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontRImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 12);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `FrontR.png`);

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
  const handleRemoveFrontRImage = async (id) => {
    setFrontRImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //front R image end

  //fron EMB start
  const handleFrontLREMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLREMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 13);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `FrontLREMB.png`);

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
  const handleRemoveFrontLREMBImage = async (id) => {
    setFrontLREMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontLR EMB end

  //frontLR sub start
  const handleFrontLRSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLRSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 13);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `FrontLRSUB.png`);

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
  const handleRemoveFrontLRSUBImage = async (id) => {
    setFrontLRSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontLR SUB end

  //frontLR s print start
  const handleFrontLRSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLRSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 13);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `FrontLRSPrint.png`);

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
  const handleRemoveFrontLRSPrintImage = async (id) => {
    setFrontLRSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontLR s print end

  //frontLR dtf start
  const handleFrontLRDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontLRDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 13);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `FrontLRDTF.png`);

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
  const handleRemoveFrontLRDTFImage = async (id) => {
    setFrontLRDTFImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };

  //frontLR dtf end
  return (
    <>
      <Grid item xs={12}>
        <Grid container>
          <Grid mt={2} item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={6} lg={3}>
                <Grid container>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        boxShadow: "none",
                        p: "10px",
                        height: "100%",
                        position: "relative",
                        cursor: "pointer",
                        backgroundImage: frontLImage
                          ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLImage})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <Box display="flex" justifyContent="space-between">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={
                                isFrontLChecked || frontLImage ? true : false
                              }
                              onChange={(event) =>
                                handleFrontLCheckboxChange(event, frontLImageID)
                              }
                            />
                          }
                        />
                        <ViewImage imageURL={frontLImage} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Front (L)
                      </Typography>

                      <Box mt={1}>
                        <input
                          type="file"
                          id="frontLImage"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleFrontLImageUpload}
                        />
                        <label htmlFor="frontLImage">
                          <Button
                            disabled={!isFrontLChecked && !frontLImage}
                            fullWidth
                            variant="contained"
                            component="span"
                          >
                            {frontLImage ? "Change Image" : "Add Image"}
                          </Button>
                        </label>
                        <Box mt={1} display="flex" justifyContent="space-between">
                          <AddFileRemark id={frontLImageID} checked={isFrontLChecked} />
                          <Tooltip onClick={() => handleRemoveFrontLImage(frontLImageID)} title="Remove" placement="top">
                            <span>
                              <IconButton disabled={!isFrontLChecked && !frontLImage} aria-label="edit">
                                <DeleteIcon color={isFrontLChecked ? "error" : ""} fontSize="medium" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card
                      sx={{
                        boxShadow: "none",
                        p: "10px",
                        mb: "10px",
                        height: "100%",
                        position: "relative",
                        cursor: "pointer",
                        backgroundImage: frontRImage
                          ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontRImage})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <Box display="flex" justifyContent="space-between">
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={
                                isFrontRChecked || frontRImage ? true : false
                              }
                              onChange={(event) =>
                                handleFrontRCheckboxChange(event, frontRImageID)
                              }
                            />
                          }
                        />
                        <ViewImage imageURL={frontRImage} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        Front (R)
                      </Typography>

                      <Box mt={1}>
                        <input
                          type="file"
                          id="frontRImage"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleFrontRImageUpload}
                        />
                        <label htmlFor="frontRImage">
                          <Button
                            disabled={!isFrontRChecked && !frontRImage}
                            fullWidth
                            variant="contained"
                            component="span"
                          >
                            {frontRImage ? "Change Image" : "Add Image"}
                          </Button>
                        </label>
                        <Box mt={1} display="flex" justifyContent="space-between">
                          <AddFileRemark id={frontRImageID} checked={isFrontRChecked} />
                          <Tooltip onClick={() => handleRemoveFrontRImage(frontRImageID)} title="Remove" placement="top">
                            <span>
                              <IconButton disabled={!isFrontRChecked && !frontRImage} aria-label="edit">
                                <DeleteIcon color={isFrontRChecked ? "error" : ""} fontSize="medium" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} lg={1}></Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: frontLREMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLREMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            isFrontLREMBChecked || frontLREMBImage
                              ? true
                              : false
                          }
                          onChange={(event) =>
                            handleFrontLREMBCheckboxChange(
                              event,
                              frontLREMBImageID
                            )
                          }
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={frontLREMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLREMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLREMBImageUpload}
                    />
                    <label htmlFor="frontLREMBImage">
                      <Button
                        fullWidth
                        disabled={!isFrontLREMBChecked && !frontLREMBImage}
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                      >
                        {frontLREMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLREMBImageID} checked={isFrontLREMBChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLREMBImage(frontLREMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLREMBChecked && !frontLREMBImage} aria-label="edit">
                            <DeleteIcon color={isFrontLREMBChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: frontLRSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLRSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={<Checkbox />}
                      checked={
                        isFrontLRSUBChecked || frontLRSUBImage ? true : false
                      }
                      onChange={(event) =>
                        handleFrontLRSUBCheckboxChange(event, frontLRSUBImageID)
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={frontLRSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLRSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLRSUBImageUpload}
                    />
                    <label htmlFor="frontLRSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        disabled={!isFrontLRSUBChecked && !frontLRSUBImage}
                        component="span"
                      >
                        {frontLRSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLRSUBImageID} checked={isFrontLRSUBChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLRSUBImage(frontLRSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLRSUBChecked && !frontLRSUBImage} aria-label="edit">
                            <DeleteIcon color={isFrontLRSUBChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: frontLRSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLRSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            isFrontLRSPrintChecked || frontLRSPrintImage
                              ? true
                              : false
                          }
                          onChange={(event) =>
                            handleFrontLRSPrintCheckboxChange(
                              event,
                              frontLRSPrintImageID
                            )
                          }
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={frontLRSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLRSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLRSPrintImageUpload}
                    />
                    <label htmlFor="frontLRSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isFrontLRSPrintChecked && !frontLRSPrintImage
                        }
                      >
                        {frontLRSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>                    
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLRSPrintImageID} checked={isFrontLRSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLRSPrintImage(frontLRSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLRSPrintChecked && !frontLRSPrintImage} aria-label="edit">
                            <DeleteIcon color={isFrontLRSPrintChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: frontLRDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontLRDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            isFrontLRDTFChecked || frontLRDTFImage
                              ? true
                              : false
                          }
                          onChange={(event) =>
                            handleFrontLRDTFCheckboxChange(
                              event,
                              frontLRDTFImageID
                            )
                          }
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={frontLRDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontLRDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontLRDTFImageUpload}
                    />
                    <label htmlFor="frontLRDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontLRDTFChecked && !frontLRDTFImage}
                      >
                        {frontLRDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontLRDTFImageID} checked={isFrontLRDTFChecked} />
                      <Tooltip onClick={() => handleRemoveFrontLRDTFImage(frontLRDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontLRDTFChecked && !frontLRDTFImage} aria-label="edit">
                            <DeleteIcon color={isFrontLRDTFChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
