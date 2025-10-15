export type PresenzaStudente = {
  cf: string;
  ore: number;
};

export type Studente = {
  nome: string;
  cognome: string;
  dataNascita: string;
  sesso: "M" | "F" | "";
  cf: string; // PK; 16 char ! es. RSSMRC78D01I622S
};
