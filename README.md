# RockPaperScissors project

You will create a smart contract named `RockPaperScissors` whereby:  
Alice and Bob can play the classic game of rock, paper, scissors using ERC20 (of your choosing).    
  
- To enroll, each player needs to deposit the right token amount, possibly zero.  
- To play, each Bob and Alice need to submit their unique move.  
- The contract decides and rewards the winner with all token wagered.  

There are many ways to implement this, so we leave that up to you.  
  
## Stretch Goals
Nice to have, but not necessary.
- Make it a utility whereby any 2 people can decide to play against each other.  
- Reduce gas costs as much as possible.
- Let players bet their previous winnings.  
- How can you entice players to play, knowing that they may have their funds stuck in the contract if they face an uncooperative player?  
- Include any tests using Hardhat.
  

## Installation
Guide to getting the smart contract runing on your local environment
### Prerequisite
Ensure you have node.js installed on your system
## Installing
- Clone the repo
`git clone https://github.com/prince-curie/RockPaperScissors-test-project.git`
- Move into the folder `RockPaperScissors-test-project`
`cd RockPaperScissor-test-project`
- Install all packages in the `package.json` file.
`npm install`

## Compile Smart Contract
`npx hardhat compile`

## Test Smart Contract
`npx hardhat test`

## Further Updates 
- Host on the mainnet
