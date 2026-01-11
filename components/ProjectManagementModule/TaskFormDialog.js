import { Formik } from "formik";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import * as Yup from "yup";

const sdlcPhases = [
  "Planning",
  "Analysis",
  "Design",
  "Development",
  "Testing",
  "Deployment",
  "Maintenance",
];

const validationSchema = Yup.object().shape({
  projectId: Yup.number()
    .required("Project is required")
    .positive("Invalid project selection"),
  boardColumnId: Yup.number()
    .required("Please select a column")
    .positive("Invalid column selection"),
  title: Yup.string()
    .required("Task title is required")
    .min(2, "Task title must be at least 2 characters")
    .max(256, "Task title cannot exceed 256 characters")
    .trim(),
  description: Yup.string()
    .nullable()
    .max(2048, "Description cannot exceed 2048 characters"),
  estimatedHours: Yup.number()
    .typeError("Estimated hours must be a number")
    .required("Estimated hours is required")
    .moreThan(0, "Estimated hours must be greater than 0"),
  startDate: Yup.date()
    .nullable()
    .typeError("Please select a valid start date")
    .test("before-due", "Start date must be before or equal to due date", function(value) {
      const { dueDate } = this.parent;
      if (!value || !dueDate) return true;
      return dayjs(value).isBefore(dayjs(dueDate)) || dayjs(value).isSame(dayjs(dueDate), "day");
    }),
  dueDate: Yup.date()
    .nullable()
    .typeError("Please select a valid due date")
    .test("after-start", "Due date must be after or equal to start date", function(value) {
      const { startDate } = this.parent;
      if (!value || !startDate) return true;
      return dayjs(value).isAfter(dayjs(startDate)) || dayjs(value).isSame(dayjs(startDate), "day");
    }),
  phaseName: Yup.string()
    .nullable()
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .max(128, "Phase name cannot exceed 128 characters"),
  phaseType: Yup.string()
    .nullable()
    .oneOf(sdlcPhases, "Please select a valid SDLC stage"),
  // If a phase is selected, we need dates to generate the timeline automatically.
  _phaseDatesGate: Yup.mixed().test(
    "phase-requires-dates",
    "Start date and Due date are required when selecting a phase",
    function () {
      const { phaseName, startDate, dueDate } = this.parent;
      if (!phaseName || !String(phaseName).trim()) return true;
      return Boolean(startDate) && Boolean(dueDate);
    }
  ),
  assignedMemberIds: Yup.array().of(Yup.number()).nullable(),
});

const TaskFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  teamMembers = [],
  columns = [],
  phases = [],
  title = "New Task",
}) => {
  const columnLocked = Boolean(initialValues?.columnLocked);
  const normalizedPhases = Array.isArray(phases)
    ? phases
        .map((p) => ({
          phaseName: p.phaseName || p.PhaseName || "",
          phaseType: p.phaseType || p.PhaseType || "",
        }))
        .filter((p) => p.phaseName)
    : [];

  const defaults = {
    projectId: initialValues?.projectId ?? null,
    boardColumnId:
      initialValues?.boardColumnId !== null &&
      initialValues?.boardColumnId !== undefined
        ? Number(initialValues.boardColumnId)
        : columns.length > 0
        ? Number(columns[0].columnId)
        : "",
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    estimatedHours:
      initialValues?.estimatedHours ??
      initialValues?.EstimatedHours ??
      "",
    assignedMemberIds: Array.isArray(initialValues?.assignees)
      ? initialValues.assignees.map((a) => a.memberId)
      : initialValues?.assignedToMemberId != null
      ? [initialValues.assignedToMemberId]
      : [],
    startDate: initialValues?.startDate ? dayjs(initialValues.startDate) : null,
    dueDate: initialValues?.dueDate ? dayjs(initialValues.dueDate) : null,
    phaseName:
      initialValues?.phaseName ||
      initialValues?.PhaseName ||
      initialValues?.phase ||
      "",
    phaseType:
      initialValues?.phaseType ||
      initialValues?.PhaseType ||
      "",
    checklist: initialValues?.checklist
      ? initialValues.checklist.map((item) => ({ title: item.title }))
      : [],
  };

  const mergeTime = (baseDate, timeValue) => {
    if (!timeValue) return baseDate;
    const base = baseDate ? dayjs(baseDate) : dayjs();
    const time = dayjs(timeValue);
    return base.hour(time.hour()).minute(time.minute()).second(0).millisecond(0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={defaults}
        validationSchema={validationSchema}
        onSubmit={async (values, helpers) => {
          try {
            // --- STATUS MAPPING LOGIC (Kept from previous fix) ---
            const selectedColumn = columns.find(
              (c) => Number(c.columnId) === Number(values.boardColumnId)
            );

            // Get the status from the column, default to 0 (ToDo) if not found
            const statusToSend = (selectedColumn && selectedColumn.status != null) 
              ? selectedColumn.status 
              : 0;
            // -----------------------------------------------------

            const payload = {
              ...values,
              projectId: values.projectId ? Number(values.projectId) : null,
              status: statusToSend,
              estimatedHours:
                values.estimatedHours === "" || values.estimatedHours == null
                  ? null
                  : Number(values.estimatedHours),
              assignedMemberIds: values.assignedMemberIds?.filter((id) => id != null) ?? [],
              checklist: values.checklist?.filter((item) => item.title.trim()),
              startDate: values.startDate ? values.startDate.toISOString() : null,
              dueDate: values.dueDate ? values.dueDate.toISOString() : null,
              phaseName: values.phaseName ? String(values.phaseName).trim() : null,
              phaseType: values.phaseType ? String(values.phaseType).trim() : null,
            };

            await onSubmit(payload);
            helpers.setSubmitting(false);
          } catch (error) {
            helpers.setSubmitting(false);
            helpers.setStatus({ success: false, message: error.message });
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          setFieldValue,
          isSubmitting,
          status,
        }) => (
          <>
            <DialogContent dividers>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      name="boardColumnId"
                      label="Column"
                      fullWidth
                      value={
                        values.boardColumnId === null ||
                        values.boardColumnId === undefined
                          ? ""
                          : values.boardColumnId
                      }
                      onChange={(event) => {
                        const valueRaw = event.target.value;
                        const value =
                          valueRaw === "" || valueRaw === null
                            ? ""
                            : Number(valueRaw);
                        setFieldValue("boardColumnId", value);
                      }}
                      error={touched.boardColumnId && Boolean(errors.boardColumnId)}
                      helperText={touched.boardColumnId && errors.boardColumnId}
                      disabled={columnLocked}
                    >
                      {columns.map((column) => (
                        <MenuItem
                          key={column.columnId}
                          value={Number(column.columnId)}
                        >
                          {column.name ??
                            column.title ??
                            `Column ${column.columnOrder + 1}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="title"
                      label="Task Title"
                      fullWidth
                      value={values.title}
                      onChange={handleChange}
                      error={touched.title && Boolean(errors.title)}
                      helperText={touched.title && errors.title}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="description"
                      label="Description"
                      fullWidth
                      multiline
                      minRows={3}
                      value={values.description}
                      onChange={handleChange}
                      error={touched.description && Boolean(errors.description)}
                      helperText={touched.description && errors.description}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="estimatedHours"
                      label="Estimated Hours"
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, step: 0.25 }}
                      value={values.estimatedHours}
                      onChange={handleChange}
                      error={touched.estimatedHours && Boolean(errors.estimatedHours)}
                      helperText={touched.estimatedHours && errors.estimatedHours}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={teamMembers}
                      value={
                        teamMembers.filter((member) =>
                          values.assignedMemberIds?.includes(member.memberId)
                        ) ?? []
                      }
                      onChange={(_, newValue) =>
                        setFieldValue(
                          "assignedMemberIds",
                          newValue.map((member) => member.memberId)
                        )
                      }
                      getOptionLabel={(option) => option.name}
                      renderInput={(params) => (
                        <TextField {...params} label="Assign To (one or more)" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={values.startDate}
                      onChange={(date) => setFieldValue("startDate", date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={touched.startDate && Boolean(errors.startDate)}
                          helperText={touched.startDate && errors.startDate}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Start Time"
                      value={values.startDate}
                      onChange={(time) =>
                        setFieldValue("startDate", mergeTime(values.startDate, time))
                      }
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Due Date"
                      value={values.dueDate}
                      onChange={(date) => setFieldValue("dueDate", date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={touched.dueDate && Boolean(errors.dueDate)}
                          helperText={touched.dueDate && errors.dueDate}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="End Time"
                      value={values.dueDate}
                      onChange={(time) =>
                        setFieldValue("dueDate", mergeTime(values.dueDate, time))
                      }
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      freeSolo
                      options={normalizedPhases.map((p) => p.phaseName)}
                      value={values.phaseName || ""}
                      onChange={(_, newValue) => {
                        const name = typeof newValue === "string" ? newValue : (newValue ?? "");
                        setFieldValue("phaseName", name);

                        const match = normalizedPhases.find(
                          (p) => p.phaseName.toLowerCase() === String(name).toLowerCase()
                        );
                        if (match?.phaseType) {
                          setFieldValue("phaseType", match.phaseType);
                        }
                      }}
                      onInputChange={(_, newInputValue) => {
                        setFieldValue("phaseName", newInputValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Phase"
                          placeholder="Select or type a new phase"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      name="phaseType"
                      label="SDLC Stage"
                      fullWidth
                      value={values.phaseType || ""}
                      onChange={handleChange}
                      helperText="Optional (used for reporting)"
                    >
                      <MenuItem value="">
                        None
                      </MenuItem>
                      {sdlcPhases.map((phase) => (
                        <MenuItem key={phase} value={phase}>
                          {phase}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </LocalizationProvider>
              {status?.message ? (
                <Box sx={{ mt: 2, color: "error.main", fontSize: 13 }}>
                  {status.message}
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={onClose} color="inherit">
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Task"}
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default TaskFormDialog;