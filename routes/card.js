var express = require('express');
var router = express.Router();

const ipfsAPI = require('ipfs-api');

// Connecting to the ipfs network via infura gateway
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

const upload = require('../uploadMiddleware');

const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/02754071220c49e1b2bfeb1eb905af88')
const web3 = new Web3(provider)

const axios = require('axios');

const IPFS_URL = "https://ipfs.infura.io/ipfs/";

router.get('/:key', function (req, res, next) {
  const private_key = req.params.key;
  var account = web3.eth.accounts.privateKeyToAccount(private_key);
  console.log(account.address)
  var signature = web3.eth.accounts.sign('Lobsters', private_key);
  var recovered = web3.eth.accounts.recover(signature);

  if (recovered == account.address) {
    axios.get('http://api.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=YourApiKeyToken&address=' + account.address)
      .then(function (response) {
        console.log(response.data);
        if(response.data.result.length == 0) {
          res.render('upload', { private_key: private_key });
        } else {
          var tx1 = response.data.result[0];
          var fileUrl = IPFS_URL + 'QmRHDjZC6ZgkDwdKP2b2N984ckhhs2yKehLSz7NmeZv7Rn'
          res.render('view', { url: fileUrl });
        }
      })
      .catch(function (error) {
        console.log(error);
      })
  } else {
    res.render('message', { message: 'Invalid Signature' });
  }
});


/* GET home page. */
router.post('/:key', upload.single('image'), function (req, res, next) {
  
  const private_key = req.params.key;
  var account = web3.eth.accounts.privateKeyToAccount(private_key);    
  
  const buffer = req.file.buffer;
  ipfs.files.add(buffer, function (err, file) {
    if (err) {
      console.log(err);
    } else {
      var hash = file[0].hash;
      console.log(hash)
      
      const rawTransaction = {
        "from": account.address,
        "to": account.address,
        "gas": 50000
      };
      
      account.signTransaction(rawTransaction)
        .then(signedTx => web3.eth.sendSignedTransaction(signedTx.rawTransaction))
        .then(receipt => console.log("Transaction receipt: ", receipt))
        .catch(err => console.error(err));

      var fileUrl = IPFS_URL + hash
      res.render('view', { url: fileUrl });
    }
  });
});

module.exports = router;
