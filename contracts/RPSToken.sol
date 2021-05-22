pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RPSToken is ERC20 {
    constructor() public ERC20("RockPaperScissors Token", "RPS"){
        _mint(msg.sender, 1000000000000000000000000);
    }
}