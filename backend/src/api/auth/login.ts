import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { LoginRequest, UserInfo } from "../../types";
import { COOKIE_NAME, encrypt, setSessionCookie, updateCookieExpiration } from "../../utils";

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response<UserInfo | string>): Promise<void> => {
  let sessionCookie = req.cookies[COOKIE_NAME];
  const { username, password } = req.body;

  if (username != null && password != null) {
    try {
      const fileUtenti = path.resolve(process.cwd(), "src/files/utenti.json");
      const fileContent = fs.readFileSync(fileUtenti, "utf-8");
      let utenti: UserInfo[] = JSON.parse(fileContent);

      // Controllo se l'utente è presente a sistema
      const utenteLoggato = utenti.find((utente: UserInfo) => utente.username === username && utente.password === password);
      if (utenteLoggato == null) {
        res.status(404).send("Username e/o password errati");
        return;
      }

      // Verifico la presenza di cookie di sessione. Se presente ne aggiorno la scadenza, se assente lo creo
      if (!sessionCookie) {
        sessionCookie = encrypt(utenteLoggato.cf); // Cripta il codice fiscale utente
        setSessionCookie(res, sessionCookie);
      } else updateCookieExpiration(req, res);
      res.status(200).json(utenteLoggato);
    } catch (err) {
      console.error(err);
      res.status(500).send("Impossibile verificare le credenziali di accesso");
    }
  } else res.status(400).send("Username e/o password mancanti");
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Servizio per verificare se le credenziali fornite sono presenti a sistema
 *     requestBody:
 *       description: Corpo della request per accedere a sistema
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *         description: Informazioni dell'utente registrato a sistema
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
 *         description: Username e/o password mancanti
 *       404:
 *         description: Username e/o password errati
 *       500:
 *         description: Errore generico
 */
