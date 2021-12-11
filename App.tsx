import React from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function App() {
  const [monaco, setMonaco] = React.useState<Monaco | undefined>(undefined);
  const [value, setValue] = React.useState<string>("");

  React.useEffect(() => {
    if (monaco) {
      monaco.editor.getModel()?.setValue(value);
    }
  }, [value]);

  return (
    <Container
      sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
    >
      <Typography variant="h4">Settings Editor</Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Key</Typography>

        <Box sx={{ display: 'flex' }}>
          <TextField variant="standard" type="string" sx={{ flexGrow: 1 }} />
          <Button variant="contained" sx={{ ml: 2 }}>
            Go
          </Button>
        </Box>
      </Box>

      <Box
        sx={{ mt: 2, flexGrow: 1, flexDirection: 'column', display: 'flex' }}
      >
        <Typography variant="h6">Editor</Typography>
        <Box sx={{ flexGrow: 1 }}>
          <Editor
            language="json"
            defaultValue="{}"
            height="100%"
            onMount={(_editor, monaco) => {
              setMonaco(monaco);
            }}
            onChange={(newValue) => {
              if (typeof newValue === "string" && newValue !== value) {
                setValue(newValue);
              }
            }}
          />
        </Box>
      </Box>
    </Container>
  );
}

export default App;
