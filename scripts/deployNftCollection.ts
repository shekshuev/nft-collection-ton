import { toNano, beginCell } from "@ton/core";
import { NftCollection } from "../wrappers/NftCollection";
import { NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    let metadata_url = "https://ipfs.io/ipfs/QmcbxymUgsFt5db5dyf5JfJZAdYvA2rYzpYnhD5p4BCskd/";
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
            value: toNano("0.05")
        },
        {
            $$type: "Deploy",
            queryId: 0n
        }
    );

    // await nftCollection.send(
    //     provider.sender(),
    //     {
    //         value: toNano("0.3")
    //     },
    //     "mint"
    // );

    await provider.waitForDeploy(nftCollection.address);
}
