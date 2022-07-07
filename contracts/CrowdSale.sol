//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Crowdsale is Ownable {

    mapping (address => uint) public balances;

    mapping (address => uint) public etherBalance;

    address public tokenFundsAddress;

    uint public deadlineOne;
    uint public deadlineTwo;
    uint public deadlineThree;
    
    address public beneficiary;

    uint public amountRaised;

    uint constant public maxGoal = 20 ether;

    uint constant private TOKEN_PRICE_IN_WEI_ONE = 1 ether;
    uint constant private TOKEN_PRICE_IN_WEI_TWO = 2 ether;
    uint constant private TOKEN_PRICE_IN_WEI_THREE = 3 ether;

    uint public minimumContribution = 1 ether;



    event TransferGB(address indexed from, address indexed to, uint value);
    event FundsRaised(address indexed from, uint fundsReceivedInWei, uint tokensIssued);
    event ETHFundsWithdrawn(address indexed recipient, uint fundsWithdrawnInWei);
    
    constructor(uint initialSupply, uint _deadlineOne,uint _deadlineTwo,uint _deadlineThree) public {
        balances[msg.sender] = initialSupply;
        deadlineOne=block.timestamp+_deadlineOne;
        deadlineTwo=block.timestamp+_deadlineTwo;
        deadlineThree=block.timestamp+_deadlineThree;
        
        tokenFundsAddress = msg.sender;
        beneficiary = tokenFundsAddress;
    }
    
    function sendTokens(address receiver, uint amount) public {
        require(balances[msg.sender] > amount, "You don't have  AMOUNT");
        balances[msg.sender] -= amount;
        
        balances[receiver] += amount;

        emit TransferGB(msg.sender, receiver, amount);
    }
    
    function getBalance(address addr) public view returns (uint) {
        return balances[addr];
    }

    function buyTokensWithEther() public payable {

        if(block.timestamp < deadlineOne){
        // require(block.timestamp < deadlineOne,"Deadline has passed");
        require(msg.value >= minimumContribution , "You don't have enough Ether");

        uint numTokens = msg.value / TOKEN_PRICE_IN_WEI_ONE;

        balances[tokenFundsAddress] -= numTokens;
        balances[msg.sender] += numTokens;
        
        amountRaised += msg.value;
        etherBalance[msg.sender] +=msg.value;
        emit FundsRaised(msg.sender, msg.value, numTokens);
        }else if (block.timestamp < deadlineTwo){

        require(msg.value >= minimumContribution , "You don't have enough Ether");

        uint numTokens = msg.value / TOKEN_PRICE_IN_WEI_TWO;

        balances[tokenFundsAddress] -= numTokens;
        balances[msg.sender] += numTokens;

        etherBalance[msg.sender] +=msg.value;
        amountRaised += msg.value;
        emit FundsRaised(msg.sender, msg.value, numTokens);
        }else{
        require(block.timestamp < deadlineThree,"Deadline has passed");
        require(msg.value >= minimumContribution , "You don't have enough Ether");

        uint numTokens = msg.value / TOKEN_PRICE_IN_WEI_THREE;

        balances[tokenFundsAddress] -= numTokens;
        balances[msg.sender] += numTokens;

        etherBalance[msg.sender] +=msg.value;
        amountRaised += msg.value;
        emit FundsRaised(msg.sender, msg.value, numTokens);
        }
    }
    
    function withdrawRaisedFunds() public onlyOwner {
        require(block.timestamp>deadlineThree && amountRaised >= maxGoal,"You are not eligible for Withdraw");
        if (msg.sender != beneficiary)
            return;
        payable(beneficiary).transfer(amountRaised);
        emit ETHFundsWithdrawn(beneficiary, amountRaised);
        
    }

        function refund() public{
        require(block.timestamp>deadlineThree && amountRaised < maxGoal,"You are not eligible for refund");
        require(etherBalance[msg.sender]>0);
        uint userBalance = etherBalance[msg.sender];
        payable(msg.sender).transfer(userBalance);
        balances[msg.sender]=0;
        
    }

}