import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { EliminaLezioneRequest, Lezione } from "../../types";
import { COOKIE_NAME, decrypt, updateCookieExpiration } from "../../utils";

export const eliminaLezione = async (req: Request<{}, {}, EliminaLezioneRequest>, res: Response): Promise<void> => {
  const { id } = req.body;

  if (id != null) {
    try {
      let sessionCookie = req.cookies[COOKIE_NAME];
      const cfUtente: string = decrypt(sessionCookie);

      const fileLezioni = path.resolve(process.cwd(), "src/files/" + cfUtente + "/lezioni.json");
      const fileLezioniContent = fs.readFileSync(fileLezioni, "utf-8");
      let lezioni: Lezione[] = JSON.parse(fileLezioniContent);

      // Controllo che la lezione sia presente a sistema
      if (lezioni.find((lezione: Lezione) => lezione.id === parseInt(id)) == null) {
        res.status(404).send("Lezione non presente a sistema");
        return;
      }

      lezioni = lezioni.filter((lezione: Lezione) => lezione.id !== parseInt(id));

      fs.writeFileSync(fileLezioni, JSON.stringify(lezioni, null, 2), "utf-8");
      updateCookieExpiration(req, res);
      res.status(200).send("Lezione eliminata correttamente");
    } catch (err) {
      console.error(err);
      res.status(500).send("Impossibile eliminare la lezione a sistema");
    }
  } else res.status(400).send("ID lezione mancante");
};

/**
 * @swagger
 * /lezioni/elimina:
 *   delete:
 *     tags:
 *       - Lezioni
 *     summary: Servizio per eliminare una lezione a sistema
 *     requestBody:
 *       description: Corpo della request per eliminare una lezione a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *                 description: Il codice identificativo univoco della lezione
 *                 example: 1072918800
 *       required: true
 *     responses:
 *       200:
 *         description: Lezione eliminata con successo
 *       400:
 *         description: ID lezione mancante
 *       401:
 *         description: Utente non autorizzato
 *       404:
 *         description: Lezione non presente a sistema
 *       500:
 *         description: Errore generico
 */
