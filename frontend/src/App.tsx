import { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import type { User } from "./models/User";

import LandingPage from "./components/LandingPage/LandingPage";
import LoginPage from "./components/LoginPage/LoginPage";
import SignupPage from "./components/SignupPage/SignupPage";
import HomePage from "./components/HomePage/HomePage";
import Dashboard from "./components/Dashboard/Dashboard";
import ClassRegister from "./components/ClassRegister/ClassRegister";
import ProfilePage from "./components/ProfilePage/ProfilePage";
import Navbar from "./components/Navbar/Navbar";
import { Toolbar } from "@mui/material";

export default function App() {
  // se poi vogliamo provare ad usare context isLogged è una di quelle cose che cambia raramente e condiziona tutto che ci sta di brutto in Context (penso)
  const [isLogged, setIsLogged] = useState<boolean>(true); // dovrebbe nascere a false e a ogni avvio controllare se è auth.. gestione dell auth non terminata però
  const [loggedUser, setLoggedUser] = useState<User | undefined>();

  // LogCheck è un comp a tutti gli effetti. Metterlo dentro ad App è comodo solo perchè lo usiamo solo in App e così evitiamo di passarli giù isLogged={isLogged} ma forse meglio spostarlo in suo file
  //nei Routes LogCheck non avrà il path perchè la navigazione non " si ferma mai li", ci passa per andare altrove e subire controllo. Senza controllo si poteva non mettere e piazzarci la NavBar esterna. Oppure anche con controllo potevamo non usarlo e controllare ogni Route
  function LogCheck() {
    // i functional possono avere >1 return come normali funzioni (wow)
    if (!isLogged) return <Navigate to="/" replace />;
    //<Outlet/> : quando url navigato combacia con un url di figlio del componente (LogCheck per noi), renderizza padre e al posto di <Outlet/> ci mette il figlio giusto corrisp all url. Puoi usarlo quando comp è un <Route../> che ha dentro altre <Route../>. Grazie a <Routes.. quando navighi verso un figlio react sa già dov'è e che deve passare dal padre (LogCheck) grazie alla gerarchia normale dei componenti
    return (
      <>
        <Navbar
          username={loggedUser?.nome ?? undefined} // se siamo dentro senza user non va bene in realtà; inoltre forse meglio usare null
          onLogout={() => {
            setIsLogged((prev) => !prev);
            setLoggedUser(undefined);       //forse meglio usare null per esprimere volutamente assenza di qualcosa
          }}
        />
        <Toolbar />
        {/* Mettiamo un ToolBar vuoto per spostare l Outlet in basso di un TooLbar in modo che non ci vada sotto. Dentro Navbar ci sara mui comp AppBar che si occupa di posizione fixed (si sovrappone al contenuto), colore, etc. Non ha altezza propria, dipende da contenuto. Dentro ancora ci sarà ToolBar, il contenuto tipico di AppBar, che invece ha dimensioni responsive e altro per fare realmente da navbar*/}
        <Outlet />
      </>
    );
  }

  return (
    <Routes>
      {/* PUBBLICHE */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={(userIn: User) => {
              setIsLogged(true);
              setLoggedUser(userIn);
            }}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignupPage
            onLogin={(userIn: User) => {
              setIsLogged(true);
              setLoggedUser(userIn);
            }}
          />
        }
      />
      {/*LOGGATE*/}
      <Route element={<LogCheck />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/class-register/*" element={<ClassRegister />} />
        <Route
          path="/profile"
          element={
            <ProfilePage
              loggedUser={loggedUser}
              onLogin={(userUp: User) => setLoggedUser(userUp)}
            />
          }
        />
        {/* Navigate è un comp con usenavigate implementato comodo. scrivere replace invece è come passare props replace={true}, vale in generale proprio, e passandogli replace true il navigate elimina dalla history l url in cui sei andato per sbaglio così se fai indietro non ci rivai di nuovo ma vai dov eri prima " davvero "  */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>

      {/* capire se vogliamo fare una pagina di NOT FOUND o mandiamo alla landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
