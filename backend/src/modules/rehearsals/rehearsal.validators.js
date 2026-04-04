const Joi = require('joi');

exports.createRehearsal = Joi.object({
  production_id:   Joi.string().uuid().required(),
  title:           Joi.string().min(2).max(200).required(),
  date:            Joi.date().iso().required(),
  start_time:      Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  end_time:        Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
  location:        Joi.string().max(200).allow('', null),
  rehearsal_type:  Joi.string().valid('full', 'partial', 'technical', 'dress', 'other').default('full'),
  notes:           Joi.string().max(1000).allow('', null),
  checkin_closes_at: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow('', null),
  // recurrence
  recurrence:      Joi.string().valid('once', 'daily', 'weekly', 'monthly').default('once'),
  repeat_until:    Joi.date().iso().when('recurrence', { is: Joi.not('once'), then: Joi.required() }),
  days_of_week:    Joi.array().items(Joi.number().integer().min(0).max(6))
                     .when('recurrence', { is: 'weekly', then: Joi.array().min(1).required() }),
});

exports.updateRehearsal = Joi.object({
  production_id:   Joi.string().uuid(),
  title:           Joi.string().min(2).max(200),
  date:            Joi.date().iso(),
  start_time:      Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time:        Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/),
  location:        Joi.string().max(200).allow('', null),
  rehearsal_type:  Joi.string().valid('full', 'partial', 'technical', 'dress', 'other'),
  notes:           Joi.string().max(1000).allow('', null),
}).min(1);
