import { Request, Response } from "express";
import fs from "fs";
import dayjs from "dayjs";
import path from "path";
import { Lezione, Presenza, Studente } from "../../types";
import { COOKIE_NAME, decrypt, getTimestamp, isAnnoBisestile, updateCookieExpiration } from "../../utils";

export const nuovaLezione = async (req: Request<{}, {}, Lezione>, res: Response): Promise<void> => {
  const { dataLezione, studenti } = req.body;

  if (dataLezione != null && studenti != null) {
    // Controllo che la data sia nel formato corretto
    const regexData = /^\d{2}\/\d{2}\/\d{4}$/;
    if (regexData.test(dataLezione)) {
      const splittedData = dataLezione.split("/");
      const giorno = parseInt(splittedData[0]);
      const mese = parseInt(splittedData[1]);
      const anno = parseInt(splittedData[2]);

      // Eseguo il controllo sull'anno della lazione
      if (!(anno >= parseInt(dayjs().subtract(1, "y").format("YYYY")) && anno <= parseInt(dayjs().format("YYYY")))) {
        res.status(400).send("Formato data non corretto: la lezione deve avere fra oggi e un anno fa");
        return;
      }

      // Eseguo il controllo sul mese della lezione
      if (!(mese > 0 && mese < 13)) {
        res.status(400).send("Formato data non corretto: la lezione deve essersi svolta in un mese valido");
        return;
      }

      // Eseguo il controllo sul giorno di nascita
      const giorniMese = [31, isAnnoBisestile(anno) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (giorno < 1 || giorno > giorniMese[mese - 1]) {
        res.status(400).send("Formato data non corretto: la lezione deve essersi svolta in un giorno valido");
        return;
      }

      try {
        let sessionCookie = req.cookies[COOKIE_NAME];
        const cfUtente: string = decrypt(sessionCookie);
        const fileLezioni = path.resolve(process.cwd(), "src/files/" + cfUtente + "/lezioni.json");
        const fileLezioniContent = fs.readFileSync(fileLezioni, "utf-8");
        let lezioni: Lezione[] = JSON.parse(fileLezioniContent);

        // Controllo che non sia presente a sistema una lezione con la stessa data
        const id = getTimestamp(dataLezione);
        if (lezioni.find((lezione: Lezione) => lezione.id === id) != null) {
          res.status(400).send("E' già presente una lezione a sistema con la stessa data");
          return;
        }

        const fileStudenti = path.resolve(process.cwd(), "src/files/" + cfUtente + "/studenti.json");
        const fileStudentiContent = fs.readFileSync(fileStudenti, "utf-8");
        const studentiRegistrati: Studente[] = JSON.parse(fileStudentiContent);
        const cfRegistrati: string[] = studentiRegistrati.map((studente: Studente) => studente.cf);

        // Controllo che non tutti gli sttudenti della lezione siano presenti a sistema
        studenti.forEach((presenza: Presenza) => {
          if (!cfRegistrati.includes(presenza.cf)) {
            res.status(400).send("Lo studente con codice fiscale " + presenza.cf + " non è presente a sistema");
            return;
          }
        });

        const nuovoLezione: Lezione = {
          id,
          dataLezione,
          studenti,
        };

        lezioni.push(nuovoLezione);
        fs.writeFileSync(fileLezioni, JSON.stringify(lezioni, null, 2), "utf-8");
        updateCookieExpiration(req, res);
        res.status(200).send("Lezione aggiunta a sistema con successo");
      } catch (err) {
        console.error(err);
        res.status(500).send("Impossibile aggiungere la nuova lezione a sistema");
      }
    } else {
      res.status(400).send("Formato data lezione non corretto");
      return;
    }
  } else res.status(400).send("Campi mancanti");
};

/**
 * @swagger
 * /lezioni/nuova:
 *   put:
 *     tags:
 *       - Lezioni
 *     summary: Servizio per aggiungere una nuova lezione a sistema
 *     requestBody:
 *       description: Corpo della request per aggiungere una nuova lezione a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataLezione:
 *                 type: string
 *                 description: La data in cui è avvenuta la lezione
 *                 format: date
 *                 example: 01/04/1978
 *               studenti:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cf:
 *                       type: string
 *                       description: Il codice fiscale dello studente presente
 *                       example: RSSMRC78D01I622S
 *                     ore:
 *                       type: number
 *                       description: Il numero di ore che quello studente ha presenziato in quella data
 *                       example: 5
 *       required: true
 *     responses:
 *       200:
 *         description: Lezione aggiunta a sistema con successo
 *       400:
 *         description: Campi mancanti o mal formattati
 *       401:
 *         description: Utente non autorizzato
 *       500:
 *         description: Errore generico
 */
