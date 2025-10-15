import type { FormAll } from "./FormAll";

export type Mode =
  | "login"
  | "signup"
  | "profilo-visualizza"
  | "profilo-modifica";

export type FormSettings = {
  mode: Mode;
  formTitle: string;
  visible: readonly (keyof FormAll)[]; // chiavi valide
  locked?: readonly (keyof FormAll)[]; // campi visibili ma non editabili
  buttonText: string;
};

export const signupFormSettings: FormSettings = {
  visible: [
    "username",
    "nome",
    "cognome",
    "dataNascita",
    "sesso",
    "cf",
    "mail",
    "username",
    "password",
    "confirmPassword",
  ],
  buttonText: "Registrati",
  mode: "signup",
  formTitle: "Registrazione",
};

export const visualizzaProfiloFormSettings: FormSettings = {
  visible: [
    "username",
    "nome",
    "cognome",
    "dataNascita",
    "sesso",
    "cf",
    "mail",
    "username",
    "password",
  ],
  locked: [
    "username",
    "nome",
    "cognome",
    "dataNascita",
    "sesso",
    "cf",
    "mail",
    "username",
    "password",
  ],
  buttonText: "Modifica",
  mode: "profilo-visualizza",
  formTitle: "Profilo",
};

export const modificaProfiloFormSettings: FormSettings = {
  visible: [
    "username",
    "nome",
    "cognome",
    "dataNascita",
    "sesso",
    "cf",
    "mail",
    "username",
    "password",
    "confirmPassword",
  ],
  locked: ["cf"],
  buttonText: "Invia Modifiche",
  mode: "profilo-modifica",
  formTitle: "I tuoi dati",
};

export const loginFormSettings: FormSettings = {
  visible: ["username", "password"],

  buttonText: "Accedi",
  mode: "login",
  formTitle: "Bentornato",
};
