import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Lezione } from "../../types";
import { COOKIE_NAME, decrypt, updateCookieExpiration } from "../../utils";

export const getLezioni = async (req: Request, res: Response<Lezione[] | string>): Promise<void> => {
  let sessionCookie = req.cookies[COOKIE_NAME];
  const cf: string = decrypt(sessionCookie);

  try {
    const fileLezioni = path.resolve(process.cwd(), "src/files/" + cf + "/lezioni.json");
    const fileContent = fs.readFileSync(fileLezioni, "utf-8");
    let lezioni: Lezione[] = JSON.parse(fileContent);

    updateCookieExpiration(req, res);
    res.status(200).json(lezioni);
  } catch (err) {
    console.error(err);
    res.status(500).send("Impossibile recuperare l'elenco di tutte le lezioni");
  }
};

/**
 * @swagger
 * /lezioni:
 *   get:
 *     tags:
 *       - Lezioni
 *     summary: Servizio per tornare tutti le lezioni presenti a sistema
 *     responses:
 *       200:
 *         description: Elenco delle lezioni presenti a sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                     description: Il codice identificativo univoco della lezione
 *                     example: 1072918800
 *                   dataLezione:
 *                     type: string
 *                     description: La data in cui è avvenuta la lezione
 *                     format: date
 *                     example: 01/04/1978
 *                   studenti:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         cf:
 *                           type: string
 *                           description: Il codice fiscale dello studente presente
 *                           example: RSSMRC78D01I622S
 *                         ore:
 *                           type: number
 *                           description: Il numero di ore che quello studente ha presenziato in quella data
 *                           example: 5
 *         required: true
 *       401:
 *         description: Utente non autorizzato
 *       500:
 *         description: Errore generico
 */
