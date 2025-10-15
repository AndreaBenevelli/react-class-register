import { Request, Response } from "express";
import { COOKIE_NAME } from "../../utils";

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(200).send("Logout eseguito correttamente");
};

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Servizio per eliminare il cookie di sessione
 *     responses:
 *       200:
 *         description: Logout eseguito correttamente
 */
