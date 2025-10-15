// versione prima di cambiare le cose asincrone con metodo runWithLoading (del ctx per la rotella

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { orderBy } from "lodash";
import { Alert, Box, Container } from "@mui/material";

import TableRegister from "./../TableRegister";
import type { PageMode } from "../../../models/PageMode";
import type { Lezione } from "../../../models/Lezione";
import type { Studente } from "../../../models/Studente";
import { navigateLandingPageIfNotAuth } from "../../../shared/utils";

import { useLoading } from "../../../shared/loading/hooks";

// mappa status code con messaggio (verificare che questo mapping abbia senso e sia usato bene, e che sia completo)
function mapErrorMessage(err: unknown): string {
  const e = err as AxiosError<any>;
  if (e.response) {
    const s = e.response.status;
    if (s === 400) return "Campi mancanti o mal formattati.";
    if (s === 401) return "Non autorizzato.";
    if (s === 404) return "Risorsa non trovata.";
    return "Errore del server. Riprova più tardi.";
  } else if (e.request) {
    return "Nessuna risposta dal server. Controlla la connessione.";
  }
  return "Errore applicativo imprevisto.";
}

export default function ClassRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  // const {runWithLoading, show, hide, setMessage} = useLoading();

  const [loading, setLoading] = useState();
  const [lezioni, setLezioni] = useState<Lezione[]>([]);
  const [studenti, setStudenti] = useState<Studente[]>([]);
  const [reloadTag, setReloadTag] = useState<boolean>(false); //ogni volta che lo cambiamo riparte lo useEffect che fa la get degli studenti e delle lezioni.

  // in new una sola riga, collassata, compilabile; se siamo in edit tutte le righe, e quella in edit on focus, cvollassata e interagibile; se siamo in view tutte le righe non interagibili, se si viene da una new o da una edit, quella aperta e on focus
  const [mode, setMode] = useState<PageMode>("view");

  // Se siamo in edit, quale lezione? (serve per passare mode giusto, aprire e mettere on focus)
  const [editingLessonId, setEditingLessonId] = useState<number | undefined>(
    undefined
  );

  // Focus della riga dopo un salvataggio o se ci arrivi da url
  const [focusLessonId, setFocusLessonId] = useState<number | undefined>(
    undefined
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // GET iniziale e al reload (lezioni + studenti) (studenti veri servono per ordinare e visualizz<re cognome nome)
  useEffect(() => {
    (async () => {
      //setLoading(true);
      setErrorMessage(null);
      try {
        // Lezioni
        const lezRes = await axios.get<Lezione[]>("/api/lezioni");
        setLezioni(lezRes.data ?? []);

        // Studenti
        try {
          const studRes = await axios.get<Studente[]>("/api/studenti");
          setStudenti(studRes.data ?? []);
        } catch {
          // se non riesce a caricare gli studenti, mette vuoto (magari gestire meglio)
          setStudenti([]);
        }
      } catch (err) {
        setErrorMessage(mapErrorMessage(err));
        navigateLandingPageIfNotAuth(err, navigate);
      } finally {
        //setLoading(false);
      }
    })();
  }, [reloadTag]);

  // parsa il path quando cambia e imposta mode e se siamo in edit l id che ricava dal path
  useEffect(() => {
    const path = location.pathname; // es. /class-register/123../edit | /class-register/new | /class-register
    // NEW
    if (path.endsWith("/new")) {
      setMode("new");
      setEditingLessonId(undefined);
      // in new il focus se c'è va tolto perchè c'è solo una row, non ha senso
      setFocusLessonId(undefined);
      return;
    }

    // EDIT
    const parts = path.split("/").filter(Boolean); // ["class-register","123","edit"] ; verrebbe ["", ..] stringa vuota prima di primo slash; con quella filter elimini le falsy, come "" ( o NaN o i famosi)
    if (
      parts.length === 3 &&
      parts[0] === "class-register" &&
      parts[2] === "edit"
    ) {
      const id = Number(parts[1]);
      if (Number.isNaN(id)) {
        setMode("view");
        setEditingLessonId(undefined);
        navigate("/class-register", { replace: true });
        return;
      }
      setMode("edit");
      setEditingLessonId(id);
      // in teoria abbiamo anche state del navigate con dentro la lesson e non solo l id.. ma non penso che la usiamo masi.. sotto passiamo le lezioni e l id di quella in modifica che sta nelll url direttamente
      // l onfocus lo gestimao negli onSaveLesson ( "da dove veniamo"); tanto se arriamo in edit da url basta lessonId per mettere il focus su row giusta
      return;
    }

    // VIEW (default)
    setMode("view");
    setEditingLessonId(undefined);

    // Se torniamo a view, settiamo il focus che ci siamo messi nello state della navigate dentro l onSaveLesson (ma ce l eravamo messi anche dentro focusLessonId direttamente ... (???!) )
    const maybeFocus = (location.state as any)?.focusId as number | undefined;
    if (maybeFocus) setFocusLessonId(maybeFocus); // sennò non cancella quelloche c eravamo comunque passati.. se ce l eravamo passati .. perchè o tutte e due o niente penso
    // cancello state del focus così ad ogni mount per qualsiasi motivo non mi ricollassa e focussa l originalmente aperto e focussato
    if (maybeFocus) {
      navigate("/class-register", { replace: true, state: null }); // non capisco perchè dovrebbe non focussare piuu che tanto passiamo focusLessonId che sopravvive ai render ed è lui a fare la cond ( da capire perchè funziona o no), a meno che non ci sia un trucco su NUmber, null e undefined, e che quindi cambio perchè non sono cosiì pro da apprezzarne la non chiarezza
    }
  }, [location.pathname, location.state, navigate]);

  // Mappa studenti by CF ordinati (cognome>nome>cf)
  // 1) mappa ordinata string (cf) {nome, cognome} , in realtà record, che è solo un tipo non "struttura" come Map con sui metodi etc. Se chiave è string e non cambia tutto spessissimo va benissimo record
  const allStudentByCfSorted = useMemo<
    Record<string, { nome?: string; cognome?: string }>
  >(() => {
    const sorted = orderBy(
      // con sortedBy sempre lodash non puoi decidere asc desc, sempre asc; in ogni caso se non c'è funz ma solo prop puoi fare order/sortBy(nomeIterable, [prop1,prop2, ..] ?, [asc, desc,..])
      studenti ?? [],
      [
        (s: Studente) => s.cognome?.toLowerCase() ?? "",
        (s: Studente) => s.nome?.toLowerCase() ?? "",
        (s: Studente) => s.cf,
      ],
      ["asc", "asc", "asc"]
    );
    return sorted.reduce((acc, s) => {
      acc[s.cf] = { nome: s.nome, cognome: s.cognome };
      return acc;
    }, {} as Record<string, { nome?: string; cognome?: string }>); //  l init usato per tipizzare fiero
  }, [studenti]); // ok lo fa quando cambia studenti, ma non rerendera subito dopo perchè non va a cambiare uno stato eventuale

  // gli HANDLER per figlio per cambiare mode
  const onCreate = () => {
    navigate("/class-register/new");
  };

  const onEdit = (lezione: Lezione) => {
    // portiamo i dati con navigate(state) per UI reattiva; fallback già gestito dal parsing del path
    navigate(`/class-register/${lezione.id}/edit`, { state: { lezione } });
  };

  const onCancelEdit = () => {
    // torni alla lista senza cambiare cache
    navigate("/class-register");
  };

  // l HANDLER del figlio per SALVARE una NEW  o una EDIT
  const onSaveLesson = async (payload: {
    id?: number;
    dataLezione: string;
    studenti: { cf: string; ore: number }[];
  }) => {
    setErrorMessage(null);

    try {
      if (payload.id != null) {
        // EDIT => POST /api/lezioni/modifica
        await axios.post("/api/lezioni/modifica", {
          id: payload.id,
          dataLezione: payload.dataLezione,
          studenti: payload.studenti,
        });

        // se andata bene con modifica/new aggiorniamo quelle locali
        setLezioni((prev) => {
          const i = prev.findIndex((l) => l.id === payload.id);
          if (i < 0) return prev;
          const updated = {
            ...prev[i],
            dataLezione: payload.dataLezione,
            studenti: payload.studenti,
          };
          const copy = [...prev];
          copy[i] = updated;
          return copy;
        });

        // dopo modifica/new quella che era in modifica/new rimane aperta in view
        setFocusLessonId(payload.id); // penso sia ridondante
        navigate("/class-register", { state: { focusId: payload.id } });
      } else {
        // NEW => PUT /api/lezioni/nuova
        // BErestituisce 200; controllare se ritorna creata senno rifare la get (penso la ritorni, guardarci)
        const res = await axios.put<Lezione | undefined>("/api/lezioni/nuova", {
          dataLezione: payload.dataLezione,
          studenti: payload.studenti,
        });

        if (res.data && res.data.id != null) {
          const created = res.data;
          setLezioni((prev) => [...prev, created]);
          setFocusLessonId(created.id);
          navigate("/class-register", { state: { focusId: created.id } });
        } else {
          // se non torna l’oggetto, refetch e si torna a view
          const lezRes = await axios.get<Lezione[]>("/api/lezioni");
          setLezioni(lezRes.data ?? []);

          navigate("/class-register");
        }
      }
    } catch (err) {
      setErrorMessage(mapErrorMessage(err));
      navigateLandingPageIfNotAuth(err, navigate);
      // non navighiamo da nessuna parte (es. edit rimani in edit e puoi correggere)
    }
  };

  // DELETE LEZIONE
  const onDeleteLesson = async (id: number) => {
    setErrorMessage(null);
    try {
      await axios.delete("/api/lezione/elimina", { data: { id } });
      setLezioni((prev) => prev.filter((l) => l.id !== id));

      // se eri in view, ci rimani e fine; se eri in edit, torni a classregister senza focusid ovviamente ( non c'è piu la lez)
      if (mode === "edit" && editingLessonId === id) {
        navigate("/class-register");
      }
    } catch (err) {
      setErrorMessage(mapErrorMessage(err));
      navigateLandingPageIfNotAuth(err, navigate);
    }
  };

  return (
    <Box
      sx={{
        fontFamily: "Roboto",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        display: "flex",
        placeItems: "center",
        backgroundColor: "lightblue",
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          fontFamily: "Roboto",
          height: "100vh",
          width: "100vw",
          display: "flex",
          placeItems: "center",
          backgroundColor: "lightblue",
          flexDirection: "column",
          overflow: "auto",
          py: 2,
        }}
      >
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <TableRegister
          mode={mode}
          lezioni={lezioni}
          editingLessonId={editingLessonId}
          focusLessonId={focusLessonId}
          onCreate={onCreate}
          onEdit={onEdit}
          onCancelEdit={onCancelEdit}
          onSave={onSaveLesson}
          onDeleteLesson={onDeleteLesson}
          allStudentByCfSorted={allStudentByCfSorted}
          onReload={() => setReloadTag((p) => !p)}
        />
      </Container>
    </Box>
  );
}
