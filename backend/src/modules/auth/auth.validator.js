const Joi = require('joi');

const registerSchema = Joi.object({
  name:        Joi.string().min(2).max(100).required(),
  email:       Joi.string().email().required(),
  password:    Joi.string().min(6).required(),
  role:        Joi.string().valid('director', 'coordinator', 'actor', 'crew', 'guest').default('actor'),
  member_type: Joi.string().valid('actor', 'crew').allow(null),
  phone:       Joi.string().allow('', null),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).required(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
