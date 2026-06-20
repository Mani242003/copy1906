import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login(){

  const nav = useNavigate();
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");

  const login = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/login",
        null,
        { params:{ username, password } }
      );

      if(res.data.msg === "success"){
        nav("/projects");
      } else {
        alert("Invalid credentials");
      }

    } catch {
      alert("Server error");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow w-[300px]">
        <h2 className="text-lg font-bold mb-3">Login</h2>

        <input className="border p-2 w-full mb-2"
          placeholder="Username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        <input className="border p-2 w-full mb-3"
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button className="bg-blue-600 text-white w-full py-2 rounded"
          onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}