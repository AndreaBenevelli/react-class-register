import {
  Box,
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Paper,
  Typography,
  InputAdornment,
  IconButton,
  FormHelperText,
} from "@mui/material";
import { type FormSettings, type Mode } from "../models/FormSettings";
import type { User } from "../models/User";
import type { FieldErrors, Ok, Err } from "../models/FieldErrors";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import { isStrongPassword } from "validator";
import { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  formToLogginUser,
  formToUser,
  userToForm,
  type FormAll,
} from "../models/FormAll";
import type { LoginUser } from "../models/LoginUser";

import { popupAlert } from "./utils";
import { useHideRotella, useNavigateWithRotella } from "./loading/hooks";

type SignupFormProps = {
  onSubmit: (data: LoginUser | User) => void | Promise<void>;
  formSettings: FormSettings;
  formMessage: string;
  submitting: boolean;
  onSubmitting: () => void;
  incomingUser?: User;
  // fieldErrors: FieldErrors[]; niente props su e giu,  mettiamo uno stato qua;  validazione in loco
};

export default function SignupForm({
  onSubmit,
  formMessage,
  submitting,
  onSubmitting,
  formSettings,
  incomingUser,
}: SignupFormProps) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<FormAll>>({});
  const [formData, setFormData] = useState<Partial<FormAll>>({});
  const [showPw, setShowPw] = useState<boolean>(false);
  const [showPw2, setShowPw2] = useState<boolean>(false);
  const [showOldPw, setShowOldPw] = useState<boolean>(false);

  useHideRotella();
  const navigateRotella = useNavigateWithRotella();

  // inizializziamo formData con l incomingUser quando serve senno vuoto o come serve. serve anche per quando c'è cambiamento senza smontare visualizza<-> modifica in profilo
  useEffect(() => {
    if (!incomingUser) return; // in signup e login non c'è incoming e smette subito
    if (formSettings.mode === "profilo-visualizza") {
      setFormData(userToForm(incomingUser));
    } else if (formSettings.mode === "profilo-modifica") {
      setFormData(userToForm({ ...incomingUser, password: "" }));
    } else if (formSettings.mode === "login") {
      setFormData({ mail: "", password: "" });
    } else if (formSettings.mode === "signup") {
      setFormData({});
    }
  }, [formSettings, incomingUser]);

  useEffect(() => {
    if (formMessage) {
      popupAlert(formMessage, "rosso");
    }
  }, [formMessage]);

  const handleSubmit = () => {
    const validationRes = validateByMode(formSettings.mode, formData);
    if (!validationRes.ok) {
      //c'è modo piu furbo per escludere Ok come tipo di return, che non ha errors ma non può essere ok:false ?
      setFieldErrors(validationRes.errors!);
      return;
    }
    if (validationRes.ok) {
      onSubmitting();
      onSubmit(validationRes.value);
    }
  };

  function validateByMode(
    mode: Mode,
    data: Partial<FormAll>
  ): Ok<User | LoginUser> | Err<FieldErrors<FormAll>> {
    const e: FieldErrors<FormAll> = {};

    // if(mode==="login") non c'è niente da fare fa tutto il backend

    if (
      mode === "profilo-modifica" ||
      mode === "profilo-visualizza" ||
      mode === "signup"
    ) {
      if (!data.nome?.trim()) e.nome = "Il nome è obbligatorio";
      if (!data.cognome?.trim()) e.cognome = "Il cognome è obbligatorio";
      if (!data.mail?.trim()) e.mail = "L'email è obbligatoria";
      if (!data.sesso?.trim()) e.sesso = "Seleziona il genere";
      if (!data.cf?.trim()) e.cf = "Il codice fiscale è obbligatorio";

      if (!data.dataNascita) {
        e.dataNascita = "La data di nascita è obbligatoria";
      } else if (dayjs().diff(data.dataNascita, "year") < 18) {
        e.dataNascita = "Devi avere almeno 18 anni";
      }

      if (!data.password) e.password = "La password è obbligatoria";
      else if (
        !isStrongPassword(data.password, {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
      ) {
        e.password = "Min. 8 car., 1 maiusc., 1 numero, 1 simbolo";
      }
    }

    if (mode === "profilo-modifica" || mode === "signup") {
      if ((data.password ?? "") !== data.confirmPassword)
        e.confirmPassword = "Le password non coincidono";
    }

    if (mode === "profilo-modifica") {
      if (!data.oldPassword) {
        e.oldPassword = "Vecchia password obbligatoria";
      }
      if (data.oldPassword !== incomingUser?.password)
        e.oldPassword = "Vecchia password errata";
    }

    switch (mode) {
      case "signup": {
        return Object.keys(e).length
          ? { ok: false, errors: e }
          : { ok: true, value: formToUser(data) };
      }
      case "login": {
        return Object.keys(e).length
          ? { ok: false, errors: e }
          : { ok: true, value: formToLogginUser(data) };
      }
      case "profilo-modifica": {
        return Object.keys(e).length
          ? { ok: false, errors: e }
          : { ok: true, value: formToUser(data) };
      }
      case "profilo-visualizza":  // non penso che potrebbe mai partire un validate da profilo-visualizza
        return { ok: true, value: {} as any };
    }
  }

  const onInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target; //destrtrr, quelle prop ci sono in questo evento (in quasi tutti direi)
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const onSelect = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const navigaAccesso = (mode: "login" | "signup") => {
    navigateRotella(`/${mode}`, {
      message: mode === "signup" ? "Registrati..." : "Accedi...",
      replace: true,
    });
  };

  return (
    <Paper
      elevation={11}
      sx={{
        minWidth: "150px",
        width: "92%",
        p: { xs: 3, sm: 4 }, // padding (interno)
        borderRadius: 3, // angoli morbidi
        backdropFilter: "blur(2px)",
        bgcolor: "#4788c0ff",
        border: "1px solid",
        borderColor: "#bddffcff",
        position: "relative",
        zIndex: 10,
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: { xs: 2, sm: 3 }, fontWeight: 600, textAlign: "center" }}
        color="#191970"
      >
        {formSettings.formTitle.toUpperCase()}
      </Typography>

      {/* FORM */}
      <Box
        component="form"
        onSubmit={(e) => {
          // appoggia mouse su e per vedere il tipo se volevi passarlo ti serviva in handleSubmit
          e.preventDefault(); // evita il submit nativo sempre, o almeno nel ramo 'visualizza'

          handleSubmit();
        }}
      >
        {/*forse per passaggio modifica<-> visualizza un onToggle apposta ci stava invece di usare handleSubmit=>onSubmit */}
        <Stack
          spacing={{ xs: 2, sm: 2.5 }}
          sx={{
            alignItems: "center",
          }} /*allinea tutti i figli di questoi stack */
        >
          {formSettings.visible.includes("username") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Username"
              name="username"
              disabled={formSettings.locked?.includes("username")}
              value={formData.username ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onInput(e);
              }}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username ?? " "}
              fullWidth
            />
          )}

          {formSettings.visible.includes("nome") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Nome"
              name="nome"
              disabled={formSettings.locked?.includes("nome")}
              value={formData.nome ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onInput(e);
              }}
              error={!!fieldErrors.nome}
              helperText={fieldErrors.nome ?? " "}
              fullWidth
            />
          )}

          {/* onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{handleChange(e)}}  è necessario perchè il noistro handler prende due tipi di eventi e gli onChange lo vogliono specifico quindi mirroriamo così e via onChange={(e: React.ChangeEvent<HTMLInputElement>)=>{handleChange(e)}}. FORSE IL TOP ERA FARE DUE HANDLER. si poteva anche semplicemente scrivere ovunque handleChange as any e a quel punto per il typescript la firma andava bene ma mi sa che non è top */}
          {formSettings.visible.includes("cognome") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Cognome"
              name="cognome"
              disabled={formSettings.locked?.includes("cognome")}
              value={formData.cognome ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onInput(e);
              }}
              error={!!fieldErrors.cognome}
              helperText={fieldErrors.cognome ?? " "}
              fullWidth
            />
          )}

          {/*ALLA FINE provider MESSO DOVE VA MESSO, IN main.ts assieme ad altri provider: LocalizationProvider è un wrapper solo logico che attraverso l adapter fornito in questo caso da dayjs converte stirnghe in date di tipo Dayjs nel formato giusto a seconda della localizzazioone . ad esempio per questo l onChange del datapicker riesce a fornire un Dayjs */}
          {formSettings.visible.includes("dataNascita") && (
            <DatePicker // BISOGNA FORNIRGLI UN POSITION RELATIVE COSICCHè POSSA USARE POSITION ABSOLUTE BENE ("displayflex=>postionrelative=>e lui poi position absolute"). DataPicker dentro usa <Popper/> che ha position: absolute e z-index 1300. se un genitore ha overflow: hidden (come <Paper/> di default) o se metti anche solo un overflowX:hidden su una box esterna, non si sa più posizionare bene di default. magari va sotto il form
              label="Data di nascita"
              name="dataNascita"
              disabled={formSettings.locked?.includes("dataNascita")}
              value={formData.dataNascita ?? null}
              //il set della data lo chiamiamo qua per comodità ma si può fare handler apposta
              onChange={(newValue: Dayjs | null) => {
                setFormData((prev) => ({
                  ...prev,
                  dataNascita: newValue ?? undefined, 
                }));
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { bgcolor: "#c0dcf5ff", borderRadius: "6px" },
                  error: !!fieldErrors.dataNascita,
                  helperText: fieldErrors.dataNascita ?? " ",
                },
              }}
            />
          )}

          {formSettings.visible.includes("mail") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Email"
              name="mail"
              disabled={formSettings.locked?.includes("mail")}
              type="email"
              value={formData.mail ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onInput(e);
              }}
              error={!!fieldErrors.mail}
              helperText={fieldErrors.mail ?? " "}
              fullWidth
            />
          )}

          {formSettings.visible.includes("cf") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Codice Fiscale"
              name="cf"
              disabled={formSettings.locked?.includes("cf")}
              inputProps={{ maxLength: 16 }}
              value={formData.cf ?? ""}
              error={!!fieldErrors.cf}
              helperText={fieldErrors.cf ?? " "}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onInput(e);
              }}
              fullWidth
            />
          )}

          {formSettings.visible.includes("sesso") && (
            <FormControl
              fullWidth
              error={!!fieldErrors.sesso}
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
            >
              <InputLabel id="gender-label">Genere</InputLabel>
              <Select
                labelId="gender-label"
                label="Genere"
                name="sesso"
                disabled={formSettings.locked?.includes("sesso")}
                value={formData.sesso ?? ""}
                onChange={(e: SelectChangeEvent<string>) => onSelect(e)}
              >
                <MenuItem value="">
                  <em>Seleziona…</em>
                </MenuItem>
                <MenuItem value="maschio">Maschio</MenuItem>
                <MenuItem value="femmina">Femmina</MenuItem>
              </Select>
              <FormHelperText>{fieldErrors.sesso ?? " "}</FormHelperText>
            </FormControl>
          )}

          {/*OLD PASSWORD */}

          {formSettings.visible.includes("oldPassword") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Password"
              name="oldPassword"
              type={showOldPw ? "text" : "password"}
              disabled={formSettings.locked?.includes("oldPassword")}
              value={formData.oldPassword ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onInput(e);
              }}
              error={!!fieldErrors.oldPassword}
              helperText={fieldErrors.oldPassword ?? " "}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Mostra/Nascondi password"
                      onClick={() => setShowOldPw((v) => !v)}
                      edge="end"
                    >
                      {showOldPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* PASSWORD */}
          {formSettings.visible.includes("password") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Password"
              name="password"
              disabled={formSettings.locked?.includes("password")}
              type={showPw ? "text" : "password"}
              value={formData.password ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInput(e)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password ?? " "}
              fullWidth
              InputProps={
                !(formSettings.mode === "profilo-visualizza")
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            disabled={formSettings.locked?.includes("password")}
                            aria-label="Mostra/Nascondi password"
                            onClick={() => setShowPw((v) => !v)}
                            edge="end"
                          >
                            {showPw ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  : undefined
              }
            />
          )}

          {/* RIPETI PASSWORD */}
          {formSettings.visible.includes("confirmPassword") && (
            <TextField
              sx={{ bgcolor: "#c0dcf5ff", borderRadius: "6px" }}
              label="Ripeti password"
              name="confirmPassword"
              type={showPw2 ? "text" : "password"}
              disabled={formSettings.locked?.includes("confirmPassword")}
              value={formData.confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInput(e)}
              error={!!fieldErrors.confirmPassword}
              helperText={fieldErrors.confirmPassword ?? " "}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Mostra/Nascondi password"
                      onClick={() => setShowPw2((v) => !v)}
                      edge="end"
                    >
                      {showPw2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{
              alignSelf: "center",
              mt: 1,
              px: { xs: 4, sm: 6 },
              bgcolor: "#191970",
              color: "#87CEFA",
              fontSize: "1.5rem",
              borderRadius: "6px",
            }}
            fullWidth
          >
            {submitting ? "Caricamento" : formSettings.buttonText}
          </Button>

          {["login", "signup"].includes(formSettings.mode) && (
            <Button
              sx={{
                alignSelf: "center",
                mt: 1,
                px: { xs: 4, sm: 6 },
                bgcolor: "transparent",
                color: "black",
                fontSize: "1.0rem",
              }}
              type="button"
              onClick={() =>
                formSettings.mode === "login"
                  ? navigaAccesso("signup")
                  : navigaAccesso("login")
              }
            >
              {formSettings.mode === "login"
                ? "Non sei ancora registrato? Registrati"
                : "Sei già registrato? Accedi"}
            </Button>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}
