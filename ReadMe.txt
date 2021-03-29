Deploy steps:-

Add private key, infura key and etherscan key inside all truffle files(truffle_config_v4, truffle_config_v5, truffle_config_v6)

- npm install
- truffle compile --config ./truffle_config_v4.js
- truffle compile --config ./truffle_config_v5.js
- truffle compile --config ./truffle_config_v6.js
- truffle migrate --network kovan --config ./truffle_config_v6.js