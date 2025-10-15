import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import type { Studente } from "../../models/Studente";
import { Add, Delete, Edit } from "@mui/icons-material";
type DashboardTableProps = {
  studenti: Studente[] | undefined;
  onModify: (studente: Studente) => void;
  onCreate: () => void;
  onReload: () => void;
  onDelete: (studene: Studente) => void;
};

export default function DashboardTable({
  studenti,
  onModify,
  onDelete,
  onCreate,
}: DashboardTableProps) {
  if (!studenti) {
    return <div>Caricamento...</div>;
  }
  return (
    <>
      <Box>
        <TableContainer sx={{ border: "1px solid ", borderRadius: "8px" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Cognome</TableCell>
                <TableCell align="left">Nome</TableCell>
                <TableCell align="center">Data di nascita</TableCell>
                <TableCell align="center">Sesso</TableCell>
                <TableCell align="center">Codice fiscale</TableCell>
                <TableCell align="center">
                  <Tooltip title="Aggiungi studente">
                    <Button startIcon={<Add />} onClick={onCreate} />
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...(studenti ?? [])].map((studente) => (
                <TableRow key={studente.cf.toUpperCase()}>
                  <TableCell />
                  <TableCell>{studente.cognome}</TableCell>
                  <TableCell align="left">{studente.nome}</TableCell>
                  <TableCell align="center">{studente.dataNascita}</TableCell>
                  <TableCell align="center">{studente.sesso}</TableCell>
                  <TableCell align="center">{studente.cf}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Modifica">
                      <Button
                        startIcon={<Edit />}
                        onClick={() => onModify(studente)}
                      />
                    </Tooltip>
                    <Tooltip title="Elimina">
                      <Button
                        startIcon={<Delete />}
                        onClick={() => onDelete(studente)}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
}
