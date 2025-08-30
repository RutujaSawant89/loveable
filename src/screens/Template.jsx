import { useState } from "react";

export default function Template() {
  const [selected, setSelected] = useState(null);

  const templates = [
    { id: 1, title: "Minimal Portfolio", category: "Portfolio", image: "src/assets/images/image.png" },
    { id: 2, title: "Startup Landing", category: "Landing Page", image: "src/assets/images/image copy.png" }, 
    { id: 3, title: "Modern Blog", category: "Blog", image: "src/assets/images/image copy 2.png" },
    { id: 4, title: "E-commerce Store", category: "E-commerce", image: "src/assets/images/image copy 3.png" },
    { id: 5, title: "Creative Agency", category: "Agency", image: "src/assets/images/image copy 4.png" },
    { id: 6, title: "Dashboard UI", category: "Dashboard", image: "src/assets/images/image copy 5.png" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white px-6 py-12 relative z-10">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
          Explore Templates
        </h1>
        <p className="text-lg text-gray-400">
          Pick from a collection of modern, responsive templates.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="group bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/30 rounded-2xl shadow-lg hover:shadow-purple-500/40 backdrop-blur-xl overflow-hidden cursor-pointer transition transform hover:-translate-y-1"
            onClick={() => setSelected(tpl)}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={tpl.image}
                alt={tpl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            </div>
            <div className="p-5">
              <span className="text-sm font-medium text-purple-400">
                {tpl.category}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {tpl.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/30 rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden backdrop-blur-xl">
            <div className="aspect-video">
              <img
                src={selected.image}
                alt={selected.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white">
                {selected.title}
              </h2>
              <p className="mt-2 text-gray-400">
                This is a preview of the selected template. You can customize and publish it to fit your needs.
              </p>
              <div className="mt-4 flex gap-3">
                <button className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition">
                  Use Template
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
