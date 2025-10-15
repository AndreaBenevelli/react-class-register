import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { orderBy } from "lodash";
import { Box, Container } from "@mui/material";

import TableRegister from "./TableRegister";
import type { PageMode } from "../../models/PageMode";
import type { Lezione } from "../../models/Lezione";
import type { Studente } from "../../models/Studente";

import {
  navigateLandingPageIfNotAuth,
  sleep,
  popupAlert,
} from "../../shared/utils";

import {
  useLoading,
  useNavigateWithRotella,
  useHideRotella,
} from "../../shared/loading/hooks";

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
    return "Nessuna risposta dal server.";
  }
  return "Errore applicativo imprevisto.";
}

export default function ClassRegister() {
  const navigate = useNavigate();
  const navigateRotella = useNavigateWithRotella();
  const location = useLocation();
  const { runWithLoading, setMessage } = useLoading(); // disponibili per destruttur anche prop in value del context foornite da useLoading : , show, hide, setMessage; per fare cosette proprio manualmente

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

  useHideRotella([mode]);

  useEffect(() => {
    if (errorMessage) {
      popupAlert(errorMessage, "rosso");
    }
  }, [errorMessage]);

  // GET iniziale e al reload (lezioni + studenti) (studenti veri servono per ordinare e visualizz<re cognome nome)
  //react esegue un effect in uno scope isolato (clousure indipendente) (varie esecuzioni consecutive di un effect non hanno accesso al cancelled del precedente), ma quando un nuovo effect parte , react gli fa rimpiazzare il precedente, eventualmente eseguendo la cleanup del precedente.
  //quindi quando l effect precedente viene chiuso, la sua cleanup parte e mette cancelled a true, e quando finisce l operazione asincrona, vede che è annullato e si interrompe.
  useEffect(() => {
    let cancelled = false;

    void runWithLoading(
      async () => {
        setErrorMessage(null);

        try {
          const [lezRes, studRes] = await Promise.all([
            axios.get<Lezione[]>("/api/lezioni"),
            axios.get<Studente[]>("/api/studenti"),
          ]);

          if (cancelled) return;
          setLezioni(lezRes.data ?? []);
          setStudenti(studRes.data ?? []);
        } catch (error: any) {
          if (cancelled) return;

          console.error(error);

          if (axios.isAxiosError(error)) {
            if (error.response) {
              setErrorMessage(
                typeof error.response.data === "string"
                  ? error.response.data
                  : "Errore applicativo imprevisto."
              );
            } else if (error.request) {
              setErrorMessage("Timeout. Nessuna risposta dal server.");
            } else {
              setErrorMessage(
                error.message ?? "Errore applicativo imprevisto."
              );
            }
          } else {
            setErrorMessage("Errore applicativo imprevisto.");
          }
          if (navigateLandingPageIfNotAuth(error, navigate)) {
            setMessage("Non Autorizzato");
            await sleep(700);
          }
        }
      },
      "Carico registro…",
      700
    );
    return () => {
      cancelled = true;
    };
  }, [reloadTag, runWithLoading, navigate]);
  // runWithLoad in LoadingSystem (doppio Provider) è useCallBack solo su hide e show quindi in ppratica useCallBack non cambia mai (ref di funz show e hide usecallback []), però se mai cmabiassimo .. eslint felice perchè "usi runWithLoading => la metti in deps.. ma non serve"
  // idem per navigate. ref non cambia ai render (useNavigate e suo provider ci fornisocno stabile), ma visto che la usiamo la mettiamo. come se non ci fosse.

  // GET iniziale e al reload (lezioni + studenti) (studenti veri servono per ordinare e visualizz<re cognome nome)

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
        navigate("/class-register", { replace: true });  // da usare useNavWithRotella hook
        return;
      }
      setMode("edit");
      setEditingLessonId(id);
      // in teoria abbiamo anche state del navigate con dentro la lesson e non solo l id.. ma non penso che la usiamo mai.. sotto passiamo le lezioni e l id di quella in modifica che sta nelll url direttamente
      // l onfocus lo gestimao negli onSaveLesson ( "da dove veniamo"); tanto se arriamo in edit da url basta lessonId per mettere il focus su row giusta
      return;
    }

    // VIEW (default)
    setMode("view");
    setEditingLessonId(undefined);
    
    // Se torniamo a view, settiamo il focus che ci siamo messi nello state della navigate dentro l onSaveLesson 
    const maybeFocus = (location.state as any)?.focusId as number | undefined;
    if (maybeFocus) setFocusLessonId(maybeFocus); // se stiamo rinavigando per finta per cancellare lo stato in modo da non looppare il focus, il focus qui sarà undefined, e quindi non lo andiamo a riassegnarlo perdendo l informazione
    
    
    // cancello lo state così non ho piu un focus id nello state che sovrascrive ogni volta quello del comp finche non rinavigo (la navigate non rerendera componente se sei su same path)
    if (maybeFocus) {
      navigateRotella("/class-register", {
        message: "apertura registro",
        replace: true,
        state: null,
      });
      // non capisco perchè dovrebbe non focussare piuu che tanto passiamo focusLessonId che sopravvive ai render ed è lui a fare la cond ( da capire perchè funziona o no), a meno che non ci sia un trucco su NUmber, null e undefined, e che quindi cambio perchè non sono cosiì pro da apprezzarne la non chiarezza
    }
  }, [location.pathname, location.state, navigateRotella]);

  // Mappa studenti by CF ordinati (cognome>nome>cf)
  // 1) mappa ordinata string (cf) {nome, cognome} , in realtà record, che è solo un tipo.. quasi una sugar syntax per dire " questo oggetto ha le chiavi di questo tipo e i valori di quest altro".. non è "struttura" come Map con sui metodi etc. Se chiave è string e non cambia tutto spessissimo va benissimo record
  const allStudentByCfSorted = useMemo<
    Record<string, { nome?: string; cognome?: string }>
  >(() => {
    const sorted = orderBy(
      // con sortedBy sempre lodash non puoi decidere asc desc, sempre asc; in ogni caso se non c'è funz ma solo prop puoi fare order/sortBy(nomeIterable, [prop1,prop2, ..], [asc, desc,..])
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
    }, {} as Record<string, { nome?: string; cognome?: string }>); //  l init usato per tipizzare,  bello
  }, [studenti]); // ok lo fa quando cambia studenti, ma non rerendera subito dopo perchè non va a cambiare uno stato eventuale

  // gli HANDLER per figlio per cambiare mode
  const onCreate = () => {
    navigateRotella("/class-register/new", { message: "verso appello" });
  };

  const onEdit = (lezione: Lezione) => {
    // portiamo i dati con navigate(state) per UI reattiva; fallback già gestito dal parsing del path
    navigateRotella(`/class-register/${lezione.id}/edit`, {
      message: `verso edit di lezione del ${lezione.dataLezione}`,
      state: { lezione },
    });
  };

  const onCancelEdit = () => {
    // torni alla lista senza cambiare cache
    navigateRotella("/class-register");
  };

  // l HANDLER del figlio per SALVARE una NEW  o una EDIT
  const onSaveLesson = async (payload: {
    id?: number;
    dataLezione: string;
    studenti: { cf: string; ore: number }[];
  }) => {
    setErrorMessage(null);

    try {
      await runWithLoading(
        async () => {
          if (payload.id != null) {
            // EDIT
            await axios.post("/api/lezioni/modifica", {
              id: payload.id,
              dataLezione: payload.dataLezione,
              studenti: payload.studenti,
            });

            setLezioni((prev) => {
              const i = prev.findIndex((l) => l.id === payload.id);
              if (i < 0) return prev;
              const copy = [...prev];
              copy[i] = {
                ...prev[i],
                dataLezione: payload.dataLezione,
                studenti: payload.studenti,
              };
              popupAlert("Modifica avvenuta con successo!", "verde");
              return copy;
            });

            setFocusLessonId(payload.id);
            navigateRotella("/class-register", {
              state: { focusId: payload.id },
            });
          } else {
            // NEW
            const res = await axios.put<Lezione | undefined>(
              "/api/lezioni/nuova",
              {
                dataLezione: payload.dataLezione,
                studenti: payload.studenti,
              }
            );

            if (res.data && res.data.id != null) {
              const created = res.data;
              setLezioni((prev) => [...prev, created]);
              setFocusLessonId(created.id);
              navigateRotella("/class-register", {
                state: { focusId: created.id },
              });
            } else {
              // fallback: refetch elenco ( da controllare)
              const lezRes = await axios.get<Lezione[]>("/api/lezioni");
              setLezioni(lezRes.data ?? []);
              navigateRotella("/class-register");
            }
            popupAlert("Nuova lezione aggiunta!", "verde");
          }
        },
        payload.id != null ? "Aggiorno lezione…" : "Creo lezione…",
        700
      );
    } catch (err) {
      setErrorMessage(mapErrorMessage(err)); //prof ci manda error message nella res personalizzato su endpoint, basterebbe usare error.response.data . il body . è plaintext. è la stringa dell errore.
      navigateLandingPageIfNotAuth(err, navigate);
    }
  };

  // DELETE LEZIONE
  const onDeleteLesson = async (id: number) => {
    setErrorMessage(null);
    try {
      await axios.delete("/api/lezioni/elimina", { data: { id } }); 
      setLezioni((prev) => prev.filter((l) => l.id !== id));

      // se eri in view, ci rimani e fine; se eri in edit, torni a classregister senza focusid ovviamente ( non c'è piu la lez)
      if (mode === "edit" && editingLessonId === id) {
        navigateRotella("/class-register");
      }
      popupAlert("Rimozione avvenuta con successo!", "verde");
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        // se err è AxiosError => true
        if (error.response) {
          // const s = err.response.status; // volendo comportamenti per stato ma non ci serve cuz be ci da stringa errore come corpo del body e noi la usiamo.
          setErrorMessage(
            error.response.data ?? "Errore applicativo imprevisto."
          ); //.data per il body della response , quello che in postman si chiama body
        } else if (error.request) {
          setErrorMessage("Timeout. Nessuna risposta dal server.");
        }
      } else {
        setErrorMessage("Errore applicativo imprevisto.");
      }

      if (navigateLandingPageIfNotAuth(error, navigate)) {
        setMessage("Non Autorizzato");
        await sleep(700);
      }
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
          py: 10,
        }}
      >
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
