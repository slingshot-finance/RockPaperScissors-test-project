# RockPaperScissors test project: Job application project for Slingshot.

My implementation leverages the "commit & reveal" pattern with the keccak256 hashing algorithm; this is essential for turn-based on-chain games to prevent players from peeping eachothers amswers.

The front-end (pending implementation) will need to encode players inputs with the hashing algorithm using user-defined "seed phrase" before proposing the commit transaction to MetaMask.

##The original brief provided for the job application can be found below.

You will create a smart contract named `RockPaperScissors` whereby:  
Alice and Bob can play the classic game of rock, paper, scissors using ERC20 (of your choosing).    
  
- To enroll, each player needs to deposit the right token amount, possibly zero. ✅ 
- To play, each Bob and Alice need to submit their unique move. ✅
- The contract decides and rewards the winner with all token wagered. ✅

There are many ways to implement this, so we leave that up to you.  
  
## Stretch Goals
Nice to have, but not necessary.
- Make it a utility whereby any 2 people can decide to play against each other. 🕒
- Reduce gas costs as much as possible.  🕒
- Let players bet their previous winnings. 🕒
- How can you entice players to play, knowing that they may have their funds stuck in the contract if they face an uncooperative player? ✅
- Include any tests using Hardhat. ✅
  
Now fork this repo and do it!
  
When you're done, please send an email to zak@slingshot.finance (if you're not applying through Homerun) with a link to your fork or join the [Slingshot Discord channel](https://discord.gg/JNUnqYjwmV) and let us know.  
  
Happy hacking!
