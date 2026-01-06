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

export default function BackRDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [backRImage, setBackRImage] = useState(null);
  const [backREMBImage, setBackREMBImage] = useState(null);
  const [backRSUBImage, setBackRSUBImage] = useState(null);
  const [backRSPrintImage, setBackRSPrintImage] = useState(null);
  const [backRDTFImage, setBackRDTFImage] = useState(null);

  const [backRImageID, setBackRImageID] = useState(null);
  const [backREMBImageID, setBackREMBImageID] = useState(null);
  const [backRSUBImageID, setBackRSUBImageID] = useState(null);
  const [backRSPrintImageID, setBackRSPrintImageID] = useState(null);
  const [backRDTFImageID, setBackRDTFImageID] = useState(null);

  const [isBackRChecked, setIsBackRChecked] = useState(false);
  const [isBackREMBChecked, setIsBackREMBChecked] = useState(false);
  const [isBackRSUBChecked, setIsBackRSUBChecked] = useState(false);
  const [isBackRSPrintChecked, setIsBackRSPrintChecked] = useState(false);
  const [isBackRDTFChecked, setIsBackRDTFChecked] = useState(false);

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
      const resultBackR = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 10 &&
          item.documentSubContentType === 5
      );
      const resultBackREMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 10 &&
          item.documentSubContentType === 1
      );
      const resultBackRSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 10 &&
          item.documentSubContentType === 2
      );
      const resultBackRSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 10 &&
          item.documentSubContentType === 3
      );
      const resultBackRDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 10 &&
          item.documentSubContentType === 4
      );
      if (resultBackR) {
        setIsBackRChecked(true);
        setBackRImage(resultBackR.documentURL);
        setBackRImageID(resultBackR.id);
      }
      if (resultBackREMB) {
        setIsBackREMBChecked(true);
        setBackREMBImage(resultBackREMB.documentURL);
        setBackREMBImageID(resultBackREMB.id);
      }
      if (resultBackRSUB) {
        setIsBackRSUBChecked(true);
        setBackRSUBImage(resultBackRSUB.documentURL);
        setBackRSUBImageID(resultBackRSUB.id);
      }
      if (resultBackRSPrint) {
        setIsBackRSPrintChecked(true);
        setBackRSPrintImage(resultBackRSPrint.documentURL);
        setBackRSPrintImageID(resultBackRSPrint.id);
      }
      if (resultBackRDTF) {
        setIsBackRDTFChecked(true);
        setBackRDTFImage(resultBackRDTF.documentURL);
        setBackRDTFImageID(resultBackRDTF.id);
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

  const handleBackRCheckboxChange = async (event, id) => {
    setIsBackRChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 10,
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
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleBackREMBCheckboxChange = async (event, id) => {
    setIsBackREMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 10,
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
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleBackRSUBCheckboxChange = async (event, id) => {
    setIsBackRSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 10,
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
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleBackRSPrintCheckboxChange = async (event, id) => {
    setIsBackRSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 10,
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
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleBackRDTFCheckboxChange = async (event, id) => {
    setIsBackRDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 10,
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
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };

  const handleBackRImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackRImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 10);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `BackR.png`);

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
  const handleRemoveBackRImage = async (id) => {
    setBackRImage(null);
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
  };
  const handleBackREMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackREMBImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 10);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `BackREMB.png`);

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
  const handleRemoveBackREMBImage = async (id) => {
    setBackREMBImage(null);
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
  };
  const handleBackRSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackRSUBImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 10);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `BackRSUB.png`);

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
  const handleRemoveBackRSUBImage = async (id) => {
    setBackRSUBImage(null);
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
  };
  const handleBackRSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackRSPrintImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 10);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `BackRSPrint.png`);

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
  const handleRemoveBackRSPrintImage = async (id) => {
    setBackRSPrintImage(null);
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
  };
  const handleBackRDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackRDTFImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 10);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `BackRDTF.png`);

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
  const handleRemoveBackRDTFImage = async (id) => {
    setBackRDTFImage(null);
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
  };
  return (
    <>
      <Grid item xs={12}>
        <Grid container>
          <Grid mt={2} item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={12} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backRImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backRImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackRChecked || backRImage ? true : false}
                          onChange={(event) => handleBackRCheckboxChange(event, backRImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={backRImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Back R
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backRImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackRImageUpload}
                    />
                    <label htmlFor="backRImage">
                      <Button
                        disabled={!isBackRChecked && !backRImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {backRImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backRImageID} checked={isBackRChecked} />
                      <Tooltip onClick={() => handleRemoveBackRImage(backRImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackRChecked && !backRImage} aria-label="edit">
                            <DeleteIcon color={isBackRChecked ? "error" : ""} fontSize="medium" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
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
                    backgroundImage: backREMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backREMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackREMBChecked || backREMBImage ? true : false}
                          onChange={(event) => handleBackREMBCheckboxChange(event, backREMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={backREMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backREMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackREMBImageUpload}
                    />
                    <label htmlFor="backREMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackREMBChecked && !backREMBImage}
                      >
                        {backREMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backREMBImageID} checked={isBackREMBChecked} />
                      <Tooltip onClick={() => handleRemoveBackREMBImage(backREMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackREMBChecked && !backREMBImage} aria-label="edit">
                            <DeleteIcon color={isBackREMBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backRSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backRSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackRSUBChecked || backRSUBImage ? true : false}
                          onChange={(event) => handleBackRSUBCheckboxChange(event, backRSUBImageID)}
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={backRSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backRSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackRSUBImageUpload}
                    />
                    <label htmlFor="backRSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackRSUBChecked && !backRSUBImage}
                      >
                        {backRSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backRSUBImageID} checked={isBackRSUBChecked} />
                      <Tooltip onClick={() => handleRemoveBackRSUBImage(backRSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackRSUBChecked && !backRSUBImage} aria-label="edit">
                            <DeleteIcon color={isBackRSUBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backRSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backRSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackRSPrintChecked || backRSPrintImage ? true : false}
                          onChange={(event) => handleBackRSPrintCheckboxChange(event, backRSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={backRSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backRSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackRSPrintImageUpload}
                    />
                    <label htmlFor="backRSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackRSPrintChecked && !backRSPrintImage}
                      >
                        {backRSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backRSPrintImageID} checked={isBackRSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveBackRSPrintImage(backRSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackRSPrintChecked && !backRSPrintImage} aria-label="edit">
                            <DeleteIcon color={isBackRSPrintChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backRDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backRDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackRDTFChecked || backRDTFImage ? true : false}
                          onChange={(event) => handleBackRDTFCheckboxChange(event, backRDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={backRDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backRDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackRDTFImageUpload}
                    />
                    <label htmlFor="backRDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackRDTFChecked && !backRDTFImage}
                      >
                        {backRDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backRDTFImageID} checked={isBackRDTFChecked} />
                      <Tooltip onClick={() => handleRemoveBackRDTFImage(backRDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackRDTFChecked && !backRDTFImage} aria-label="edit">
                            <DeleteIcon color={isBackRDTFChecked ? "error" : ""} fontSize="medium" />
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
