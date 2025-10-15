import { type User } from "./User";

//partial rende le chiavi opzionali, ma se cis ono devono rispettare il tipo. Record è una mappa chiave valore: in questo caso la chiave deve essere una chiave di user oppure "confirmPassword" (abbiamo aggiunto una chiave), mentre il valore deve essere stringa ( per ogni chiave = possibile input del form ci mettiamo eventuale stringa di errore)
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; errors: E };
