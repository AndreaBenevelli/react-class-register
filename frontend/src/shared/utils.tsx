import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ClassIcon from "@mui/icons-material/Class";
import AddTaskIcon from "@mui/icons-material/AddTask";
import PersonIcon from "@mui/icons-material/Person";
import type { AxiosError } from "axios";
import type { NavigateFunction } from "react-router-dom";

import { Bounce, toast } from "react-toastify";

//workaround per usare setTimeout che non faccia niente quando finisce il timeout
//SET-TIMEOUT  non è "thread"-bloccante: aspetta ms per fare la func, ma il resto nello scope in cui è usata va avanti 
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms)); // new Promise<T>((resolve,reject?) => {funzione che quando vuole risolvere la promise fa resolve(T) e che, eventualmente, quando vuole lanciare eccezione fa reject(new Error/..tipi come error.. throwabili)} )
//se facevamo workaround poco cristiano tipo setTimeout(()=>(1+1),ms) usandola ovunque pulita senza sleep che aspetta promise, non funzionava. perchè setTimeout partiva, metteva timer e poi ricedeva controllo a thread sino a fine timeout ( e intanto thread faceva la fetch istantanea es. 4ms in locale e rotella scompariva subito).. e poi dopo ms gli tornava controllo , eseguiva 1+1 nel vuoto. e fine. non era servito a niente.

export type NavItem = {
  title: string;
  icon: React.ReactElement;
  to: string;
};

export const navItems: NavItem[] = [
  { title: "Home", icon: <HomeIcon />, to: "/home" },
  { title: "Dashboard", icon: <DashboardIcon />, to: "/dashboard" },
  { title: "Registro", icon: <ClassIcon />, to: "/class-register" },
  { title: "Nuova lezione", icon: <AddTaskIcon />, to: "/class-register/new" },
  { title: "Profilo", icon: <PersonIcon />, to: "/profile" },
];

export const navigateLandingPageIfNotAuth = (
  err: unknown,
  navigate: NavigateFunction
): boolean => {
  const errAx = err as AxiosError<any>;
  if (errAx.response?.status === 401) {
    //mettere messaggio in rotellina in questo caso.. forse da mettere rotellina proprio
    navigate("/");
    return true;
  }
  return false;
};

export function popupAlert(message: string, colore: string) {
  if (!message) return;

  if (colore == "rosso") {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  } else {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  }
}
