// questo file disattivato: cerco di capire le cose + primo tentativo non ottimizzato (senza splittare LoadingContext in Action e State)

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_MSG = "Caricamento…";

type LoadingContextValue = {
  isOpen: boolean;
  message: string;
  show: (msg?: string) => void;
  hide: () => void;
  setMessage: (msg: string) => void;
  /** Utility: esegue una promise mostrando l’overlay e lo chiude in finally */
  runWithLoading: <T>(task: () => Promise<T>, msg?: string) => Promise<T>;
};

// React ci fornisce il context che è solo un interfaccia magica, UN API che fa comunicare consumer con provider.. (concettualmente, come utilità, però in teoria è un Oggetto e createContext non è un hook ma una factory infatti. useContext è l hook per farsi dare il value da qualsiasi comp dentro a provider, che così diventa customer) ..
//Il provider è il comp che nel suo return usa NomeProviderObj.Provider (quest ultimo è un comp speiciale), e che gli passa un oggetto nella prop speciale value. questa prop non arriva ai figli normalmente (è di quelle speciali, come key). Chiunque nella discendenza però
// può ottenere il value attuale del value  attraverso apposito hook useContext(nomedelcontext)  e diventa così un customer: può leggerne i valori e usarne le callback, e rerendera ogni qual volta che cambia il ref di value, persino anche se non usa campi cambiato o non usa value ! LO CHIEDE con hook, gli arriva il ref, se cambia => rerender, come se cambiasse prop
// cosa mette il provider dentro l oggetto che passa in value ? => ciò che vuole che i consumer possano vedere e le callback per fare ciò che pensa che i cunsomer debbano fare
// value NON E' REF MUTABILE MA VALORE CORRENTE DEL VALUE PASSATO CON DENTRO DEI VALORI READONLY E DELLE CALLBACK CON LE QUALI PUOI MODIFICARE VOLENDO, USABILI MA READONLY appunto (non puoi riassegnare funz a quella prop per dire)

const LoadingContext = createContext<LoadingContextValue | null>(null); //va creato a file scope( o comunque non in comp sicuramente). se lo creassi dentro un componente, ad ogni render creeresti un nuovo Context: i consumer (i comp che lo usano) collegati al vecchio non “vedrebbero” quello nuovo => comportamento rotto

//LoadingContext è un oggetto grazie al quale facciamo funzionare sta cosa.. è la nostra api verso il framework ..e lo si può importare dove si vuole per usarlo in un comp per fornire il servizio.
// Noi lo usiamo in LoadingProvider, dove conserveremo i dati e le funzioni che servono a tutti i comp per usare GlobalLoading e a GloabLoading per funzionarfe
export function LoadingProvider({ children }: { children: ReactNode }) { // per children guardare LoadingSystem, esempio migliore
  const [isOpen, setOpen] = useState(false); // overlay aperto/chiuso
  const [message, _setMessage] = useState(DEFAULT_MSG); // testo mostrato
  // comp rerendera se 1 cambia stato 2 cambia props 3 cambia context di cui è consumer (consumato),  4 cambio key jsx (smonta e rimonta proproio un altro, perdi anche stato e dire memo etc tutto) ...[5 (non fatto) "librerie con subscription tipo Redux/Zustand che chiamano il setState interno dell’hook"]
  // un func comp è una func quindi quando banalmente rerendera viene rieseguito, e tutte le funzioni definite se le usi vengono ricreate appunto, con altro ref (senza useCallback).
  // useCallBack returna la stessa referenza di funz (stessa funz nella stessa ref) finche deps non cambiano => rende stabile la ref delle funzioni attraverso i render (non che ogni render => nuovo ref per quella funz )=> useMemo del value di fatto si attiva solo quando cambia isOpen o message
  // ingenerale useCallBack spesso utile per stabilizzare funzioni 1 da passare nel value di un context, 2 o come semplici props ai fiigli, 3 o  come deps a useMemo, useEffect o useCallback. Così davvero hooks si attivano quando vogliamo e non quando in realtà " è rimasta uguale" ma "ne è stato ricalcolato il ref " a causa di un render che non c entrava ( c entra quando cambia una deps di useCallback)
  // FORMALE: useCallback(fn, deps) restituisce la stessa referenza di fn finché tutte le deps restano identiche. Quando una dep cambia, React ricrea la funzione (nuova referenza) che chiude sui nuovi valori.
  // solo per avere setter personalizzato
  const setMessage = useCallback(
    (msg: string) => _setMessage(msg || DEFAULT_MSG), // === msg? msg : DEFAULT_MSG
    [] // non usa (non legge) lo stato, che può cambiare, ne altro di cui può cambiare il ref o il value quindi il ref (penso sia così); usano solo i setter, il cui ref è garantito stabile tra i render dal mounting all unmounting quindi no deps. (gli state come isOpen invece non hanno ref fisso e se li usi vanno in deps!)
  );

  //🟢  poco solido comunque perchè si rischia di sommare vari show senza hide o viceversa. con useRef tenere un counter o qualcosa che non causa rerender gratis ma ci dica come stiamo messi magari fiero

  const show = useCallback((msg?: string) => {
    //setOpen(true) + ?message dritto
    if (msg) _setMessage(msg);
    setOpen(true);
  }, []); // idem
  const hide = useCallback(() => {
    //rimette msg a default e setOpen(false)
    setOpen(false);
    _setMessage(DEFAULT_MSG);
  }, []); //idem

  const runWithLoading = useCallback(
    // fierissimo: prende qualsiasi funz async come le fetch , prima di avviarle mette show(?msg) e comunque vada alla fine lo chiude.
    async <T,>(task: () => Promise<T>, msg?: string) => {
      // es: 🔴 se ho una (async () => {..})(); cosa ci devo piazzare ? ;; se ho una axios.get<..>(..).then(..).catch(..); ?? cosa faccio cosa ci metto? altre cose che ci posso mettere? (blocchi try catch puri sbattuti dentro no vero? domanda idiotissima sono sicuro di no però boh non sisa mai)
      show(msg);
      try {
        return await task();
      } finally {
        hide();
      }
    },
    [show, hide] //per come è ora situazione, anche se in runWithLoading usiamo show w hide, show e hide sono stabili (no deps), quindi di fatto anche runWithLoading è stabile.. potremmo toglierle. ma magari poi fai refactor di show o di etid e gli metti deps e non sono piu stabili, allora casino. quindi ce le metti già. eslint infatti si incazzza se non le metti
  ); // se show e hide cambiassero ma qua non fossero in deps, questa " istanza" di runWithLoading continuerebbe a cercare le vecchie e casino => va rifatta anceh runWithLoading => deps di show e hide in useCallback così se cambiano ti rifà runWithLoading

  // spesso il comp rerendera per colpa del padre e non perchè è cambiato qualcosa in lui ( per uno dei imlle altri provider accatastati che spesso ci sono delle app vere ad esempio, ma banalmente il routing),
  // e quindi a cascata lo fanno tutti i figli. se succede anche qua con tutti i consumer è un grande problema perchè rerendera tuto quanto in continuazione
  // usando useMemo così senza calcolo in pratica ne ricordiamo il ref che sopravvivrà al rerender (value non viene ricalcolato), a meno che il rerender non sia stato causato da una deps di useMemo.
  //  così value ha la stessa ref finche davvero qualcosa non cambia davvero, e non gratuitamente ad ogni render. altrimenti cambierebbe ref di value a ogni render e quindi tutti i consumer rerenderebbero ancora piu volte del necessario
  const value = useMemo(
    () => ({ isOpen, message, show, hide, setMessage, runWithLoading }), // se qua scordi un pezzo di LoadingContextValue (T ContextValue) value= nel return qua sotto diventa rosso : lo sa che quel value dev essere dello stesso tipo del context ( devi metterci tutte le cose , uguali)
    [isOpen, message, show, hide, setMessage, runWithLoading]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

//volendo potevamo evitare custom hook e fare sta cosa in ogni posto dove ci serviva ctx ?
//custom hook: si può usare dove vuoi, ma se lo usi fuori dal provider => !ctx ; perchè non sei dentro a un render che abbia fatto NomeContext.Provider e abbia settato value= (prop speciale di  NomeContext.Provider)
export function useLoading() {
  // evitando di importare  useContext e LoadingContext ovunque nei consumer. ricorda che custom hook solo a livello functionComp scope
  const ctx = useContext(LoadingContext);
  if (!ctx)
    throw new Error("useLoading deve essere usato dentro <LoadingProvider>");
  return ctx;
}

// !! quando cambia isOpen o message 1 il provider rerendera, 2 value dipendendo anche da loro viene ricalcolato e cambia (useMemo) , 3 🔴 tutta la subtree del Provider viene ri-invocata (re-run) (⬇️🔎SPIEGO SOTTO: intro) perché il padre ha ri-renderato (quindi di fatto tutto albero rerendera quindi quasi inutile context a meno di memoizzare tutti i figli + props invariate che non impareremo a fare adesso. magari ci sono altri modi meno top ma meno hardcore per evitare rerender a cascata quando cambiano stati provider ma non penso...)
// !! quanndo rerendera padre di provider rerendera anche provider ma se stato invariato, grazie a useCallBack che non fanno ricreare le funzioni e a memo che aggiorna value solo se cambia stato o funzioni, value non cambia e i consumer così non rerenderano, ma comunque tutta la subtree del provider viene rievocata
//

//⬇️🔎 si potrebbe usare il context con lo stato solo intorno alla rotella così "cascata dello stato " solo su di lei, mentre context delle func su tutta l app.. tanto non cambia.. però ho paura che si stia solo spostando problema perchè come fa .. no si può.. si si può. basta esporre i setter degli stati, rotella può vedere entrambi i cointext e fa da ponte ?? capire meglio
// digressione: penso che si usi molto React.Memo che è una specie di useMemo ma per l intero componente, dove le deps sono le prop, e in pratica salta il re-run se le prop sono invariate. React.memo(Componente) fa skippare il rerun del comp (e del suo subtree quindi) se le props non sono cambiate (forse puoi selezionare quali stile deps non lo so, agari ci devi giocare con useMemo o useCallback in padre). SE PERò lo stato del comp memoizzato , quello dentro React.memo, cambia, parte rerender ovvio(se cambia stato padre invece no, se sue prop non cambiano.. penso nasca per qusto). idem se value di context di cui è consumer cambia. idem se cambia key jsx

