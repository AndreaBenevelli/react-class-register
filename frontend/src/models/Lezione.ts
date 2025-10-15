import type { PresenzaStudente } from "./Studente";

export type Lezione = {
  id: number;

  dataLezione: string; //formato "DD/MM/YYYY" ( da gestire magari con dayjs tra poco)
  studenti: PresenzaStudente[];
};

export type LezioneCreate = Omit<Lezione, "id">;
