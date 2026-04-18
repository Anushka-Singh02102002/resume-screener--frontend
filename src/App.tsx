import { useState } from "react";
import "./FormStyles.css";
import ChatPanel from "./ChatPanel";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [jd, setJd] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: "name" | "score"; direction: "asc" | "desc" } | null>({ key: "score", direction: "desc" });

  const requestSort = (key: "name" | "score") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortConfig) return 0;
    if (sortConfig.key === "score") {
      return sortConfig.direction === "asc" ? a.score - b.score : b.score - a.score;
    }
    if (sortConfig.key === "name") {
      const nameA = a.name ? a.name.toLowerCase() : "";
      const nameB = b.name ? b.name.toLowerCase() : "";
      if (nameA < nameB) return sortConfig.direction === "asc" ? -1 : 1;
      if (nameA > nameB) return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const handleFileChange = (e: any) => {
    const selectedFiles = Array.from(e.target.files) as File[];
    setFiles((prevFiles) => {
      const newFiles = selectedFiles.filter(
        (newFile) => !prevFiles.some((f) => f.name === newFile.name && f.size === newFile.size)
      );
      return [...prevFiles, ...newFiles];
    });
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
    <div className="page-container">
      <h1 className="app-title">AI Resume Screener</h1>

      <div className="form-container">
        {/* Upload */}
        <div className="file-input-wrapper">
          <label className="file-input-label">Upload Resumes</label>
          <input className="file-input" type="file" multiple onChange={handleFileChange} />
          {files.length > 0 && (
            <div style={{ marginTop: "12px", fontSize: "14px", color: "#475569" }}>
              <strong>Selected Files ({files.length}):</strong>
              <ul style={{ paddingLeft: "20px", marginTop: "8px", marginBottom: 0 }}>
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* JD */}
        <div className="file-input-wrapper">
          <label className="file-input-label">Job Description</label>
          <textarea
            className="jd-textarea"
            placeholder="Paste the Job Description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={5}
          />
        </div>

        {/* Button */}
        <button className="analyze-button" onClick={handleSubmit}>
          Analyze Candidates
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <table border={1} cellPadding={8} style={{ marginTop: "20px", borderCollapse: "collapse", width: "100%", textAlign: "left" }}>
          <thead style={{ backgroundColor: "#f4f4f4" }}>
            <tr>
              <th
                style={{ width: "15%", cursor: "pointer", userSelect: "none" }}
                onClick={() => requestSort("name")}
                title="Click to sort by Name"
              >
                Name {sortConfig?.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
              </th>
              <th
                style={{ width: "5%", cursor: "pointer", userSelect: "none" }}
                onClick={() => requestSort("score")}
                title="Click to sort by Score"
              >
                Score {sortConfig?.key === "score" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕"}
              </th>
              <th style={{ width: "30%" }}>Summary</th>
              <th style={{ width: "25%" }}>Strengths</th>
              <th style={{ width: "25%" }}>Gaps</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((r, i) => (
              <tr key={i} style={{ verticalAlign: "top" }}>
                <td><strong>{r.name}</strong></td>
                <td><span style={{ fontWeight: "bold", color: r.score >= 80 ? "green" : "orange" }}>{r.score}</span></td>
                <td>{r.summary}</td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {r.strengths?.map((s: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{s}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {r.gaps?.map((g: string, idx: number) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>{g}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ChatPanel context={results} />
    </div>
  );
}

export default App;