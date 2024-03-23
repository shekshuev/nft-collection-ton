import "./messages";

const minTonsForStorage: Int = ton("0.03");
const gasConsumption: Int = ton("0.03");

contract NftItem {
    collection_address: Address;
    item_index: Int; 
    owner: Address;
    individual_content: Cell;
    is_initialized: Bool;

    init(collection_address: Address, item_index: Int, owner: Address, individual_content: Cell){
        self.collection_address = collection_address;
        self.item_index = item_index;
        self.owner = collection_address;
        self.individual_content = individual_content;
        self.is_initialized = false;
    }

    receive(msg: Transfer){
        let ctx: Context = context();
        require(ctx.sender == self.owner, "not owner");
    
        let msgValue: Int = ctx.value; 
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        msgValue = msgValue - (storageFee + gasConsumption);

        if (self.is_initialized == false) {
            self.is_initialized = true;
            self.owner = msg.new_owner;
            send(SendParameters{
                to: msg.response_destination,
                value: 0,
                mode: SendIgnoreErrors + SendRemainingValue,
                body: Excesses { query_id: msg.query_id }.toCell()
            });
        } else {
            
            self.owner = msg.new_owner;
            if (msg.forward_amount > 0) {
                send(SendParameters{
                    to: msg.new_owner,
                    value: msg.forward_amount,
                    mode: SendIgnoreErrors + SendPayGasSeparately, 
                    bounce: true,
                    body: OwnershipAssigned{
                        query_id: msg.query_id,
                        prev_owner: ctx.sender,
                        forward_payload: msg.forward_payload
                    }.toCell()
                }); 
            }

            msgValue = msgValue - ctx.readForwardFee(); 
            if (msg.response_destination != null) { 
                send(SendParameters{ 
                    to: msg.response_destination,
                    value: msgValue - msg.forward_amount,
                    mode: SendPayGasSeparately,
                    bounce: true,
                    body: Excesses { query_id: msg.query_id }.toCell()
                });
            } 
        }
    }
    
    receive(msg: GetStaticData){ 
        let ctx: Context = context();
        send(SendParameters {
            to: ctx.sender,
            value: 0,
            mode: 64,
            bounce: true,
            body: ReportStaticData{
                query_id: msg.query_id,
                index_id: self.item_index,
                collection: self.collection_address
            }.toCell()
        });
    }

    get fun get_nft_data(): GetNftData {
        let b: StringBuilder = beginString();
        let collectionData: String = self.individual_content.asSlice().asString();
        b.append(collectionData);
        if (self.item_index == 6) {
            b.append("graduation.json");
        } else {
            b.append(self.item_index.toString());
            b.append(".json");
        }
        return GetNftData {
            is_initialized: self.is_initialized, 
            index: self.item_index, 
            collection_address: self.collection_address, 
            owner_address: self.owner,
            individual_content: b.toCell()
        };
    }
}
