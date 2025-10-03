import { ObjOfferParticipant } from './ObjOfferParticipant';

export class ObjOffersReport {
  UsersCount: number | null = null;
  MinPriceOffer: number | null = null;
  Participants: ObjOfferParticipant[] = [];
  Winner: ObjOfferParticipant | null = null;
}
