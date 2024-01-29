// FeedbackDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  DialogActions,
  Button,
} from "@mui/material";

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  feedbackMessage: string;
  userNote: string;
  setUserNote: React.Dispatch<React.SetStateAction<string>>;
  handleSaveUserNote: () => void;
};

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  onClose,
  feedbackMessage,
  userNote,
  setUserNote,
  handleSaveUserNote,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Session Feedback</DialogTitle>
      <DialogContent>
        <Typography>{feedbackMessage}</Typography>
        <TextField
          dir="rtl"
          autoFocus
          margin="dense"
          id="note"
          label="Note for Self"
          multiline
          rows={4}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
        <Button onClick={handleSaveUserNote} color="primary">
          Save Note
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;
