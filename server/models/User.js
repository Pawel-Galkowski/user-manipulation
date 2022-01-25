import Mongoose from 'mongoose';

const UserSchema = new Mongoose.Schema({
  email: {
    type: String,
  },
  password: {
    String,
  },
  confirmedKey: {
    type: String,
  },
  recoveryToken: {
    type: String,
  },
  avatar: {
    type: String,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
});

const User = Mongoose.model('users', UserSchema);

export default User;
