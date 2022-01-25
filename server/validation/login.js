import Validator from 'validator';
import isEmpty from './is-empty.js';

export default function validateLoginImput(data) {
  const errors = {};
  const { email, password } = data;

  const resEmail = !isEmpty(email) ? email : '';
  const resPassword = !isEmpty(password) ? password : '';

  if (!Validator.isEmpty(resEmail)) {
    errors.email = 'Email is invalid';
  }
  if (Validator.isEmpty(resEmail)) {
    errors.email = 'Email is required';
  }
  if (!Validator.isEmpty(resPassword)) {
    errors.password = 'Password is invalid';
  }
  if (Validator.isEmpty(resPassword)) {
    errors.password = 'Password is required ';
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
}
