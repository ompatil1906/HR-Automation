import fs from "fs";

async function test() {
  const latex = `\\documentclass{article}\\begin{document}Hello world!\\end{document}`;
  const formData = new FormData();
  formData.append("filecontents", latex);
  formData.append("filename", "document.tex");
  formData.append("engine", "pdflatex");
  formData.append("return", "pdf");

  const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.error("Error:", res.status, res.statusText);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync("test.pdf", buffer);
  console.log("Success! Created test.pdf");
}

test();
