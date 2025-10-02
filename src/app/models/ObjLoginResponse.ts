import { ObjUsers } from "./ObjUsers";

export class ObjLoginResponse {
    User: ObjUsers = new ObjUsers();
    Token: string = "";
}