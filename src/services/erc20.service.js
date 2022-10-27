const Web3 = require('web3');
const { Transaction } = require('@ethereumjs/tx');
const { Chain, Common, Hardfork } = require('@ethereumjs/common');
const BigNumber = require('bignumber.js');
const ERC20ContractABI = require('./erc20.abi.json');
const ERC20ContractAddress = require('./erc20.contract.json');

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_ENDPOINTS));

const convertWeiToEther = (wei) => web3.utils.fromWei(wei, 'ether');

const getContractAddress = (token, network) => ERC20ContractAddress[token][network];
const getContract = (contractAddress) => new web3.eth.Contract(ERC20ContractABI, contractAddress);

const fromWei = (balance, decimals) => new BigNumber(balance).shiftedBy(-decimals).toString();
const toWei = (balance, decimals) => new BigNumber(balance).shiftedBy(+decimals).toString();

exports.getNativeBalance = async (address) => convertWeiToEther(await web3.eth.getBalance(address));

exports.getTokenBalance = async (token, network, address) => {
  const contract = getContract(getContractAddress(token, network));
  const decimals = await contract.methods.decimals().call();
  const balance = await contract.methods.balanceOf(address).call();
  return fromWei(balance, decimals);
};

exports.faucet = async (token, network, address) => {
  const ownerAddress = process.env.OWNER_ADDRESS;
  const nonce = await web3.eth.getTransactionCount(ownerAddress, 'pending');
  const contract = getContract(getContractAddress(token, network));
  const decimals = await contract.methods.decimals().call();
  const amount = toWei(50, decimals);

  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = await web3.eth.estimateGas({
    from: ownerAddress,
    to: getContractAddress(token, network),
    nonce: web3.utils.toHex(nonce),
    data: contract.methods.transfer(address, web3.utils.toHex(amount)).encodeABI(),
  });

  const rawTransaction = {
    from: ownerAddress,
    to: getContractAddress(token, network),
    value: 0x0,
    nonce: web3.utils.toHex(nonce),
    gasPrice: web3.utils.toHex(Math.round(gasPrice * 1.2)),
    gasLimit: web3.utils.toHex(Math.round(gasLimit * 1.5)),
    data: contract.methods.transfer(address, web3.utils.toHex(amount)).encodeABI(),
  };

  const privateKey = Buffer.from(process.env.OWNER_PRIVATE_KEY.replace('0x', ''), 'hex');
  const common = new Common({ chain: Chain.Goerli, hardfork: Hardfork.London });
  const transaction = new Transaction(rawTransaction, { common });
  const signedTransaction = transaction.sign(privateKey);
  const serializedTransaction = signedTransaction.serialize();

  web3.eth.sendSignedTransaction(`0x${serializedTransaction.toString('hex')}`);

  return `0x${signedTransaction.hash().toString('hex')}`;
};
