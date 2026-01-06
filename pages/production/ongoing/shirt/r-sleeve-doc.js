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

export default function RSleeveDocument() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));

  const [rsleeveImage, setRSleeveImage] = useState(null);
  const [rsleeveEMBImage, setRSleeveEMBImage] = useState(null);
  const [rsleeveSUBImage, setRSleeveSUBImage] = useState(null);
  const [rsleeveSPrintImage, setRSleeveSPrintImage] = useState(null);
  const [rsleeveDTFImage, setRSleeveDTFImage] = useState(null);

  const [rsleeveImageID, setRSleeveImageID] = useState(null);
  const [rsleeveEMBImageID, setRSleeveEMBImageID] = useState(null);
  const [rsleeveSUBImageID, setRSleeveSUBImageID] = useState(null);
  const [rsleeveSPrintImageID, setRSleeveSPrintImageID] = useState(null);
  const [rsleeveDTFImageID, setRSleeveDTFImageID] = useState(null);

  const [isRSleeveChecked, setIsRSleeveChecked] = useState(false);
  const [isRSleeveEMBChecked, setIsRSleeveEMBChecked] = useState(false);
  const [isRSleeveSUBChecked, setIsRSleeveSUBChecked] = useState(false);
  const [isRSleeveSPrintChecked, setIsRSleeveSPrintChecked] = useState(false);
  const [isRSleeveDTFChecked, setIsRSleeveDTFChecked] = useState(false);

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
      const resultRSleeve = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 5 &&
          item.documentSubContentType === 5
      );
      const resultRSleeveEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 5 &&
          item.documentSubContentType === 1
      );
      const resultRSleeveSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 5 &&
          item.documentSubContentType === 2
      );
      const resultRSleeveSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 5 &&
          item.documentSubContentType === 3
      );
      const resultRSleeveDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 5 &&
          item.documentSubContentType === 4
      );
      if (resultRSleeve) {
        setIsRSleeveChecked(true);
        setRSleeveImage(resultRSleeve.documentURL);
        setRSleeveImageID(resultRSleeve.id);
      }
      if (resultRSleeveEMB) {
        setIsRSleeveEMBChecked(true);
        setRSleeveEMBImage(resultRSleeveEMB.documentURL);
        setRSleeveEMBImageID(resultRSleeveEMB.id);
      }
      if (resultRSleeveSUB) {
        setIsRSleeveSUBChecked(true);
        setRSleeveSUBImage(resultRSleeveSUB.documentURL);
        setRSleeveSUBImageID(resultRSleeveSUB.id);
      }
      if (resultRSleeveSPrint) {
        setIsRSleeveSPrintChecked(true);
        setRSleeveSPrintImage(resultRSleeveSPrint.documentURL);
        setRSleeveSPrintImageID(resultRSleeveSPrint.id);
      }
      if (resultRSleeveDTF) {
        setIsRSleeveDTFChecked(true);
        setRSleeveDTFImage(resultRSleeveDTF.documentURL);
        setRSleeveDTFImageID(resultRSleeveDTF.id);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRSleeveCheckboxChange = async (event,id) => {
    setIsRSleeveChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 5,
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
  const handleRSleeveEMBCheckboxChange = async (event,id) => {
    setIsRSleeveEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 5,
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
  const handleRSleeveSUBCheckboxChange = async (event,id) => {
    setIsRSleeveSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 5,
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
  const handleRSleeveSPrintCheckboxChange = async (event,id) => {
    setIsRSleeveSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 5,
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
  const handleRSleeveDTFCheckboxChange = async (event,id) => {
    setIsRSleeveDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 5,
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

  const handleRSleeveImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSleeveImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 5);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `RSleeve.png`);

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
  const handleRemoveRSleeveImage = async (id) => {
    setRSleeveImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSleeveEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSleeveEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 5);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `RSleeveEMB.png`);

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
  const handleRemoveRSleeveEMBImage = async (id) => {
    setRSleeveEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSleeveSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSleeveSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 5);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `RSleeveSUB.png`);

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
  const handleRemoveRSleeveSUBImage = async (id) => {
    setRSleeveSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSleeveSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSleeveSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 5);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `RSleeveSPrint.png`);

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
  const handleRemoveRSleeveSPrintImage = async (id) => {
    setRSleeveSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  const handleRSleeveDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setRSleeveDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 5);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `RSleeveDTF.png`);

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
  const handleRemoveRSleeveDTFImage = async (id) => {
    setRSleeveDTFImage(null);
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
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: rsleeveImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsleeveImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRSleeveChecked || rsleeveImage ? true : false}
                        onChange={(event) =>handleRSleeveCheckboxChange(event,rsleeveImageID)}
                      />
                    }
                  />
                  <ViewImage imageURL={rsleeveImage}/>
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    R Sleeve
                  </Typography>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsleeveImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSleeveImageUpload}
                    />
                    <label htmlFor="rsleeveImage">
                      <Button
                        disabled={!isRSleeveChecked && !rsleeveImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {rsleeveImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={()=>handleRemoveRSleeveImage(rsleeveImageID)}
                      disabled={!isRSleeveChecked && !rsleeveImage}
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
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: rsleeveEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsleeveEMBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRSleeveEMBChecked || rsleeveEMBImage ? true : false}
                        onChange={(event) =>handleRSleeveEMBCheckboxChange(event,rsleeveEMBImageID)}
                      />
                    }
                    label="EMB"
                  />
                  <ViewImage imageURL={rsleeveEMBImage}/>
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsleeveEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSleeveEMBImageUpload}
                    />
                    <label htmlFor="rsleeveEMBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isRSleeveEMBChecked && !rsleeveEMBImage}
                      >
                        {rsleeveEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={()=>handleRemoveRSleeveEMBImage(rsleeveEMBImageID)}
                      disabled={!isRSleeveEMBChecked && !rsleeveEMBImage}
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
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: rsleeveSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsleeveSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRSleeveSUBChecked || rsleeveSPrintImage ? true : false}
                        onChange={(event) =>handleRSleeveSUBCheckboxChange(event,rsleeveSUBImageID)}
                      />
                    }
                    label="SUB"
                  />
                  <ViewImage imageURL={rsleeveSPrintImage}/>
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsleeveSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSleeveSUBImageUpload}
                    />
                    <label htmlFor="rsleeveSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isRSleeveSUBChecked && !rsleeveSUBImage}
                      >
                        {rsleeveSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={()=>handleRemoveRSleeveSUBImage(rsleeveSUBImageID)}
                      disabled={!isRSleeveSUBChecked && !rsleeveSUBImage}
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
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: rsleeveSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsleeveSPrintImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRSleeveSPrintChecked || rsleeveSPrintImage ? true : false}
                        onChange={(event) =>handleRSleeveSPrintCheckboxChange(event,rsleeveSPrintImageID)}
                      />
                    }
                    label="S Print"
                  />
                  <ViewImage imageURL={rsleeveSPrintImage}/>
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsleeveSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSleeveSPrintImageUpload}
                    />
                    <label htmlFor="rsleeveSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={
                          !isRSleeveSPrintChecked && !rsleeveSPrintImage
                        }
                      >
                        {rsleeveSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={()=>handleRemoveRSleeveSPrintImage(rsleeveSPrintImageID)}
                      disabled={!isRSleeveSPrintChecked && !rsleeveSPrintImage}
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
                    mb: "10px",
                    height: "100%",
                    position: "relative",
                    cursor: "pointer",
                    backgroundImage: rsleeveDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${rsleeveDTFImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isRSleeveDTFChecked || rsleeveDTFImage ? true : false}
                        onChange={(event) =>handleRSleeveDTFCheckboxChange(event,rsleeveImageID)}
                      />
                    }
                    label="DTF"
                  />
                  <ViewImage imageURL={rsleeveDTFImage}/>
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="rsleeveDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleRSleeveDTFImageUpload}
                    />
                    <label htmlFor="rsleeveDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isRSleeveDTFChecked && !rsleeveDTFImage}
                      >
                        {rsleeveDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={()=>handleRemoveRSleeveDTFImage(rsleeveDTFImageID)}
                      disabled={!isRSleeveDTFChecked && !rsleeveDTFImage}
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
