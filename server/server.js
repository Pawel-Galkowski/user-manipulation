/* eslint-disable no-console */
import Express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import Mongoose from 'mongoose';
import users from './routes/users.js';
import db from './config/keys.js';

const app = Express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

Mongoose
  .connect(db.mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.use('/users', users);

if (process.env.NODE_ENV === 'production') {
  app.use(Express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`Server running on port ${port}`));
