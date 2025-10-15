import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { EliminaStudenteRequest, Lezione, Presenza, Studente } from "../../types";
import { COOKIE_NAME, decrypt, updateCookieExpiration } from "../../utils";

export const eliminaStudente = async (req: Request<{}, {}, EliminaStudenteRequest>, res: Response): Promise<void> => {
  const { cf } = req.body;

  if (cf != null) {
    if (cf.length !== 16) {
      res.status(400).send("Formato codice fiscale non corretto");
      return;
    }

    try {
      let sessionCookie = req.cookies[COOKIE_NAME];
      const cfUtente: string = decrypt(sessionCookie);
      const fileStudenti = path.resolve(process.cwd(), "src/files/" + cfUtente + "/studenti.json");
      const fileStudentiContent = fs.readFileSync(fileStudenti, "utf-8");
      let studenti: Studente[] = JSON.parse(fileStudentiContent);

      try {
        // Tengo solo gli studenti con cf differente da quello che si vuole eliminare
        studenti = studenti.filter((studente: Studente) => studente.cf !== cf.trim().toUpperCase());

        const fileLezioni = path.resolve(process.cwd(), "src/files/" + cfUtente + "/lezioni.json");
        const fileLezioniContent = fs.readFileSync(fileLezioni, "utf-8");
        let lezioni: Lezione[] = JSON.parse(fileLezioniContent);

        lezioni = lezioni.map((lezione: Lezione) => {
          let studentiPresenti: Presenza[] = lezione.studenti;
          studentiPresenti = studentiPresenti.filter((presenza: Presenza) => presenza.cf !== cf);
          return {
            id: lezione.id,
            dataLezione: lezione.dataLezione,
            studenti: studentiPresenti,
          };
        });

        // Dalle lezioni tengo solo gli studenti con cf differente da quello che si vuole eliminare
        fs.writeFileSync(fileLezioni, JSON.stringify(lezioni, null, 2), "utf-8");
        fs.writeFileSync(fileStudenti, JSON.stringify(studenti, null, 2), "utf-8");
        updateCookieExpiration(req, res);
        res.status(200).send("Studente eliminato correttamente");
      } catch (err) {
        console.error(err);
        res.status(500).send("Impossibile eliminare lo studente a sistema");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Impossibile eliminare lo studente a sistema");
    }
  } else res.status(400).send("Codice fiscale mancante");
};

/**
 * @swagger
 * /studenti/elimina:
 *   delete:
 *     tags:
 *       - Studenti
 *     summary: Servizio per eliminare uno studente a sistema
 *     requestBody:
 *       description: Corpo della request per eliminare uno studente a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cf:
 *                 type: string
 *                 description: Il codice fiscale dello studente che si vuole rimuovere
 *                 example: BDAPPP36H07C351U
 *       required: true
 *     responses:
 *       200:
 *         description: Studente eliminato con successo
 *       400:
 *         description: Codice fiscale mancante o mal formattato
 *       401:
 *         description: Utente non autorizzato
 *       500:
 *         description: Errore generico
 */
