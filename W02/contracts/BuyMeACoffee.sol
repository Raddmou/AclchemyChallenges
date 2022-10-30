//SPDX-License-Identifier: Unlicense

// contracts/BuyMeACoffee.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// Example Contract Address on Goerli: 0xc2a82bD0f09027971E5988BFc0890EDF85E5091E

contract BuyMeACoffee is Ownable  {

    address payable public withdrawalAddress;

    // Event to emit when a Memo is created.
    event NewMemo(
        address indexed from,
        uint256 timestamp,
        string name,
        string message,
        bool isLargeCoffee
    );

    // Event to emit when a withdrawal is updated.
    event withdrawalAddressUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );

    // Event to emit when a withdraw is done.
    event Withdrawed(
        uint256 amount,
        address withdrawalAddress
    );
    
    // Memo struct.
    struct Memo {
        address from;
        uint256 timestamp;
        string name;
        string message;
        bool isLargeCoffee;
    }
    
    // Address of contract deployer. Marked payable so that
    // we can withdraw to this address later.
    //address payable owner;

    // List of all memos received from coffee purchases.
    Memo[] memos;

    constructor() {
        // Store the address of the deployer as a payable address.
        // When we withdraw funds, we'll withdraw here.
        //owner = payable(msg.sender);
        withdrawalAddress = payable(msg.sender);
    }

    /**
     * @dev fetches all stored memos
     */
    function getMemos() public view returns (Memo[] memory) {
        return memos;
    }

    /**
     * @dev buy a coffee for owner (sends an ETH tip and leaves a memo)
     * @param _name name of the coffee purchaser
     * @param _message a nice message from the purchaser
     */
    function buyCoffee(string memory _name, string memory _message) public payable {
        // Must accept more than 0 ETH for a coffee.
        require(msg.value > 0, "can't buy coffee for free!");

        // Add the memo to storage!
        memos.push(Memo(
            msg.sender,
            block.timestamp,
            _name,
            _message,
            msg.value >= 0.003 ether
        ));

        // Emit a NewMemo event with details about the memo.
        emit NewMemo(
            msg.sender,
            block.timestamp,
            _name,
            _message,
            msg.value >= 0.003 ether
        );
    }

    /**
     * @dev send the entire balance stored in this contract to the owner
     */
    function withdrawTips() public {
        require(msg.sender == withdrawalAddress, "Incorrect address");
        uint256 balance = address(this).balance;
        require(withdrawalAddress.send(address(this).balance));
        emit Withdrawed(balance, withdrawalAddress);
    }

    /**
     * @dev update the withdrawal address
     */
    function updateWithdrawalAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "Incorrect address");
        require(newAddress != withdrawalAddress, "Already registred");

        address oldAddress = withdrawalAddress;
        withdrawalAddress = payable(newAddress);

        emit withdrawalAddressUpdated(oldAddress, withdrawalAddress);
    }

    /**
     * @dev get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}