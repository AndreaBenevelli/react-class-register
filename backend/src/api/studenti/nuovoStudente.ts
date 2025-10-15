import { Request, Response } from "express";
import fs from "fs";
import dayjs from "dayjs";
import path from "path";
import { Studente } from "../../types";
import { capitalizePhrase, COOKIE_NAME, decrypt, isAnnoBisestile, updateCookieExpiration } from "../../utils";

export const nuovoStudente = async (req: Request<{}, {}, Studente>, res: Response): Promise<void> => {
  const { nome, cognome, sesso, dataNascita, cf } = req.body;

  if (nome != null && cognome != null && sesso != null && dataNascita != null && cf != null) {
    if (!["M", "F"].includes(sesso.toUpperCase())) {
      res.status(400).send("Formato sesso non corretto");
      return;
    }
    if (cf.length !== 16) {
      res.status(400).send("Formato codice fiscale non corretto");
      return;
    }
    const regexData = /^\d{2}\/\d{2}\/\d{4}$/;
    if (regexData.test(dataNascita)) {
      const splittedData = dataNascita.split("/");
      const giorno = parseInt(splittedData[0]);
      const mese = parseInt(splittedData[1]);
      const anno = parseInt(splittedData[2]);

      // Eseguo il controllo sull'anno di nascita
      if (!(anno >= parseInt(dayjs().subtract(100, "y").format("YYYY")) && anno <= parseInt(dayjs().subtract(18, "y").format("YYYY")))) {
        res.status(400).send("Formato data di nascita non corretto: lo studente deve avere fra i 18 e i 100 anni");
        return;
      }

      // Eseguo il controllo sul mese di nascita
      if (!(mese > 0 && mese < 13)) {
        res.status(400).send("Formato data di nascita non corretto: lo studente deve essere nata in un mese valido");
        return;
      }

      // Eseguo il controllo sul giorno di nascita
      const giorniMese = [31, isAnnoBisestile(anno) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (giorno < 1 || giorno > giorniMese[mese - 1]) {
        res.status(400).send("Formato data di nascita non corretto: lo studente deve essere nata in un giorno valido");
        return;
      }

      try {
        let sessionCookie = req.cookies[COOKIE_NAME];
        const cfUtente: string = decrypt(sessionCookie);
        const fileStudenti = path.resolve(process.cwd(), "src/files/" + cfUtente + "/studenti.json");
        const fileContent = fs.readFileSync(fileStudenti, "utf-8");
        let studenti: Studente[] = JSON.parse(fileContent);

        // Controllo che non sia presente a sistema un altro studente con lo stesso codice fiscale
        if (studenti.find((studente: Studente) => studente.cf === cf.trim().toUpperCase()) != null) {
          res.status(400).send("E' già presente un studente a sistema con lo stesso codice fiscale");
          return;
        }
        const nuovoStudente: Studente = {
          nome: capitalizePhrase(nome.trim()),
          cognome: capitalizePhrase(cognome.trim()),
          dataNascita: dataNascita,
          sesso: sesso.trim().toUpperCase() as "M" | "F",
          cf: cf.trim().toUpperCase(),
        };

        studenti.push(nuovoStudente);
        fs.writeFileSync(fileStudenti, JSON.stringify(studenti, null, 2), "utf-8");
        updateCookieExpiration(req, res);
        res.status(200).send("Studente salvato correttamente");
      } catch (err) {
        console.error(err);
        res.status(500).send("Impossibile aggiungere il nuovo studente a sistema");
      }
    } else {
      res.status(400).send("Formato data di nascita non corretto");
      return;
    }
  } else res.status(400).send("Campi mancanti");
};

/**
 * @swagger
 * /studenti/nuovo:
 *   put:
 *     tags:
 *       - Studenti
 *     summary: Servizio per aggiungere un nuovo studente a sistema
 *     requestBody:
 *       description: Corpo della request per aggiungere un nuovo studente a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Il nome dello studente che si vuole aggiungere
 *                 example: Pippo
 *               cognome:
 *                 type: string
 *                 description: Il cognome dello studente che si vuole aggiungere
 *                 example: Baudo
 *               dataNascita:
 *                 type: string
 *                 description: La data di nascita dello studente che si vuole aggiungere (nel formato DD/MM/YYYY)
 *                 format: date
 *                 example: 07/06/1936
 *               sesso:
 *                 type: string
 *                 description: Il sesso dello studente che si vuole aggiungere (M per uomo e S per donna)
 *                 enum: [M, F]
 *                 example: M
 *               cf:
 *                 type: string
 *                 description: Il codice fiscale dello studente che si vuole aggiungere
 *                 example: BDAPPP36H07C351U
 *       required: true
 *     responses:
 *       200:
 *         description: Studente aggiunto a sistema con successo
 *       400:
 *         description: Campi mancanti o mal formattati
 *       401:
 *         description: Utente non autorizzato
 *       500:
 *         description: Errore generico
 */
