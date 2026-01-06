import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BASE_URL from "Base/api";

const OfferAcceptPage = () => {
  const router = useRouter();
  const { offerId, token } = router.query;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("pending"); // pending, success, error
  const [message, setMessage] = useState("");
  const [offerDetails, setOfferDetails] = useState(null);

  useEffect(() => {
    if (offerId && token) {
      handleAcceptOffer();
    }
  }, [offerId, token]);

  const handleAcceptOffer = async () => {
    if (!offerId || !token) return;

    setLoading(true);
    setStatus("pending");

    try {
      const response = await fetch(`${BASE_URL}/hr/recruitment/offers/${offerId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          OfferId: parseInt(offerId, 10),
          Action: "ACCEPT",
          Token: token,
        }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.statusCode === 200) {
        setStatus("success");
        setMessage("Offer accepted successfully! You will be contacted by HR soon.");
      } else {
        setStatus("error");
        setMessage(responseData.message || responseData.Message || "Failed to accept offer. Please contact HR.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred while processing your request. Please contact HR.");
      console.error("Error accepting offer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Card>
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          {loading && (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6">Processing your acceptance...</Typography>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircleIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
              <Typography variant="h4" sx={{ mb: 2, color: "success.main" }}>
                Offer Accepted!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Alert severity="success" sx={{ mt: 2 }}>
                Your acceptance has been recorded. Our HR team will contact you shortly with next steps.
              </Alert>
            </>
          )}

          {status === "error" && (
            <>
              <CancelIcon sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
              <Typography variant="h4" sx={{ mb: 2, color: "error.main" }}>
                Unable to Process
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {message}
              </Typography>
              <Alert severity="error" sx={{ mt: 2 }}>
                If you believe this is an error, please contact our HR department directly.
              </Alert>
            </>
          )}

          {status === "pending" && !loading && (
            <Typography variant="body1">Please wait...</Typography>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default OfferAcceptPage;

