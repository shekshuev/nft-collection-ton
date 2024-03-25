import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano, beginCell } from "@ton/core";
import { NftCollection } from "../wrappers/NftCollection";
import "@ton/test-utils";
import { NftItem } from "../wrappers/NftItem";

describe("NftCollection", () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftCollection: SandboxContract<NftCollection>;

    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    let metadata_url = "https://ipfs.io/ipfs/QmZn1jT2z8LgW8gydXYQSy7P1Ty4WsgfU286TTThKJT9jc/";
    let newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(metadata_url).endCell();

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury("deployer");

        nftCollection = blockchain.openContract(
            await NftCollection.fromInit(deployer.address, newContent, {
                $$type: "RoyaltyParams",
                numerator: 0n,
                denominator: 1n,
                destination: deployer.address
            })
        );
    });

    it("should mint nft, set code and sent it", async () => {
        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "mint"
        );
        const nftItemAddress = await nftCollection.getGetNftAddressByIndex(0n);
        const nftItem = blockchain.openContract(NftItem.fromAddress(nftItemAddress!));
        const nftItemData = await nftItem.getGetNftData();
        expect(nftItemData.index).toEqual(0n);
        expect(nftItemData.owner_address).toEqualAddress(deployer.address);
        const metadataUrl = nftItemData.individual_content.asSlice().loadStringTail();
        expect(metadataUrl).toMatch(/.*(graduation.json)$/);

        await nftItem.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "theme1"
        );
        const nftItemChangedData = await nftItem.getGetNftData();
        expect(nftItemChangedData.index).toEqual(0n);
        expect(nftItemChangedData.owner_address).toEqualAddress(deployer.address);
        const changedMetadataUrl = nftItemChangedData.individual_content.asSlice().loadStringTail();
        expect(changedMetadataUrl).toMatch(/.*(theme1.json)$/);

        const user = await blockchain.treasury("user");
        await nftItem.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            {
                $$type: "Transfer",
                new_owner: user.address,
                query_id: 0n,
                custom_payload: null,
                forward_amount: 0n,
                forward_payload: beginCell().endCell(),
                response_destination: deployer.address
            }
        );
        const newOwner = await nftItem.getGetNftData();
        const newOwnerNftItemData = await nftItem.getGetNftData();
        expect(newOwner.owner_address).toEqualAddress(user.address);
        const userMetadataUrl = newOwnerNftItemData.individual_content.asSlice().loadStringTail();
        expect(userMetadataUrl).toMatch(/.*(theme1.json)$/);
    });
});
