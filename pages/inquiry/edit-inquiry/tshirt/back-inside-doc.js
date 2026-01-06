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

export default function BackInsideDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [backInsideImage, setBackInsideImage] = useState(null);
  const [backInsideEMBImage, setBackInsideEMBImage] = useState(null);
  const [backInsideSUBImage, setBackInsideSUBImage] = useState(null);
  const [backInsideSPrintImage, setBackInsideSPrintImage] = useState(null);
  const [backInsideDTFImage, setBackInsideDTFImage] = useState(null);

  const [backInsideImageID, setBackInsideImageID] = useState(null);
  const [backInsideEMBImageID, setBackInsideEMBImageID] = useState(null);
  const [backInsideSUBImageID, setBackInsideSUBImageID] = useState(null);
  const [backInsideSPrintImageID, setBackInsideSPrintImageID] = useState(null);
  const [backInsideDTFImageID, setBackInsideDTFImageID] = useState(null);

  const [isBackInsideChecked, setIsBackInsideChecked] = useState(false);
  const [isBackInsideEMBChecked, setIsBackInsideEMBChecked] = useState(false);
  const [isBackInsideSUBChecked, setIsBackInsideSUBChecked] = useState(false);
  const [isBackInsideSPrintChecked, setIsBackInsideSPrintChecked] =
    useState(false);
  const [isBackInsideDTFChecked, setIsBackInsideDTFChecked] = useState(false);

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
      const resultBackInside = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 3 &&
          item.documentSubContentType === 5
      );
      const resultBackInsideEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 3 &&
          item.documentSubContentType === 1
      );
      const resultBackInsideSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 3 &&
          item.documentSubContentType === 2
      );
      const resultBackInsideSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 3 &&
          item.documentSubContentType === 3
      );
      const resultBackInsideDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 3 &&
          item.documentSubContentType === 4
      );
      if (resultBackInside) {
        setIsBackInsideChecked(true);
        setBackInsideImage(resultBackInside.documentURL);
        setBackInsideImageID(resultBackInside.id);
      }
      if (resultBackInsideEMB) {
        setIsBackInsideEMBChecked(true);
        setBackInsideEMBImage(resultBackInsideEMB.documentURL);
        setBackInsideEMBImageID(resultBackInsideEMB.id);
      }
      if (resultBackInsideSUB) {
        setIsBackInsideSUBChecked(true);
        setBackInsideSUBImage(resultBackInsideSUB.documentURL);
        setBackInsideSUBImageID(resultBackInsideSUB.id);
      }
      if (resultBackInsideSPrint) {
        setIsBackInsideSPrintChecked(true);
        setBackInsideSPrintImage(resultBackInsideSPrint.documentURL);
        setBackInsideSPrintImageID(resultBackInsideSPrint.id);
      }
      if (resultBackInsideDTF) {
        setIsBackInsideDTFChecked(true);
        setBackInsideDTFImage(resultBackInsideDTF.documentURL);
        setBackInsideDTFImageID(resultBackInsideDTF.id);
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

  const handleBackInsideCheckboxChange = async (event, id) => {
    setIsBackInsideChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 3,
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
  const handleBackInsideEMBCheckboxChange = async (event, id) => {
    setIsBackInsideEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 3,
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
  const handleBackInsideSUBCheckboxChange = async (event, id) => {
    setIsBackInsideSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 3,
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
  const handleBackInsideSPrintCheckboxChange = async (event, id) => {
    setIsBackInsideSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 3,
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
  const handleBackInsideDTFCheckboxChange = async (event, id) => {
    setIsBackInsideDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 3,
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

  const handleBackInsideImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackInsideImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 3);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `BackInside.png`);

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
  const handleRemoveBackInsideImage = async (id) => {
    setBackInsideImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackInsideEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackInsideEMBImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 3);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `BackInsideEMB.png`);

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
  const handleRemoveBackInsideEMBImage = async (id) => {
    setBackInsideEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackInsideSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackInsideSUBImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 3);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `BackInsideSUB.png`);

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
  const handleRemoveBackInsideSUBImage = async (id) => {
    setBackInsideSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackInsideSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackInsideSPrintImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 3);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `BackInsideSPrint.png`);

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
  const handleRemoveBackInsideSPrintImage = async (id) => {
    setBackInsideSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackInsideDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackInsideDTFImage(URL.createObjectURL(file));
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 3);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `BackInsideDTF.png`);

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
  const handleRemoveBackInsideDTFImage = async (id) => {
    setBackInsideDTFImage(null);
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
                    backgroundImage: backInsideImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backInsideImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackInsideChecked || backInsideImage ? true : false}
                          onChange={(event) => handleBackInsideCheckboxChange(event, backInsideImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={backInsideImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Back Inside
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backInsideImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackInsideImageUpload}
                    />
                    <label htmlFor="backInsideImage">
                      <Button
                        fullWidth
                        variant="contained"
                        disabled={!isBackInsideChecked && !backInsideImage}
                        component="span"
                      >
                        {backInsideImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backInsideImageID} checked={isBackInsideChecked} />
                      <Tooltip onClick={() => handleRemoveBackInsideImage(backInsideImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackInsideChecked && !backInsideImage} aria-label="edit">
                            <DeleteIcon color={isBackInsideChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backInsideEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backInsideEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackInsideEMBChecked || backInsideEMBImage ? true : false}
                          onChange={(event) => handleBackInsideEMBCheckboxChange(event, backInsideEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={backInsideEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backInsideEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackInsideEMBImageUpload}
                    />
                    <label htmlFor="backInsideEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        disabled={
                          !isBackInsideEMBChecked && !backInsideEMBImage
                        }
                        component="span"
                      >
                        {backInsideEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>

                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backInsideEMBImageID} checked={isBackInsideEMBChecked} />
                      <Tooltip onClick={() => handleRemoveBackInsideEMBImage(backInsideEMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackInsideEMBChecked && !backInsideEMBImage} aria-label="edit">
                            <DeleteIcon color={isBackInsideEMBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backInsideSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backInsideSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackInsideSUBChecked || backInsideSUBImage ? true : false}
                          onChange={(event) => handleBackInsideSUBCheckboxChange(event, backInsideSUBImageID)}
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={backInsideSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backInsideSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackInsideSUBImageUpload}
                    />
                    <label htmlFor="backInsideSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isBackInsideSUBChecked && !backInsideSUBImage
                        }
                      >
                        {backInsideSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>

                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backInsideSUBImageID} checked={isBackInsideSUBChecked} />
                      <Tooltip onClick={() => handleRemoveBackInsideSUBImage(backInsideSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackInsideSUBChecked && !backInsideSUBImage} aria-label="edit">
                            <DeleteIcon color={isBackInsideSUBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backInsideSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backInsideSPrintImage})`
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
                            isBackInsideSPrintChecked || backInsideSPrintImage ? true : false
                          }
                          onChange={(event) => handleBackInsideSPrintCheckboxChange(event, backInsideSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={backInsideSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backInsideSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackInsideSPrintImageUpload}
                    />
                    <label htmlFor="backInsideSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isBackInsideSPrintChecked && !backInsideSPrintImage
                        }
                      >
                        {backInsideSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backInsideSPrintImageID} checked={isBackInsideSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveBackInsideSPrintImage(backInsideSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackInsideSPrintChecked && !backInsideSPrintImage} aria-label="edit">
                            <DeleteIcon color={isBackInsideSPrintChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: backInsideDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backInsideDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackInsideDTFChecked || backInsideDTFImage ? true : false}
                          onChange={(event) => handleBackInsideDTFCheckboxChange(event, backInsideDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={backInsideDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backInsideDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackInsideDTFImageUpload}
                    />
                    <label htmlFor="backInsideDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isBackInsideDTFChecked && !backInsideDTFImage
                        }
                      >
                        {backInsideDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={backInsideDTFImageID} checked={isBackInsideDTFChecked} />
                      <Tooltip onClick={() => handleRemoveBackInsideDTFImage(backInsideDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isBackInsideDTFChecked && !backInsideDTFImage} aria-label="edit">
                            <DeleteIcon color={isBackInsideDTFChecked ? "error" : ""} fontSize="medium" />
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
