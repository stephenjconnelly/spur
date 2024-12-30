import { Book, Menu } from 'lucide-react';

export default function Navbar() {
  return (
    <div className="flex items-center justify-between bg-white p-4 shadow-md">
      <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-500">
        <Menu className="w-5 h-5 text-gray-900" />
      </button>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2  text-gray-500 py-2 px-4 rounded-lg">
          <Book className="w-5 h-5" />
          Docs
        </button>
        <div className="p-2 border border-gray-500 rounded-full flex items-center justify-center font-medium">
            NE
        </div>
      </div>
    </div>
  );
}