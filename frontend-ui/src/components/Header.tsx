import { useParams } from "react-router-dom";

export default function Header(){
  const { id } = useParams();

  return (
    <div className="fixed top-0 left-0 w-full h-[60px] bg-gray-800 text-white flex items-center px-5 z-50">
      <h2 className="text-lg font-semibold">
        {/* 🚀 CI/CD Dashboard {id && `| Project ${id}`} */}
      </h2>
    </div>
  );
}