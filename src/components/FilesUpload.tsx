import React from 'react';
import { useMachine } from '@xstate/react';
import { useState, useEffect, useCallback } from 'react';
import { Avatar, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Snackbar } from '@mui/material';
import { Typography, Button } from '@mui/material';
import { FormatListBulleted, CloudUploadOutlined, CheckCircle, FileCopy, Cancel } from '@mui/icons-material';
import { DropzoneOptions, useDropzone } from "react-dropzone";
import { uploadMachine } from '../uploadState';
import CircularProgressWithLabel from './CircularProgressWithLabel';

const FilesUpload: React.FC = () => {
  const [current, send] = useMachine(uploadMachine);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState('idle');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isDropzoneEnabled, setIsDropzoneEnabled] = useState(true);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setSelectedFiles(acceptedFiles);
      send({ type: "UPLOAD", files: Array.from(acceptedFiles) });
    }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    disabled: !isDropzoneEnabled,
  } as DropzoneOptions);

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setProgress(0);
    setState('idle');
    setOpen(false);
    setMessage("");
    setIsDropzoneEnabled(true);
    send({ type: 'RESET' });
  };

  useEffect(() => {
    if (state === "uploadingFile") setMessage("uploading files...");
    else if (state === "failed") setMessage("upload failed.");
    else if (state === "cancelled") setMessage("upload cancelled.");
    else if (state === "completed") setMessage("upload completed.");
    if (message) setOpen(true);
  }, [state]);

  useEffect(() => {
    if (!current.matches("idle")) setIsDropzoneEnabled(false);
    if (current.matches("uploadingFile")) setState("uploadingFile");
    else if (current.matches("failed")) setState("failed");
    else if (current.matches("cancelled")) setState("cancelled");
    else if (current.matches("completed")) setState("completed");
  }, [current]);

  useEffect(() => {
    setProgress(current.context.progress);
  }, [current.context.progress]);


  const action = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        close
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      />
    </React.Fragment>
  );
  const substrFileName = (fileName: string) => {
    if (fileName.length > 20) {
      const start = fileName.substring(0, 8);
      const end = fileName.substring(fileName.length - 9, fileName.length);
      fileName = `${start}...${end}`;
    }
    return fileName;
  }


  return (
    <div className="sub-container">
      <div className="dropzone" {...getRootProps()}>
        <input {...getInputProps()} />
        {!selectedFiles.length ? (
          <div className="dropzone-in">
            <CloudUploadOutlined className="large-icon-font" />
            <Typography variant="h4" mb={5}>
              Drag&Drop files here
            </Typography>
            <Typography variant="body2" mb={3}>
              or
            </Typography>
            <Button variant='contained'>
              Browse here
            </Button>
          </div>
        ) : (
          <div className="dropzone-in seleted">
            {current.matches("uploadingFile") ? (
              <>
                <Typography variant='body1'>Uploading file <span id="uploadLabel">{current.context.currentFileIndex + 1}</span><span> of {current.context.files.length}</span></Typography>
                <CircularProgressWithLabel value={progress} sx={{ marginBottom: 10 }} />
                <Button variant="outlined" onClick={() => { send({ type: 'CANCEL' }); }}>Cancel</Button>
              </>
            ) : (
              <FormatListBulleted className="large-icon-font" />
            )}
            {current.matches("failed") && <Button variant="outlined" onClick={() => send({ type: 'RETRY' })}>Retry</Button>}
            {(current.matches("cancelled") || current.matches("completed")) && <Button variant="outlined" onClick={handleReset}>RESET</Button>}
            <List component="nav" sx={{
              maxHeight: 150,
              overflowY: "scroll"
            }}
            >
              {selectedFiles.map((file: File, idx) => (
                <ListItem key={idx}
                  secondaryAction={
                    (current.matches("uploadingFile") && current.context.currentFileIndex == idx) ? <CircularProgress size={20} />
                      : (current.matches("uploadingFile") && current.context.currentFileIndex > idx || current.matches("completed")) ? <CheckCircle />
                        : (current.matches("failed") && current.context.currentFileIndex == idx) && <Cancel />
                  }
                >
                  <ListItemAvatar><Avatar sx={{ width: 30, height: 30 }}><FileCopy sx={{ fontSize: "1rem" }} /></Avatar> </ListItemAvatar>
                  <ListItemText primary={substrFileName(file.name)} />
                </ListItem>
              ))}
            </List>
          </div>
        )}
      </div>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={message}
        action={action}
      />
    </div>
  );
}

export default FilesUpload;
