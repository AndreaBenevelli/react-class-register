import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useLoadingState } from "./hooks";

export default function GlobalLoading() {
  const { isOpen, message } = useLoadingState();

  return (
    <Backdrop // default pos fixed con top/l/r/b: 0  ; cattura eventi come click e li blocca quando open
      open={isOpen}  // fatta per coprire tutta viewPort quando open true
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.modal + 1, //anche senza theme usa tema mui default
        bgcolor: "rgba(0,0,0,0.4)",
      }}
      
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={56} thickness={4} />
        <Typography variant="subtitle1">{message}</Typography>
      </Stack>
    </Backdrop>
  );
}
