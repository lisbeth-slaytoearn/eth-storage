//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract File is Ownable {
    string private _name; // arbitrary file name, follows same standard as HTTP file names
    string private _mimeType; // follows same standard as HTTP Content-Type
    string private _encoding; // follows same standard as HTTP Content-Encoding
    string private _metadata; // arbitrary data for custom use cases and metadata, preferably versioned, namespaced JSON
    uint256 private _sizeInBytes;
    bytes[] private _chunks;

    constructor(string memory nameArg, string memory mimeTypeArg, string memory encodingArg, string memory metadataArg) {
        _name = nameArg;
        _mimeType = mimeTypeArg;
        _encoding = encodingArg;
        _metadata = metadataArg;
    }

    function finalize() public onlyOwner {
        require(!isFinalized(), "File is already finalized and can not be modified.");

        renounceOwnership();
    }

    function addChunk(uint256 chunkIndex, bytes memory chunk) public onlyOwner {
        require(!isFinalized(), "File is already finalized and can not be modified.");

        while (_chunks.length <= chunkIndex) {
            _chunks.push();
        }

        require(_chunks[chunkIndex].length == 0, "Chunk has already been assigned and can't be overwritten.");

        _sizeInBytes += chunk.length;
        _chunks[chunkIndex] = chunk;
    }

    function isFinalized() public view returns (bool) {
        return owner() == address(0);
    }

    function metadata() public view returns (string memory) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _metadata;
    }

    function name() public view returns (string memory) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _name;
    }

    function mimeType() public view returns (string memory) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _mimeType;
    }

    function encoding() public view returns (string memory) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _encoding;
    }

    function sizeInBytes() public view returns (uint256) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _sizeInBytes;
    }

    function chunkCount() public view returns (uint256) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _chunks.length;
    }

    function areChunksNonEmpty(uint256[] memory chunkIndices) public view returns (bool[] memory) {
        bool[] memory result = new bool[](chunkIndices.length);

        for (uint256 i = 0; i < chunkIndices.length; i++) {
            uint256 chunkIndex = chunkIndices[i];

            result[i] = chunkIndex < _chunks.length && _chunks[chunkIndex].length > 0;
        }

        return result;
    }

    function downloadChunk(uint256 chunkIndex) public view returns (bytes memory) {
        require(isFinalized(), "File is not yet finalized and can not be accessed.");

        return _chunks[chunkIndex];
    }
}
