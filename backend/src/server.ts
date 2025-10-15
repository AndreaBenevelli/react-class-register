import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupSwagger } from "./swagger"; // Importa la configurazione di Swagger
import { COOKIE_NAME } from "./utils";
import { signup, login, logout, modificaUtente } from "./api/auth";
import { getStudenti, nuovoStudente, modificaStudente, eliminaStudente } from "./api/studenti";
import { getLezioni, nuovaLezione, modificaLezione, eliminaLezione } from "./api/lezioni";

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

setupSwagger(app); // Configura Swagger

const BASE_PATH = "/api";
// Auth API
const PATH_SIGNUP = "/auth/signup";
const PATH_LOGIN = "/auth/login";
const PATH_LOGOUT = "/auth/logout";
const PATH_MODIFICA_UTENTE = "/auth/modifica";
const FULL_PATH_SIGNUP = BASE_PATH + PATH_SIGNUP;
const FULL_PATH_LOGIN = BASE_PATH + PATH_LOGIN;
const FULL_PATH_LOGOUT = BASE_PATH + PATH_LOGOUT;
const FULL_PATH_MODIFICA_UTENTE = BASE_PATH + PATH_MODIFICA_UTENTE;
// Studenti API
const PATH_STUDENTI = "/studenti";
const FULL_PATH_STUDENTI = BASE_PATH + PATH_STUDENTI;
const PATH_NUOVO_STUDENTE = "/studenti/nuovo";
const FULL_PATH_NUOVO_STUDENTE = BASE_PATH + PATH_NUOVO_STUDENTE;
const PATH_MODIFICA_STUDENTE = "/studenti/modifica";
const FULL_PATH_MODIFICA_STUDENTE = BASE_PATH + PATH_MODIFICA_STUDENTE;
const PATH_ELIMINA_STUDENTE = "/studenti/elimina";
const FULL_PATH_ELIMINA_STUDENTE = BASE_PATH + PATH_ELIMINA_STUDENTE;
// Lezioni API
const PATH_LEZIONI = "/lezioni";
const FULL_PATH_LEZIONI = BASE_PATH + PATH_LEZIONI;
const PATH_NUOVA_LEZIONE = "/lezioni/nuova";
const FULL_PATH_NUOVA_LEZIONE = BASE_PATH + PATH_NUOVA_LEZIONE;
const PATH_MODIFICA_LEZIONE = "/lezioni/modifica";
const FULL_PATH_MODIFICA_LEZIONE = BASE_PATH + PATH_MODIFICA_LEZIONE;
const PATH_ELIMINA_LEZIONE = "/lezioni/elimina";
const FULL_PATH_ELIMINA_LEZIONE = BASE_PATH + PATH_ELIMINA_LEZIONE;

// Middleware per controllare che l'api sia presente
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    ![
      FULL_PATH_SIGNUP,
      FULL_PATH_LOGIN,
      FULL_PATH_LOGOUT,
      FULL_PATH_MODIFICA_UTENTE,
      FULL_PATH_STUDENTI,
      FULL_PATH_NUOVO_STUDENTE,
      FULL_PATH_MODIFICA_STUDENTE,
      FULL_PATH_ELIMINA_STUDENTE,
      FULL_PATH_LEZIONI,
      FULL_PATH_NUOVA_LEZIONE,
      FULL_PATH_MODIFICA_LEZIONE,
      FULL_PATH_ELIMINA_LEZIONE,
    ].includes(req.path)
  )
    return res.status(404).send(req.path + " non è presente fra le api disponibili");
  next();
});

// Middleware di protezione per tutte le rotte sotto /api
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  const sessionCookie = req.cookies[COOKIE_NAME] ?? null;

  if ([PATH_SIGNUP, PATH_LOGIN, PATH_LOGOUT].includes(req.path)) return next();
  if (!sessionCookie) return res.status(401).send("Utente non autorizzato");

  next();
});

// Auth API
app.put(FULL_PATH_SIGNUP, signup);
app.post(FULL_PATH_LOGIN, login);
app.get(FULL_PATH_LOGOUT, logout);
app.post(FULL_PATH_MODIFICA_UTENTE, modificaUtente);
// Studenti API
app.get(FULL_PATH_STUDENTI, getStudenti);
app.put(FULL_PATH_NUOVO_STUDENTE, nuovoStudente);
app.post(FULL_PATH_MODIFICA_STUDENTE, modificaStudente);
app.delete(FULL_PATH_ELIMINA_STUDENTE, eliminaStudente);
// Lezioni API
app.get(FULL_PATH_LEZIONI, getLezioni);
app.put(FULL_PATH_NUOVA_LEZIONE, nuovaLezione);
app.post(FULL_PATH_MODIFICA_LEZIONE, modificaLezione);
app.delete(FULL_PATH_ELIMINA_LEZIONE, eliminaLezione);

app.listen(PORT, () => {
  console.log("Server avviato su http://localhost:" + PORT);
});
