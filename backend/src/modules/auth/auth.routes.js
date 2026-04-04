const router = require('express').Router();
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validator');
const controller = require('./auth.controller');

router.get('/registration-status',                                    controller.getRegistrationStatus);
router.post('/register',              validate(registerSchema),       controller.register);
router.post('/login',                 validate(loginSchema),          controller.login);
router.post('/logout',                auth,                           controller.logout);
router.post('/refresh-token',                                         controller.refreshToken);
router.get('/me',                     auth,                           controller.getMe);
router.post('/forgot-password',       validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema),  controller.resetPassword);

// First-login flow: verify code → set new password
router.post('/verify-code',    controller.verifyCode);
router.post('/set-password',   controller.setOwnPassword);

// Sessions
router.get('/sessions',        auth, controller.getSessions);
router.delete('/sessions/:id', auth, controller.deleteSession);

module.exports = router;
