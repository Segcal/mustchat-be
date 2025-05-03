import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddlewares.js";
import { getAllContacts, getContactsForDMList, SearchContacts } from "../controllers/ContactController.js";



const constactsRoutes = Router();

constactsRoutes.post("/search", verifyToken, SearchContacts);
constactsRoutes.get("/get-contacts-for-dm", verifyToken, getContactsForDMList);
constactsRoutes.get("/get-all-contacts", verifyToken, getAllContacts)

export default constactsRoutes;