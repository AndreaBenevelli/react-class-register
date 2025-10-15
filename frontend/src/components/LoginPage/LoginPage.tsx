import { useState } from "react";
import axios, { type AxiosResponse } from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container } from "@mui/material";
import type { LoginUser } from "../../models/LoginUser";
import SignupForm from "../../shared/SignupForm";
import { loginFormSettings } from "../../models/FormSettings";
import { useLoading } from "../../shared/loading/hooks";
import type { User } from "../../models/User";
import { navigateLandingPageIfNotAuth, sleep } from "../../shared/utils";
import {
  useNavigateWithRotella,
  useHideRotella,
} from "../../shared/loading/hooks";

type LoginPageProps = {
  onLogin: (user: User) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {

  const [formMessage, setFormMessage] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
 
  const { runWithLoading, setMessage } = useLoading();

  useHideRotella();

  //hook per la navigazione
  const navigateRotella = useNavigateWithRotella();

  const handleSubmit = async (formData: LoginUser) => {
    setFormMessage("");
    await runWithLoading(
      async () => {
        try {
          const res = await axios.post<LoginUser, AxiosResponse<User>>(
            "/api/auth/login",
            formData
          );
          console.log(res); // debug, da togliere
          setSubmitting(false);
          if (res.data) {
          // Probabilmente non serve: in caso di errore axios solleva già un'eccezione

            onLogin(res.data);
            navigateRotella("/home", {
              message: "accedendo ...",
              replace: true,
            });
            setMessage("Logged"); //aggiorna il messaggio della rotella di caricamento se login
            await sleep(700);
          }
        } catch (err) {
          setSubmitting(false);
          if (axios.isAxiosError(err)) {
            // se err è AxiosError => true
            if (err.response) {
              // const s = err.response.status; // volendo comportamenti per stato ma non necessaria perchè abbiamo errormessage nel body della response
              setFormMessage(
                err.response.data ?? "Errore applicativo imprevisto."
              ); //.data per il body della response , quello che in postman si chiama body
            } else if (err.request) {
              setFormMessage("Timeout. Nessuna risposta dal server.");
            }
          } else {
            setFormMessage("Errore applicativo imprevisto.");
          }

          // navigateLandingPageIfNotAuth(err, navigate); //in login non necessario (non serve auth)
        }
      },
      "Loggin in..",
      700
      //true è default, non forzarlo; così se poi cambiamo default cambia ovunque
    );
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "100vw",
          display: "flex",
          placeItems: "center",
          bgcolor: "#6a7780ff",
          overflow: "hidden",
          overflowY: "hidden",
        }}
      >
        {/*card*/}
        <Container maxWidth="sm">
          <SignupForm
            formSettings={loginFormSettings}
            formMessage={formMessage}
            submitting={submitting}
            onSubmit={handleSubmit}
            onSubmitting={() => setSubmitting(true)}
          />
        </Container>
      </Box>
    </>
  );
}
