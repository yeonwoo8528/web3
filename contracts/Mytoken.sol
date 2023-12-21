// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Mytoken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint 100 tokens to msg.sender
        // Similar to how
        // 1 dollar = 100 cents
        // 1 token = 1 * (10 ** decimals)
        _mint(msg.sender, 100 * 10**uint(decimals()));
    }

    // Modifier to ensure that only the owner (admin) can call the function
    modifier onlyAdmin() {
        require(owner() == msg.sender, "Not an admin");
        _;
    }

    // Function to mint new tokens
    function mint(address to, uint256 amount) external onlyAdmin {
        _mint(to, amount);
    }

    // Function to burn existing tokens
    function burn(address from, uint256 amount) external onlyAdmin {
        _burn(from, amount);
    }
}