import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { navItems } from "../../shared/utils";
import type { NavItem } from "../../shared/utils";
import { useHideRotella, useNavigateWithRotella } from "../../shared/loading/hooks";

export default function HomePage() {
  const navigateRotella = useNavigateWithRotella();
  useHideRotella();

  return (
    <Box
      sx={{
        background: "linear-gradient(to right, #4facfe, #00f2fe)",
        minHeight: "100vh",
        height: "100%",
        width: "100vw",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 2, sm: 3, md: 4 },
        py: 8,
        boxSizing: "border-box",
        margin: 0,
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{
          mb: 6,
          mt: 2,
          color: "#ffffff",
          fontWeight: "bold",
          fontFamily: "Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        Benvenuto nella tua area personale!
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 3,
          justifyContent: "center",
          width: "100%",
          maxWidth: "1200px",
          px: { xs: 1, sm: 2 },
        }}
      >
        {navItems.map((item: NavItem) => (
          item.title!=="Home" && <Card
            key={item.to}
            onClick={() => navigateRotella(item.to, {message:`Caricamento ${item.title}`})}
            sx={{
              p: 2.5,
              borderRadius: 3,
              boxShadow: 6,
              textAlign: "center",
              cursor: "pointer",
              transition:
                "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.03)",
                boxShadow: 8,
              },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0,
            }}
          >
            <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
              <Box sx={{ fontSize: 40, mb: 2, color: "#3498db" }}>
                {item.icon}
              </Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                }}
              >
                {item.title}
              </Typography>
              <Button
                variant="contained"
                size="small"
                fullWidth
                sx={{
                  mt: 2,
                  fontSize: "0.875rem",
                  py: 0.8,
                  borderRadius: 2.5,
                  backgroundColor: "#3498db",
                  fontWeight: "bold",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#2980b9",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateRotella(item.to, {message:`Carincando ${item.title}`});
                }}
              >
                VAI
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ height: "48px", width: "100%" }} />
    </Box>
  );
}
