import express from 'express';
import { handler as ssrHandler } from '../dist/server/entry.mjs';
import { exec } from 'child_process';
import fs from 'fs';

const app = express();
// Change this based on your astro.config.mjs, `base` option.
// They should match. The default value is "/".
const base = '/';
app.use(base, express.static('dist/client/'));
app.use(ssrHandler);


let encoder = new TextEncoder();

async function verifySignature(secret, header, payload) {
    let parts = header.split("=");
    let sigHex = parts[1];

    console.log(`Signature: ${sigHex}`);


    let algorithm = { name: "HMAC", hash: { name: 'SHA-256' } };

    let keyBytes = encoder.encode(secret);
    let extractable = false;
    let key = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        algorithm,
        extractable,
        ["sign", "verify"],
    );

    let sigBytes = hexToBytes(sigHex);
    let dataBytes = encoder.encode(payload);

    console.log(dataBytes);
    let equal = await crypto.subtle.verify(
        algorithm.name,
        key,
        sigBytes,
        dataBytes,
    );

    return equal;
}

function hexToBytes(hex) {
    let len = hex.length / 2;
    let bytes = new Uint8Array(len);

    let index = 0;
    for (let i = 0; i < hex.length; i += 2) {
        let c = hex.slice(i, i + 2);
        let b = parseInt(c, 16);
        bytes[index] = b;
        index += 1;
    }

    return bytes;
}


app.post('/github-webhook', (req, res) => {
    const githubSecret = process.env.GITHUB_SECRET;

    let payload = '';

    req.on('data', chunk => {
        payload += chunk.toString();
    });

    req.on('end', () => {
        let header = req.headers['x-hub-signature-256'];
        let event = req.headers['x-github-event'];

        if (event !== 'push') {
            return res.status(400).send('Unsupported event');
        }

        if (!header) {
            return res.status(400).send('Missing signature');
        }

        if (!githubSecret) {
            return res.status(500).send('Missing secret');
        }

        console.log(`Payload: ${payload}`);

        verifySignature(githubSecret, header, payload).then((equal) => {
            if (!equal) {
                return res.status(400).send('Invalid signature');
            }

            const script = `
            cd /home/openagentsbuilder-docs/open-agents-builder-docs
            pwd
            git pull
            npm install
            npm run build
            /usr/local/bin/pm2 delete OpenAgentsBuilderDocs
            /usr/local/bin/pm2 start "node ./src/run-server.js" --name OpenAgentsBuilderDocs
            /usr/local/bin/pm2 reload all
        `;

            exec(script, (error, stdout, stderr) => {
                const logStream = fs.createWriteStream('deployments.log', { flags: 'a' });
                const logMessage = `Deployment at ${new Date().toISOString()}:\nstdout: ${stdout}\nstderr: ${stderr}\n\n`;

                if (error) {
                    console.error(`Error executing script: ${error}`);
                    logStream.write(`Error: ${error}\n${logMessage}`);
                    logStream.end();
                    return res.status(500).send('Deployment failed');
                }

                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                logStream.write(logMessage);
                logStream.end();
                res.send('Deployment successful');
            });

        });
    });

});

app.listen(4321);