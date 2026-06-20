import { Link, useParams } from "react-router-dom";

export default function Sidebar({ workflows }: any){

  const { id } = useParams();

  return (
    <div className="fixed top-[60px] left-0 w-[240px] h-[calc(100vh-60px)] bg-slate-900 text-white p-5 overflow-y-auto">

      <h3 className="text-lg font-bold mb-4">Project {id}</h3>

      <Link className="block mb-2 hover:text-blue-400" to={`/project/${id}`}>Dashboard</Link>
      <Link className="block mb-2 hover:text-blue-400" to={`/project/${id}/workflows`}>Workflows</Link>
      <Link className="block mb-2 hover:text-blue-400" to={`/project/${id}/deploy`}>Deploy</Link>

      {workflows && (
        <>
          <h4 className="mt-5 font-semibold">Workflow Files</h4>

          {Object.values(workflows).map((file:any, i)=>(
            <div key={i} className="text-sm mt-1">📄 {file}</div>
          ))}
        </>
      )}

    </div>
  );
}
