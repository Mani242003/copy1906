import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [component, setComponent] = useState("frontend");
  const [action, setAction] = useState("build");
  const [version, setVersion] = useState("26.43");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
const [history, setHistory] = useState<any[]>([]);

useEffect(() => {
  fetchHistory();

  const interval = setInterval(fetchHistory, 5000);
  return () => clearInterval(interval);
}, []);
  const runDeployment = async () => {
    const cmd = `${action} ${component} version ${version}`;

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:8000/deploy",
        null,
        {
          params: { cmd }
        }
      );

      setMsg("✅ Triggered Successfully");
      console.log(res.data);

    } catch (err) {
      setMsg("❌ Error triggering deployment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
  const res = await axios.get("http://localhost:8000/deployments");
  setHistory(res.data);
};



  return (
    <div style={{ padding: 30 }} className="">
      <h2>Deployment UI</h2>

      <select value={component} onChange={(e) => setComponent(e.target.value)}>
        <option value="frontend">Frontend</option>
        <option value="backend">Backend</option>
      </select>

      <br /><br />

      <select value={action} onChange={(e) => setAction(e.target.value)}>
        <option value="build">Build</option>
        <option value="deploy">Deploy</option>
        <option value="build_deploy">Build + Deploy</option>
      </select>

      <br /><br />

      <input
        value={version}
        onChange={(e) => setVersion(e.target.value)}
      />

      <br /><br />

      <button onClick={runDeployment} disabled={loading}>
        {loading ? "Running..." : "Execute"}
      </button>

      <p>{msg}</p>
      <h3>Deployment History</h3>

<table border={1}>
  <thead>
    <tr>
      <th>ID</th>
      <th>Component</th>
      <th>Action</th>
      <th>Status</th>
      <th>Time</th>
    </tr>
  </thead>

  <tbody>
    {history.map((item) => (
      <tr key={item.id}>
        <td>{item.id}</td>
        <td>{item.component}</td>
        <td>{item.action}</td>
        <td>{item.status}</td>
        <td>{item.created_at}</td>
      </tr>
    ))}
  </tbody>
</table>
    </div>
  );
}