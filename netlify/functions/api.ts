import serverless from 'serverless-http';
import app from '../../artifacts/api-server/src/app';

module.exports.handler = serverless(app);
