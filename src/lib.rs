use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    near_bindgen, require, AccountId,
};
use near_sdk_contract_tools::{hook::Hook, nft::*};

#[derive(BorshSerialize, BorshDeserialize, Default, NonFungibleToken)]
#[non_fungible_token(mint_hook = "ReferralHook", transfer_hook = "NonTransferrableHook")]
#[near_bindgen]
pub struct Contract {}

#[near_bindgen]
impl Contract {
    pub fn update_metadata(&mut self, metadata: ContractMetadata) {
        self.set_contract_metadata(metadata);
    }

    pub fn mint(&mut self, memo: String) {
        Nep171Controller::mint(
            self,
            &Nep171Mint {
                token_ids: &vec![near_sdk::env::predecessor_account_id().into()],
                receiver_id: &near_sdk::env::predecessor_account_id().into(),
                memo: Some(&memo),
            },
        )
        .expect("Mint failed");
    }

    #[payable]
    pub fn mint_for(&mut self, receiver_id: AccountId, memo: String) {
        require!(
            near_sdk::env::predecessor_account_id()
                == "relay.intear.near"
                    .parse()
                    .unwrap(),
            "Only the minter can mint for others"
        );
        Nep145Controller::deposit_to_storage_account(
            self,
            &receiver_id,
            near_sdk::env::attached_deposit().into(),
        )
        .expect("Deposit failed");
        Nep171Controller::mint(
            self,
            &Nep171Mint {
                token_ids: &vec![receiver_id.to_string()],
                receiver_id: &receiver_id,
                memo: Some(&memo),
            },
        )
        .expect("MintFor failed");
    }
}

pub struct ReferralHook;

impl Hook<Contract, Nep171Mint<'_>> for ReferralHook {
    fn hook<R>(
        contract: &mut Contract,
        args: &Nep171Mint<'_>,
        f: impl FnOnce(&mut Contract) -> R,
    ) -> R {
        if args.token_ids.len() != 1 {
            panic!("Only one token can be minted");
        }
        let token_id = args.token_ids[0].clone();
        let account_id = token_id
            .parse::<AccountId>()
            .expect("Invalid token ID. It should be an account ID of the receiver");
        if &account_id != args.receiver_id {
            panic!("Invalid token ID. It should be an account ID of the receiver");
        }
        let memo = args
            .memo
            .as_ref()
            .expect("Memo is required. It should be the account ID of the referrer and other data");
        let memo = memo.split('\n').collect::<Vec<_>>();
        if memo.len() < 5 {
            panic!("Invalid memo. It should contain 5 parts separated by new lines: Recruited by, gender, age, profession, contact details");
        }
        let referrer_id = memo[0]
            .parse::<AccountId>()
            .expect("Invalid first part of the memo. It should be the account ID of the referrer");
        if contract.total_enumerated_tokens() > 0 {
            if contract
                .nft_tokens_for_owner(referrer_id.clone(), None, None)
                .is_empty()
            {
                panic!("Referrer does not own a token");
            }
        }
        <Contract as Nep177ControllerInternal>::slot_token_metadata(&token_id).set(Some(&TokenMetadata {
            title: Some(format!("Axis Church Follower ID: {token_id}")),
            description: Some(format!("An official Axis Church identification document of {token_id}. Referred by {referrer_id}")),
            media: Some(format!("https://aqua.church/{}/{}", token_id, memo.join("/"))),
            issued_at: Some((near_sdk::env::block_timestamp() / 1_000_000).into()),
            starts_at: Some((near_sdk::env::block_timestamp() / 1_000_000).into()),
            ..Default::default()
        }));
        f(contract)
    }
}

pub struct NonTransferrableHook;

impl<C> Hook<C, Nep171Transfer<'_>> for NonTransferrableHook {
    fn hook<R>(_contract: &mut C, _args: &Nep171Transfer<'_>, _f: impl FnOnce(&mut C) -> R) -> R {
        panic!("Token is non-transferrable");
    }
}
