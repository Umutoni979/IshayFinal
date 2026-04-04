const Joi = require('joi');

const id = Joi.string().uuid();

exports.createProduction = Joi.object({
  title:       Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow('', null),
  venue:       Joi.string().max(200).allow('', null),
  start_date:  Joi.date().iso().allow(null),
  end_date:    Joi.date().iso().min(Joi.ref('start_date')).allow(null),
  status:      Joi.string().valid('planning', 'active', 'completed', 'cancelled').default('planning'),
});

exports.updateProduction = Joi.object({
  title:       Joi.string().min(2).max(200),
  description: Joi.string().max(1000).allow('', null),
  venue:       Joi.string().max(200).allow('', null),
  start_date:  Joi.date().iso().allow(null),
  end_date:    Joi.date().iso().allow(null),
  status:      Joi.string().valid('planning', 'active', 'completed', 'cancelled'),
}).min(1);

exports.createMilestone = Joi.object({
  title:       Joi.string().min(2).max(200).required(),
  category:    Joi.string().valid('costumes', 'props', 'venue', 'performance', 'other').default('other'),
  status:      Joi.string().valid('pending', 'in_progress', 'completed').default('pending'),
  due_date:    Joi.date().iso().allow(null),
  notes:       Joi.string().max(500).allow('', null),
  order_index: Joi.number().integer().min(1).allow(null),
});

exports.updateMilestone = Joi.object({
  title:       Joi.string().min(2).max(200),
  category:    Joi.string().valid('costumes', 'props', 'venue', 'performance', 'other'),
  status:      Joi.string().valid('pending', 'in_progress', 'completed'),
  due_date:    Joi.date().iso().allow(null),
  notes:       Joi.string().max(500).allow('', null),
  order_index: Joi.number().integer().min(1),
}).min(1);

exports.createEvent = Joi.object({
  title:       Joi.string().min(2).max(200).required(),
  description: Joi.string().max(500).allow('', null),
  event_date:  Joi.date().iso().required(),
  event_time:  Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow(null),
  event_type:  Joi.string().valid('meeting', 'fitting', 'venue_visit', 'technical', 'dress_rehearsal', 'other').default('other'),
  status:      Joi.string().valid('scheduled', 'completed', 'cancelled').default('scheduled'),
});

exports.updateEvent = Joi.object({
  title:       Joi.string().min(2).max(200),
  description: Joi.string().max(500).allow('', null),
  event_date:  Joi.date().iso(),
  event_time:  Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow(null),
  event_type:  Joi.string().valid('meeting', 'fitting', 'venue_visit', 'technical', 'dress_rehearsal', 'other'),
  status:      Joi.string().valid('scheduled', 'completed', 'cancelled'),
}).min(1);

exports.savePerformanceReport = Joi.object({
  performance_date: Joi.date().iso().allow(null),
  venue:            Joi.string().max(200).allow('', null),
  audience_count:   Joi.number().integer().min(0).allow(null),
  summary:          Joi.string().max(2000).allow('', null),
  outcomes:         Joi.string().max(2000).allow('', null),
  observations:     Joi.string().max(2000).allow('', null),
});
