import express from 'express';
import{
  createRequest,
  updateRequest,
  createEngagement,
  defineRequirements
} from '../models/queryMock.js'; 
import { pool } from '../config/connectDB.js';

async function createReq(req, res){
  try{
    const result = await createRequest({ ...req.body}); 
    res.status(201).json({ result }); 
  }catch(error){
    console.log(error);
    res.sendStatus(500)
  }
}

async function approveReq(req, res) {
  try {
    const { request_id, service_id, ...rest } = req.body;

    await updateRequest(request_id);
    const engagement = await createEngagement({
      
      request_id,
      service_id,
      ...rest
    });

    await defineRequirements(engagement.engagement_id, request_id);

    const requirements = await pool.query(`
      SELECT srq.requirement_id, srq.document_name
      FROM service_requirements srq
      WHERE srq.service_id = $1
    `, [service_id]);

    res.status(200).json({
      engagement,
      requirements: requirements.rows   // not .rows[0]
    });

  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}

// async function createEng(req, res){
//   try{
//     const engagament = await createEngagement({ ...req.body }); 
//     const requirements = await pool.query(`
//       SELECT srq.requirement_id, srq.document_name
//       FROM service_requirements srq
//       WHERE srq.service_id = $1
//     `, [req.body.service_id]);

//     res.json({
//       engagement,
//       requirements: requirements.rows
//     });
      
//   }catch(error){
//     console.log(error);
//     res.sendStatus(500)
//   }
// }

async function defReq(req, res){
  try{
    const result = await defineRequirements({ ...req.body }); 
    res.status(201).json({ result }); 
  }catch(error){
    console.log(error);
    res.sendStatus(500)
  }
}

export{
  createReq,
  approveReq,
  // createEng,
  defReq
}