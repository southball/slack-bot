import React from 'react';
import Editor from '@monaco-editor/react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import * as APITypes from 'slack-bot-server/src/api/types';
import { NextPage } from 'next';

const API_URL = (key: string) => `${process.env.NEXT_PUBLIC_API_URL}/${key}`;

const Home: NextPage = () => {
  const [statusText, setStatusText] = React.useState<string>('');
  const [optionName, setOptionName] = React.useState<string>('');
  const [value, setValue] = React.useState<string>('');

  const loadOption = async () => {
    if (optionName) {
      const request = await fetch(API_URL(optionName));
      const json = (await request.json()) as APITypes.HTTPDataResponse<string>;
      if (json.success) {
        setValue(JSON.stringify(json.data, null, 4));
      } else {
        setStatusText(`Failed to fetch option ${optionName}: ${json.error}`);
      }
    } else {
      setStatusText('No option name is selected.');
    }
  };

  const saveOption = async () => {
    if (optionName) {
      try {
        console.log(value);
        const _object = JSON.parse(value);
        console.log(_object);
        const request = await fetch(API_URL(optionName), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: value,
        });
        const json = (await request.json()) as APITypes.HTTPSuccessResponse;
        if (json.success) {
          setStatusText(`Saved setting for ${optionName} successfully.`);
        }
      } catch (err) {
        alert('Invalid JSON!');
      }
    }
  };

  return (
    <Container
      sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
    >
      <Typography variant="h4">Settings Editor</Typography>

      {statusText && (
        <Box sx={{ mt: 2 }}>
          <Typography>{statusText}</Typography>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6">Key</Typography>

        <Box sx={{ display: 'flex' }}>
          <TextField
            variant="standard"
            type="string"
            sx={{ flexGrow: 1 }}
            value={optionName}
            onChange={(event) => setOptionName(event.target.value)}
          />
          <Button variant="contained" sx={{ ml: 2 }} onClick={loadOption}>
            Go
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2,
          height: '600px',
          flexDirection: 'column',
          display: 'flex',
        }}
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
              minimap: { enabled: false },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'end' }}>
        <Button variant="contained" onClick={saveOption}>
          Save
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
