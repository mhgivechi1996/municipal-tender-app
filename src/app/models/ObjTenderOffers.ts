import { ObjOffersReport } from "./ObjOffersReport";

export class ObjTenderOffers {
  Id: number = 0;
  Title: string = "";
  Description: string = "";
  BeginDate: Date | null = null;
  EndDate: Date | null = null;
  FromPrice: number = 0;
  ToPrice: number = 0;
  Report: ObjOffersReport = new ObjOffersReport();
}
