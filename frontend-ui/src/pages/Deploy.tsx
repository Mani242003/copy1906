import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function Deploy() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [chat, setChat] = useState<any[]>([]);
  const [selectedWF, setSelectedWF] = useState<any>(null);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  useEffect(() => {
    axios.get("http://localhost:8000/projects")
      .then(res => {
        const p = res.data.find((x: any) => x.id == id);
        setProject(p);
      });
  }, []);


  useEffect(() => {
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);


  useEffect(() => {
    setSelectedHistory(null);
    setChat([]);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    axios.get(`http://localhost:8000/deployments/${id}`)
      .then(res => setHistory(res.data));
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!id) return;

      axios.get(`http://localhost:8000/deployments/${id}`)
        .then(res => setHistory(res.data));
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // ✅ keep selected workflow
  useEffect(() => {
    if (!project) return;

    const workflows = JSON.parse(project.workflows || "{}");

    const params = new URLSearchParams(location.search);
    const wfFromURL = params.get("wf");

    const savedWF = localStorage.getItem(`selectedWF-${id}`);

    let finalWF = null;

    // ✅ FIRST LOAD → use URL
    if (wfFromURL && workflows[wfFromURL]) {
      finalWF = wfFromURL;

      // ✅ store it
      localStorage.setItem(`selectedWF-${id}`, wfFromURL);
    }
    // ✅ AFTER REFRESH → use localStorage
    else if (savedWF && workflows[savedWF]) {
      finalWF = savedWF;
    }

    if (finalWF) {
      setSelectedWF({
        ...workflows[finalWF],
        key: finalWF
      });
    }

  }, [project, location.search]);

  useEffect(() => {

    if (!history || history.length === 0) {
      setSelectedHistory(null);
      setChat([]);
      return;
    }

    // ✅ take latest (or first)
    const first = history[0];

    let inputsParsed = {};
    let chatData: any[] = [];

    try {
      inputsParsed = first.inputs ? JSON.parse(first.inputs) : {};
    } catch {
      inputsParsed = {};
    }

    try {
      chatData = first.chat_history ? JSON.parse(first.chat_history) : [];
      if (!Array.isArray(chatData)) chatData = [];
    } catch {
      chatData = [];
    }

    setSelectedHistory({
      ...first,
      inputs: inputsParsed
    });

    setChat(chatData);

  }, [history]);
  ``
  if (!project) return <div>Loading...</div>;

  const workflows = JSON.parse(project.workflows || "{}");

  const deploy = async () => {
    const res = await axios.post("http://localhost:8000/deploy", {
      project_id: project.id,
      workflow_key: selectedWF.key
    });

    if (res.data.msg !== "triggered") {
      alert(res.data.msg);
      return;
    }

    alert("Triggered ✅");
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-white">

      {/* ✅ LEFT SIDEBAR */}
      <div className="w-72 bg-[#111] border-r border-gray-800 flex flex-col">

        {/* ✅ LOGO */}
        <div className="p-4 text-lg font-semibold border-b border-gray-800">
          🚀 DevOps AI
        </div>

        {/* ✅ SEARCH */}
        <div className="p-3">
          <input
            placeholder="Search deployments..."
            className="w-full bg-[#1f1f1f] p-2 rounded text-sm outline-none"
          />
        </div>

        {/* ✅ HISTORY LIST */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">

          {history.map((h) => {

            const statusColor =
              h.status === "success" ? "text-green-400" :
                h.status === "failed" ? "text-red-400" :
                  "text-yellow-400";

            return (
              <div
                key={h.id}
                className={`relative p-3 rounded cursor-pointer transition hover:bg-[#1f1f1f]
        ${selectedHistory?.id === h.id ? "bg-[#1f1f1f]" : ""}
      `}
              >

                {/* ✅ CLICK AREA */}
                <div
                  onClick={() => {

                    let inputsParsed = {};
                    let chatData: any[] = [];

                    try {
                      inputsParsed = h.inputs ? JSON.parse(h.inputs) : {};
                    } catch {
                      inputsParsed = {};
                    }

                    try {
                      chatData = h.chat_history ? JSON.parse(h.chat_history) : [];
                      if (!Array.isArray(chatData)) chatData = [];
                    } catch {
                      chatData = [];
                    }

                    setSelectedHistory({
                      ...h,
                      inputs: inputsParsed
                    });

                    setChat(chatData);
                  }}
                >

                  <div className="flex justify-between items-center">

                    <span className="text-sm">{h.workflow}</span>

                    {/* ✅ RIGHT SIDE (STATUS + MENU) */}
                    <div className="flex items-center gap-2">

                      <span className={`text-xs ${statusColor}`}>
                        ● {h.status}
                      </span>

                      {/* ✅ 3 DOT MENU BUTTON */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(h.id);
                        }}
                        className="px-2 text-gray-400 hover:text-white"
                      >
                        ⋮
                      </button>

                    </div>

                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    ID: {h.id}
                  </div>

                </div>

                {/* ✅ RETRY BUTTON */}
                <button
                  className="mt-2 text-xs bg-gray-700 px-2 py-1 rounded"
                  onClick={async (e) => {
                    e.stopPropagation();

                    await axios.post(`http://localhost:8000/retry/${h.id}`);
                    alert("Retry triggered ✅");
                  }}
                >
                  Retry
                </button>

                {/* ✅ DROPDOWN MENU */}
                {openMenu === h.id && (
                  <div className="absolute right-2 top-10 bg-[#1f1f1f] border border-gray-700 rounded shadow-lg z-50 w-32">

                    <button
                      className="w-full px-3 py-2 text-sm text-left hover:bg-red-600"
                      onClick={async (e) => {
                        e.stopPropagation();

                        if (!confirm("Delete this deployment?")) return;

                        await axios.delete(`http://localhost:8000/deployments/${h.id}`);

                        // ✅ refresh list
                        const res = await axios.get(`http://localhost:8000/deployments/${id}`);
                        setHistory(res.data);

                        // ✅ clear if deleted
                        if (selectedHistory?.id === h.id) {
                          setSelectedHistory(null);
                          setChat([]);
                        }

                        setOpenMenu(null);
                      }}
                    >
                      🗑 Delete
                    </button>

                  </div>
                )}

              </div>
            );
          })}


        </div>

        {/* ✅ USER FOOTER */}
        <div className="p-3 border-t border-gray-800 text-xs text-gray-400">
          Manikandan
        </div>

      </div>

      {/* ✅ MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="h-16 border-b flex items-center justify-between px-6">

          {/* ✅ Project Name */}
          <div className="font-bold">
            {project.name}
          </div>

          <div className="flex">
            {selectedWF && (
              <div className="text-center mb-6">
                <button
                  className="bg-gray-700 px-4 py-2 rounded"
                  onClick={() =>
                    nav(`/workflow/${project.id}?tab=${selectedWF.key}`)
                  }
                >
                  ⚙️ Modify Inputs
                </button>
              </div>
            )}

            {/* ✅ YAML SELECT DROPDOWN */}
            <select
              className="bg-gray-800 p-2 rounded"
              value={selectedWF?.key || ""}

              onChange={(e) => {
                const k = e.target.value;

                setSelectedWF({ ...workflows[k], key: k });

                // ✅ save
                localStorage.setItem(`selectedWF-${id}`, k);

                // ✅ REMOVE query param (VERY IMPORTANT)
                nav(`/deploy/${id}`, { replace: true });
              }}

            >
              <option value="">Select Workflow</option>
              {Object.keys(workflows).map((k) => (
                <option key={k} value={k}>
                  {workflows[k].file}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* ✅ CONTENT (ONLY THIS SCROLLS) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-[100px] w-full">

          {selectedHistory ? (

            <div className="w-full max-w-3xl mx-auto space-y-4">

              {/* ✅ HEADER */}
              <div className="text-xl font-bold">
                🤖 Deployment Assistant
              </div>

              {/* ✅ RUNNING STATE LOADER */}
              {selectedHistory.status === "running" ? (

                <div className="bg-[#2a2a2a] p-6 rounded text-gray-300">

                  <div className="text-sm mb-2">
                    ⏳ Running deployment...
                  </div>

                  {/* ✅ ChatGPT-style blinking cursor */}
                  <div className="text-sm font-mono">
                    Analyzing logs<span className="inline-block w-2 animate-bounce">▌</span>
                  </div>

                </div>

              ) : (

                <>
                  {/* ✅ INPUTS */}
                  <div className="bg-[#2a2a2a] p-4 rounded">
                    <div className="text-sm font-semibold mb-2 text-gray-300">
                      📦 Inputs
                    </div>

                    {Object.keys(selectedHistory.inputs || {}).length === 0 ? (
                      <div className="text-gray-500 text-sm">No inputs provided</div>
                    ) : (
                      Object.keys(selectedHistory.inputs).map((k) => (
                        <div key={k} className="text-sm">
                          <span className="text-gray-400">{k}:</span>{" "}
                          <span>{selectedHistory.inputs[k]}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <hr className="border-gray-700" />

                  {/* ✅ CHAT */}
                  {chat.length === 0 ? (
                    <div className="text-gray-400 text-sm">
                      No chat history available
                    </div>
                  ) : (

                    Array.isArray(chat) && chat.map((msg, i) => {

                      const isAI = msg?.role === "ai";
                      const isRetry =
                        typeof msg?.message === "string" &&
                        msg.message.includes("RETRY");

                      return (
                        <div
                          key={i}
                          className={`p-3 rounded max-w-[75%] text-sm ${isAI
                              ? "bg-blue-900 ml-auto border border-blue-400"
                              : isRetry
                                ? "bg-yellow-700 text-black mx-auto text-center"
                                : "bg-[#2a2a2a]"
                            }`}
                        >

                          <div className="text-xs text-gray-400 mb-1">
                            {msg?.role?.toUpperCase?.() || "SYSTEM"}
                          </div>

                          <pre className="whitespace-pre-wrap">
                            {typeof msg?.message === "string"
                              ? msg.message
                              : msg?.message?.output
                                ? msg.message.output
                                : JSON.stringify(msg?.message || "⚠️ No message")}
                          </pre>

                        </div>
                      );
                    })

                  )}
                </>

              )}
            </div>

          ) : (


            // ✅ EMPTY STATE
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <h2 className="text-xl mb-2">🤖 Deployment Assistant</h2>
                <p>Select a deployment from left panel</p>
              </div>
            </div>

          )}

        </div>

        {selectedWF && (
          <div className="fixed bottom-0 left-64 right-0 bg-[#1e1e1e] p-4">

            <div className="max-w-3xl mx-auto flex items-center bg-[#2a2a2a] rounded-full px-4 py-3">

              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Start deployment command..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") deploy();
                }}
              />

              <button
                className="bg-white text-black px-4 py-2 rounded-full ml-2"
                onClick={deploy}
              >
                →
              </button>

            </div>

          </div>
        )}


      </div>

    </div>
  );
}