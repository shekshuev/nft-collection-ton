import "@stdlib/deploy";
import "@stdlib/ownable";
import "./nft_item";
import "./messages";

contract NftCollection with Deployable, Ownable {

    const minTonForStorage: Int = ton("0.03");
    const gasConsumption: Int = ton("0.03");

    owner: Address;
    next_item_index: Int as uint32 = 0;
    collection_content: Cell;

    init(collection_content: Cell) {
        self.owner = sender();
        self.collection_content = collection_content;
    }

    receive("Mint") {
        self.requireOwner();
        self.mint(sender());
    }

    fun mint(receiver: Address) {
        require(self.next_item_index >= 0, "non-sequential NFTs");
        require(self.next_item_index < 5, "all NFTs are minted");
        let nft_init: StateInit = self.getNftItemInit(self.next_item_index);
        let msgValue: Int = context().value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.minTonForStorage - min(tonBalanceBeforeMsg, self.minTonForStorage);
        msgValue = msgValue - (storageFee + self.gasConsumption);

        send(SendParameters {
            to: contractAddress(nft_init),
            value: msgValue,
            mode: SendIgnoreErrors,
            bounce: false,
            body: Transfer {
                query_id: 0,
                new_owner: receiver,
                response_destination: self.owner,
                custom_payload: emptyCell(),
                forward_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: nft_init.code,
            data: nft_init.data
        });
        self.next_item_index = self.next_item_index + 1;
    }

    get fun get_collection_data(): CollectionData {     
        let b: StringBuilder = beginString();
        let collectionDataString: String = self.collection_content.asSlice().asString();
        b.append(collectionDataString);
        b.append("collection.json");
        return CollectionData{
            next_item_index: self.next_item_index, 
            collection_content: b.toCell(), 
            owner_address: self.owner
        };
    }

    get fun get_nft_address_by_index(item_index: Int): Address {
        return contractAddress(self.getNftItemInit(item_index));
    }

    get fun getNftItemInit(item_index: Int): StateInit {
        return initOf NftItem(self.owner, myAddress(), item_index, self.collection_content);
    }

    get fun get_nft_content(index: Int, individual_content: Cell): Cell { 
        let b: StringBuilder = beginString();
        let ic: String = individual_content.asSlice().asString();
        b.append(ic);
        return b.toCell();
    }
    

    

    
}