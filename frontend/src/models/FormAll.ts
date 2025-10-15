import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { User } from "./User";
import type { LoginUser } from "./LoginUser";
dayjs.extend(customParseFormat);

// TUTTI i campi che il form può avere nei vari casi
export type FormAll = {
  nome: string;
  cognome: string;
  mail: string;
  sesso: "maschio" | "femmina";
  dataNascita: Dayjs;
  cf: string;
  password: string;
  confirmPassword: string;
  oldPassword: string;
  username: string;
};

// 🟠 le seguenti alla fine non usate

// Api user -> Form
export const userToForm = (u: User): Partial<FormAll> => ({
  nome: u.nome,
  cognome: u.cognome,
  sesso: u.sesso === "M" ? "maschio" : "femmina",
  dataNascita: dayjs(u.dataNascita, "DD/MM/YYYY", true),
  cf: u.cf,
  mail: u.mail,
  username: u.username,
  password: u.password,
});

// Form -> Api User
export const formToUser = (f: Partial<FormAll>): User => ({
  nome: f.nome!,
  cognome: f.cognome!,
  sesso: f.sesso === "maschio" ? "M" : "F",
  dataNascita: f.dataNascita!.format("DD/MM/YYYY"),
  cf: f.cf!,
  mail: f.mail!,
  username: f.username!,
  password: f.password!,
});

// LoginUser  -> Form
export const logginUserToForm = (u: LoginUser): Partial<FormAll> => ({
  username: u.username,
  password: u.password,
});

// Form-> LogginUser per api
export const formToLogginUser = (f: Partial<FormAll>): LoginUser => ({
  username: f.username!,
  password: f.password!, // solo dove serve
});
