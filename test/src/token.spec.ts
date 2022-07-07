import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

describe("CrowdSale Token", function () {

  let signers: Signer[];


  let crowdSalesContract: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;


  let CrowdSales: any;

  before(async () => {
    [owner, user, user2, user3] = await ethers.getSigners();

    hre.tracer.nameTags[owner.address] = "ADMIN";
    hre.tracer.nameTags[user.address] = "USER1";
    hre.tracer.nameTags[user2.address] = "USER2";
    hre.tracer.nameTags[user3.address] = "USER3";
    CrowdSales = await ethers.getContractFactory("Crowdsale");
    crowdSalesContract = await CrowdSales.deploy(1000, 60, 180, 360);
  });


  it("Owner Of Contract", async function () {
    expect(await crowdSalesContract.callStatic.owner()).to.be.equal(owner.address)
  })

  it("Maximum Goal", async () => {
    expect(await crowdSalesContract.callStatic.maxGoal()).to.be.equal(parseEther("20"))
  })

  it("Minimum Contribution", async () => {
    expect(await crowdSalesContract.callStatic.minimumContribution()).to.be.equal(parseEther("1"))
  })

  it("Amount Rasied", async () => {
    expect(await crowdSalesContract.callStatic.amountRaised()).to.be.equal(0)
  })

  it("Owner Balance", async () => {
    expect(await crowdSalesContract.callStatic.getBalance(owner.address)).to.be.equal(1000)
  })

  it("BuyToken With Ether", async () => {
    await expect(() => crowdSalesContract.connect(user).buyTokensWithEther({ value: parseEther("2") })).to.changeEtherBalance(user, parseEther("-2"))
    expect(await crowdSalesContract.callStatic.getBalance(user.address)).to.be.equal(2)
  })

  it("Owner Balance", async () => {
    expect(await crowdSalesContract.callStatic.getBalance(owner.address)).to.be.equal(998)
    expect(await crowdSalesContract.callStatic.getBalance(user.address)).to.be.equal(2)
  })

  it("Balance of User", async () => {
    expect(await crowdSalesContract.callStatic.etherBalance(user.address)).to.be.equal(parseEther("2"))
  })

  it("Balance of Token", async () => {
    expect(await crowdSalesContract.callStatic.getBalance(user.address)).to.be.equal(2)
  })

  it("Balance for Buy Token Less than Minimum Contribution", async () => {
    await expect(crowdSalesContract.connect(user).buyTokensWithEther({ value: "10000" })).to.be.revertedWith("You don't have enough Ether")
  })

  async function increaseTime(duration: number): Promise<void> {
    ethers.provider.send("evm_increaseTime", [duration]);
    ethers.provider.send("evm_mine", []);
  }

  it("BuyToken With Ether User 2 Second Phase", async () => {
    increaseTime(62)
    await expect(() => crowdSalesContract.connect(user2).buyTokensWithEther({ value: parseEther("6") })).to.changeEtherBalance(user2, parseEther("-6"))

  })

  it("Balance of Token User 2", async () => {
    expect(await crowdSalesContract.callStatic.getBalance(user2.address)).to.be.equal(3)
  })

  it("BuyToken With Ether", async () => {
    increaseTime(182)
    await expect(() => crowdSalesContract.connect(user3).buyTokensWithEther({ value: parseEther("15") })).to.changeEtherBalance(user3, parseEther("-15"))
  })

  it("Balance of Token User 3", async () => {
    expect(await crowdSalesContract.callStatic.getBalance(user3.address)).to.be.equal(5)
  })

  it("BuyToken With Ether When Time Is Passed", async () => {
    increaseTime(362)
    await expect(crowdSalesContract.connect(user3).buyTokensWithEther({ value: parseEther("9") })).to.be.revertedWith("Deadline has passed")
  })

  it("Amount Rasied", async () => {
    expect(await crowdSalesContract.callStatic.amountRaised()).to.be.equal(parseEther("23"))
  })

  // if don't reached MaxGoal Than
  // it("Withdraw Amount When time is Over And max Goal Not Full Fill",async () =>{

  //   await crowdSalesContract.connect(owner).withdrawRaisedFunds()
  //   // await expect( crowdSalesContract.connect(owner).withdrawRaisedFunds()).to.be.revertedWith("You are not eligible for Withdraw")
  // })


  it("Withdraw Amount When time is Over And max Goal reached", async () => {
    await crowdSalesContract.connect(owner).withdrawRaisedFunds()
  })

  it("Send Balance Greater Than Amount", async () => {
    await expect(crowdSalesContract.connect(user).sendTokens(user2.address, 20)).to.be.revertedWith("You don't have  AMOUNT")
  })

  it("Send Balance Less Than Amount", async () => {
    await crowdSalesContract.connect(user).sendTokens(user2.address, 1)
    expect(await crowdSalesContract.callStatic.getBalance(user2.address)).to.be.equal(4)
  })

  it("Withdraw Amount if MaxGoal Reached", async () => {
    await expect(crowdSalesContract.connect(user).refund()).to.be.revertedWith("You are not eligible for refund")
  })

  // it("Withdraw Amount if MaxGoal Not Reached",async () =>{
  //   await crowdSalesContract.connect(user).refund()
  //   await crowdSalesContract.connect(user2).refund()
  //   await crowdSalesContract.connect(user3).refund()
  // })


});