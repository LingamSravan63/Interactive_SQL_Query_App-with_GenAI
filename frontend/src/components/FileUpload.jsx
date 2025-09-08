import React, {useState} from "react";
import axios from "axios";

export default function FileUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const upload = async () => {
    if (!file) { setMessage("Choose a file first."); return; }
    setMessage("Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload`, fd, { headers: {"Content-Type":"multipart/form-data"} });
      setMessage(res.data.message || "Uploaded.");
      onUploaded && onUploaded();
    } catch (err) {
      setMessage("Upload failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div>
      <input type="file" accept=".csv,.xlsx,.xls,.parquet" onChange={e=>setFile(e.target.files[0])}/>
      <div style={{marginTop:10, display:"flex",gap:12, alignItems:"center"}}>
        <button className="btn" onClick={upload}>Upload</button>
        <div className="muted">{message}</div>
      </div>
    </div>
  );
}
