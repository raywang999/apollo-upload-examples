import { fileURLToPath } from 'url';
//import { ApolloServer } from 'apollo-server-koa';
import { ApolloServer } from 'apollo-server-express';
//import { graphqlUploadKoa } from 'graphql-upload';
import { graphqlUploadExpress } from 'graphql-upload';
//import Koa from 'koa';
import express from 'express';
import makeDir from 'make-dir';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import http from 'http';

import UPLOAD_DIRECTORY_URL from './config/UPLOAD_DIRECTORY_URL.mjs';
import schema from './schema/index.mjs';

/**
 * Starts the API server.
 */
async function startServer() {
  // Ensure the upload directory exists.
  await makeDir(fileURLToPath(UPLOAD_DIRECTORY_URL));

  // Required logic for integrating with Express
  // Check official docs at https://www.apollographql.com/docs/apollo-server/integrations/middleware/#apollo-server-express
  const app = new express();

  // Parse multipart-requests
  // For more on multipart-requests, check https://github.com/jaydenseric/graphql-multipart-request-spec#server 
  app.use(graphqlUploadExpress({
    maxFileSize: 10000000, // 10 MB
    maxFiles: 20,
  })); 
  //Set CORS headers to allow access from the frontend
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // More required logic for integrating with Express
  const httpServer = new http.createServer(app);
  const apolloServer = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  await apolloServer.start();

  //short for app.use(apolloServer.getMiddleware({path: '/'}))
  apolloServer.applyMiddleware({
    app,
    path: '/'
  });

  await new Promise(resolve => httpServer.listen({ port: process.env.PORT }, resolve));
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/${apolloServer.graphqlPath}`);
}

startServer();
