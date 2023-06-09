// import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { Container, Typography } from "@mui/material";

import FilesUpload from "./components/FilesUpload";

const App: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <div className="my-3">
        <Typography variant="h4">Welcome to</Typography>
        <Typography variant="h5" align="center">React Typescript Multiple Files Upload</Typography>
      </div>
      <FilesUpload />
    </Container>
  );
}

export default App;
