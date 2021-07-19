pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SlingBux is ERC20 {
    constructor(address _player1, address _player2) ERC20("SlingBux", "SB") {
        _mint(_player1, 100 * (10**18)); //Supply 100 SlingBux to player 1.
        _mint(_player2, 100 * (10**18)); //Supply 100 SlingBux to player 2.
    }
}
