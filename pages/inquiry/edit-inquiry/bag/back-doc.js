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

export default function BackDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [backImage, setBackImage] = useState(null);
  const [backEMBImage, setBackEMBImage] = useState(null);
  const [backSUBImage, setBackSUBImage] = useState(null);
  const [backSPrintImage, setBackSPrintImage] = useState(null);
  const [backDTFImage, setBackDTFImage] = useState(null);

  const [backImageID, setBackImageID] = useState(null);
  const [backEMBImageID, setBackEMBImageID] = useState(null);
  const [backSUBImageID, setBackSUBImageID] = useState(null);
  const [backSPrintImageID, setBackSPrintImageID] = useState(null);
  const [backDTFImageID, setBackDTFImageID] = useState(null);

  const [isBackChecked, setIsBackChecked] = useState(false);
  const [isBackEMBChecked, setIsBackEMBChecked] = useState(false);
  const [isBackSUBChecked, setIsBackSUBChecked] = useState(false);
  const [isBackSPrintChecked, setIsBackSPrintChecked] = useState(false);
  const [isBackDTFChecked, setIsBackDTFChecked] = useState(false);

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
      const resultBack = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 2 &&
          item.documentSubContentType === 5
      );
      const resultBackEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 2 &&
          item.documentSubContentType === 1
      );
      const resultBackSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 2 &&
          item.documentSubContentType === 2
      );
      const resultBackSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 2 &&
          item.documentSubContentType === 3
      );
      const resultBackDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 2 &&
          item.documentSubContentType === 4
      );
      if (resultBack) {
        setIsBackChecked(true);
        setBackImage(resultBack.documentURL);
        setBackImageID(resultBack.id);
      }
      if (resultBackEMB) {
        setIsBackEMBChecked(true);
        setBackEMBImage(resultBackEMB.documentURL);
        setBackEMBImageID(resultBackEMB.id);
      }
      if (resultBackSUB) {
        setIsBackSUBChecked(true);
        setBackSUBImage(resultBackSUB.documentURL);
        setBackSUBImageID(resultBackSUB.id);
      }
      if (resultBackSPrint) {
        setIsBackSPrintChecked(true);
        setBackSPrintImage(resultBackSPrint.documentURL);
        setBackSPrintImageID(resultBackSPrint.id);
      }
      if (resultBackDTF) {
        setIsBackDTFChecked(true);
        setBackDTFImage(resultBackDTF.documentURL);
        setBackDTFImageID(resultBackDTF.id);
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

  const handleBackCheckboxChange = async (event, id) => {
    setIsBackChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 2,
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
  const handleBackEMBCheckboxChange = async (event, id) => {
    setIsBackEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 2,
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
  const handleBackSUBCheckboxChange = async (event, id) => {
    setIsBackSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 2,
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
  const handleBackSPrintCheckboxChange = async (event, id) => {
    setIsBackSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 2,
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
  const handleBackDTFCheckboxChange = async (event, id) => {
    setIsBackDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 2,
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

  const handleBackImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 2);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `Back.png`);

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
  const handleRemoveBackImage = async (id) => {
    setBackImage(null);
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
  const handleBackEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 2);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `BackEMB.png`);

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
  const handleRemoveBackEMBImage = async (id) => {
    setBackEMBImage(null);
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
  const handleBackSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 2);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `BackSUB.png`);

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
  const handleRemoveBackSUBImage = async (id) => {
    setBackSUBImage(null);
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
  const handleBackSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 2);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `BackSPrint.png`);

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
  const handleRemoveBackSPrintImage = async (id) => {
    setBackSPrintImage(null);
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
  const handleBackDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 2);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `BackDTF.png`);

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
  const handleRemoveBackDTFImage = async (id) => {
    setBackDTFImage(null);
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
            <Grid container spacing={1} >
              <Grid item xs={12} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackChecked || backImage ? true : false}
                          onChange={(event) => handleBackCheckboxChange(event, backImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={backImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Back
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackImageUpload}
                    />
                    <label htmlFor="backImage">
                      <Button
                        disabled={!isBackChecked && !backImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {backImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backImageID} checked={isBackChecked} />
                      <Tooltip onClick={() => handleRemoveBackImage(backImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackChecked && !backImage} aria-label="edit">
                            <DeleteIcon color={isBackChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackEMBChecked || backEMBImage ? true : false}
                          onChange={(event) => handleBackEMBCheckboxChange(event, backEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={backEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackEMBImageUpload}
                    />
                    <label htmlFor="backEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackEMBChecked && !backEMBImage}
                      >
                        {backEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backEMBImageID} checked={isBackEMBChecked} />
                      <Tooltip onClick={() => handleRemoveBackEMBImage(backEMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackEMBChecked && !backEMBImage} aria-label="edit">
                            <DeleteIcon color={isBackEMBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackSUBChecked || backSUBImage ? true : false}
                          onChange={(event) => handleBackSUBCheckboxChange(event, backSUBImageID)}
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={backSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackSUBImageUpload}
                    />
                    <label htmlFor="backSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackSUBChecked && !backSUBImage}
                      >
                        {backSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backSUBImageID} checked={isBackSUBChecked} />
                      <Tooltip onClick={() => handleRemoveBackSUBImage(backSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackSUBChecked && !backSUBImage} aria-label="edit">
                            <DeleteIcon color={isBackSUBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackSPrintChecked || backSPrintImage ? true : false}
                          onChange={(event) => handleBackSPrintCheckboxChange(event, backSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={backSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackSPrintImageUpload}
                    />
                    <label htmlFor="backSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackSPrintChecked && !backSPrintImage}
                      >
                        {backSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backSPrintImageID} checked={isBackSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveBackSPrintImage(backSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackSPrintChecked && !backSPrintImage} aria-label="edit">
                            <DeleteIcon color={isBackSPrintChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackDTFChecked || backDTFImage ? true : false}
                          onChange={(event) => handleBackDTFCheckboxChange(event, backDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={backDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackDTFImageUpload}
                    />
                    <label htmlFor="backDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackDTFChecked && !backDTFImage}
                      >
                        {backDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backDTFImageID} checked={isBackDTFChecked} />
                      <Tooltip onClick={() => handleRemoveBackDTFImage(backDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackDTFChecked && !backDTFImage} aria-label="edit">
                            <DeleteIcon color={isBackDTFChecked ? "error" : ""} fontSize="medium" />
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
