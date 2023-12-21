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
    let metadata_url = "https://gateway.pinata.cloud/ipfs/QmdUrQ7yiDRAVXuKi7QRUyRfcfQS5QQR8cxjgXBdxCCr6g/";
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

    it("should mint nft", async () => {
        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );
        let collectionData = await nftCollection.getGetCollectionData();
        expect(collectionData.next_item_index).toEqual(1n);

        const nftItemAddress0 = await nftCollection.getGetNftAddressByIndex(0n);
        const nftItem0 = blockchain.openContract(NftItem.fromAddress(nftItemAddress0!));
        const nftItemData0 = await nftItem0.getGetNftData();
        expect(nftItemData0.index).toEqual(0n);
        expect(nftItemData0.owner_address).toEqualAddress(deployer.address);

        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );

        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );

        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );

        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );

        collectionData = await nftCollection.getGetCollectionData();
        expect(collectionData.next_item_index).toEqual(5n);

        const nftItemAddress4 = await nftCollection.getGetNftAddressByIndex(4n);
        const nftItem4 = blockchain.openContract(NftItem.fromAddress(nftItemAddress4!));
        const nftItemData4 = await nftItem4.getGetNftData();
        expect(nftItemData4.index).toEqual(4n);

        await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );

        collectionData = await nftCollection.getGetCollectionData();
        expect(collectionData.next_item_index).toEqual(5n);

        const user = await blockchain.treasury("user");
        await nftItem4.send(
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
        const newOwner = await nftItem4.getGetNftData();
        expect(newOwner.owner_address).toEqualAddress(user.address);
        console.log(nftItemData4.individual_content.asSlice().loadStringTail());
        console.log(collectionData.collection_content.asSlice().loadStringTail());
    });
});
