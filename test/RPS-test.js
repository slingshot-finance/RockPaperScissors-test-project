const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");

describe("SlingBux", function () {
    it("Assigns the correct balance to initial accounts", async function () {
        let player1, player2;
        [player1, player2, _] = await hre.ethers.getSigners();
        const SlingBux = await ethers.getContractFactory("SlingBux");
        const slingbux = await SlingBux.deploy(player1.address, player2.address);
        await slingbux.deployed();

        expect(await
            slingbux.balanceOf(player1.address)).to.equal("100000000000000000000");


    });
});

describe("RPS", function () {
    let player1, player2, player3, SlingBux, slingbux, RPS, rps, p1, p2
    const buyIn = "1000000000000000000";
    let p1_commit = "0x5fdecc49c5614d4431222e6bd136397a7824bf642b12df46cd9a1e7cba75fdde"; //Hashed commit of "rockswag"
    let p2_commit = "0x86d6a1bbb2acdacbc5f74d52980a49717b41f7f8e484e2a43b43f6a7f65de636"; //Hashed commit of "scissors123123"
    let p1_reveal = ["rock", "swag"];
    let p2_reveal = ["scissors", '123123'];
    beforeEach(async () => {
        [player1, player2, player3, _] = await hre.ethers.getSigners();
        SlingBux = await ethers.getContractFactory("SlingBux");
        slingbux = await SlingBux.deploy(player1.address, player2.address);
        await slingbux.deployed();
        RPS = await ethers.getContractFactory("RPS");
        rps = await RPS.deploy(player2.address, buyIn, slingbux.address);
        await rps.deployed();
        p1 = await rps.players(0);
        p2 = await rps.players(1);
        await slingbux.connect(player1).approve(rps.address, buyIn);
        await slingbux.connect(player2).approve(rps.address, buyIn);



    })
    //TODO: Finish up the test cases
    it('Should setup the initial contract state according to constuctor variables', async function () {
        expect(await rps.buyIn()).to.equal(buyIn);
        expect(await p1.addr).to.equal(player1.address);
        expect(await p2.addr).to.equal(player2.address);
    });

    //test unable to play from non-allowed address
    it('Should not let non-players make moves', async function () {
        expect(await rps.buyIn()).to.equal(buyIn);
        await expect(rps.connect(player3).commitMove(p1_commit)).to.be.reverted;
    });

    it('Should register player commits correctly and not allow reveal until after both commits', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await expect(rps.connect(player1).revealMove(...p1_reveal)).to.be.revertedWith("Both players must commit.");
        await rps.connect(player2).commitMove(p2_commit);
        p1 = await rps.players(0);
        p2 = await rps.players(1);
        expect(await p1.commit).to.equal(p1_commit);
        expect(await p2.commit).to.equal(p2_commit);
    });

    it('Should allow player1 to withdraw early if player2 has not made a move.', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await rps.connect(player1).withdraw();
        expect(await slingbux.balanceOf(player1.address)).to.equal("100000000000000000000");

    });

    it('Should only let player1 withdraw early', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await expect(rps.connect(player2).withdraw()).to.be.revertedWith("Only player 1 can withdraw early");
    });

    it('Should not allow player1 to withdraw early if player2 made a move.', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await rps.connect(player2).commitMove(p2_commit);
        await expect(rps.connect(player1).withdraw()).to.be.revertedWith("Player 2 has made a move, no early withdrawals.");
    });

    it('Should not allow players to reveal using incorrect values', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await rps.connect(player2).commitMove(p2_commit);
        await expect(rps.connect(player1).revealMove(...p2_reveal)).to.be.revertedWith("Move doesn't match hash");
    });

    it('Should allow 0 wager games to take place and be completed', async function () {
        RPS = await ethers.getContractFactory("RPS");
        rps = await RPS.deploy(player2.address, "0", slingbux.address);
        await rps.deployed();
        await rps.connect(player1).commitMove(p1_commit);
        await rps.connect(player2).commitMove(p2_commit);
        await rps.connect(player1).revealMove(...p1_reveal);
        await rps.connect(player2).revealMove(...p2_reveal);
        expect(await rps.gameIsLive()).to.equal(false);
        expect(await rps.winner()).to.equal(player1.address);
    });



    it('Should assign the correct winner and allow withdrawal when both reveals are made', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await rps.connect(player2).commitMove(p2_commit);
        await rps.connect(player1).revealMove(...p1_reveal);
        await rps.connect(player2).revealMove(...p2_reveal);
        expect(await rps.gameIsLive()).to.equal(false);
        expect(await rps.winner()).to.equal(player1.address);
        expect(await rps.balance(player1.address)).to.equal("2000000000000000000");
        await rps.connect(player1).withdraw();
        expect(await rps.balance(player1.address)).to.equal(0);
        expect(await slingbux.balanceOf(player1.address)).to.equal("101000000000000000000");
    });

    it('Should not allow a loser to withdraw the game winnings', async function () {
        await rps.connect(player1).commitMove(p1_commit);
        await rps.connect(player2).commitMove(p2_commit);
        await rps.connect(player1).revealMove(...p1_reveal);
        await rps.connect(player2).revealMove(...p2_reveal);
        await expect(rps.connect(player2).withdraw()).to.be.revertedWith("No balance to withdraw.");
    });

    it('Should automatically assign the opposing player as the winner if an invalid move was made', async function () {
        let bad_commit = "0xfb2a8ed6c06d02e4b082114ed00dc0ef0edf0d7a958ec583c202b15d0871c0d2"; //Hashed commit of "invalid123"
        let bad_reveal = ["invalid","123"];
        await rps.connect(player1).commitMove(bad_commit);
        await expect(rps.connect(player1).revealMove(...p1_reveal)).to.be.revertedWith("Both players must commit.");
        await rps.connect(player2).commitMove(p2_commit);
        await rps.connect(player1).revealMove(...bad_reveal);
        expect(await rps.gameIsLive()).to.equal(false);
        expect(await rps.winner()).to.equal(player2.address);
    });



})
