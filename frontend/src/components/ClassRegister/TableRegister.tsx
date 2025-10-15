import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useRef } from "react";

import LessonRow from "./LessonRow";
import type { Lezione } from "../../models/Lezione";
import type { PageMode } from "../../models/PageMode";

type TableRegisterProps = {
  mode: PageMode;
  allStudentByCfSorted: Record<string, { nome?: string; cognome?: string }>;
  // dati
  lezioni: Lezione[];

  // “contesto di navigazione”
  editingLessonId?: number | null; // usata quando mode==="edit"  apri quella row in edit
  focusId?: number | null; // riga da aprire/scrollare (es. dopo save o da /:id/edit)

  // handler al livello pagina (ClassRegister)
  onEdit: (lezione: Lezione) => void;
  onCancelEdit: () => void;
  focusLessonId?: number; // scroll/focus quella row quando entri in lista
  onSave: (payload: {
    id?: number; // c'è in edit
    dataLezione: string;
    studenti: { cf: string; ore: number }[];
  }) => void;
  onDeleteLesson: (id: number) => void;

  onCreate: () => void;
  onReload: () => void;
};

export default function TableRegister({
  mode,
  lezioni,
  allStudentByCfSorted,
  editingLessonId,
  focusLessonId,
  onEdit,
  onCancelEdit,
  onSave,
  onDeleteLesson,
  onCreate,
  onReload,
}: TableRegisterProps) {
  // 2) provando a trovare best way to fare questo
  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({}); // contiene il ref di quella tipizzazione, non quella tipizzazione (mouuse hover leggi type). contiene ref a dom reale o anche a figlio con imperativeQualcosa (useImperativeHandle per fare cose ancora piu avanzate.. tipo ci definisci metodi dentro, nel figlio, e poi il padre li può usare da .current). quando comp su cui usi ref con ref= viene montato, in nomeRef.current trovi realmente un oggetto dom su cui pootrai fare operazioni. quando smontato, torna a null. ti permette quindi di fare cose  in altri posti e se te la studi bene anche in modo coordinato etc, una bomba. quandoi nodo smontato, .current torna a null
  // così il .current sarà un Record quindi .current[num] sarà una row.

  // l effect parte dopo che il dom è stato completato ( approfondire render, commit, effect (phases) ), quando ci sono già i riferimenti e quindi quando il record è stato completato nella map nel render di tutte le coppie chiave (idlezione) valore (riferimento nodo react, la row di quell iterazione)
  //mette on focus la riga giusta
  useEffect(() => {
    if (!focusLessonId) return;
    const el = rowRefs.current[focusLessonId];
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusLessonId]);

  // 3) modalità NEW: una sola riga, aperta
  if (mode === "new") {
    return (
      <Box>
        <TableContainer sx={{ border: "1px solid", borderRadius: "8px" }}>
          <Table aria-label="table-new">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Id Lezione</TableCell>
                <TableCell align="right">Data</TableCell>
                <TableCell align="right">
                  <Tooltip title="Ricarica elenco">
                    <IconButton size="small" onClick={onReload}>
                      ⟳
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* New: lezione undefined, row aperta */}
              <LessonRow
                mode="new"
                initialOpen
                allStudentByCfSorted={allStudentByCfSorted}
                onEdit={() => {}}
                onCancelEdit={onCancelEdit}
                onSave={onSave}
                onDeleteLesson={() => {}}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // 4) modalità VIEW/EDIT: lista
  return (
    <Box>
      <TableContainer sx={{ border: "1px solid", borderRadius: "8px" }}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Id Lezione</TableCell>
              <TableCell align="right">Data</TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <Tooltip title="Aggiungi nuova lezione">
                  <IconButton onClick={onCreate} size="small" sx={{ mr: 1 }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Ricarica elenco">
                  <IconButton size="small" onClick={onReload}>
                    ⟳
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {lezioni.map((lezione) => {
              const isEditingThis =
                mode === "edit" && lezione.id === editingLessonId;
              const shouldOpen =
                isEditingThis ||
                (focusLessonId && lezione.id === focusLessonId) ||
                false;

              return (
                <LessonRow
                  key={lezione.id}
                  ref={(el) => {
                    // el è l alias den nodo corrente (LessonRow di questa iterazione della map sopra.)
                    rowRefs.current[lezione.id] = el; //aggiungiamo al record chiave:questaLezioneId valore:il ref di questa row. "IL REF CHE PASSERO' A QUESTA ROW!!"
                  }}
                  mode={isEditingThis ? "edit" : "view"}
                  initialOpen={!!shouldOpen}
                  lezione={lezione}
                  allStudentByCfSorted={allStudentByCfSorted}
                  onEdit={onEdit}
                  onCancelEdit={onCancelEdit}
                  onSave={onSave}
                  onDeleteLesson={onDeleteLesson}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
