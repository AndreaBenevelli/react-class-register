import { Request, Response } from "express";
import fs from "fs";
import dayjs from "dayjs";
import path from "path";
import { UserInfo } from "../../types";
import { capitalizePhrase, COOKIE_NAME, encrypt, isAnnoBisestile, setSessionCookie, updateCookieExpiration } from "../../utils";

export const modificaUtente = async (req: Request<{}, {}, UserInfo>, res: Response): Promise<void> => {
  let sessionCookie = req.cookies[COOKIE_NAME];
  const { nome, cognome, sesso, dataNascita, cf, mail, username, password } = req.body;

  if (nome != null && cognome != null && sesso != null && dataNascita != null && cf != null && mail != null && username != null && password != null) {
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
        res.status(400).send("Formato data di nascita non corretto: la persona deve avere fra i 18 e i 100 anni");
        return;
      }

      // Eseguo il controllo sul mese di nascita
      if (!(mese > 0 && mese < 13)) {
        res.status(400).send("Formato data di nascita non corretto: la persona deve essere nata in un mese valido");
        return;
      }

      // Eseguo il controllo sul giorno di nascita
      const giorniMese = [31, isAnnoBisestile(anno) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (giorno < 1 || giorno > giorniMese[mese - 1]) {
        res.status(400).send("Formato data di nascita non corretto: la persona deve essere nata in un giorno valido");
        return;
      }

      try {
        const fileUtenti = path.resolve(process.cwd(), "src/files/utenti.json");
        const fileContent = fs.readFileSync(fileUtenti, "utf-8");
        let utenti: UserInfo[] = JSON.parse(fileContent);

        // Controllo che l'utente sia presente a sistema
        if (utenti.find((utente: UserInfo) => utente.cf === cf.trim().toUpperCase()) == null) {
          res.status(400).send("L'utente con il codice fiscale " + cf.trim().toUpperCase() + " non + presente a sistema");
          return;
        }
        utenti = utenti.filter((utente: UserInfo) => utente.cf !== cf.trim().toUpperCase());

        const utenteModificato: UserInfo = {
          nome: capitalizePhrase(nome.trim()),
          cognome: capitalizePhrase(cognome.trim()),
          dataNascita: dataNascita,
          sesso: sesso.trim().toUpperCase() as "M" | "F",
          cf: cf.trim().toUpperCase(),
          mail: mail.replace(/ +/g, "").toLowerCase(),
          username,
          password,
        };
        utenti.push(utenteModificato);

        fs.writeFileSync(fileUtenti, JSON.stringify(utenti, null, 2), "utf-8");
        updateCookieExpiration(req, res);
        res.status(200).send(utenteModificato);
      } catch (err) {
        console.error(err);
        res.status(500).send("Impossibile modificare l'utente a sistema");
      }
    } else {
      res.status(400).send("Formato data di nascita non corretto");
      return;
    }
  } else res.status(400).send("Campi mancanti");
};

/**
 * @swagger
 * /auth/modifica:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Servizio per modificare un utente dell'applicativo
 *     requestBody:
 *       description: Corpo della request per modificare un utente a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Il nome della persona che si vuole modificare
 *                 example: Pippo
 *               cognome:
 *                 type: string
 *                 description: Il cognome della persona che si vuole modificare
 *                 example: Baudo
 *               dataNascita:
 *                 type: string
 *                 description: La data di nascita della persona che si vuole modificare (nel formato DD/MM/YYYY)
 *                 format: date
 *                 example: 07/06/1936
 *               sesso:
 *                 type: string
 *                 description: Il sesso della persona che si vuole modificare (M per uomo e S per donna)
 *                 enum: [M, F]
 *                 example: M
 *               cf:
 *                 type: string
 *                 description: Il codice fiscale della persona che si vuole modificare
 *                 example: BDAPPP36H07C351U
 *               mail:
 *                 type: string
 *                 description: L'indirizzo email della persona che si vuole modificare
 *                 example: pippobaudo@gmail.com
 *               username:
 *                 type: string
 *                 description: L'username che la persona che si vuole modificare vuole utilizzare per accedere al sistema
 *                 example: pippo
 *               password:
 *                 type: string
 *                 description: La password che la persona che si vuole modificare vuole utilizzare per accedere al sistema
 *                 example: baudo
 *       required: true
 *     responses:
 *       200:
 *         description: Informazioni dell'utente modificato con successo a sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nome:
 *                   type: string
 *                   description: Il nome della persona modificata
 *                   example: Pippo
 *                 cognome:
 *                   type: string
 *                   description: Il cognome della persona modificata
 *                   example: Baudo
 *                 dataNascita:
 *                   type: string
 *                   description: La data di nascita della persona modificata
 *                   format: date
 *                   example: 07/06/1936
 *                 sesso:
 *                   type: string
 *                   description: Il sesso della persona modificata
 *                   enum: [M, F]
 *                   example: M
 *                 cf:
 *                   type: string
 *                   description: Il codice fiscale della persona modificata
 *                   example: BDAPPP36H07C351U
 *                 mail:
 *                   type: string
 *                   description: L'indirizzo email della persona modificata
 *                   example: pippobaudo@gmail.com
 *                 username:
 *                   type: string
 *                   description: L'username della persona modificata
 *                   example: pippo
 *                 password:
 *                   type: string
 *                   description: La password della persona modificata
 *                   example: baudo
 *         required: true
 *       400:
 *         description: Campi mancanti o mal formattati
 *       500:
 *         description: Errore generico
 */
