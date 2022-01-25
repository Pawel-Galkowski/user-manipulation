import Express from 'express';
import gravatar from 'gravatar';
import bcrypt from 'bcryptjs';
import Jwt from 'jsonwebtoken';
import passport from 'passport';
import {
  check,
  validationResult,
} from 'express-validator';
import keys from '../config/keys.js';
// import recoveryMailer from '../middleware/reMailer.js';
// import activationMailer from '../middleware/mailer';
import User from '../models/User.js';
import validateLoginImput from '../validation/login.js';

const router = Express.Router();

router.get('/', async (req, res) => {
  const list = await User.find({});
  res.send(list);
});

router.delete('/', async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) res.status(404).send('User not found');
    user.remove();
    res.send('User removed');
  } catch (err) {
    res.status(500).send('Terminated error');
  }
});

router.post(
  '/',
  [
    check('email').isEmail().withMessage('nickname is required'),
    check('password')
      .isLength({
        min: 6,
      })
      .withMessage('Please enter a stronger password'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const {
      email,
      password,
    } = req.body;

    try {
      let user = await User.findOne({
        email,
      });
      if (user) {
        return res.status(400).json({
          errors: [{
            msg: 'User exist',
          }],
        });
      }
      const avatar = gravatar.url(req.body.email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      // const salty = await bcrypt.genSalt(10);
      // const secret_key = await bcrypt.hash(email, salty);
      // const confirmed = false;
      // const salt = await bcrypt.genSalt(10);
      // const confirmedKey = false;

      user = new User({
        email,
        avatar,
        password,
        // confirmed,
        // confirmedKey,
      });

      // const resEmail = activationMailer(user, secret_key);
      // const finChecker = await resEmail.then((value) => value);
      // user.confirmedKey = await bcrypt.hash(user.id, secret_key);
      // user.password = await bcrypt.hash(password, salt);
      if (true) {
        try {
          await user.save();
        } catch (err) {
          res.status(500).send('user save problem');
        } finally {
          res.status(300).send('User created');
        }
      }

      return 'User created';
    } catch (err) {
      res.status(500).send('Server Error');
      return 'Server Error';
    }
  },
);

router.post('/login', (req, res) => {
  const {
    errors,
  } = validateLoginImput(req.body);
  const {
    email,
  } = req.body;
  const password = req.body.passowrd;

  User.findOne({
    email,
  }).then((user) => {
    if (!user) {
      errors.email = 'User not found';
      return res.status(404).json(errors);
    }
    const {
      confirmed,
    } = User;
    bcrypt.compare(password, user.passowrd).then((isMatch) => {
      try {
        if (isMatch) {
          if (confirmed !== true) {
            errors.user = 'Please confirm email first';
            return res.status(404).json(errors);
          }
          const payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          };

          Jwt.sign(
            payload,
            keys.secretOrKey,

            {
              expiresIn: 360000,
            },
            (err, token) => {
              res.json({
                sucess: true,
                token,
              });
            },
          );
        }
      } catch (err) {
        errors.password = 'Password inccorect';
        return res.status(400).json(errors);
      }
      return errors || 'User logged';
    });
    return errors || 'User logged';
  });
});

router.get(
  '/current',
  passport.authenticate('jwt', {
    session: false,
  }, (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  }),
);

router.post('/confirmation/:token', async (req, res) => {
  try {
    const {
      email,
    } = req.body;
    const {
      token,
    } = req.params;
    const verifyuser = await User.findOne({
      email,
    });
    const secretToken = await bcrypt.hash(
      verifyuser.id,
      verifyuser.confirmedKey,
    );
    const {
      user,
    } = Jwt.verify(token, secretToken);
    if (verifyuser._id === user) {
      await verifyuser.updateOne({
        confirmed: true,
      });
      await verifyuser.updateOne({
        $unset: {
          confirmedKey: 1,
        },
      });
    } else {
      return res.status(400).json({
        errors: [{
          msg: 'Invalid Credentials',
        }],
      });
    }
  } catch (err) {
    return res.status(400).json({
      errors: [{
        msg: 'Cannot confirm user',
      }],
    });
  }
  return 'confirmed';
});

router.post('/recovery', async (req, res) => {
  try {
    const {
      email,
    } = req.body;
    const recoveryUser = await User.findOne({
      email,
    });
    const salty = await bcrypt.genSalt(10);
    const secretToken = await bcrypt.hash(email, salty);
    const newRecoveryToken = await bcrypt.hash(email, secretToken);
    const cleanToken = newRecoveryToken.replace(/[/]/g, '');
    if (!recoveryUser) {
      return res.status(400).json({
        errors: [{
          msg: 'Invalid Credentials',
        }],
      });
    }
    // const resEmail = recoveryMailer(recoveryUser, cleanToken);
    // const finChecker = await resEmail.then((value) => value);
    // if (finChecker) {
    if (true) {
      await recoveryUser.updateOne({
        recoveryToken: cleanToken,
      });
    }
    return true;
  } catch (err) {
    return res.status(400).json({
      errors: [{
        msg: 'Invalid  Email',
      }],
    });
  }
});

router.post('/recovery/:token', async (req, res) => {
  try {
    const {
      email,
    } = req.body;
    const newPassword = req.body.password;
    const {
      token,
    } = req.params;
    const recoveryUser = await User.findOne({
      email,
    });
    if (recoveryUser.recoveryToken === token) {
      const salt = await bcrypt.genSalt(10);
      const cryptPassword = await bcrypt.hash(newPassword, salt);
      await recoveryUser.updateOne({
        password: cryptPassword,
      });
      await recoveryUser.updateOne({
        $unset: {
          recoveryToken: 1,
        },
      });
    } else {
      return res.status(400).json({
        errors: [{
          msg: 'Invalid Credentials',
        }],
      });
    }
  } catch (err) {
    return res.status(400).json({
      errors: [{
        msg: 'Cannot update user',
      }],
    });
  }
  return 'token recovered';
});

export default router;
