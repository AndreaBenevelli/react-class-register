import { useCallback, useMemo, useState, type ReactNode } from "react";
import { LoadingStateContext, LoadingActionsContext } from "./contexts";
import { sleep } from "./../utils";
import GlobalLoading from "./GlobalLoading";

// n.b : qui non siamo in un consumer del provider, a cui basta importare useContext e il tipo del context e ottenere value, o importare un hook custom centralizzato che fa la steessa cosa (useLoading e useLoadingState)
// qui non ci serve value ovviamente, "siamo noi value" ! è proprio qui LoadingSystem che tiene (e volendo gestisce le logiche) dei due value ( actions e state) e che li rende accessibili ai consumer di ciascun provider mettendoli nel value
// QUI CI SERVONO GLI OGGETTI CONTEXT ! per poterne usare prop comp .Provider . questo comp tipo un hub con 2 provider

const DEFAULT_MSG = "Caricamento…";

export function LoadingSystem({ children }: { children: ReactNode }) {
  //prendere children come prop speciale (i comp annidati che verranno usati al suo interno) e tipizzarlo come ReactNode permette di dire a react che comp corrente accetta appunto contenuto JSX annidato, e poi nel render possiamo decidere dove va a finire, dove inserirlo.

  // in questo comp ovviamente state e actions comunicano tra di loro,
  // ma

  const [isOpen, setOpen] = useState(false);
  const [message, _setMessage] = useState(DEFAULT_MSG);


  const show = useCallback((msg?: string) => {
    if (msg !== undefined) _setMessage(msg);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    _setMessage(DEFAULT_MSG);
  }, []);

  const setMessage = useCallback((msg?: string) => {
    _setMessage(msg === undefined ? DEFAULT_MSG : msg);
  }, []);

  

  const runWithLoading = useCallback(
    async <T,>(
      task: () => Promise<T>,
      msg?: string,
      ms?: number,
      wait?: boolean
    ) => {
      show(msg);
      if (wait === undefined) wait = true; // CAMBIARE SE VUOI CHE DI DEFAULT NON ASPETTI 
      if (ms && wait) await sleep(ms);
      try {
        return await task();
      } finally {
        hide();
      }
    },
    [show, hide]
  );

  const actions = useMemo(  
    () => ({ show, hide, setMessage, runWithLoading}), 
    [show, hide, setMessage, runWithLoading]
  );

  const state = useMemo(() => ({ isOpen, message }), [isOpen, message]);

  return (
    <LoadingActionsContext.Provider value={actions}>
      {/* Tutta l'app è dentro al provider con le actios: children è tutta l app visto che useremo questo comp per wrappare l app */}
      {children}

      {/* Solo GlobalLoading (ROTELLA) vede lo stato (che cambia), e quindi unica a fare rerender nel caso */}
      <LoadingStateContext.Provider value={state}>
        <GlobalLoading />
      </LoadingStateContext.Provider>
    </LoadingActionsContext.Provider>
  );
}

/*
- PRIMA DI SPLITTARE CONTEXT: quando cambia isOpen/message (stati) =>value context cabiava quindi anche per consumer di solo actions (che però lo erano di tutto)
  quindi il context causava moolti più rerender ( ogni volta che rotella compariva o scompariva, rerenderava tutta app inutilmente di fatto)
- DOPO SPLITTATO CONTEXT: quando isOpen/message cambia, cambia solo value di StateContext => solo suoi consumer cioè solo rotella rerenderano
  I consumer di solo ActionsContext, tutta l app, non rerenderano mai per context.


!! RUGUARDO INVECE A RE-RENDER PER cambio stato in padre !!!!

  CHILDREN: una prop special che può contenere un ReactNode (tipo più generico): un padre può riceverla e decidere dove renderarla nel return (essendo che la rendera è padre, ma in realtà la children che gli arriva potrebbe essergli stata passata anchee da molto in alto in gerarchia)
            Se cambia fa fare rerender ovviamente. 
- a me sarebbe venuto da pensare che visto che LoadingSystem ha come stato isOpen e message, ogni volta che cambiavano rerunnava il subtree, e quindi tutta l app, visto che la wrappa. Ma sta qua la magia:
  I FIGLI CHE ARRIVANO VIA chilren SONO STATI CREATI DAL PADRE DI LoadingContext ( e di qualsi altro procvider penso visto che sono tutti incapsulati e penso che siano fatti così ha senso)
  QUINDI QUANO LoadingContext ( o chiunque usi children) rerendera per suo cambio stato, non fa rerenderare children, perchè in realtà arrivano dall alto, da fuori. ! children che in quqesto caso è App ! (prop children stessa ref di prima, padre di children non ha rerunnato)

- DA APPROFONDIRE MEGLIO ! SOLO SPUNTO (miglioramento ulteriore. non lo faremo)!! _: MEMOIZZAZIONE DI ALCUNI COMP con Reat.memo !!
  1) ogni volta che App rerendera rendera tutto quindi memoizzare comp che vogliamo decidere noi quado lo fanno, magari i piu pesannti. o che quasi mai dovrebbero rerunnare quando però lo fanno (navbar a es . se è pesante ci sta memoizzarla) 
     ?? quando app rerendera nonostante sia in cima ?? 
        - cambio stato, 
        - nb: navigazione perchè Routes cambia di per se non fa rerender se non consumi provider in app stessa con useLocate o useNavigate.. (Routes è un consumer del provider della navigazione.. può rerenderare se navigazione fa qualcosa) ma Routes è dentro App render, quindi App non rerendera di per se: è Routes a consumare provider, non App.
          (in ogni caso tutti i rami di App  stanno dentro a delle route bene o male quindi discorso della memoizzazione si ribalta sulle Routes ok ma non cambia, comp da memoizzare se vuoi farlo ha senso)
        - eventuali context che app consuma.. capire meglio cause nascoste o legate a provider , e legate a routes, che rerenderano app.. routes è usato dentro app)
     
    Ovviamente non solo app rerender da gestire ma anche di altri comp che magari  sotto hanno tanta roba che non deve rerenderare.
  2) (piu facile. ma ha senso farlo solo se memoizzi anche i comp con React.memo sennò tanto anche se non cambia prop che passi o ref della fun che passi, rerendera lo stesso figlio solo perchè padre a rerenderto)
     memoizzare prop ( quini anche funz di callback passate come prop) (=> useMemo) nei padri dove cambierebbero piu spesso del necessario, specialmente se comportano rerender pesanti o frequeenti inultilmente
      .Per le funzioni che vuoi memoizzare in piu devi stabilizzaarne il ref attraverso i render nel padre, con useCallBack  
     
  
      */
