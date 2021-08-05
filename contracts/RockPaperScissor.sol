// SPDX-License-Identifier: GPL-3.0
pragma solidity = 0.8.0;

/// @author Onwubiko Chibuike (prince-curie)
/// @title Rock Paper Scissor Game

contract RockPaperScissor {
    mapping(string => uint8) weapons;
    
    
    struct TournamentDetails {
        string name;
        address player1;
        address player2;
        uint256 amountToWager;
        address winner;
        uint256 player1Time;
        uint256 player2Time;
        uint256 totalWagered;
        string player1Weapon;
        string player2Weapon;
        bool draw;
        bool paid;
        bool cancelled;
        uint256 cancelledAt;
        address cancelledBy;
    }
    mapping(string => TournamentDetails) tournaments;
    
    mapping(string => mapping(string => string)) fightResults;
    
    mapping(address => uint256) public totalWins;
    
    event TournamentCreated(string tournamentName, uint256 amount);
    event Registered(address player, string tournamentName, uint256 amount);
    event Played(string tournamentName, string weapon, uint256 playTime);
    event Drew(string);
    event Won(address winner, uint256 totalWagered);
    event Paid(uint256 amountPaid);
    event Withdrew(address paymentReceiver, uint256 amountPaid, bool paymentStatus);
    event Cancelled(string tournamentName, address sender, uint256 cancelledAt);
    
    /// @dev sets up the necessary weapons for the game and how each
    /// weapon fare against the other
    constructor() {
        weapons['rock'] = 1;
        weapons['paper'] = 2;
        weapons['scissor'] = 3;
        
        fightResults['rock']['paper'] = 'paper';
        fightResults['rock']['scissor'] = 'rock';
        fightResults['paper']['rock'] = 'paper';
        fightResults['paper']['scissor'] = 'scissor';
        fightResults['scissor']['paper'] = 'scissor';
        fightResults['scissor']['rock'] = 'rock';
    }
    
    /// @dev checks if a tournament exist
    /// @param name The name of the tournament
    modifier existingTournament(string calldata name) {
        require(keccak256(abi.encodePacked(name)) == keccak256(abi.encodePacked(tournaments[name].name)), 'Tournament does not exist!');
        _;
    }

    /// @dev checks if a tournament is cancelled
    /// @param name The name of the tournament
    modifier isCancelled(string calldata name) {
        require(tournaments[name].cancelled == false, 'Tournament has been cancelled!');
        _;
    }
    
    /// @dev Creates a new tournament with tokens and registers the 
    // user who created the tournament as player1
    /// @param name The name of the tournament you want to create
    function createTournament(string calldata name) public payable {
        TournamentDetails memory tournament = tournaments[name];
        require(keccak256(abi.encodePacked('')) == keccak256(abi.encodePacked(tournament.name)), 'Tournament already exist!');

        tournaments[name] = TournamentDetails(name, msg.sender, address(0), msg.value, address(0), 0, 0, msg.value, '', '', false, false, false, 0, address(0));
        
        emit TournamentCreated(name, msg.value);
        
        emit Registered(msg.sender, name, msg.value);
    } 

    /// @dev Creates a new tournament and registers the user who created the tournament as player1
    /// @param name The name of the tournament you want to create
    /// @param stakeWinnings Use your previous wins for the new game
    function createTournament(string calldata name, bool stakeWinnings) public payable {
        TournamentDetails memory tournament = tournaments[name];
        require(keccak256(abi.encodePacked('')) == keccak256(abi.encodePacked(tournament.name)), 'Tournament already exist!');
        uint256 amount = msg.value;

        if(stakeWinnings == true) {
            require(totalWins[msg.sender] > 0, 'You have no winnings to stake');
            amount = totalWins[msg.sender];
            totalWins[msg.sender] = 0;
        }

        tournaments[name] = TournamentDetails(name, msg.sender, address(0), amount, address(0), 0, 0, amount, '', '', false, false, false, 0, address(0));
        
        emit TournamentCreated(name, amount);
        
        emit Registered(msg.sender, name, amount);
    } 
    
    /// @dev Returns details of a Tournament
    /// @param name The name of the tournament, whose details you are looking for.
    function getTournament(string calldata name) public view existingTournament(name) returns( TournamentDetails memory) {
        return tournaments[name];
    }
    
    /// @dev Registers the second player with no stakings
    /// @param name The name of the tournament the second player wants to register for.
    function registerPlayer2(string calldata name) public payable existingTournament(name) isCancelled(name) {
        require(tournaments[name].player1 == address(0) || tournaments[name].player2 == address(0), 'Tournament registration complete.');
        require(tournaments[name].player1 != msg.sender, 'You are registered for the tournament.');
        require(msg.value >= tournaments[name].amountToWager, 'Input the wagered amount');
        
        tournaments[name].player2 = msg.sender;
        tournaments[name].totalWagered += msg.value;
        
        emit Registered(msg.sender, name, msg.value);
    }

    /// @dev Registers the second player with stakings
    /// @param name The name of the tournament the second player wants to register for.
    /// @param stakeWinnings Use your previous wins for the new game
    function registerPlayer2(string calldata name, bool stakeWinnings) public payable existingTournament(name) isCancelled(name) {
        require(tournaments[name].player1 == address(0) || tournaments[name].player2 == address(0), 'Tournament registration complete.');
        require(tournaments[name].player1 != msg.sender, 'You are registered for the tournament.');
        
        uint256 amount = msg.value;
        if(stakeWinnings == true) {
            require(totalWins[msg.sender] > 0, 'You have no winnings to stake');
            amount = totalWins[msg.sender];
            totalWins[msg.sender] = 0;
        } 
            
        require(amount >= tournaments[name].amountToWager, 'You have less than the wagered amount');
        
        tournaments[name].player2 = msg.sender;
        tournaments[name].totalWagered += tournaments[name].amountToWager;
        totalWins[msg.sender] = amount - tournaments[name].amountToWager;

        emit Registered(msg.sender, name, amount);
    }
    
    /// @dev Controlls the plying of the game
    /// @param weapon The weapon the player wants to use in the game
    /// @param name The name of the tournament the player wants to play
    /// @param time The time the player plays the game
    function play(string calldata weapon, string calldata name, uint256 time) public existingTournament(name) isCancelled(name) {
        require(weapons[weapon] != 0, 'Invalid weapon');

        TournamentDetails storage tournament = tournaments[name];

        require(tournament.winner == address(0) && tournament.draw == false, 'Tournament is over!');
        require(tournament.player1 == msg.sender || tournament.player2 == msg.sender, 'You are not eligible for this tournament');
        
        if(tournament.player1 == msg.sender) {
            require(keccak256(abi.encodePacked(tournament.player1Weapon)) == keccak256(abi.encodePacked('')), 'Currently awaiting the tournament result');
            tournament.player1Weapon = weapon;
            tournament.player1Time = time;
        } else {
            require(keccak256(abi.encodePacked(tournament.player2Weapon)) == keccak256(abi.encodePacked('')), 'Currently awaiting the tournament result');
            tournament.player2Weapon = weapon;
            tournament.player2Time = time;
        }
        
        emit Played(name, weapon, time);
        
        if(tournament.player1Time != 0 && tournament.player2Time != 0) {
            computeWinner(tournament);
            
            if(!tournament.paid) {
                if(tournament.totalWagered > 0 wei) {
                    pay(tournament);
                }
            }
        }
    }
    
    /// @dev Finds the winner based on the time difference between when the two players play
    /// @param tournament The details of a particular tournament
    /// @return address The address of a winner or if no winner the 0 address
    function computeWinnerWithTime(TournamentDetails storage tournament) internal view returns(address) {
        if(tournament.player1Time != tournament.player2Time) {
            if(tournament.player1Time < tournament.player2Time && (tournament.player2Time - tournament.player1Time) > 15) {
                return tournament.player1;
            }
            
            if(tournament.player2Time < tournament.player1Time && (tournament.player1Time - tournament.player2Time) > 15) {
                return tournament.player2;
            }
        }
        
        return address(0);
    }
    
    /// @dev Finds the tournament winner if the computeWinnerWithTime based on the weapon of choice
    /// @param tournament The details of a tournament
    /// @return address The address of the winner
    function computeWinnerByWeapon(TournamentDetails storage tournament) internal view returns(address) {
        string memory fightResult = fightResults[tournament.player1Weapon][tournament.player2Weapon];
        
        if(keccak256(abi.encodePacked(fightResult)) == keccak256(abi.encodePacked(tournament.player1Weapon))) {
            return tournament.player1; 
        } else { return tournament.player2; }
    }
    
    /// @dev Finds the tournament winner by finding calling the computeWinnerWithTime and computeWinnerByWeapon function
    /// @param tournament The details of a tournament
    function computeWinner(TournamentDetails storage tournament) internal {
        if(keccak256(abi.encodePacked(tournament.player1Weapon)) == keccak256(abi.encodePacked(tournament.player2Weapon))) {
            tournament.winner = computeWinnerWithTime(tournament);
            if(tournament.winner == address(0)) {
                tournament.draw = true;
            
                emit Drew('The game ended in a draw');
            } else {
                emit Won(tournament.winner, tournament.totalWagered);
            }

        } else {
            tournament.winner = computeWinnerWithTime(tournament);

            if(tournament.winner == address(0)){
                tournament.winner = computeWinnerByWeapon(tournament);
            }

            emit Won(tournament.winner, tournament.totalWagered);    
        }
    }
    
    /// @dev Credits those deserving of it whether it ends in a win or draw
    /// @param tournament The details of the tournament
    function pay(TournamentDetails storage tournament) internal {
        tournament.paid = true;
        
        if(tournament.winner != address(0)) {
            totalWins[tournament.winner] += tournament.totalWagered;
        } else if(tournament.draw) {
            totalWins[tournament.player1] += tournament.amountToWager;
            totalWins[tournament.player2] += tournament.amountToWager;
        }
        
        emit Paid(tournament.totalWagered);
    }
    
    /// @dev Players withdraw the funds to there wallet
    /// @param amount The amount to be withdrawn
    function withdraw(uint256 amount) public {
        require(amount <= totalWins[msg.sender], 'Insufficient balance'); 
        
        totalWins[msg.sender] -= amount;
        
        bool isSent = payable(msg.sender).send(amount);
        
        require(isSent, 'Transaction failed'); 
            
        Withdrew(msg.sender, amount, isSent);
    }

    /// @dev Players can choose to cancel a tournament
    /// @param name The name of the tournament to be cancelled
    /// @param cancelledAt The time the cancell request was sent in
    function cancel(string calldata name, uint256 cancelledAt) public existingTournament(name) isCancelled(name) {
        TournamentDetails storage tournament = tournaments[name];

        require(tournament.amountToWager > 0, 'You can not cancel there is nothing to loose'); 
        
        if((tournament.player1 != address(0)) && (tournament.player2 != address(0))) {
            if(msg.sender == tournament.player1 && tournament.player2Time == 0) {
                cancelAction(tournament, cancelledAt, msg.sender);
            } else if(msg.sender == tournament.player2 && tournament.player1Time == 0) {
                cancelAction(tournament, cancelledAt, msg.sender);
            }
        } else if(tournament.player1 == msg.sender) {
            cancelAction(tournament, cancelledAt, msg.sender);
        } else {
            revert('Please you cannot cancel the game');
        }
    }

    /// @dev handles cancelling and refunds
    /// @param tournament The tournament details
    function cancelAction(TournamentDetails storage tournament, uint256 cancelledAt, address sender ) internal {
        tournament.cancelled = true;
        tournament.cancelledAt = cancelledAt;
        tournament.cancelledBy = sender;

        if(tournament.totalWagered > tournament.amountToWager) {
            totalWins[tournament.player2] += tournament.amountToWager;
            totalWins[tournament.player1] += tournament.amountToWager;
        } else if (tournament.totalWagered == tournament.amountToWager) {
            totalWins[tournament.player1] += tournament.amountToWager;
        }

        emit Cancelled(tournament.name, sender, cancelledAt);
    }
}
