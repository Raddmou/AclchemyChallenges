// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import '@chainlink/contracts/src/v0.8/ConfirmedOwner.sol';
import "hardhat/console.sol";

contract ChainBattles is ERC721URIStorage, VRFConsumerBaseV2, ConfirmedOwner  {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
        uint256 tokenId;
    }
    mapping(uint256 => RequestStatus) public s_requests; /* requestId --> requestStatus */

    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID.
    uint64 s_subscriptionId;

    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf/v2/subscription/supported-networks/#configurations
    bytes32 keyHash = 0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 100,000 is a safe default for this example contract. Test and adjust
    // this limit based on the network that you select, the size of the request,
    // and the processing of the callback request in the fulfillRandomWords()
    // function.
    uint32 callbackGasLimit = 100000;

    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    // For this example, retrieve 2 random values in one request.
    // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
    uint32 numWords = 4;

    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    struct Warrior
    {
        uint256 Level;
        uint256 Speed;
        uint256 Strength;
        uint256 Life;
    }

    mapping(uint256 => Warrior) public tokenIdToWarriors;

    constructor(uint64 _subscriptionId) 
        VRFConsumerBaseV2 (0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed) 
        ConfirmedOwner(msg.sender)
        ERC721 ("Chain Battles", "CBTLS")
    {
        COORDINATOR = VRFCoordinatorV2Interface(0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed);
        s_subscriptionId = _subscriptionId;
    }

    function generateCharacter(uint256 tokenId) private view returns(string memory){
        Warrior memory warrior = tokenIdToWarriors[tokenId];
        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            '<style>.base { fill: white; font-family: serif; font-size: 14px; }</style>',
            '<rect width="100%" height="100%" fill="black" />',
            '<text x="50%" y="30%" class="base" dominant-baseline="middle" text-anchor="middle">',"Warrior",'</text>',
            '<text x="50%" y="10%" class="base" dominant-baseline="middle" text-anchor="middle">', "Level: ",warrior.Level,'</text>',
            '<text x="50%" y="10%" class="base" dominant-baseline="middle" text-anchor="middle">', "Speed: ",warrior.Level,'</text>',
            '<text x="50%" y="10%" class="base" dominant-baseline="middle" text-anchor="middle">', "Strength: ",warrior.Level,'</text>',
            '<text x="50%" y="10%" class="base" dominant-baseline="middle" text-anchor="middle">', "Life: ",warrior.Level,'</text>',
            '</svg>'
        );
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(svg)
            )    
        );
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory){
        require(_exists(tokenId), "Please use an existing token");
        Warrior memory warrior = tokenIdToWarriors[tokenId];
        bytes memory dataURI = abi.encodePacked(
            '{',
                '"name": "Chain Battles #', tokenId.toString(), '",',
                '"description": "Battles on chain",',
                '"image": "', generateCharacter(tokenId), '"',
                '"attributes": [ ',
                    '{',
                        ' "trait_type": "Level"', 
                        ' "value": ', warrior.Level,
                    '}',
                    '{',
                        ' "trait_type": "Speed"', 
                        ' "value": ', warrior.Speed,
                    '}',
                    '{',
                        ' "trait_type": "Strength"', 
                        ' "value": ', warrior.Strength,
                    '}',
                    '{',
                        ' "trait_type": "Life"', 
                        ' "value": ', warrior.Life,
                    '}',
                ']',
            '}'
        );
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    function mint() external {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _safeMint(msg.sender, newItemId);
        requestRandomWords(newItemId);
        // _setTokenURI(newItemId, getTokenURI(newItemId));
    }

    function train(uint256 tokenId) external {
        require(_exists(tokenId), "Please use an existing token");
        require(ownerOf(tokenId) == msg.sender, "You must own this token to train it");
        Warrior memory warrior = tokenIdToWarriors[tokenId];
        unchecked {
            warrior.Level++;
            warrior.Speed++;
            warrior.Strength++;
            warrior.Life++;
        }
        tokenIdToWarriors[tokenId] = warrior;
        _setTokenURI(tokenId, getTokenURI(tokenId));
    }

    // Assumes the subscription is funded sufficiently.
    function requestRandomWords(uint256 _tokenId) public onlyOwner returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        s_requests[requestId] = RequestStatus({randomWords: new uint256[](0), exists: true, fulfilled: false, tokenId: _tokenId});
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);
        return requestId;
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(s_requests[_requestId].exists, 'request not found');
        // transform the result to a number between 1 and 10 inclusively
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        Warrior memory warrior = Warrior((_randomWords[0] % 10) + 1, (_randomWords[1] % 10) + 1, (_randomWords[2] % 10) + 1, (_randomWords[3] % 10) + 1);
        //Warrior memory warrior = Warrior(1, 1, 1, 1);
        tokenIdToWarriors[s_requests[_requestId].tokenId] = warrior;
        _setTokenURI(s_requests[_requestId].tokenId, getTokenURI(s_requests[_requestId].tokenId));
        emit RequestFulfilled(_requestId, _randomWords);
    }

    function getRequestStatus(uint256 _requestId) external view returns (bool fulfilled, uint256[] memory randomWord) {
        require(s_requests[_requestId].exists, 'request not found');
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }
}