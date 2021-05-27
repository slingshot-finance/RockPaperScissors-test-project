// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RockPaperScissors is ERC20 {

    using Address for address;
    using SafeERC20 for IERC20;

    IERC20 public token;
    address public governance;
    uint256 public bid = 20_000_000_000_000_000_000;

    constructor(address _token) 
        ERC20("RockPaperScissorsToken", "RPS")
    {
        token = IERC20(_token);
        governance = msg.sender;
    }

    function setGovernance(address _governance) public {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setBid(uint256 _bid) external {
        require(msg.sender == governance, "!governance");
        bid = _bid;
    }

    function deposit(uint256 _amount) public {
        // Amount must be greater than zero
        require(_amount == bid, "amount must be equal to bid");

        // Transfer MyToken to smart contract
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Mint RockPaperScissorsToken to msg sender
        _mint(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) public {
        // Burn RockPaperScissorsToken from msg sender
        _burn(msg.sender, _amount);

        // Transfer MyTokens from this smart contract to msg sender
        token.safeTransfer(msg.sender, _amount);
    }

    function withdrawAll() external {
        withdraw(balanceOf(msg.sender));
    }
}