import db from "../services/Db.js";
import fs from "fs";
import { converBase64ToImage } from 'convert-base64-to-image'
import ResponseObject from "../objects/ResponseObject.js";
import ResponseCodes from "../objects/ResponseCodes.js";
import ErrorMessage from '../objects/ErrorMessage.js';
import Util from '../utils/Util.js';

class VehicleHandler {

    constructor () {
        this.util = new Util();
    }

    async create(body) {

        if (!body.brand || !body.model || !body.userId || !body.numberPlate) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const insertResult = await this.insertVehicle(body);

        return new ResponseObject(insertResult.rows, ResponseCodes.OK);
    }

    async update(body) {

        if (!body.brand || !body.model || !body.vehicleId || !body.numberPlate) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const updateResult = await this.updateVehicle(body);

        return new ResponseObject(updateResult.rows, ResponseCodes.OK);
    }

    async delete(body) {

        if (!body.vehicleId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        await this.deleteVehicle(body);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async get(body) {

        if (!body.userId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const vehicleResult = await this.selectVehicle(body.userId);

        return new ResponseObject(vehicleResult.rows, ResponseCodes.OK);
    }

    async operationCreate(body) {

        if (!body.vehicleId || !body.operationId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const vehicleResult = await this.selectVehicle(null, body.vehicleId);

        if (!vehicleResult.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.VEHICLE_NOT_FOUND);
        }

        await this.insertVehicleOperation(body);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async operationUpdate(body) {

        if (!body.id || !body.status) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const updateResult = await this.updateVehicleOperation(body);

        return new ResponseObject(updateResult.rows, ResponseCodes.OK);
    }

    async operationDelete(body) {

        if (!body.id) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        await this.deleteVehicleOperation(body);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async operationGet(body) {

        if (!body.vehicleId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const result = await this.selectVehicleOperation(body);

        return new ResponseObject(result.rows, ResponseCodes.OK);
    }

    async operationPhotoCreate(body) {
        
        if (!body.vehicleId || !Array.isArray(body.photoList) || !body.operationId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const vehicleResult = await this.selectVehicle(null, body.vehicleId);

        if (!vehicleResult.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.VEHICLE_NOT_FOUND);
        }

        const selectVehicleResult = await this.selectOperationPhoto(body.vehicleId, -1, -1);

        await this.deletePhotoInFolder(selectVehicleResult.rows);
        await this.deleteOperationPhotoDelete(body.vehicleId, body.id);

        const photoName = await this.savePhotoInFolder(body.photoList);

        body.photoList = Array.from(body.photoList, (photo, index) => `('${photoName[index]}', ${index}, ${body.vehicleId}, ${body.operationId})`).join(", ");

        await this.insertOperationPhoto(body);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async operationPhotoUpdate(body) {

        if (!body.vehicleId || !body.id || !Array.isArray(body.photoList)) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }
        
        const vehicleResult = await this.selectVehicle(null, body.vehicleId);
        
        if (!vehicleResult.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.VEHICLE_NOT_FOUND);
        }

        const selectVehiclePhotoResult = await this.selectOperationPhoto(body.vehicleId, body.id, null);

        if (!selectVehiclePhotoResult.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.PHOTO_NOT_FOUND);
        }

        await this.deletePhotoInFolder(selectVehiclePhotoResult.rows);
        
        const photoName = await this.savePhotoInFolder(body.photoList);
        body.photo = photoName[0];
        
        await this.updateOperationPhotoUpdate(body);
        
        return new ResponseObject({}, ResponseCodes.OK);
    }

    async operationPhotoDelete(body) {

        if (!body.id || !body.vehicleId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const selectVehiclePhotoResult = await this.selectOperationPhoto(body.vehicleId, body.id);

        if (!selectVehiclePhotoResult.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.PHOTO_NOT_FOUND);
        }
        
        await this.deletePhotoInFolder(selectVehiclePhotoResult.rows);

        await this.deleteOperationPhotoDelete(body.vehicleId, body.id);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async operationPhotoGet(body) {

        if (!body.vehicleId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const selectPhotoResult = await this.selectOperationPhoto(body.vehicleId, -1, body.operationId);

        const response = await Promise.all(selectPhotoResult.rows.map(async (row) => {
            const photoPath = `${process.env.VEHICLE_IMAGE_PATH}${row.photo}${process.env.IMAGE_URL}`;
            const photoBuffer = await this.util.readFile(photoPath);
            const photoDataUrl = `data:image/jpeg;base64,${photoBuffer.toString("base64")}`;
          
            return {
                vehicleId: row.vehicle_id,
                id: row.id,
                sort: row.sort,
                operationId: row.operation_id,
                photo: photoDataUrl
            };
        }));

        return new ResponseObject(response, ResponseCodes.OK);
    }
    
    async noteCreate(body) {

        if (!body.vehicleId || !body.userId || !body.type || !body.note) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const vehicleResult = await this.selectVehicle(null, body.vehicleId);

        if (!vehicleResult.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.VEHICLE_NOT_FOUND);
        }

        await this.insertNote(body);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async noteUpdate(body) {

        if (!body.id || !body.note) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const updateResult = await this.updateNote(body);

        return new ResponseObject(updateResult.rows, ResponseCodes.OK);
    }

    async noteDelete(body) {

        if (!body.id) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        await this.deleteNote(body);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async noteGet(body) {

        if (!body.vehicleId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const noteResult = await this.selectVehicleNote(body);

        return new ResponseObject(noteResult.rows, ResponseCodes.OK);
    }

    // #region Private methods

    async insertVehicle(data) {

        const vehicleInsert = `insert into public.vehicles(brand, model, user_id, number_plate) values ($1, $2, $3, $4)`;
        return await db.query(vehicleInsert, [data.brand, data.model, data.userId, data.numberPlate.toUpperCase().replace(/\s/g, '')]);
    }

    async selectVehicle(userId, vehicleId) {

        const vehicleSelect = `select * from vehicles where ((user_id = $1) or ($1 = -1)) or (id = $2)`;
        return await db.query(vehicleSelect, [userId || null, vehicleId || null]);
    }

    async updateVehicle(data) {

        const vehicleUpdate = `update public.vehicles set brand=$2, model=$3, number_plate=$4, updated_date=now() where id=$1 returning*`;
        return await db.query(vehicleUpdate, [data.vehicleId, data.brand, data.model, data.numberPlate.toUpperCase().replace(/\s/g, '')]);
    }

    async deleteVehicle(data) {

        const vehicleDelete = `delete from public.vehicles where id=$1`;
        await db.query(vehicleDelete, [data.vehicleId]);
    }

    async insertOperationPhoto(data) {

		const insertVehiclePhotoQuery = `insert into vehicle_operation_photos (photo, sort, vehicle_id, operation_id) values ${data.photoList}`;
        return await db.query(insertVehiclePhotoQuery);
    }

    async selectOperationPhoto(vehicleId, id, operationId) {

        const query = `select * from vehicle_operation_photos where vehicle_id=$1 and ((id = $2) or ($2 = -1)) and ((operation_id = $3) or ($3 = -1)) order by sort`;
        return await db.query(query, [vehicleId || null, id || -1, operationId || -1]);
    }

    async deleteOperationPhotoDelete(vehicleId, id) {

        const query = `delete from public.vehicle_operation_photos where vehicle_id=$1 and ((id = $2) or ($2 = -1))`;
        await db.query(query, [vehicleId, id || -1]);
    }

    async updateOperationPhotoUpdate(data) {

        const query = `update public.vehicle_operation_photos set photo=$2, updated_date=now() where id=$1`;
        return await db.query(query, [data.id, data.photo]);
    }

    async deletePhotoInFolder(data) {

        const vehicleImagePath = process.env.VEHICLE_IMAGE_PATH;
        const imageUrl = process.env.IMAGE_URL;
        
        data.forEach(photo => {
          const photoPath = `${vehicleImagePath}${photo.photo}${imageUrl}`;
          fs.unlink(photoPath, (err) => {
            if (err) {
              console.error(err);
            }
          });
        });
    }

    async insertNote(data) {

        const query = `insert into public.vehicle_notes(note, vehicle_id, user_id, type) values ($1, $2, $3, $4);`;
        return await db.query(query, [data.note, data.vehicleId, data.userId, data.type]);
    }

    async updateNote(data) {

        const noteUpdate = `update public.vehicle_notes set note=$1 where id=$2 returning*`;
        return await db.query(noteUpdate, [data.note, data.id]);
    }

    async deleteNote(data) {

        const noteDelete = `delete from public.vehicle_notes where id=$1`;
        await db.query(noteDelete, [data.id]);
    }

    async selectVehicleNote(data) {

        const vehicleSelect = `select * from vehicle_notes where vehicle_id=$1 and ((id = $2) or ($2 = -1))`;
        return await db.query(vehicleSelect, [data.vehicleId, data.id || -1]);
    }

    async insertVehicleOperation(data) {

        const query = `insert into public.vehicle_operation(vehicle_id, operation_id) values ($1, $2);`;
        return await db.query(query, [data.vehicleId, data.operationId]);
    }

    async updateVehicleOperation(data) {

        const query = `update public.vehicle_operation set status=$1, updated_date=now() where id=$2 returning*`;
        return await db.query(query, [data.status, data.id]);
    }

    async deleteVehicleOperation(data) {

        const query = `delete from public.vehicle_operation where id=$1`;
        await db.query(query, [data.id]);
    }

    async selectVehicleOperation(data) {

        const query = `select * from vehicle_operation where vehicle_id=$1 and ((id = $2) or ($2 = -1)) and ((status = $3) or ($3 = -1))`;
        return await db.query(query, [data.vehicleId, data.id || -1, data.status || -1]);
    }

    async savePhotoInFolder(data) {

        const photoName = [];
        for (let i = 0; i < data.length; i++) {

            const pathName = await this.util.randomUuid();
            const pathToSaveImage = `${process.env.VEHICLE_IMAGE_PATH}${pathName}${process.env.IMAGE_URL}`;

            await converBase64ToImage(data[i], pathToSaveImage);
            photoName.push(pathName);
        }

        return photoName;
    }

    // #endregion Private methods
}

export default VehicleHandler;