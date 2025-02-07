// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ERC1967Proxy} from  "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title Box
/// @notice A box with objects inside.
contract BoxProxy is ERC1967Proxy{
    constructor(address implementation, bytes memory _data) payable ERC1967Proxy(implementation,_data) {
    }
}