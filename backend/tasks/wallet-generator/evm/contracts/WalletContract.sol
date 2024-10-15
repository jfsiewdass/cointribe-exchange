// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract WalletContract {

    uint256 private constant MIN = 100000000000000000; // 0.001
    address private constant HOT_WALLET = 0x85513299341Fa1Aef01885dC2A5cB6d959C30A3d;

    event DepositedOnCoinTribe();

    function forward() private {
        if(msg.value >= MIN){
            (bool success, ) = payable(HOT_WALLET).call{value: address(this).balance}("");
            require(success);
        }
        emit DepositedOnCoinTribe();
    }

    receive() external payable { forward();}
    fallback() external payable { forward();}
}