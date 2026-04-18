import { useState } from "react";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [jd, setJd] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleFileChange = (e: any) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async () => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("jd", jd);

    const res = await fetch("https://ai-resume-screener-6815.onrender.com/analyze/", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResults(data.results);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Resume Screener</h1>

      {/* Upload */}
      <input type="file" multiple onChange={handleFileChange} />

      {/* JD */}
      <textarea
        placeholder="Enter Job Description"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={4}
      />

      {/* Button */}
      <br />
      <button onClick={handleSubmit}>Analyze</button>

      {/* Results */}
      {results.map((r, i) => (
        <div key={i}>
          <h3>{r.name} - {r.score}</h3>
          <p>{r.summary}</p>
        </div>
      ))}
    </div>
  );
}

export default App;