import { ObjTenderOffers } from "./ObjTenderOffers";

export class ObjOffers {
    Id: number = 0;
    TenderOfferId: number = 0;
    UserId: number = 0;
    PriceOffer: number = 0;
    Date: Date = new Date();
    TenderOffer: ObjTenderOffers = new ObjTenderOffers()
}

