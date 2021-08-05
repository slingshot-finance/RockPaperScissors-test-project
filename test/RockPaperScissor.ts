import truffleAssert from 'truffle-assertions';
import { artifacts, web3 } from 'hardhat';
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { expect } from 'chai';

const RockPaperScissor = artifacts.require("RockPaperScissor");

describe("RockPaperScissor", () => {
    let accounts: string[];
    let player1: string;
    let player2: string; 
    let player3: string;
    let player4: string;
    let invalidWeapon: string = 'stone';
    let time: number = Math.floor(new Date().getTime()/1000);
    const rock: string = 'rock';
    const scissor: string = 'scissor';
    const paper: string = 'paper';

    beforeEach(async () => {
        accounts = await web3.eth.getAccounts();
        player1 = accounts[0];
        player2 = accounts[1];
        player3 = accounts[2];
        player4 = accounts[3];
    })

    describe('Create Tournament Test', () => {
        it('should create a new tournament with no cash', async() => {
            const rockPaperScissor: any = await RockPaperScissor.new();
            let name: string = 'new';

            const result: any = await rockPaperScissor.createTournament(name);

            const tournamentDetails: any = await rockPaperScissor.getTournament.call(name);

            truffleAssert.eventEmitted(result, 'TournamentCreated', (ev: any) => {
                return ev.tournamentName == name && ev.amount == 0
            });

            truffleAssert.eventEmitted(result, 'Registered', (ev: any) => {
                return ev.player == player1 && ev.amount == 0 && ev.tournamentName == name
            });

            assert.equal(name, tournamentDetails.name)
            assert.equal(player1, tournamentDetails.player1)
            assert.equal(0, tournamentDetails.amountToWager)
        })

        it('should create a new tournament with cash', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther: string = web3.utils.toWei(amount, 'ether');

            const result = await rockPaperScissor.createTournament(name, {value: amountInEther, from: player2});

            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            truffleAssert.eventEmitted(result, 'TournamentCreated', (ev: any) => {
                return ev.tournamentName == name && ev.amount == amountInEther
            });

            truffleAssert.eventEmitted(result, 'Registered', (ev: any) => {
                return ev.player == player2 && ev.amount == amountInEther && ev.tournamentName == name
            });

            assert.equal(name, tournamentDetails.name)
            assert.equal(player2, tournamentDetails.player1)
            assert.equal(amountInEther, tournamentDetails.amountToWager)
        })

        it('should revert if an existing tournament is created again', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            
            let name = 'new';
            
            const result = await rockPaperScissor.createTournament(name);

            await truffleAssert.fails(rockPaperScissor.createTournament(name), 'revert', 'Tournament already exist!');
        })
    })

    describe('Register Player Two Test', () => {
        it('should register the second player', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'new';

            await rockPaperScissor.createTournament(name);
            const result = await rockPaperScissor.registerPlayer2(name, {'from': player3});

            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            truffleAssert.eventEmitted(result, 'Registered', (ev: any) => {
                return ev.player == player3 && ev.amount == 0 && ev.tournamentName == name
            });

            assert.equal(name, tournamentDetails.name)
            assert.equal(player3, tournamentDetails.player2)
            assert.equal(0, tournamentDetails.amountToWager)
        })

        it('should register the second player with cash', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            const result = await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            truffleAssert.eventEmitted(result, 'Registered', (ev: any) => {
                return ev.player == player4 && ev.amount == amountInEther && ev.tournamentName == name
            });

            assert.equal(name, tournamentDetails.name)
            assert.equal(player4, tournamentDetails.player2)
            assert.equal(amountInEther, tournamentDetails.amountToWager)
            assert.equal((Number(amountInEther) * 2), tournamentDetails.totalWagered)
        })

        it('should revert an already registered player', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await truffleAssert.fails(rockPaperScissor.registerPlayer2(name, {'from': player3, value: amountInEther}), 'revert', 'You are registered for the tournament.');
        })

        it('should revert if registration is complete', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {value: amountInEther, from: player4});

            await truffleAssert.fails(rockPaperScissor.registerPlayer2(name, {'from': player2, value: amountInEther}), 'revert', 'Tournament registration complete.');
        })

        it('should revert if user is not paying required amount', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await truffleAssert.fails(rockPaperScissor.registerPlayer2(name, {from: player2}), 'revert', 'Input the wagered amount');
        })

        it('should revert if tournament does not exist', async() => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            
            await truffleAssert.fails(rockPaperScissor.registerPlayer2(name, {from: player2}), 'revert', 'Tournament does not exist!');
        })
    })

    describe('Play Tournament Test', () => {
        it('should return error for invalid weapon', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await truffleAssert.fails(rockPaperScissor.play(invalidWeapon, name, time), 'revert', 'Invalid weapon')
        })

        it('should revert if a none registered player tries to play', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await truffleAssert.fails(rockPaperScissor.play(rock, name, time, {from: player1}), 'revert', 'You are not eligible for this tournament');
        })

        it('should play successfully for first player', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            let result = await rockPaperScissor.play(rock, name, time, {from: player4})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Played', (ev: any) => {
                return ev.tournamentName == name && ev.weapon == rock && ev.playTime == time
            });

            assert.equal(name, tournamentDetails.name)
            assert.equal(rock, tournamentDetails.player2Weapon)
            assert.equal(time, tournamentDetails.player2Time)
        })

        it('should return draw', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(rock, name, time, {from: player4})
            const result = await rockPaperScissor.play(rock, name, time, {from: player3})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Played', (ev: any) => {
                return ev.tournamentName == name && ev.weapon == rock && ev.playTime == time
            });

            await truffleAssert.eventEmitted(result , 'Drew');

            assert.equal(name, tournamentDetails.name)
            assert.equal(rock, tournamentDetails.player2Weapon)
            assert.equal(time, tournamentDetails.player2Time)
            assert.equal(true, tournamentDetails.draw)
        })

        it('should return winner based on time difference with different weapon', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(rock, name, time, {from: player4})
            const result = await rockPaperScissor.play(paper, name, time + 20, {from: player3})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Won', (ev: any) => {
                return tournamentDetails.winner == player3, tournamentDetails.totalWagered == Number(amountInEther) * 2
            });

            assert.equal(name, tournamentDetails.name)
            assert.equal(rock, tournamentDetails.player2Weapon)
            assert.equal(time, tournamentDetails.player2Time)
            assert.equal(player4, tournamentDetails.winner)
        })

        it('should return winner based on time difference with same weapon', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(rock, name, time, {from: player3})
            const result = await rockPaperScissor.play(rock, name, time + 20, {from: player4})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Won', (ev: any) => {
                return tournamentDetails.winner == player3, tournamentDetails.totalWagered == Number(amountInEther) * 2
            });

            assert.equal(player3, tournamentDetails.winner)
        })

        it('should return winner based on different weapon', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(rock, name, time, {from: player3})
            const result = await rockPaperScissor.play(paper, name, time + 10, {from: player4})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Won', (ev: any) => {
                return tournamentDetails.winner == player4, tournamentDetails.totalWagered == Number(amountInEther) * 2
            });

            assert.equal(player4, tournamentDetails.winner)
        })

        it('should that winner got paid', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(rock, name, time, {from: player3})
            const result = await rockPaperScissor.play(scissor, name, time + 10, {from: player4})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);
            const amountPaid = await rockPaperScissor.totalWins(player3);

            await truffleAssert.eventEmitted(result , 'Paid', (ev: any) => {
                return tournamentDetails.totalWagered == ev.amountPaid;
            });

            assert.equal(true, tournamentDetails.paid)
            assert.equal(tournamentDetails.totalWagered, amountPaid)
        })

        it('should that players got paid after draw', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(rock, name, time, {from: player3})
            const result = await rockPaperScissor.play(rock, name, time + 10, {from: player4})
    
            const tournamentDetails = await rockPaperScissor.getTournament.call(name);
            const amountPaid = await rockPaperScissor.totalWins(player3);
            const amountPaid2 = await rockPaperScissor.totalWins(player4);

            await truffleAssert.eventEmitted(result , 'Paid', (ev: any) => {
                return tournamentDetails.totalWagered == ev.amountPaid;
            });

            await truffleAssert.eventEmitted(result , 'Drew');

            assert.equal(true, tournamentDetails.draw);
            assert.equal(true, tournamentDetails.paid);
            assert.equal(amountInEther, amountPaid);
            assert.equal(amountInEther, amountPaid2);
        })
    })

    describe('Withdrawal', () => {
        it('should revert if player tries to withdraw more than they own', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');
    
            await truffleAssert.fails(rockPaperScissor.withdraw(amountInEther), 'revert', 'Insufficient balance');
        })

        it('should withdraw successfully', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            await rockPaperScissor.play(rock, name, time + 10, {from: player4})

            const winnings = await rockPaperScissor.totalWins.call(player3);
            
            const result = await rockPaperScissor.withdraw(winnings, {from: player3})
    
            const remainingWinnings = await rockPaperScissor.totalWins.call(player3);

            await truffleAssert.eventEmitted(result , 'Withdrew', (ev: any) => {
                      
                return ev.paymentReceiver == player3 && ev.paymentStatus == true
            });

            assert.notEqual(winnings, remainingWinnings);
        })
    })

    describe('Cancel', () => {
        it('should revert if a non tournament participator tries to cancel', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            
            await truffleAssert.fails(rockPaperScissor.cancel(name, time), 'revert', 'Please you cannot cancel the game');
        })

        it('should revert if no amount is at stake', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            
            await rockPaperScissor.createTournament(name, {from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4});

            await truffleAssert.fails(rockPaperScissor.cancel(name, time, {from: player4}) , 'revert', 'You can not cancel there is nothing to loose');
        })

        it('should cancel successfully if only one player is registered', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            const winnings = await rockPaperScissor.totalWins.call(player3)
            
            const result = await rockPaperScissor.cancel(name, time, {from: player3})
            
            const remainingWinnings = await rockPaperScissor.totalWins.call(player3)
            
            await truffleAssert.eventEmitted(result , 'Cancelled', (ev: any) => {                      
                return ev.tournamentName == name && ev.sender == player3 && ev.cancelledAt == time
            });
            assert.equal(winnings.toNumber(), 0);
            assert.notEqual(winnings, remainingWinnings);
        })

        it('should cancel successfully if player2 has not played', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            
            const result = await rockPaperScissor.cancel(name, time + 10, {from: player3})

            await truffleAssert.eventEmitted(result , 'Cancelled', (ev: any) => {                      
                return ev.tournamentName == name && ev.sender == player3 && ev.cancelledAt == time + 10
            });
        })

        it('should cancel successfully if player1 has not played', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player4})
            
            const result = await rockPaperScissor.cancel(name, time + 10, {from: player4})

            const tournament = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Cancelled', (ev: any) => {                      
                return ev.tournamentName == name && ev.sender == player4 && ev.cancelledAt == time + 10
            });

            assert.equal(tournament.cancelled, true)
            assert.equal(tournament.cancelledAt, time + 10)
            assert.equal(tournament.cancelledBy, player4)
        })

        it('should cancel successfully if player1 has not played', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            
            const result = await rockPaperScissor.cancel(name, time + 10, {from: player3})

            const tournament = await rockPaperScissor.getTournament.call(name);

            await truffleAssert.eventEmitted(result , 'Cancelled', (ev: any) => {                      
                return ev.tournamentName == name && ev.sender == player3 && ev.cancelledAt == time + 10
            });

            assert.equal(tournament.cancelled, true)
            assert.equal(tournament.cancelledAt, time + 10)
            assert.equal(tournament.cancelledBy, player3)
        })

        it('should revert when trying to cancel an already cancelled tournament', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {'from': player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            
            await rockPaperScissor.cancel(name, time + 10, {from: player3})

            await truffleAssert.fails(rockPaperScissor.cancel(name, time + 10) , 'revert', 'Tournament has been cancelled!');
        })
    })

    describe('Stake Winnings', () => {
        it('should create a tournament with previous winnings', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {from: player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            await rockPaperScissor.play(scissor, name, time, {from: player4})
            
            name = 'Isaac'
            const result = await rockPaperScissor.methods['createTournament(string,bool)'](name, true, {from: player4});

            truffleAssert.eventEmitted(result, 'TournamentCreated', (ev: any) => {
                return ev.tournamentName == name             
            });

            truffleAssert.eventEmitted(result, 'Registered', (ev: any) => {
                return ev.player == player4 && ev.tournamentName == name
            });
        })

        it('should revert when creating a tournament with no previous winnings', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {from: player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            await rockPaperScissor.play(scissor, name, time, {from: player4})
            
            name = 'Isaac'

            await truffleAssert.fails(rockPaperScissor.methods['createTournament(string,bool)'](name, true, {from: player3}), 'revert', 'You have no winnings to stake')
        })

        it('should register a second player with stakes reverts for no stakes', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {from: player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            await rockPaperScissor.play(scissor, name, time, {from: player4})
            
            name = 'Isaac'
            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await truffleAssert.fails(rockPaperScissor.methods['registerPlayer2(string,bool)'](name, true, {from: player2}), 'revert', 'You have no winnings to stake');
        })

        it('should register a second player with stakes reverts for low stakes', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');
            let amountInGwei = web3.utils.toWei(amount, 'gwei');

            await rockPaperScissor.createTournament(name, {value: amountInGwei, from: player3});
            await rockPaperScissor.registerPlayer2(name, {from: player4, value: amountInGwei});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            await rockPaperScissor.play(scissor, name, time, {from: player4})
            
            name = 'Isaac'
            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});

            await truffleAssert.fails(rockPaperScissor.methods['registerPlayer2(string,bool)'](name, true, {from: player4}), 'revert', 'You have less than the wagered amount');
        })

        it('should register a second player with stakes', async () => {
            const rockPaperScissor = await RockPaperScissor.new();
            let name = 'newton';
            let amount = '1';
            let amountInEther = web3.utils.toWei(amount, 'ether');
            let amountInGwei = web3.utils.toWei(amount, 'gwei');

            await rockPaperScissor.createTournament(name, {value: amountInEther, from: player3});
            await rockPaperScissor.registerPlayer2(name, {from: player4, value: amountInEther});

            await rockPaperScissor.play(paper, name, time, {from: player3})
            await rockPaperScissor.play(scissor, name, time, {from: player4})
            
            name = 'Isaac'
            await rockPaperScissor.createTournament(name, {value: amountInGwei, from: player3});
            const result = await rockPaperScissor.methods['registerPlayer2(string,bool)'](name, true, {from: player4})
            
            truffleAssert.eventEmitted(result, 'Registered', (ev: any) => {
                return ev.player == player4 && ev.tournamentName == name
            });
        })
    })
})
