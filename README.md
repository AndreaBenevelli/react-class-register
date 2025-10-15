# Registro di Classe – Web App Full Stack

Progetto realizzato come **esercitazione di gruppo** durante il corso  
**ITS Full Stack Developer – Accademia Digitale Liguria (2024-2025)**.

La web app simula un **registro di classe semplificato**, con autenticazione, gestione degli studenti e registrazione delle presenze.

## Backend e frontend

Il **backend (API Express)** è stato fornito dal docente, mentre il **frontend (React + Vite)** è stato sviluppato in autonomia dal gruppo.

## Come abbiamo lavorato

Visto il tempo limitato, io e il gruppo ci siamo concentrati soprattutto sullo sperimentare e iniziare a comprendere gli aspetti più “strutturali” di **React** e **TypeScript**, come _hook_, _context_, _ref_, gestione asincrona, flussi logici e piccoli pattern di componenti e design.  
La parte grafica (**MUI**, **CSS**, **temi**) è stata curata solo quanto bastava per rendere l’app utilizzabile.  
Per la stessa ragione il progetto contiene molti **commenti didattici**, pensati per fissare concetti più che per scopi produttivi.

---

## Avvio del progetto

### 1. Requisiti

Assicurarsi di avere installato **Node.js** (e **npm**).

### 2. Avvio backend

```bash
cd react-class-register/backend
npm install
npm start
```

### 3. Avvio backend

```bash
cd react-class-register/frontend
npm install
npm run dev
```

**Documentazione API:** http://localhost:8080/swagger

## Funzionalità principali

| Pagina                 | Descrizione                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| **Landing page**       | Accesso iniziale con scelta tra login e registrazione                 |
| **Login**              | Verifica delle credenziali tramite API                                |
| **Signup**             | Registrazione di un nuovo utente                                      |
| **Home**               | Accesso rapido alle sezioni principali (Registro, Profilo, Dashboard) |
| **Profilo utente**     | Visualizzazione e modifica dei propri dati (tranne CF)                |
| **Dashboard studenti** | Aggiunta/rimozione studenti e visualizzazione elenco completo         |
| **Registro presenze**  | Visualizzazione e modifica delle lezioni passate                      |
| **Nuova lezione**      | Inserimento delle presenze giornaliere                                |
