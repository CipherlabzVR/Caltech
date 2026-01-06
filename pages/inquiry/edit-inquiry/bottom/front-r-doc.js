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

export default function FrontRDocument({ inquiry, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const [frontRImage, setFrontRImage] = useState(null);
  const [frontREMBImage, setFrontREMBImage] = useState(null);
  const [frontRSUBImage, setFrontRSUBImage] = useState(null);
  const [frontRSPrintImage, setFrontRSPrintImage] = useState(null);
  const [frontRDTFImage, setFrontRDTFImage] = useState(null);

  const [frontRImageID, setFrontRImageID] = useState();
  const [frontREMBImageID, setFrontREMBImageID] = useState();
  const [frontRSUBImageID, setFrontRSUBImageID] = useState();
  const [frontRSPrintImageID, setFrontRSPrintImageID] = useState();
  const [frontRDTFImageID, setFrontRDTFImageID] = useState();

  const [isFrontRChecked, setIsFrontRChecked] = useState(false);
  const [isFrontREMBChecked, setIsFrontREMBChecked] = useState(false);
  const [isFrontRSUBChecked, setIsFrontRSUBChecked] = useState(false);
  const [isFrontRSPrintChecked, setIsFrontRSPrintChecked] = useState(false);
  const [isFrontRDTFChecked, setIsFrontRDTFChecked] = useState(false);

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
      const resultFrontR = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 12 &&
          item.documentSubContentType === 5
      );
      const resultFrontREMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 12 &&
          item.documentSubContentType === 1
      );
      const resultFrontRSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 12 &&
          item.documentSubContentType === 2
      );
      const resultFrontRSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 12 &&
          item.documentSubContentType === 3
      );
      const resultFrontRDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 12 &&
          item.documentSubContentType === 4
      );
      if (resultFrontR) {
        setIsFrontRChecked(true);
        setFrontRImage(resultFrontR.documentURL);
        setFrontRImageID(resultFrontR.id);
      }
      if (resultFrontREMB) {
        setIsFrontREMBChecked(true);
        setFrontREMBImage(resultFrontREMB.documentURL);
        setFrontREMBImageID(resultFrontREMB.id);
      }
      if (resultFrontRSUB) {
        setIsFrontRSUBChecked(true);
        setFrontRSUBImage(resultFrontRSUB.documentURL);
        setFrontRSUBImageID(resultFrontRSUB.id);
      }
      if (resultFrontRSPrint) {
        setIsFrontRSPrintChecked(true);
        setFrontRSPrintImage(resultFrontRSPrint.documentURL);
        setFrontRSPrintImageID(resultFrontRSPrint.id);
      }
      if (resultFrontRDTF) {
        setIsFrontRDTFChecked(true);
        setFrontRDTFImage(resultFrontRDTF.documentURL);
        setFrontRDTFImageID(resultFrontRDTF.id);
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
      const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
    }
  };
  const handleFrontREMBCheckboxChange = async (event, id) => {
    setIsFrontREMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 12,
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
  const handleFrontRSUBCheckboxChange = async (event, id) => {
    setIsFrontRSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 12,
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
  const handleFrontRSPrintCheckboxChange = async (event, id) => {
    setIsFrontRSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 12,
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
  const handleFrontRDTFCheckboxChange = async (event, id) => {
    setIsFrontRDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          WindowType: inquiry.windowType,
          OptionId: inquiry.optionId,
          DocumentType: 4,
          DocumentContentType: 12,
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

  //fornt image start
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
  //frontR image end

  //fron EMB start
  const handleFrontREMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontREMBImage(URL.createObjectURL(file));
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
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `FrontREMB.png`);

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
  const handleRemoveFrontREMBImage = async (id) => {
    setFrontREMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontR EMB end

  //frontR sub start
  const handleFrontRSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontRSUBImage(URL.createObjectURL(file));
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
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `FrontRSUB.png`);

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
  const handleRemoveFrontRSUBImage = async (id) => {
    setFrontRSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontR SUB end

  //frontR s print start
  const handleFrontRSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontRSPrintImage(URL.createObjectURL(file));
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
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `FrontRSPrint.png`);

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
  const handleRemoveFrontRSPrintImage = async (id) => {
    setFrontRSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //frontR s print end

  //frontR dtf start
  const handleFrontRDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontRDTFImage(URL.createObjectURL(file));
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
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `FrontRDTF.png`);

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
  const handleRemoveFrontRDTFImage = async (id) => {
    setFrontRDTFImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };

  //frontR dtf end
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
                          checked={isFrontRChecked || frontRImage ? true : false}
                          onChange={(event) => handleFrontRCheckboxChange(event, frontRImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={frontRImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Front R
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
              <Grid item xs={12} lg={1}></Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: frontREMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontREMBImage})`
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
                            isFrontREMBChecked || frontREMBImage ? true : false
                          }
                          onChange={(event) => handleFrontREMBCheckboxChange(event, frontREMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={frontREMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontREMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontREMBImageUpload}
                    />
                    <label htmlFor="frontREMBImage">
                      <Button
                        fullWidth
                        disabled={!isFrontREMBChecked && !frontREMBImage}
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                      >
                        {frontREMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontREMBImageID} checked={isFrontREMBChecked} />
                      <Tooltip onClick={() => handleRemoveFrontREMBImage(frontREMBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontREMBChecked && !frontREMBImage} aria-label="edit">
                            <DeleteIcon color={isFrontREMBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontRSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontRSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={<Checkbox />}
                      checked={
                        isFrontRSUBChecked || frontRSUBImage ? true : false
                      }
                      onChange={(event) => handleFrontRSUBCheckboxChange(event, frontRSUBImageID)}
                      label="SUB"
                    />
                    <ViewImage imageURL={frontRSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontRSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontRSUBImageUpload}
                    />
                    <label htmlFor="frontRSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        disabled={!isFrontRSUBChecked && !frontRSUBImage}
                        component="span"
                      >
                        {frontRSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontRSUBImageID} checked={isFrontRSUBChecked} />
                      <Tooltip onClick={() => handleRemoveFrontRSUBImage(frontRSUBImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontRSUBChecked && !frontRSUBImage} aria-label="edit">
                            <DeleteIcon color={isFrontRSUBChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontRSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontRSPrintImage})`
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
                            isFrontRSPrintChecked || frontRSPrintImage
                              ? true
                              : false
                          }
                          onChange={(event) => handleFrontRSPrintCheckboxChange(event, frontRSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={frontRSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontRSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontRSPrintImageUpload}
                    />
                    <label htmlFor="frontRSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontRSPrintChecked && !frontRSPrintImage}
                      >
                        {frontRSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontRSPrintImageID} checked={isFrontRSPrintChecked} />
                      <Tooltip onClick={() => handleRemoveFrontRSPrintImage(frontRSPrintImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontRSPrintChecked && !frontRSPrintImage} aria-label="edit">
                            <DeleteIcon color={isFrontRSPrintChecked ? "error" : ""} fontSize="medium" />
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
                    backgroundImage: frontRDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontRDTFImage})`
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
                            isFrontRDTFChecked || frontRDTFImage ? true : false
                          }
                          onChange={(event) => handleFrontRDTFCheckboxChange(event, frontRDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={frontRDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontRDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontRDTFImageUpload}
                    />
                    <label htmlFor="frontRDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontRDTFChecked && !frontRDTFImage}
                      >
                        {frontRDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Box mt={1} display="flex" justifyContent="space-between">
                      <AddFileRemark id={frontRDTFImageID} checked={isFrontRDTFChecked} />
                      <Tooltip onClick={() => handleRemoveFrontRDTFImage(frontRDTFImageID)} title="Remove" placement="top">
                        <span>
                          <IconButton disabled={!isFrontRDTFChecked && !frontRDTFImage} aria-label="edit">
                            <DeleteIcon color={isFrontRDTFChecked ? "error" : ""} fontSize="medium" />
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
