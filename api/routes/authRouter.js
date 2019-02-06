/////============ DEPENDENCIES ============/////////

const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, makeToken } = require('../../api/middleware/auth');
const router = express.Router();
const jwt = require('jsonwebtoken');
const imageParser = require('../../config/cloudinary');

const db = require('../../data/dbConfig');

const db1 = require('../../helpers/dbTippersHelpers'); // going to have to be excised
const db2 = require('../../helpers/dbTippeesHelpers'); // going to have to be excised
/////============ ROUTES ============/////////

router.get('/', (req, res) => {
  // we have to require email, we have to require a hashed password, we have to require a boolean

  /// sanity check, and dance check

  res.send('hopefully everyone is up in here, up in here.');
});

router.post('/login', (req, res) => {
  const creds = req.body;
  const { tipperBoolean } = req.body;
  console.log(creds);

  if (tipperBoolean) {
    db('tippers')
      .where({ email: creds.email })
      .first()
      .then(tipper => {
        if (tipper && bcrypt.compareSync(creds.password, tipper.password)) {
          const token = makeToken(tipper);
          res.status(200).json({
            message: `hey ${tipper.first_name}! Welcome to the great game.`,
            token
          });
        } else {
          res.status(401).json({
            you: 'Sorry buddy, no room for you here yet. Get registered.'
          });
        }
      })
      .catch(err => res.status(500).json(err));
  } else {
    db('tippees')
      .where({ email: creds.email })
      .first()
      .then(tippee => {
        if (tippee && bcrypt.compareSync(creds.password, tippee.password)) {
          const token = makeToken(tippee);
          res.status(200).json({
            message: `hey ${tippee.first_name}! Welcome to the great game.`,
            token
          });
        } else {
          res.status(401).json({
            you: 'Sorry buddy, no room for you here yet. Get registered.'
          });
        }
      })
      .catch(err => res.status(500).json(err));
  }
});

router.post('/register', imageParser.single('image'), (req, res) => {
  const { tipperBoolean, ...data } = req.body;
  const image = {};

  if (tipperBoolean) {
    const hash = bcrypt.hashSync(data.password, 8);

    data.password = hash;
    const token = makeToken(data);
    if (req.file) {
      data.photo_url = req.file.url;
      data.photo_public_id = req.file.public_id;
    }

    if (!data.first_name || !data.last_name || !data.email || !data.password) {
      res.status(400).json({
        errMessage:
          'Please add a first name, last name, and an email! Make a fake pass for now.'
      });
    }
    db1
      .insertTipperData(data)
      .then(id => {
        db1.getByTipperId(id[0]).then(data => {
          res.status(201).json({ ...data[0], token });
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  } else {
    const hash = bcrypt.hashSync(data.password, 8);

    data.password = hash;
    const token = makeToken(data);
    if (!data.first_name || !data.last_name || !data.email || !data.password) {
      res.status(400).json({
        errMessage:
          'Please add a first name, last name, and an email! Make a fake pass for now.'
      });
    }
    db2
      .insertTippeeData(data)
      .then(id => {
        db2.getByTippeeId(id[0]).then(data => {
          res.status(201).json({ ...data, token });
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  }
});

module.exports = router;
