import {expect} from "chai";
import {ethers} from "hardhat";

describe("File", function () {
    it("Can upload empty file.", async function () {
        const File = await ethers.getContractFactory("File");
        const file = await File.deploy("My filename!", "text/plain", "gzip", "{}");
        await file.deployed();

        (await file.finalize()).wait();

        expect(await file.name()).to.equal("My filename!");
        expect(await file.mimeType()).to.equal("text/plain");
        expect(await file.encoding()).to.equal("gzip");
        expect(await file.metadata()).to.equal("{}");
        expect(await file.sizeInBytes()).to.equal(0);
        expect(await file.chunkCount()).to.equal(0);
    });

    it("Can upload single-chunk file.", async function () {
        const File = await ethers.getContractFactory("File");
        const file = await File.deploy("My filename!", "text/plain", "gzip", "{}");
        await file.deployed();

        (await file.addChunk(0, Uint8Array.of(1, 2, 3, 4, 5))).wait();

        (await file.finalize()).wait();

        expect(await file.sizeInBytes()).to.equal(5);
        expect(await file.chunkCount()).to.equal(1);
        expect(ethers.utils.arrayify(await file.downloadChunk(0))).to.deep.equal(Uint8Array.of(1, 2, 3, 4, 5));
    });

    it("Can upload large single-chunk file.", async function () {
        const File = await ethers.getContractFactory("File");
        const file = await File.deploy("My filename!", "text/plain", "gzip", "{}");
        await file.deployed();

        var array = new Uint8Array(8192);
        for (var i = 0; i < array.length; i++) {
            array[i] = i % 256;
        }

        (await file.addChunk(0, array)).wait();

        (await file.finalize()).wait();

        expect(await file.sizeInBytes()).to.equal(8192);
        expect(await file.chunkCount()).to.equal(1);
        expect(ethers.utils.arrayify(await file.downloadChunk(0))).to.deep.equal(array);
    });

    it("Can upload multi-chunk file.", async function () {
        const File = await ethers.getContractFactory("File");
        const file = await File.deploy("My filename!", "text/plain", "gzip", "{}");
        await file.deployed();

        (await file.addChunk(0, Uint8Array.of(1, 2, 3, 4, 5))).wait();
        (await file.addChunk(1, Uint8Array.of(6, 7))).wait();
        (await file.addChunk(2, Uint8Array.of())).wait();
        (await file.addChunk(3, Uint8Array.of(8))).wait();
        (await file.addChunk(4, Uint8Array.of())).wait();
        (await file.addChunk(5, Uint8Array.of())).wait();
        (await file.addChunk(6, Uint8Array.of(9, 10, 11))).wait();

        (await file.finalize()).wait();

        expect(await file.sizeInBytes()).to.equal(11);
        expect(await file.chunkCount()).to.equal(7);
        expect(ethers.utils.arrayify(await file.downloadChunk(0))).to.deep.equal(Uint8Array.of(1, 2, 3, 4, 5));
        expect(ethers.utils.arrayify(await file.downloadChunk(1))).to.deep.equal(Uint8Array.of(6, 7));
        expect(ethers.utils.arrayify(await file.downloadChunk(2))).to.deep.equal(Uint8Array.of());
        expect(ethers.utils.arrayify(await file.downloadChunk(3))).to.deep.equal(Uint8Array.of(8));
        expect(ethers.utils.arrayify(await file.downloadChunk(4))).to.deep.equal(Uint8Array.of());
        expect(ethers.utils.arrayify(await file.downloadChunk(5))).to.deep.equal(Uint8Array.of());
        expect(ethers.utils.arrayify(await file.downloadChunk(6))).to.deep.equal(Uint8Array.of(9, 10, 11));
    });

    it("Can upload multi-chunk file in arbitrary order.", async function () {
        const File = await ethers.getContractFactory("File");
        const file = await File.deploy("My filename!", "text/plain", "gzip", "{}");
        await file.deployed();

        (await file.addChunk(3, Uint8Array.of(8))).wait();
        // (await file.addChunk(2, Uint8Array.of())).wait(); // test if leaving out a chunk creates a blank chunk
        (await file.addChunk(1, Uint8Array.of(6, 7))).wait();
        (await file.addChunk(6, Uint8Array.of(9, 10, 11))).wait();
        (await file.addChunk(4, Uint8Array.of())).wait();
        (await file.addChunk(0, Uint8Array.of(1, 2, 3, 4, 5))).wait();
        (await file.addChunk(5, Uint8Array.of())).wait();

        (await file.finalize()).wait();

        expect(await file.sizeInBytes()).to.equal(11);
        expect(await file.chunkCount()).to.equal(7);
        expect(ethers.utils.arrayify(await file.downloadChunk(0))).to.deep.equal(Uint8Array.of(1, 2, 3, 4, 5));
        expect(ethers.utils.arrayify(await file.downloadChunk(1))).to.deep.equal(Uint8Array.of(6, 7));
        expect(ethers.utils.arrayify(await file.downloadChunk(2))).to.deep.equal(Uint8Array.of());
        expect(ethers.utils.arrayify(await file.downloadChunk(3))).to.deep.equal(Uint8Array.of(8));
        expect(ethers.utils.arrayify(await file.downloadChunk(4))).to.deep.equal(Uint8Array.of());
        expect(ethers.utils.arrayify(await file.downloadChunk(5))).to.deep.equal(Uint8Array.of());
        expect(ethers.utils.arrayify(await file.downloadChunk(6))).to.deep.equal(Uint8Array.of(9, 10, 11));
        expect(await file.areChunksNonEmpty([6,2,1,3,4,5,0,7,100])).to.deep.equal([true, false, true, true, false, false, true, false, false]);

    });
});
