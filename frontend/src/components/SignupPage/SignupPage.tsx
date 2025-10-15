import { useState } from "react";
import axios, { AxiosError } from "axios";
import type { User } from "../../models/User";
import { Box, Container } from "@mui/material";

import SignupForm from "../../shared/SignupForm";
import { signupFormSettings } from "../../models/FormSettings";
import { popupAlert} from "../../shared/utils";
import { useLoading } from "../../shared/loading/hooks";

import {
  useNavigateWithRotella,
  useHideRotella,
} from "../../shared/loading/hooks";

type SignupPageProps = {
  onLogin: (user: User) => void;
};

export default function SignupPage({ onLogin }: SignupPageProps) {
  const [formMessage, setFormMessage] = useState<string>(""); 
  const [submitting, setSubmitting] = useState<boolean>(false); 
  // stati per password
  const { runWithLoading } = useLoading();

  useHideRotella();

  const navigateRotella = useNavigateWithRotella();

  const handleSubmit = async (formData: User) => {
    setFormMessage("");

    runWithLoading(
      () =>
        axios
          .put("/api/auth/signup", formData)
          .then(function (response) {
            console.log(response);
            onLogin(formData);
            setSubmitting(false);
            popupAlert("Registrazione Avvenuta con successo!", "verde"); //toast compare subito quindi prima che loader si chiuda
            navigateRotella("/home", { message: "Benvenuto", replace: true }); //così dopo che uno si registra se fa indietro torna a home e non a signup
          })
          .catch((error) => {
            setSubmitting(false);
            console.error(error);
            if (axios.isAxiosError(error)) {
              if (error.response) {
                setFormMessage(
                  error.response.data ?? "Errore applicativo imprevisto."
                ); //.data per il body della response , quello che in postman si chiama body
              } else if (error.request) {
                setFormMessage("Timeout. Nessuna risposta dal server.");
              } else {
                setFormMessage("Errore applicativo imprevisto.");
              }
            }
          }),
      "Registrazione in corso",
      700
    );
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw", // minWidth non usarli, potrebbero attivare e usare anche un po di scrollbar su schermi piccoli, usa width: 100% , o niente, perchè è il default.
        // padding tolti perchè magari uscivano dai 100vw e 100vh e facevano comparire le scrollbar
        display: "flex",
        placeItems: "center",
        bgcolor: "#6a7780ff",
        overflow: "hidden",
        overflowY: "hidden",
      }}
    >
      {/* CARD */}
      <Container
        maxWidth="sm" /*Container: un comp comodo per gestire responsive dei suoi figli*/
        sx={{
          transform: "scale(0.67)",
          transformOrigin: "center center",
        }}
      >
        <SignupForm
          formSettings={signupFormSettings}
          formMessage={formMessage}
          submitting={submitting}
          onSubmit={handleSubmit as any} 
          onSubmitting={() => setSubmitting(true)} 
        />
      </Container>
    </Box>
  );
}
