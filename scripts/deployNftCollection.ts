import { toNano, beginCell } from "@ton/core";
import { NftCollection } from "../wrappers/NftCollection";
import { NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    let metadata_url = "https://gateway.pinata.cloud/ipfs/QmdUrQ7yiDRAVXuKi7QRUyRfcfQS5QQR8cxjgXBdxCCr6g/";
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

    let i = 0;
    while (i++ < 5) {
        await nftCollection.send(
            provider.sender(),
            {
                value: toNano("0.3")
            },
            "Mint"
        );
    }

    await provider.waitForDeploy(nftCollection.address);
}
