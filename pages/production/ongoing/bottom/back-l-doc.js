import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Typography,
  Card,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ViewImage from "@/components/UIElements/Modal/ViewImage";
import BASE_URL from "Base/api";

export default function BackLDocument() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));

  const [backLImage, setBackLImage] = useState(null);
  const [backLEMBImage, setBackLEMBImage] = useState(null);
  const [backLSUBImage, setBackLSUBImage] = useState(null);
  const [backLSPrintImage, setBackLSPrintImage] = useState(null);
  const [backLDTFImage, setBackLDTFImage] = useState(null);

  const [backLImageID, setBackLImageID] = useState(null);
  const [backLEMBImageID, setBackLEMBImageID] = useState(null);
  const [backLSUBImageID, setBackLSUBImageID] = useState(null);
  const [backLSPrintImageID, setBackLSPrintImageID] = useState(null);
  const [backLDTFImageID, setBackLDTFImageID] = useState(null);

  const [isBackLChecked, setIsBackLChecked] = useState(false);
  const [isBackLEMBChecked, setIsBackLEMBChecked] = useState(false);
  const [isBackLSUBChecked, setIsBackLSUBChecked] = useState(false);
  const [isBackLSPrintChecked, setIsBackLSPrintChecked] = useState(false);
  const [isBackLDTFChecked, setIsBackLDTFChecked] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      const resultBackL = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 9 &&
          item.documentSubContentType === 5
      );
      const resultBackLEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 9 &&
          item.documentSubContentType === 1
      );
      const resultBackLSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 9 &&
          item.documentSubContentType === 2
      );
      const resultBackLSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 9 &&
          item.documentSubContentType === 3
      );
      const resultBackLDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 9 &&
          item.documentSubContentType === 4
      );
      if (resultBackL) {
        setIsBackLChecked(true);
        setBackLImage(resultBackL.documentURL);
        setBackLImageID(resultBackL.id);
      }
      if (resultBackLEMB) {
        setIsBackLEMBChecked(true);
        setBackLEMBImage(resultBackLEMB.documentURL);
        setBackLEMBImageID(resultBackLEMB.id);
      }
      if (resultBackLSUB) {
        setIsBackLSUBChecked(true);
        setBackLSUBImage(resultBackLSUB.documentURL);
        setBackLSUBImageID(resultBackLSUB.id);
      }
      if (resultBackLSPrint) {
        setIsBackLSPrintChecked(true);
        setBackLSPrintImage(resultBackLSPrint.documentURL);
        setBackLSPrintImageID(resultBackLSPrint.id);
      }
      if (resultBackLDTF) {
        setIsBackLDTFChecked(true);
        setBackLDTFImage(resultBackLDTF.documentURL);
        setBackLDTFImageID(resultBackLDTF.id);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleBackLCheckboxChange = async (event, id) => {
    setIsBackLChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 9,
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
  const handleBackLEMBCheckboxChange = async (event, id) => {
    setIsBackLEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 9,
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
  const handleBackLSUBCheckboxChange = async (event, id) => {
    setIsBackLSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 9,
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
  const handleBackLSPrintCheckboxChange = async (event, id) => {
    setIsBackLSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 9,
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
  const handleBackLDTFCheckboxChange = async (event, id) => {
    setIsBackLDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 9,
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

  const handleBackLImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackLImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 9);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `BackL.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveBackLImage = async (id) => {
    setBackLImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackLEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackLEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 9);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `BackLEMB.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveBackLEMBImage = async (id) => {
    setBackLEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackLSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackLSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 9);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `BackLSUB.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveBackLSUBImage = async (id) => {
    setBackLSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackLSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackLSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 9);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `BackLSPrint.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveBackLSPrintImage = async (id) => {
    setBackLSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleBackLDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setBackLDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 9);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `BackLDTF.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };
  const handleRemoveBackLDTFImage = async (id) => {
    setBackLDTFImage(null);
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
            <Grid container mt={2}>
              <Grid item xs={12} lg={3}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "15px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backLImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backLImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isBackLChecked || backLImage ? true : false}
                          onChange={(event) =>
                            handleBackLCheckboxChange(event, backLImageID)
                          }
                        />
                      }
                    />
                    <ViewImage imageURL={backLImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Back L
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backLImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackLImageUpload}
                    />
                    <label htmlFor="backLImage">
                      <Button
                        disabled={!isBackLChecked && !backLImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {backLImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveBackLImage(backLImageID)}
                      disabled={!isBackLChecked && !backLImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={1}></Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "15px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backLEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backLEMBImage})`
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
                            isBackLEMBChecked || backLEMBImage ? true : false
                          }
                          onChange={(event) =>
                            handleBackLEMBCheckboxChange(event, backLEMBImageID)
                          }
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={backLEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backLEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackLEMBImageUpload}
                    />
                    <label htmlFor="backLEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackLEMBChecked && !backLEMBImage}
                      >
                        {backLEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveBackLEMBImage(backLEMBImageID)}
                      disabled={!isBackLEMBChecked && !backLEMBImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "15px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backLSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backLSUBImage})`
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
                            isBackLSUBChecked || backLSUBImage ? true : false
                          }
                          onChange={(event) =>
                            handleBackLSUBCheckboxChange(event, backLSUBImageID)
                          }
                        />
                      }
                      label="SUB"
                    />
                    <ViewImage imageURL={backLSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backLSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackLSUBImageUpload}
                    />
                    <label htmlFor="backLSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackLSUBChecked && !backLSUBImage}
                      >
                        {backLSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveBackLSUBImage(backLSUBImageID)}
                      disabled={!isBackLSUBChecked && !backLSUBImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "15px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backLSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backLSPrintImage})`
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
                            isBackLSPrintChecked || backLSPrintImage
                              ? true
                              : false
                          }
                          onChange={(event) =>
                            handleBackLSPrintCheckboxChange(
                              event,
                              backLSPrintImageID
                            )
                          }
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={backLSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backLSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackLSPrintImageUpload}
                    />
                    <label htmlFor="backLSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackLSPrintChecked && !backLSPrintImage}
                      >
                        {backLSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveBackLSPrintImage(backLSPrintImageID)
                      }
                      disabled={!isBackLSPrintChecked && !backLSPrintImage}
                    >
                      Remove
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} lg={2}>
                <Card
                  sx={{
                    boxShadow: "none",
                    p: "10px",
                    mb: "15px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: backLDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${backLDTFImage})`
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
                            isBackLDTFChecked || backLDTFImage ? true : false
                          }
                          onChange={(event) =>
                            handleBackLDTFCheckboxChange(event, backLDTFImageID)
                          }
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={backLDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="backLDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackLDTFImageUpload}
                    />
                    <label htmlFor="backLDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isBackLDTFChecked && !backLDTFImage}
                      >
                        {backLDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveBackLDTFImage(backLDTFImageID)}
                      disabled={!isBackLDTFChecked && !backLDTFImage}
                    >
                      Remove
                    </Button>
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
