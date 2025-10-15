import { Request, Response } from "express";
import fs from "fs";
import dayjs from "dayjs";
import path from "path";
import { UserInfo } from "../../types";
import { capitalizePhrase, COOKIE_NAME, encrypt, isAnnoBisestile, setSessionCookie, updateCookieExpiration } from "../../utils";

export const signup = async (req: Request<{}, {}, UserInfo>, res: Response): Promise<void> => {
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

        // Controllo che non sia presente a sistema un altro utente con lo stesso codice fiscale
        if (utenti.find((utente: UserInfo) => utente.cf === cf.trim().toUpperCase()) != null) {
          res.status(400).send("E' già presente un utente a sistema con lo stesso codice fiscale");
          return;
        }
        const nuovoUtente: UserInfo = {
          nome: capitalizePhrase(nome.trim()),
          cognome: capitalizePhrase(cognome.trim()),
          dataNascita: dataNascita,
          sesso: sesso.trim().toUpperCase() as "M" | "F",
          cf: cf.trim().toUpperCase(),
          mail: mail.replace(/ +/g, "").toLowerCase(),
          username,
          password,
        };
        utenti.push(nuovoUtente);

        // Creo la cartella per il nuovo utente e vi salvo all'interno i 2 file: studenti.json e lezioni.json, ciascuno valorizzato come array vuoto
        const folderPath = path.resolve(process.cwd(), "src/files/" + cf.trim().toUpperCase());
        try {
          // Creo la cartella se non esiste
          if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

          // Percorsi dei file
          const studentiFile = path.join(folderPath, "studenti.json");
          const lezioniFile = path.join(folderPath, "lezioni.json");

          // Inizializzo i file come array vuoti se non esistono già
          if (!fs.existsSync(studentiFile)) fs.writeFileSync(studentiFile, JSON.stringify([], null, 2), "utf-8");
          if (!fs.existsSync(lezioniFile)) fs.writeFileSync(lezioniFile, JSON.stringify([], null, 2), "utf-8");

          // Salvo le credenziali solo se la creazione della cartella e dei file ha avuto buon fine
          fs.writeFileSync(fileUtenti, JSON.stringify(utenti, null, 2), "utf-8");

          // Verifico la presenza di cookie di sessione. Se presente ne aggiorno la scadenza, se assente lo creo
          if (!sessionCookie) {
            sessionCookie = encrypt(nuovoUtente.cf); // Cripta il codice fiscale utente
            setSessionCookie(res, sessionCookie);
          } else updateCookieExpiration(req, res);

          res.status(200).send(nuovoUtente);
        } catch (err) {
          console.error(err);
          res.status(500).send("Impossibile registrare il nuovo utente a sistema");
        }
      } catch (err) {
        console.error(err);
        res.status(500).send("Impossibile registrare il nuovo utente a sistema");
      }
    } else {
      res.status(400).send("Formato data di nascita non corretto");
      return;
    }
  } else res.status(400).send("Campi mancanti");
};

/**
 * @swagger
 * /auth/signup:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Servizio per aggiungere un nuovo utente dell'applicativo
 *     requestBody:
 *       description: Corpo della request per aggiungere un nuovo utente a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Il nome della persona che si vuole registrare
 *                 example: Pippo
 *               cognome:
 *                 type: string
 *                 description: Il cognome della persona che si vuole registrare
 *                 example: Baudo
 *               dataNascita:
 *                 type: string
 *                 description: La data di nascita della persona che si vuole registrare (nel formato DD/MM/YYYY)
 *                 format: date
 *                 example: 07/06/1936
 *               sesso:
 *                 type: string
 *                 description: Il sesso della persona che si vuole registrare (M per uomo e S per donna)
 *                 enum: [M, F]
 *                 example: M
 *               cf:
 *                 type: string
 *                 description: Il codice fiscale della persona che si vuole registrare
 *                 example: BDAPPP36H07C351U
 *               mail:
 *                 type: string
 *                 description: L'indirizzo email della persona che si vuole registrare
 *                 example: pippobaudo@gmail.com
 *               username:
 *                 type: string
 *                 description: L'username che la persona che si vuole registrare vuole utilizzare per accedere al sistema
 *                 example: pippo
 *               password:
 *                 type: string
 *                 description: La password che la persona che si vuole registrare vuole utilizzare per accedere al sistema
 *                 example: baudo
 *       required: true
 *     responses:
 *       200:
 *         description: Informazioni dell'utente registrato con successo a sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nome:
 *                   type: string
 *                   description: Il nome della persona registrata
 *                   example: Pippo
 *                 cognome:
 *                   type: string
 *                   description: Il cognome della persona registrata
 *                   example: Baudo
 *                 dataNascita:
 *                   type: string
 *                   description: La data di nascita della persona registrata
 *                   format: date
 *                   example: 07/06/1936
 *                 sesso:
 *                   type: string
 *                   description: Il sesso della persona registrata
 *                   enum: [M, F]
 *                   example: M
 *                 cf:
 *                   type: string
 *                   description: Il codice fiscale della persona registrata
 *                   example: BDAPPP36H07C351U
 *                 mail:
 *                   type: string
 *                   description: L'indirizzo email della persona registrata
 *                   example: pippobaudo@gmail.com
 *                 username:
 *                   type: string
 *                   description: L'username della persona registrata
 *                   example: pippo
 *                 password:
 *                   type: string
 *                   description: La password della persona registrata
 *                   example: baudo
 *         required: true
 *       400:
 *         description: Campi mancanti o mal formattati
 *       500:
 *         description: Errore generico
 */
