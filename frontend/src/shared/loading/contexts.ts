import { createContext } from "react";

// spezziamo i due context: uno peer gli state così unico a cambiare e l alltro , utilizzato da tutti i comp tranne rotella, non va a re-renderare in continuazione

export type LoadingState = { isOpen: boolean; message: string };

export type LoadingActions = {
  show: (msg?: string) => void;
  hide: () => void;
  setMessage: (msg?: string) => void;
  runWithLoading: <T>(
    task: () => Promise<T>,
    msg?: string,
    ms?: number,
    wait?: boolean
  ) => Promise<T>;
};


export const LoadingStateContext = createContext<LoadingState | null>(null);
export const LoadingActionsContext = createContext<LoadingActions | null>(null);

/* Context ha dentro un oggetto, il value , di tipo "il tipo del context". In un comp che farà da provider puoi importare l oggetto context creato con createContext e usare il suo componente nomeContext.Provider per wrappare i componenti che potranno usare il context, detti consumer. attraverso la proprietà value del nomeContext.Provider potrai passare un oggetto di tipo tipoDelContext al context, e tenerlo aggiornato ovviamente.  e i consumer potranno usare le callback al suo interno o leggerne i valori. se usano callback queste si attioveranno nel componente provider e potranno quindi anche cambiare lo stato di questo , che magari fa anche parte dello stesso value o di un value di un altro context che condivide lo stesso provider */
/*Prima che il Provider esista e dia un valore a l oggetto dentro context attraverso il value del suo .Provider, e che ne tenga aggiornato il valore attraverso esso, il context deve comunque avere tipo coerente. Quindi o ..  ti inventi un valore default del suo tipo che non verrebbe mai più usato e poi i riferimenti non sarebbero quelli che darebbe il provider manco di default, 
oppure all inizio lo metti a null . in più se uno poi usa useContext fuori dal provider la const associata sarà null e controllabile, invece di dare errore*/
