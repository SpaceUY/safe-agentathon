// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Initializable} from  "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title Box
/// @notice A box with objects inside.
contract Box is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    /*//////////////////////////////////////////////////////////////
                                VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Number of objects inside the box.
    uint256 public numberOfObjects;

    /*//////////////////////////////////////////////////////////////
                                FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice No constructor in upgradable contracts, so initialized with this function.
    function initialize(uint256 objects, address multisig) public initializer {
        __UUPSUpgradeable_init();
        __Ownable_init(multisig);

        numberOfObjects = objects;
    }

    /// @notice Remove an object from the box.
    function removeObject() external {
        require(numberOfObjects > 1, "Nothing inside");
        numberOfObjects -= 1;
    }

    /// @dev Upgrades the implementation of the proxy to new address.
    function _authorizeUpgrade(address) internal override onlyOwner {}
}