import { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Registro API Documentation",
      version: "1.0.0",
      description: "Lista di api create per l'esercitazione del modulo 1.25 sul registro scolastico",
    },
    servers: [
      {
        url: "http://localhost:8080/api",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Api per contenuti autenticati",
      },
      {
        name: "Studenti",
        description: "Api per contenuti sugli studenti",
      },
      {
        name: "Lezioni",
        description: "Api per contenuti inerenti alle lezioni",
      },
    ],
  },
  apis: ["./src/api/auth/*", "./src/api/lezioni/*", "./src/api/studenti/*"], // Percorso ai file che contengono le definizioni delle API
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
