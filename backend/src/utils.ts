import { Request, Response } from "express";
import crypto from "crypto";
import dayjs from "dayjs";

const COOKIE_NAME = "sessionId";
const DURATA_COOKIE_IN_MINUTI = 100;

const ENCRYPT_ALGORITHM = "aes-256-cbc";

/* ---------- Funzione per scrivere tutte le parole all'interno di una frase con la prima lettera maiuscola e il resto minuscolo ---------- */
const capitalizePhrase = (phrase: string): string =>
  phrase
    .toLowerCase()
    .split(/\s+/) // divide per spazi multipli
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/* ---------- Funzione per dire se un anno è bisestile o meno ---------- */
const isAnnoBisestile = (anno: number): boolean => (anno % 4 === 0 && anno % 100 !== 0) || anno % 400 === 0;

/* ---------- Funzione per ottener il timestamp di una data in formato DD/MM/YYYY ---------- */
const getTimestamp = (data: string): number => {
  const [giorno, mese, anno] = data.split("/");

  const dataFormattata = dayjs()
    .set("ms", 0)
    .set("s", 0)
    .set("m", 0)
    .set("h", 0)
    .set("y", parseInt(anno))
    .set("M", parseInt(mese) - 1)
    .set("D", parseInt(giorno));

  return Math.abs(dayjs(dataFormattata).unix());
};

/* ---------- Funzione per settare il cookie di sessione ---------- */
const setSessionCookie = (res: Response, cookie: string): Response =>
  res.cookie(COOKIE_NAME, cookie, {
    httpOnly: true, // il cookie non è accessibile via JS
    sameSite: "lax", // protezione CSRF base
    maxAge: 1000 * 60 * DURATA_COOKIE_IN_MINUTI,
    path: "/", // cookie valido in tutta l'app
  });

/* ---------- Funzione per aggiornare il maxAge del cookie di sessione ---------- */
const updateCookieExpiration = (req: Request, res: Response): void => {
  const sessionCookie = req.cookies[COOKIE_NAME];
  setSessionCookie(res, sessionCookie);
};

/* ---------- Funzione per criptare un testo ---------- */
const encrypt = (text: string): string => {
  // Creo chiave e iv in maniera casuale
  const encryptKey = crypto.randomBytes(32);
  const encryptIv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, encryptKey, encryptIv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Ritorno chiave, iv (entrambi in formato esadecimale) + testo criptato (separati con :)
  return encryptKey.toString("hex") + ":" + encryptIv.toString("hex") + ":" + encrypted;
};

/* ---------- Funzione per decriptare un testo ---------- */
const decrypt = (fullEncryptedText: string): string => {
  // Recupero chiave, iv (entrambi in formato esadecimale) e testo criptato splittando sul carattere ':'
  const [keyHex, ivHex, encryptedText] = fullEncryptedText.split(":");
  // Trasformo chiave e iv dal formato esadecimale al formato buffer
  const encryptKey = Buffer.from(keyHex, "hex");
  const encryptIv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, encryptKey, encryptIv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export { COOKIE_NAME, setSessionCookie, updateCookieExpiration, capitalizePhrase, isAnnoBisestile, getTimestamp, encrypt, decrypt };
