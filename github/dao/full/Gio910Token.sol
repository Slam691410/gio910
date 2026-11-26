// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title Gio910Token
 * @notice Token tata kelola (Governance Token) untuk Full DAO Holding Investasi.
 *         Memakai mode jam `timestamp` (detik) agar konsisten di Ethereum L1, Base, dan Arbitrum.
 *         PENTING: setelah menerima token, pemegang token wajib memanggil `delegate(alamatSendiri)`
 *         agar hak suaranya aktif di Governor.
 */
contract Gio910Token is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000 * 1e18; // Maksimal 10 juta token suara

    constructor(address initialOwner, uint256 initialSupply)
        ERC20("Gio910 Gerai Governance", "G910")
        ERC20Permit("Gio910 Gerai Governance")
        Ownable(initialOwner)
    {
        require(initialSupply <= MAX_SUPPLY, "Melebihi batas suplai");
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /**
     * @notice Mencetak token suara tambahan (setelah DAO berjalan, pindahkan ownership ke TimelockController).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Melebihi MAX_SUPPLY");
        _mint(to, amount);
    }

    /// @dev Gunakan timestamp agar durasi voting di Governor dihitung dalam detik (bukan jumlah blok).
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
