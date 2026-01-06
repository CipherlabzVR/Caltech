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

export default function RSideDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [rsideImage, setRSideImage] = useState(null);
  const [rsideEMBImage, setRSideEMBImage] = useState(null);
  const [rsideSUBImage, setRSideSUBImage] = useState(null);
  const [rsideSPrintImage, setRSideSPrintImage] = useState(null);
  const [rsideDTFImage, setRSideDTFImage] = useState(null);

  const [rsideImageID, setRSideImageID] = useState(null);
  const [rsideEMBImageID, setRSideEMBImageID] = useState(null);
  const [rsideSUBImageID, setRSideSUBImageID] = useState(null);
  const [rsideSPrintImageID, setRSideSPrintImageID] = useState(null);
  const [rsideDTFImageID, setRSideDTFImageID] = useState(null);

  const [isRSideChecked, setIsRSideChecked] = useState(false);
  const [isRSideEMBChecked, setIsRSideEMBChecked] = useState(false);
  const [isRSideSUBChecked, setIsRSideSUBChecked] = useState(false);
  const [isRSideSPrintChecked, setIsRSideSPrintChecked] = useState(false);
  const [isRSideDTFChecked, setIsRSideDTFChecked] = useState(false);

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
      const resultRSide = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 8 &&
          item.documentSubContentType === 5
      );
      const resultRSideEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 8 &&
          item.documentSubContentType === 1
      );
      const resultRSideSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 8 &&
          item.documentSubContentType === 2
      );
      const resultRSideSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 8 &&
          item.documentSubContentType === 3
      );
      const resultRSideDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 8 &&
          item.documentSubContentType === 4
      );
      if (resultRSide) {
        setIsRSideChecked(true);
        setRSideImage(resultRSide.documentURL);
        setRSideImageID(resultRSide.id);
      }
      if (resultRSideEMB) {
        setIsRSideEMBChecked(true);
        setRSideEMBImage(resultRSideEMB.documentURL);
        setRSideEMBImageID(resultRSideEMB.id);
      }
      if (resultRSideSUB) {
        setIsRSideSUBChecked(true);
        setRSideSUBImage(resultRSideSUB.documentURL);
        setRSideSUBImageID(resultRSideSUB.id);
      }
      if (resultRSideSPrint) {
        setIsRSideSPrintChecked(true);
        setRSideSPrintImage(resultRSideSPrint.documentURL);
        setRSideSPrintImageID(resultRSideSPrint.id);
      }
      if (resultRSideDTF) {
        setIsRSideDTFChecked(true);
        setRSideDTFImage(resultRSideDTF.documentURL);
        setRSideDTFImageID(resultRSideDTF.id);
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

  const handleRSideCheckboxChange = async (event, id) => {
    setIsRSideChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 8,
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
  const handleRSideEMBCheckboxChange = async (event, id) => {
    setIsRSideEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 8,
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
  const handleRSideSUBCheckboxChange = async (event, id) => {
    setIsRSideSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 8,
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
  const handleRSideSPrintCheckboxChange = async (event, id) => {
    setIsRSideSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 8,
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
  const handleRSideDTFCheckboxChange = async (event, id) => {
    setIsRSideDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 8,
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

  const handleRSideImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSideImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 8);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `RSide.png`);

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
  const handleRemoveRSideImage = async (id) => {
    setRSideImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSideEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSideEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 8);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `RSideEMB.png`);

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
  const handleRemoveRSideEMBImage = async (id) => {
    setRSideEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSideSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSideSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 8);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `RSideSUB.png`);

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
  const handleRemoveRSideSUBImage = async (id) => {
    setRSideSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSideSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSideSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 8);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `RSideSPrint.png`);

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
  const handleRemoveRSideSPrintImage = async (id) => {
    setRSideSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSideDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSideDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      setUploading(true);
      formData.append("File", file);
      formData.append("InquiryID", inquiry.inquiryId);
      formData.append("InqCode", inquiry.inquiryCode);
      formData.append("WindowType", inquiry.windowType);
      formData.append("OptionId", inquiry.optionId);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 8);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `RSideDTF.png`);

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
  const handleRemoveRSideDTFImage = async (id) => {
    setRSideDTFImage(null);
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
                    backgroundImage: rsideImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsideImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isRSideChecked || rsideImage ? true : false}
                          onChange={(event) => handleRSideCheckboxChange(event, rsideImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={rsideImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    R Side
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsideImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSideImageUpload}
                    />
                    <label htmlFor="rsideImage">
                      <Button
                        disabled={!isRSideChecked && !rsideImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {rsideImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={rsideImageID} checked={isRSideChecked} />
                      <Tooltip onClick={() => handleRemoveRSideImage(rsideImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isRSideChecked && !rsideImage} aria-label="edit">
                            <DeleteIcon color={isRSideChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: rsideEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsideEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isRSideEMBChecked || rsideEMBImage ? true : false}
                          onChange={(event) => handleRSideEMBCheckboxChange(event, rsideEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={rsideEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsideEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSideEMBImageUpload}
                    />
                    <label htmlFor="rsideEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isRSideEMBChecked && !rsideEMBImage}
                      >
                        {rsideEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={rsideEMBImageID} checked={isRSideEMBChecked} />
                      <Tooltip onClick={() => handleRemoveRSideEMBImage(rsideEMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isRSideEMBChecked && !rsideEMBImage} aria-label="edit">
                            <DeleteIcon color={isRSideEMBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: rsideSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsideSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isRSideSUBChecked || rsideSPrintImage ? true : false}
                          onChange={(event) => handleRSideSUBCheckboxChange(event, rsideSUBImageID)}
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={rsideSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsideSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSideSUBImageUpload}
                    />
                    <label htmlFor="rsideSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isRSideSUBChecked && !rsideSUBImage}
                      >
                        {rsideSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={rsideSUBImageID} checked={isRSideSUBChecked} />
                      <Tooltip onClick={() => handleRemoveRSideSUBImage(rsideSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isRSideSUBChecked && !rsideSUBImage} aria-label="edit">
                            <DeleteIcon color={isRSideSUBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: rsideSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsideSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isRSideSPrintChecked || rsideSPrintImage ? true : false}
                          onChange={(event) => handleRSideSPrintCheckboxChange(event, rsideSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={rsideSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsideSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSideSPrintImageUpload}
                    />
                    <label htmlFor="rsideSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isRSideSPrintChecked && !rsideSPrintImage
                        }
                      >
                        {rsideSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={rsideSPrintImageID} checked={isRSideSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveRSideSPrintImage(rsideSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isRSideSPrintChecked && !rsideSPrintImage} aria-label="edit">
                            <DeleteIcon color={isRSideSPrintChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: rsideDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsideDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isRSideDTFChecked || rsideDTFImage ? true : false}
                          onChange={(event) => handleRSideDTFCheckboxChange(event, rsideImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={rsideDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsideDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSideDTFImageUpload}
                    />
                    <label htmlFor="rsideDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isRSideDTFChecked && !rsideDTFImage}
                      >
                        {rsideDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={rsideDTFImageID} checked={isRSideDTFChecked} />
                      <Tooltip onClick={() => handleRemoveRSideDTFImage(rsideDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isRSideDTFChecked && !rsideDTFImage} aria-label="edit">
                            <DeleteIcon color={isRSideDTFChecked ? "error" : ""} fontSize="medium" />
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
