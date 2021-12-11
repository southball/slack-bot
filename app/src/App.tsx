import React from 'react';
import Editor from '@monaco-editor/react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const API_URL = (key: string) => `http://localhost:3000/api/${key}`;

function App() {
  const [optionName, setOptionName] = React.useState<string>('');
  const [value, setValue] = React.useState<string>('');

  const loadOption = async () => {
    if (optionName) {
      const request = await fetch(API_URL(optionName));
      const json = await request.json();
      setValue(JSON.stringify(json.data, null, 4))
    }
  };

  const saveOption = async () => {
    if (optionName) {
      try {
        console.log(value);
        const _object = JSON.parse(value);
        console.log(_object);
        await fetch(API_URL(optionName), {
          method: "POST",
          headers: {'Content-Type': 'application/json'},
          body: value
        })
      } catch (err) {
        alert("Invalid JSON!");
      }
    }
  };

  return (
    <Container
      sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
    >
      <Typography variant="h4">Settings Editor</Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Key</Typography>

        <Box sx={{ display: 'flex' }}>
          <TextField variant="standard" type="string" sx={{ flexGrow: 1 }} value={optionName} onChange={(event) => setOptionName(event.target.value)} />
          <Button variant="contained" sx={{ ml: 2 }} onClick={loadOption}>
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
            value={value}
            onChange={(newValue) => {
              if (typeof newValue === 'string') {
                setValue(newValue);
              }
            }}
            options={{
              minimap: {enabled:false}
            }}
          />
        </Box>
      </Box>

      <Box sx={{mt:2,display:"flex",justifyContent:"end"}}>
        <Button variant="contained" onClick={saveOption}>Save</Button>
      </Box>
    </Container>
  );
}

export default App;
