import { toNano, beginCell } from "@ton/core";
import { NftCollection } from "../wrappers/NftCollection";
import { NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    let metadata_url = "https://ipfs.io/ipfs/QmZn1jT2z8LgW8gydXYQSy7P1Ty4WsgfU286TTThKJT9jc/";
    let newContent = beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(metadata_url).endCell();
    const nftCollection = provider.open(
        await NftCollection.fromInit(provider.sender().address!, newContent, {
            $$type: "RoyaltyParams",
            numerator: 0n,
            denominator: 1n,
            destination: provider.sender().address!
        })
    );

    await nftCollection.send(
        provider.sender(),
        {
            value: toNano("0.1")
        },
        {
            $$type: "Deploy",
            queryId: 0n
        }
    );

    for (let i = 0; i < 3; i++) {
        await nftCollection.send(
            provider.sender(),
            {
                value: toNano("0.5")
            },
            "mint"
        );
    }

    await provider.waitForDeploy(nftCollection.address);
}
