import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { createAuthHeaders, getOrgId, parsePagedResponse } from "@/components/utils/apiHelpers";

const validationSchema = Yup.object().shape({
  candidateId: Yup.number()
    .typeError("Please select a candidate")
    .required("Candidate is required")
    .min(1, "Please select a candidate"),
  profileId: Yup.number()
    .typeError("Please select an onboarding profile")
    .required("Onboarding profile is required")
    .min(1, "Please select an onboarding profile"),
});

const labelSx = { fontWeight: 500, fontSize: "14px", mb: "5px" };

export default function AssignOnboarding() {
  const router = useRouter();
  const orgId = getOrgId() ?? 0;

  const [candidates, setCandidates] = useState([]);
  const [profiles, setProfiles]     = useState([]);
  const [loadingCand, setLoadingCand] = useState(false);
  const [loadingPro, setLoadingPro]   = useState(false);

  const loadCandidates = useCallback(async () => {
    setLoadingCand(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/candidates-ready?orgId=${orgId}&skipCount=0&maxResultCount=200`,
        { headers: createAuthHeaders() }
      );
      if (res.ok) {
        const json = await res.json();
        const { items } = parsePagedResponse(json);
        setCandidates(items || []);
      }
    } finally {
      setLoadingCand(false);
    }
  }, [orgId]);

  const loadProfiles = useCallback(async () => {
    setLoadingPro(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding-profiles?SkipCount=0&MaxResultCount=200&IsActive=true`,
        { headers: createAuthHeaders() }
      );
      if (res.ok) {
        const json = await res.json();
        const { items } = parsePagedResponse(json);
        setProfiles(items || []);
      }
    } finally {
      setLoadingPro(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
    loadProfiles();
  }, [loadCandidates, loadProfiles]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const res = await fetch(`${BASE_URL}/hr/onboarding/assign-candidate`, {
        method: "POST",
        headers: createAuthHeaders(),
        body: JSON.stringify({
          CandidateId: values.candidateId,
          ProfileId: values.profileId,
          OrgId: orgId,
        }),
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success(data.message || "Onboarding assigned to candidate successfully.");
        setTimeout(() => router.push("/hr/onboarding/"), 1200);
      } else {
        toast.error(data.message || "Failed to assign onboarding.");
      }
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Assign Onboarding</h1>
        <ul>
          <li><Link href="/hr/onboarding/">Employee Onboarding</Link></li>
          <li>Assign</li>
        </ul>
      </div>

      <Grid container justifyContent="center">
        <Grid item xs={12} md={6} lg={5}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={1}>
              Assign Onboarding Profile to Candidate
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Only candidates who have accepted their offer are shown below.
            </Typography>

            <Formik
              initialValues={{ candidateId: "", profileId: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                <Form>
                  <Grid container spacing={3}>
                    {/* Candidate */}
                    <Grid item xs={12}>
                      <Typography sx={labelSx}>
                        Candidate <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <FormControl
                        fullWidth
                        size="small"
                        error={touched.candidateId && Boolean(errors.candidateId)}
                      >
                        <InputLabel>
                          {loadingCand ? "Loading…" : candidates.length === 0 ? "No candidates ready" : "Select Candidate"}
                        </InputLabel>
                        <Select
                          value={values.candidateId}
                          label={loadingCand ? "Loading…" : candidates.length === 0 ? "No candidates ready" : "Select Candidate"}
                          disabled={loadingCand || candidates.length === 0}
                          onChange={(e) => setFieldValue("candidateId", e.target.value)}
                        >
                          {candidates.map((c) => {
                            const cid = c.id ?? c.Id;
                            const firstName = c.firstName ?? c.FirstName ?? "";
                            const lastName  = c.lastName  ?? c.LastName  ?? "";
                            const email     = c.email     ?? c.Email     ?? "";
                            const jobTitle  = c.jobOpening?.title ?? c.JobOpening?.Title ?? c.jobOpening?.Title ?? "";
                            return (
                              <MenuItem key={cid} value={cid}>
                                {`${firstName} ${lastName}`.trim() || `#${cid}`}
                                {email ? ` — ${email}` : ""}
                                {jobTitle ? ` (${jobTitle})` : ""}
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {touched.candidateId && errors.candidateId && (
                          <Typography variant="caption" color="error" mt={0.5}>
                            {errors.candidateId}
                          </Typography>
                        )}
                      </FormControl>
                      {!loadingCand && candidates.length === 0 && (
                        <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                          No candidates have accepted offers yet. Accept an offer from the Recruitment module first.
                        </Typography>
                      )}
                    </Grid>

                    {/* Profile */}
                    <Grid item xs={12}>
                      <Typography sx={labelSx}>
                        Onboarding Profile <span style={{ color: "red" }}>*</span>
                      </Typography>
                      <FormControl
                        fullWidth
                        size="small"
                        error={touched.profileId && Boolean(errors.profileId)}
                      >
                        <InputLabel>
                          {loadingPro ? "Loading…" : "Select Profile"}
                        </InputLabel>
                        <Select
                          value={values.profileId}
                          label={loadingPro ? "Loading…" : "Select Profile"}
                          disabled={loadingPro}
                          onChange={(e) => setFieldValue("profileId", e.target.value)}
                        >
                          {profiles.map((p) => (
                            <MenuItem key={p.id ?? p.Id} value={p.id ?? p.Id}>
                              {p.name ?? p.Name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.profileId && errors.profileId && (
                          <Typography variant="caption" color="error" mt={0.5}>
                            {errors.profileId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Button
                          variant="outlined"
                          color="inherit"
                          onClick={() => router.push("/hr/onboarding/")}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSubmitting || candidates.length === 0}
                          startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
                        >
                          {isSubmitting ? "Assigning…" : "Assign"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
