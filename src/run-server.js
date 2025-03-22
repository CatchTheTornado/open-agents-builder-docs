import express from 'express';
import { handler as ssrHandler } from '../dist/server/entry.mjs';
import { exec } from 'child_process';

const app = express();
// Change this based on your astro.config.mjs, `base` option.
// They should match. The default value is "/".
const base = '/';
app.use(base, express.static('dist/client/'));
app.use(ssrHandler);

app.post('/github-webhook', (req, res) => {
    const script = `
        cd /home/openagentsbuilder-docs/open-agents-builder-docs
        pwd
        git pull
        npm install
        npm run build
        pm2 delete OpenAgentsBuilderDocs
        pm2 start "node ./src/run-server.js" --name OpenAgentsBuilderDocs
        pm2 reload all
    `;

    exec(script, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return res.status(500).send('Deployment failed');
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send('Deployment successful');
    });
});

app.listen(4321);