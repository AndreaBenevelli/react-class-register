import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import LogoutIcon from "@mui/icons-material/Logout";

import { navItems } from "../../shared/utils";
import {
  useNavigateWithRotella,
} from "../../shared/loading/hooks";

type NavbarProps = {
  onLogout: () => void; // logout:   mette a null loggeduser in app e mette a false islogged
  username?: string; // loggedUser?: string == loggedUser: string | undefined
};

export default function Navbar({ onLogout, username }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const navigateRotella =  useNavigateWithRotella();

  // <<<<<<  const toggle = (v: boolean) => () => setOpen(v);  >>>>>>   funzione che returna funzione puoi scrivere nel jsx direttamente {toggle(true)} perchè sarebbe come scrivere {(v: boolean) => setOpen(v)} e dargli true cioè fare {()=>setOpen(true)}
  const toggle = () => () => setOpen((prev) => !prev); // questo pattern è utile in realtà quando devi passare argomenti, così non devi fare ()=>{} nel jsx "ovunque usi questo"

  // const toggle = (v: boolean): void =>{
  //   setOpen(v);
  // }

  // function toggle(v: boolean){
  //   setOpen(v);
  // }

  const go = (path: string, name: string) => {
    navigateRotella(path, {message: `Caricando ${name}...`});
    setOpen(false);
  };

  const handleLogout = () => {  // aggiungere chiamata API di logout
    setOpen(false);
    onLogout();
    navigateRotella("/", { message: "Loggin out", replace: true });
  };

  // const items = [
  //   { text: "Home", icon: <HomeIcon />, to: "/home" },
  //   { text: "Dashboard", icon: <DashboardIcon />, to: "/dashboard" },
  //   { text: "Registro", icon: <ClassIcon />, to: "/class-register" },
  //   { text: "Nuova lezione", icon: <AddTaskIcon />, to: "class-register/new },
  //   { text: "Profilo", icon: <PersonIcon />, to: "/profile" },
  // ];

  return (
    <>
      <AppBar
        position="fixed" // mantiene navbar fissa e fuori dal flusso-spazio elementi dom => non schiaccia il contenuto, ci si sovrappone
        sx={{
          backdropFilter: "saturate(180%) blur(6px)",
          backgroundColor: "rgba(25,118,210,0.85)",
        }}
      >
        <Toolbar
          sx={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
          }}
        >
          <IconButton
            edge="start" // o "end" : props di IconButton per quando è dentro ad una Toolbar: fa in modo attraversi margin di allinearsi a sx / dx. usato per hamburger  o avatar, etc
            color="inherit" // eredita il colore dal primo genitore che ha un colore ( AppBar )
            aria-label="menu"
            onClick={toggle()}
            disableRipple // niente onda
            disableFocusRipple // niente onda sul focus
            sx={{
              //sx deriva da prima di mui da style expression o style extended. Dentro sx per chiavio non semplici come stati (es. over, focus, ..), classi applicate, discendenti, etc si usa & con ' .. ' dove & è l elem corrente (root) . es. '&:hover': .. o applicare classi  '&.Mui-disabled': { opacity: 0.5 } .. altro  come css tutto
              mr: 2,
              ml: 0,
              flex: "0 0 auto",
              "&:focus": { outline: "none" }, //focus si attiva sempre quando elemento ha il focus sia programmatico sia da tastiera sia da mouse
              "&:focus-visible": {
                // si attiva solo quando ci arrivi da tastiera o in altri strani casi (comandi AT ??) volendo si può togliere bordo e usare altri effetti o classi base di mui come '&.Mui-focusVisible': { outline: '2px solid #fff' }
                outline: "2px solid #fff",
                outlineOffset: 2,
              },
              transition: "transform 120ms ease", // quest ultimo pezzo di sx magari da togliere poi con tema
              "&:hover": {
                transform: "scale(1.12)",
              },
              "&:active": {
                transform: "scale(0.98)",
              },
            }}
          >
            <MenuIcon sx={{ fontSize: "2.2rem" }} />
            {/*menu icon ha solo svg dell icona praticamente.. puoi metterci sopra l onClick ma le aree di click non sono il meglio,  e non ha altre funzioni importanti(focus, ripple, hover, area cliccabile ampia) . meglio wrappare icone base in IconButton*/}
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              left: 0,
              right: 0,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            Registro – {username ?? "Errore: Sistema stato in app"} 
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open} 
        onClose={toggle()}
        PaperProps={{ sx: { width: 260 } }}
        ModalProps={{ keepMounted: true }} // Il drawer sotto è fatto con <Modal/> .. con questa props dici al Drawer di non smontare il suo Modal, ma di tenerlo montato ma nascosto, penso spostandolo a sx (/dx) con css, per permettere riaperture piu fluide 
      >
        <Box
          // sx={{ width: 260 }}  ok così la box spinge fuori il drawer e alla fine funziona ma magari regola male le cose. meglio fissarla sul Paper interno al drawer
          role="presentation" //per ARIA  così sa che è solo un wrapper che può ignorare
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          sx={{
            // serve a far funzionare mt:'auto' (margin top)
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <List>
            {" "}
            {/*questi comp usati per liste navigabili, solitamente menu drawer. List contenitore html semantico (come <ul/> )+ gestisce padding, densità, divider . ListItem (semantic <li) ... generico più altri personalizzati per vari scopi */}
            {navItems.map((it) => (
              <ListItem key={it.title} disablePadding>
                {/*anche una key meno forte andava bene tanto non si ordinano, non si filtrano etc */}
                <ListItemButton onClick={() => go(it.to, it.title)}>
                  <ListItemIcon>{it.icon}</ListItemIcon>
                  <ListItemText primary={it.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ mt: "auto", pb: 2, px: 1 }}>
            {/* spinge in basso + padding */}
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
