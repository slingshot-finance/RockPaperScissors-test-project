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
    enum PossibleMoves {Default, Rock, Paper, Scissor}
    Match gameMatch;
    struct Match {
        address firstPlayer;
        address secondPlayer;
        PossibleMoves firstPlayerMove;
        PossibleMoves secondPlayerMove;
    }

    constructor(address _token) 
        ERC20(
            string(abi.encodePacked("RockPaperScissorsToken ", ERC20(_token).name()),
            string(abi.encodePacked(("RSP"), ERC20(_token).symbol())))
        )
    {
        token = IERC20(_token);
        governance = msg.sender;
        gameMatch = Match(address(0), address(0), PossibleMoves.Default, PossibleMoves.Default);
    }

    function setGovernance(address _governance) public {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setBid(uint256 _bid) external {
        require(msg.sender == governance, "!governance");
        // We can only set the bid if no one is playing a match
        require(gameMatch.firstPlayer == address(0) && gameMatch.secondPlayer == address(0), "You can only change the bid if no one is playing the game");
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

    // If the first Player decides not to wait for the second player to play the game, he/she can withdraw the funds
    function leaveGame() public {
        require(msg.sender == gameMatch.firstPlayer && gameMatch.secondPlayer == address(0), "You can't withdraw");

        uint256 balance = balanceOf(msg.sender);

        // Burn RockPaperScissorsToken from msg sender
        _burn(msg.sender, balance);

        // Transfer the Tokens from this smart contract to msg sender
        token.safeTransfer(msg.sender, balance); 
    }

    function play(uint8 _move, uint256 _amount) public isAllowedMove(_move) {
        deposit(_amount);
        // This is the First Player playing
        if (gameMatch.firstPlayer == address(0))
        {
            gameMatch.firstPlayer = msg.sender;
            gameMatch.firstPlayerMove = PossibleMoves(_move);
        }
        // The player can't play with himself or herself
        if (gameMatch.secondPlayer == address(0) && gameMatch.firstPlayer != msg.sender)
        {
            gameMatch.secondPlayer = msg.sender;
            gameMatch.secondPlayerMove = PossibleMoves(_move);
            gameLogic();
        }
    }

    function gameLogic() internal {
        if (gameMatch.firstPlayerMove == PossibleMoves.Rock && gameMatch.secondPlayerMove == PossibleMoves.Rock) {
            tie();
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Rock && gameMatch.secondPlayerMove == PossibleMoves.Paper) {
            // Player 1 looses
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Rock && gameMatch.secondPlayerMove == PossibleMoves.Scissor) {
            // Player 1 wins
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Paper && gameMatch.secondPlayerMove == PossibleMoves.Rock) {
            // Player 1 wins
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Paper && gameMatch.secondPlayerMove == PossibleMoves.Paper) {
            tie();
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Paper && gameMatch.secondPlayerMove == PossibleMoves.Scissor) {
            // Player 1 looses
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Scissor && gameMatch.secondPlayerMove == PossibleMoves.Rock) {
            // Player 1 looses
        }
        else if (gameMatch.firstPlayerMove == PossibleMoves.Scissor && gameMatch.secondPlayerMove == PossibleMoves.Paper) {
            // Player 1 looses
        }
        else /* gameMatch.firstPlayerMove == PossibleMoves.Scissor && gameMatch.secondPlayerMove == PossibleMoves.Scissor)*/ {
            tie();
        }
    }

    function winner(address _winner) internal {
        if (gameMatch.firstPlayer == _winner) {
            // Transfer all the bid to the first address and burn RPS tokens from the winner
            withdraw(token.balanceOf(address(this)), _winner);
            // Burn RPS tokens from the looser
            _burn(gameMatch.secondPlayer, bid);
        }
        else {
            // Transfer all the bid to the first address and burn RPS tokens from the winner
            withdraw(token.balanceOf(address(this)), _winner);
            // Burn RPS tokens from the looser
            _burn(gameMatch.firstPlayer, bid);
        }
    }

    function tie() internal {
        withdraw(bid, gameMatch.firstPlayer);
        withdraw(bid, gameMatch.secondPlayer);
    }

    function cleanMatch() internal {

    }

    function withdraw(uint256 _amount, address _address) internal {
        // Burn RockPaperScissorsToken from msg sender
        _burn(_address, _amount);

        // Transfer MyTokens from this smart contract to msg sender
        token.safeTransfer(_address, _amount); 
    }

    modifier isAllowedMove(uint8 _move)
    {
        require(_move == uint8(PossibleMoves.Rock) || _move == uint8(PossibleMoves.Paper) || _move == uint8(PossibleMoves.Scissor), "This move is invalid");
        _;
    }
}