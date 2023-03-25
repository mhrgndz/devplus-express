'use strict';

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import ResponseObject from './src/objects/ResponseObject.js';
import RequestHandler from './src/RequestHandler.js';
import ValidateRequest from './src/middleware/ValidateRequest.js';

const app = express();
const validate = new ValidateRequest();

app.use(express.json({limit: '50mb'}));
app.use(cors());
dotenv.config();

let validateResult;

app.post('/api/*', async (req, res, next) => {
    validateResult = await validate.validateRequest(req);

    if (validateResult.statusCode === 200){
        next('route');
    } 
    else{
        next();
    } 
  }, (req, res) => {
    res.send(new ResponseObject({}, validateResult.statusCode, validateResult.message));
});
  
app.post('/api/*', async (req, res) => {
    const reqHandler = new RequestHandler(req);
    res.send(await reqHandler.dispatch());
});

app.listen(process.env.PORT, "0.0.0.0");