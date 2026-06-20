import { pool } from "../config/connectDB.js";




// request queries 
async function createRequest({ ...data }){
  const query = `
    INSERT INTO service_request(
      request_id,
      user_id,
      service_id,
      title,
      description
    ) VALUES ($1,$2,$3,$4,$5)
    RETURNING *
  `
  const val = [
    data.request_id,
    data.user_id,
    data.service_id,
    data.title,
    data.description,
  ];
  await pool.query(query,val); 
}


async function updateRequest(request_id){
  const result = await pool.query(`
  UPDATE service_request
  SET status = 'approved'
  WHERE request_id = $1
  RETURNING *;
  `, [request_id]);
  
  return result; 
}


// engagament creation 
async function createEngagement({ ...data }){
  const query = `
    INSERT INTO engagements(
      request_id,
      service_id,
      title,
      created_at,
      stats 
    ) VALUES ($1,$2,$3,$4,$5)
    RETURNING *; 
  `;
  const val = [
    data.request_id,
    data.service_id,
    data.title,
    data.created_at,
    data.stats
  ];

  const engagament = await pool.query(query,val);
  return engagament.rows[0];
}

// requirements
async function defineRequirements(engagament_id, request_id){
  const query = `
    INSERT INTO engagement_requirements (engagement_id, requirement_id)
    SELECT 
      $1,
      srq.requirement_id    -- ← pull from the joined table
    FROM service_requirements srq
    JOIN service_request sr ON sr.service_id = srq.service_id
    WHERE sr.request_id = $2
  `
  const val = [engagament_id, request_id]
  
  const req = await pool.query(query, val); 
  return req.rows[0]
}

export{
  createRequest, 
  updateRequest, 
  createEngagement,
  defineRequirements
}