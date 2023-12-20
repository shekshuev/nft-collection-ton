import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { toNano, beginCell } from "@ton/core";
import { NftCollection } from "../wrappers/NftCollection";
import "@ton/test-utils";
import { NftItem } from "../wrappers/NftItem";

describe("NftCollection", () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nftCollection: SandboxContract<NftCollection>;
    let metadata_url = "https://ipfs.io/ipfs/QmdUrQ7yiDRAVXuKi7QRUyRfcfQS5QQR8cxjgXBdxCCr6g/";
    let newContent = beginCell().storeStringRefTail(metadata_url).endCell();

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nftCollection = blockchain.openContract(await NftCollection.fromInit(newContent));

        deployer = await blockchain.treasury("deployer");

        const deployResult = await nftCollection.send(
            deployer.getSender(),
            {
                value: toNano("0.05")
            },
            {
                $$type: "Deploy",
                queryId: 0n
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nftCollection.address,
            deploy: true,
            success: true
        });
    });

    it("should deploy", async () => {
        const collectionData = await nftCollection.getGetCollectionData();
        const content = collectionData.collection_content.beginParse().loadStringTail();
        expect(content).toEqual(metadata_url + "collection.json");
        expect(collectionData.owner_address).toEqualAddress(deployer.getSender().address);
        expect(collectionData.next_item_index).toEqual(0n);
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
        const nftItem0 = blockchain.openContract(NftItem.fromAddress(nftItemAddress0));
        const nftItemData0 = await nftItem0.getGetNftData();
        const content0 = nftItemData0.individual_content.beginParse().loadStringTail();
        expect(content0).toEqual(metadata_url + "0.json");

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
        const nftItem4 = blockchain.openContract(NftItem.fromAddress(nftItemAddress4));
        const nftItemData4 = await nftItem4.getGetNftData();
        const content4 = nftItemData4.individual_content.beginParse().loadStringTail();
        expect(content4).toEqual(metadata_url + "4.json");

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
                response_destination: user.address,
                forward_amount: 0n,
                custom_payload: null,
                forward_payload: beginCell().endCell()
            }
        );
        const newOwner = await nftItem4.getOwner();
        expect(newOwner).toEqualAddress(user.address);
    });
});
