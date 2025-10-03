import { ObjTenderOffers } from "./ObjTenderOffers";

export class ObjOffers {
  Id: number = 0;
  TenderOfferId: number | null = null;
  UserId: number | null = null;
  PriceOffer: number | null = null;
  Date: Date | null = null;
  TenderOffer: ObjTenderOffers | null = null;
}
