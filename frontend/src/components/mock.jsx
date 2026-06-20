import { useState } from "react";

export default function ApproveRequest() {
  const [engagement, setEngagement] = useState(null);
  const [requirements, setRequirements] = useState([]);

  const handleApprove = async () => {
    try {
      const res = await fetch("http://localhost:3000/mock/approveReq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        request_id: 1,
        service_id: 1,
        title: "Tax Compliance Engagement",
        created_at: new Date().toISOString(),
        stats: "pending"
      })
    });

      const data = await res.json();

      setEngagement(data.engagement);
      setRequirements(data.requirements);

    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Service Request</h2>

      <button onClick={handleApprove}>
        Approve
      </button>

      {/* Engagement UI */}
      {engagement && (
        <div style={{ marginTop: "20px", border: "1px solid black", padding: "10px" }}>
          <h3>Engagement Created</h3>
          <p><strong>ID:</strong> {engagement.engagement_id}</p>
          <p><strong>Title:</strong> {engagement.title}</p>
          <p><strong>Status:</strong> {engagement.status}</p>
        </div>
      )}

      {/* Requirements UI */}
      {requirements.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Requirements</h3>
          <ul>
            {requirements.map((req) => (
              <li key={req.requirement_id}>
                {req.document_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}