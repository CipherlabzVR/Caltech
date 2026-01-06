import { Box, Stack, Typography } from "@mui/material";
import ProjectHeaderNav from "./ProjectHeaderNav";

const PageHeader = ({
  title,
  subtitle,
  actions,
  showNavigation = true,
  navigationCategories,
}) => {
  return (
    <Box sx={{ mb: showNavigation ? 4 : 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {actions}
          </Stack>
        ) : null}
      </Box>

      {showNavigation ? (
        <ProjectHeaderNav
          categories={navigationCategories}
          sx={{ mt: { xs: 2, md: 3 } }}
        />
      ) : null}
    </Box>
  );
};

export default PageHeader;

