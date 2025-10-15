import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Studente } from "../../types";
import { COOKIE_NAME, decrypt, updateCookieExpiration } from "../../utils";

export const getStudenti = async (req: Request, res: Response<Studente[] | string>): Promise<void> => {
  let sessionCookie = req.cookies[COOKIE_NAME];
  const cf: string = decrypt(sessionCookie);

  try {
    const fileStudenti = path.resolve(process.cwd(), "src/files/" + cf + "/studenti.json");
    const fileContent = fs.readFileSync(fileStudenti, "utf-8");
    let studenti: Studente[] = JSON.parse(fileContent);

    updateCookieExpiration(req, res);
    res.status(200).json(studenti);
  } catch (err) {
    console.error(err);
    res.status(500).send("Impossibile recuperare la lista studenti");
  }
};

/**
 * @swagger
 * /studenti:
 *   get:
 *     tags:
 *       - Studenti
 *     summary: Servizio per tornare tutti gli studenti presenti a sistema
 *     responses:
 *       200:
 *         description: Elenco degli studenti presenti a sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nome:
 *                     type: string
 *                     description: Il nome dello studente presente
 *                     example: Marco
 *                   cognome:
 *                     type: string
 *                     description: Il cognome dello studente presente
 *                     example: Rossi
 *                   dataNascita:
 *                     type: string
 *                     description: La data di nascita dello studente presente
 *                     format: date
 *                     example: 01/04/1978
 *                   sesso:
 *                     type: string
 *                     description: Il sesso dello studente presente
 *                     enum: [M, F]
 *                     example: M
 *                   cf:
 *                     type: string
 *                     description: Il codice fiscale dello studente presente
 *                     example: RSSMRC78D01I622S
 *         required: true
 *       401:
 *         description: Utente non autorizzato
 *       500:
 *         description: Errore generico
 */
