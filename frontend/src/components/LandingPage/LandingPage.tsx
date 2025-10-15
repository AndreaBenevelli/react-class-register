import AuthCard from './AuthCard';
import { useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useHideRotella } from '../../shared/loading/hooks';


const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          background: 'linear-gradient(to right, #4facfe, #00f2fe)',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflowX: 'hidden',
        },
      },
    },
  },
});

export default function LandingPage() {
  useEffect(() => {
    document.title = "Benvenuto | La nostra App";
  }, []);


  useHideRotella();

  return (       //togliere provider da qua e metterno dai provider, dopodichè penso sia automatico sennò guardare che hook bisogna usare e come
    <ThemeProvider theme={theme}>   
      <CssBaseline />
      <AuthCard />
    </ThemeProvider>
  );
}
