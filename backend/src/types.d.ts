import { Request } from "express";

type UserInfo = {
  nome: string;
  cognome: string;
  dataNascita: string;
  sesso: "M" | "F";
  cf: string;
  mail: string;
  username: string;
  password: pass;
};

type LoginRequest = {
  username: string;
  password: string;
};

type Studente = {
  nome: string;
  cognome: string;
  dataNascita: string;
  sesso: "M" | "F";
  cf: string;
};

type Presenza = {
  cf: string;
  ore: number;
};

type Lezione = {
  id: number;
  dataLezione: string;
  studenti: Presenza[];
};

type EliminaStudenteRequest = {
  cf: string;
};

type EliminaLezioneRequest = {
  id: string;
};

export { UserInfo, LoginRequest, Studente, Presenza, Lezione, EliminaStudenteRequest, EliminaLezioneRequest };
