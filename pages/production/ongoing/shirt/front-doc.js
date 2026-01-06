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

export default function FrontDocument() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [frontImage, setFrontImage] = useState(null);
  const [frontEMBImage, setFrontEMBImage] = useState(null);
  const [frontSUBImage, setFrontSUBImage] = useState(null);
  const [frontSPrintImage, setFrontSPrintImage] = useState(null);
  const [frontDTFImage, setFrontDTFImage] = useState(null);

  const [frontImageID, setFrontImageID] = useState();
  const [frontEMBImageID, setFrontEMBImageID] = useState();
  const [frontSUBImageID, setFrontSUBImageID] = useState();
  const [frontSPrintImageID, setFrontSPrintImageID] = useState();
  const [frontDTFImageID, setFrontDTFImageID] = useState();

  const [isFrontChecked, setIsFrontChecked] = useState(false);
  const [isFrontEMBChecked, setIsFrontEMBChecked] = useState(false);
  const [isFrontSUBChecked, setIsFrontSUBChecked] = useState(false);
  const [isFrontSPrintChecked, setIsFrontSPrintChecked] = useState(false);
  const [isFrontDTFChecked, setIsFrontDTFChecked] = useState(false);

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
      const resultFront = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 5
      );
      const resultFrontEMB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 1
      );
      const resultFrontSUB = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 2
      );
      const resultFrontSPrint = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 3
      );
      const resultFrontDTF = data.result.find(
        (item) =>
          item.documentType === 4 &&
          item.documentContentType === 1 &&
          item.documentSubContentType === 4
      );
      if (resultFront) {
        setIsFrontChecked(true);
        setFrontImage(resultFront.documentURL);
        setFrontImageID(resultFront.id);
      }
      if (resultFrontEMB) {
        setIsFrontEMBChecked(true);
        setFrontEMBImage(resultFrontEMB.documentURL);
        setFrontEMBImageID(resultFrontEMB.id);
      }
      if (resultFrontSUB) {
        setIsFrontSUBChecked(true);
        setFrontSUBImage(resultFrontSUB.documentURL);
        setFrontSUBImageID(resultFrontSUB.id);
      }
      if (resultFrontSPrint) {
        setIsFrontSPrintChecked(true);
        setFrontSPrintImage(resultFrontSPrint.documentURL);
        setFrontSPrintImageID(resultFrontSPrint.id);
      }
      if (resultFrontDTF) {
        setIsFrontDTFChecked(true);
        setFrontDTFImage(resultFrontDTF.documentURL);
        setFrontDTFImageID(resultFrontDTF.id);
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFrontCheckboxChange = async (event,id) => {
    setIsFrontChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 1,
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
  const handleFrontEMBCheckboxChange = async (event,id) => {
    setIsFrontEMBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 1,
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
  const handleFrontSUBCheckboxChange = async (event,id) => {
    setIsFrontSUBChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 1,
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
  const handleFrontSPrintCheckboxChange = async (event,id) => {
    setIsFrontSPrintChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 1,
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
  const handleFrontDTFCheckboxChange = async (event,id) => {
    setIsFrontDTFChecked(event.target.checked);
    if (event.target.checked === true) {
      try {
        const data = {
          InquiryID: optionDetails.inquiryID,
          InqCode: optionDetails.inqCode,
          WindowType: optionDetails.windowType,
          OptionId: optionDetails.id,
          DocumentType: 4,
          DocumentContentType: 1,
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
  const handleFrontImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 1);
      formData.append("DocumentSubContentType", 5);
      formData.append("FileName", `Front.png`);

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
  const handleRemoveFrontImage = async (id) => {
    setFrontImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //front image end

  //fron EMB start
  const handleFrontEMBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontEMBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 1);
      formData.append("DocumentSubContentType", 1);
      formData.append("FileName", `FrontEMB.png`);

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
  const handleRemoveFrontEMBImage = async (id) => {
    setFrontEMBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //front EMB end

  //front sub start
  const handleFrontSUBImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontSUBImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 1);
      formData.append("DocumentSubContentType", 2);
      formData.append("FileName", `FrontSUB.png`);

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
  const handleRemoveFrontSUBImage = async (id) => {
    setFrontSUBImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //front SUB end

  //front s print start
  const handleFrontSPrintImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontSPrintImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 1);
      formData.append("DocumentSubContentType", 3);
      formData.append("FileName", `FrontSPrint.png`);

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
  const handleRemoveFrontSPrintImage = async (id) => {
    setFrontSPrintImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };
  //front s print end

  //front dtf start
  const handleFrontDTFImageUpload = async (event) => {
    const file = event.target.files[0];
    setFrontDTFImage(URL.createObjectURL(file));
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", optionDetails.inquiryID);
      formData.append("InqCode", optionDetails.inqCode);
      formData.append("WindowType", optionDetails.windowType);
      formData.append("OptionId", optionDetails.id);
      formData.append("DocumentType", 4);
      formData.append("DocumentContentType", 1);
      formData.append("DocumentSubContentType", 4);
      formData.append("FileName", `FrontDTF.png`);

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
  const handleRemoveFrontDTFImage = async (id) => {
    setFrontDTFImage(null);
    const response = await fetch(`${BASE_URL}/AWS/DeleteDocument?docId=${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });
  };

  //front dtf end
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
                    backgroundImage: frontImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isFrontChecked || frontImage ? true : false}
                          onChange={(event) => handleFrontCheckboxChange(event, frontImageID)}
                        />
                      }
                    />
                    <ViewImage imageURL={frontImage} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    Front
                  </Typography>

                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontImageUpload}
                    />
                    <label htmlFor="frontImage">
                      <Button
                        disabled={!isFrontChecked && !frontImage}
                        fullWidth
                        variant="contained"
                        component="span"
                      >
                        {frontImage ? "Change Image" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      disabled={!isFrontChecked && !frontImage}
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveFrontImage(frontImageID)}
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
                    backgroundImage: frontEMBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontEMBImage})`
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
                            isFrontEMBChecked || frontEMBImage ? true : false
                          }
                          onChange={(event) => handleFrontEMBCheckboxChange(event,frontEMBImageID)}
                        />
                      }
                      label="EMB"
                    />
                    <ViewImage imageURL={frontEMBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontEMBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontEMBImageUpload}
                    />
                    <label htmlFor="frontEMBImage">
                      <Button
                        fullWidth
                        disabled={!isFrontEMBChecked && !frontEMBImage}
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                      >
                        {frontEMBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      disabled={!isFrontEMBChecked && !frontEMBImage}
                      color="error"
                      variant="outlined"
                      onClick={() => handleRemoveFrontEMBImage(frontEMBImageID)}
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
                    backgroundImage: frontSUBImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontSUBImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <FormControlLabel
                      control={<Checkbox />}
                      checked={
                        isFrontSUBChecked || frontSUBImage ? true : false
                      }
                      onChange={(event) =>handleFrontSUBCheckboxChange(event,frontSUBImageID)}
                      label="SUB"
                    />
                    <ViewImage imageURL={frontSUBImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontSUBImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontSUBImageUpload}
                    />
                    <label htmlFor="frontSUBImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        disabled={!isFrontSUBChecked && !frontSUBImage}
                        component="span"
                      >
                        {frontSUBImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveFrontSUBImage(frontSUBImageID)}
                      disabled={!isFrontSUBChecked && !frontSUBImage}
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
                    backgroundImage: frontSPrintImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontSPrintImage})`
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
                            isFrontSPrintChecked || frontSPrintImage
                              ? true
                              : false
                          }
                          onChange={(event) =>handleFrontSPrintCheckboxChange(event, frontSPrintImageID)}
                        />
                      }
                      label="S Print"
                    />
                    <ViewImage imageURL={frontSPrintImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontSPrintImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontSPrintImageUpload}
                    />
                    <label htmlFor="frontSPrintImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontSPrintChecked && !frontSPrintImage}
                      >
                        {frontSPrintImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        handleRemoveFrontSPrintImage(frontSPrintImageID)
                      }
                      disabled={!isFrontSPrintChecked && !frontSPrintImage}
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
                    backgroundImage: frontDTFImage
                      ? `linear-gradient(rgba(255,255,255, 0.7), rgba(255,255,255, 0.7)), url(${frontDTFImage})`
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
                            isFrontDTFChecked || frontDTFImage ? true : false
                          }
                          onChange={(event) =>handleFrontDTFCheckboxChange(event,frontDTFImageID)}
                        />
                      }
                      label="DTF"
                    />
                    <ViewImage imageURL={frontDTFImage} />
                  </Box>
                  <Box mt={1}>
                    <input
                      type="file"
                      id="frontDTFImage"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFrontDTFImageUpload}
                    />
                    <label htmlFor="frontDTFImage">
                      <Button
                        fullWidth
                        sx={{ mt: 4 }}
                        variant="contained"
                        component="span"
                        disabled={!isFrontDTFChecked && !frontDTFImage}
                      >
                        {frontDTFImage ? "Change" : "Add Image"}
                      </Button>
                    </label>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveFrontDTFImage(frontDTFImageID)}
                      disabled={!isFrontDTFChecked && !frontDTFImage}
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
