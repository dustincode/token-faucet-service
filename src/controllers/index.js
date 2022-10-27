const express = require('express');

const erc20 = require('./erc20.controller');

const router = express.Router();

router.use('/erc20', erc20);

module.exports = router;
