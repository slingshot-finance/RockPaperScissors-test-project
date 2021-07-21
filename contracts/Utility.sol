pragma solidity ^0.8.0;
import "./RPS.sol";

contract Utility {
    address[] public games;

    function getGameCount() public view returns (uint256) {
        return games.length;
    }

    function startGame(
        address payable _player2Address,
        uint256 _buyIn,
        address _tokenContract
    ) public payable returns (RPS gameContract) {
        RPS newGame = new RPS(
            msg.sender,
            _player2Address,
            _buyIn,
            _tokenContract
        );
        games.push(address(newGame));
        return RPS(newGame);
    }
}
