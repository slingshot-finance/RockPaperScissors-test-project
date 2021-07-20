pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RPS {
    struct Player {
        address addr;
        bytes32 commit;
        string revealed;
    }
    struct Move {
        uint256 value;
        bool valid;
    }

    Player[2] public players;
    mapping(address => uint256) addressToID;

    IERC20 public SlingBux;

    mapping(string => Move) moves;

    uint256 public buyIn;

    bool public gameIsLive = true;
    address public winner;

    mapping(address => uint256) public balance;

    constructor(
        address _player2Address,
        uint256 _buyIn,
        address _tokenContract
    ) {
        moves["rock"] = Move({value: 0, valid: true});
        moves["paper"] = Move({value: 1, valid: true});
        moves["scissors"] = Move({value: 2, valid: true});
        players[0] = Player({addr: msg.sender, commit: "", revealed: ""});
        players[1] = Player({addr: _player2Address, commit: "", revealed: ""});
        buyIn = _buyIn;
        SlingBux = IERC20(_tokenContract);
        addressToID[msg.sender] = 0;
        addressToID[_player2Address] = 1;
    }

    modifier onlyPlayers() {
        require(msg.sender == players[0].addr || msg.sender == players[1].addr);
        _;
    }
    modifier readyToReveal() {
        require(
            (!isEmpty(players[0].commit) && !isEmpty(players[1].commit)),
            "Both players must commit."
        );
        require(gameIsLive, "Winner already selected.");
        _;
    }

    function isEmpty(bytes32 _bytes) internal pure returns (bool) {
        return (_bytes == "");
    }

    function isEmpty(string memory _string) internal pure returns (bool) {
        return (keccak256(abi.encodePacked(_string)) ==
            keccak256(abi.encodePacked("")));
    }

    function selectWinner() internal {
        if (!isEmpty(players[1].revealed) && !isEmpty(players[0].revealed)) {
            uint256 p1_move = moves[players[0].revealed].value;
            uint256 p2_move = moves[players[1].revealed].value;
            if (p1_move != p2_move) {
                winner = (p1_move == (p2_move + 1) % 3)
                    ? players[0].addr
                    : players[1].addr;
                balance[winner] = buyIn * 2;
            } else {
                balance[players[0].addr] = buyIn;
                balance[players[1].addr] = buyIn;
            }
            gameIsLive = false;
        }
    }

    function commitMove(bytes32 _move) public onlyPlayers {
        require(
            isEmpty(players[addressToID[msg.sender]].commit),
            "Already made a commitment"
        );
        require(
            SlingBux.allowance(msg.sender, address(this)) >= buyIn,
            "Allowed balance not sufficient for game deposit"
        );
        SlingBux.transferFrom(msg.sender, address(this), buyIn);
        players[addressToID[msg.sender]].commit = _move;
    }

    function revealMove(string memory _move, string memory _seed)
        public
        onlyPlayers
        readyToReveal
    {
        uint256 playerID = addressToID[msg.sender];
        require(
            keccak256(abi.encodePacked(_move, _seed)) ==
                players[playerID].commit,
            "Move doesn't match hash"
        );
        players[playerID].revealed = _move;
        if (!moves[_move].valid) {
            //Code executed when invalid move...
            gameIsLive = false;
            if (playerID == 0) {
                balance[players[1].addr] = 2 * buyIn;
                winner = players[1].addr;
            } else if (playerID == 1) {
                balance[players[0].addr] = 2 * buyIn;
                winner = players[0].addr;
            }
        } else {
            selectWinner();
        }
    }

    function withdraw() external {
        if (gameIsLive) {
            require(
                msg.sender == players[0].addr,
                "Only player 1 can withdraw early"
            );
            require(
                isEmpty(players[1].commit),
                "Player 2 has made a move, no early withdrawals."
            );

            SlingBux.transfer(players[0].addr, buyIn);
        } else {
            require(balance[msg.sender] > 0, "No balance to withdraw.");
            uint256 toSend = balance[msg.sender];
            balance[msg.sender] = 0;
            SlingBux.transfer(msg.sender, toSend);
        }
    }
}
