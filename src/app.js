const fs = require('fs');
const path = require('path');
const {ApolloServer} = require('@apollo/server');
const {startStandaloneServer} = require('@apollo/server/standalone');
const {addMocksToSchema} = require("@graphql-tools/mock");
const {makeExecutableSchema} = require("@graphql-tools/schema");
const casual = require('casual');
const express = require('express');

function findFilesInDir(fileExt, dirPath) {
    const files = fs.readdirSync(dirPath);
    return files.filter(file => file.endsWith(fileExt));
}

function loadFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
}

const mocks = {
    Int: () => casual.integer(0, 100),
    Float: () => casual.double(0, 100),
    String: () => casual.sentence,
    Boolean: () => casual.coin_flip,
    ID: () => casual.uuid,
    Date: () => casual.date('YYYY-MM-DDTHH:mm:ss.sssZ'),
    DateTime: () => casual.date('YYYY-MM-DDTHH:mm:ss.sssZ'),
    Json: () => {
        const obj = {};
        for (let i = 0; i < casual.integer(1, 10); i++) {
            obj[casual.word] = casual.word;
        }
        return obj;
    }
};

// todo show landing page with all endpoints
// todo make mocks dynamic

async function main() {
    const SCHEMA_DIR_PATH = './src/schema';
    const graphqlFiles = findFilesInDir('.graphql', SCHEMA_DIR_PATH);
    const PORT_FROM = 4000;

    const app = express();

    let routes = [];
    app.get('/', (req, res) => {
        res.status(200).json(routes);
    });

    for (const [index, graphqlFile] of graphqlFiles.entries()) {
        const typeDefs = loadFile(path.join(SCHEMA_DIR_PATH, graphqlFile));
        const server = new ApolloServer({
            typeDefs,
            schema: addMocksToSchema({
                schema: makeExecutableSchema({typeDefs}),
                mocks
            }),
        });

        const {url} = await startStandaloneServer(server, {
            listen: {
                exclusive: true,
                port: PORT_FROM + index + 1
            },
        });

        console.log(`🚀 Server for "${graphqlFile}" ready at ${url}`);
        routes.push({name: graphqlFile, url});
    }

    app.listen(PORT_FROM, () => {
        console.log(`🚀 Main server started on port http://localhost:${PORT_FROM}/`);
    });
}

main().catch(console.error);
