const express = require('express');

const router = express.Router();

const { Erc20Service } = require('../services');

router.get('/native-balance', async (req, res, next) => {
  try {
    res.json({
      balance: await Erc20Service.getNativeBalance(process.env.OWNER_ADDRESS),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/token-balance', async (req, res, next) => {
  try {
    const { token, network } = req.query;
    res.json({
      balance: await Erc20Service.getTokenBalance(token, network, process.env.OWNER_ADDRESS),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/faucet', async (req, res, next) => {
  try {
    const { token, network, address } = req.body;
    res.json({ hash: await Erc20Service.faucet(token, network, address) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
