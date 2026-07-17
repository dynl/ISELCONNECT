import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import { Loader2 } from "lucide-react";

export default function IdVerification({
  step,
  onIdCaptured,
  onSelfieCaptured,
}) {
  const webcamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const captureIDPhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      processOCR(imageSrc);
    }
  }, [webcamRef]);

  const processOCR = async (imageSrc) => {
    setIsScanning(true);
    setScanProgress(0);
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setScanProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(imageSrc);
      await worker.terminate();

      const parsedData = parseIDDetails(data.text);
      onIdCaptured(imageSrc, parsedData);
    } catch (err) {
      console.error("OCR Error:", err);
      // Proceed to the next step even if OCR fails to read the text
      onIdCaptured(imageSrc, {});
    } finally {
      setIsScanning(false);
    }
  };

  const parseIDDetails = (text) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    let extractedIdNum = "";
    let extractedName = "";

    const idRegex =
      /(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})|(\d{2}[-\s]?\d{7}[-\s]?\d{1})|([A-Z0-9]{3,4}[-\s]?[0-9]{7,8})/;
    const idMatch = text.match(idRegex);
    if (idMatch) extractedIdNum = idMatch[0].replace(/\s+/g, "-");

    const ignoreWords = [
      "REPUBLIC",
      "PHILIPPINES",
      "NATIONAL",
      "IDENTITY",
      "CARD",
      "DRIVER",
      "LICENSE",
      "NAME",
      "SEX",
      "DATE",
      "BIRTH",
      "ADDRESS",
      "LAST",
      "FIRST",
      "MIDDLE",
    ];
    const possibleNameLines = lines.filter((line) => {
      const upper = line.toUpperCase();
      return (
        !ignoreWords.some((word) => upper.includes(word)) &&
        line.length > 3 &&
        /^[A-Za-z\s.,-]+$/.test(line)
      );
    });

    if (possibleNameLines.length > 0) {
      extractedName = possibleNameLines.slice(0, 2).join(" ");
    }

    let firstName = "";
    let lastName = "";
    if (extractedName) {
      const nameParts = extractedName.split(" ");
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(" ");
      } else {
        firstName = nameParts[0];
      }
    }

    return { idNumber: extractedIdNum, firstName, lastName };
  };

  const captureSelfiePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      onSelfieCaptured(imageSrc);
    }
  }, [webcamRef]);

  if (step === "id-scan") {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          animation: "contentFade 0.3s ease-out",
        }}
      >
        <div
          style={{
            background: "#000",
            borderRadius: "15px",
            flex: 1,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px",
              color: "#facc15",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "0.85rem",
              background: "#1e1b4b",
            }}
          >
            Step 1: Align ID inside the frame
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "85%",
                height: "200px",
                border: "3px solid #10b981",
                borderRadius: "10px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              }}
            ></div>
          </div>

          {isScanning ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(27, 11, 140, 0.9)",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <Loader2
                size={40}
                className="animate-spin"
                style={{ marginBottom: "15px" }}
              />
              <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
                Extracting Data... {scanProgress}%
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: "15px",
                background: "#111",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                onClick={captureIDPhoto}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#fff",
                  border: "4px solid #cbd5e1",
                  cursor: "pointer",
                }}
              ></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "selfie-scan") {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          animation: "contentFade 0.3s ease-out",
        }}
      >
        <div
          style={{
            background: "#000",
            borderRadius: "15px",
            flex: 1,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "10px",
              color: "#4ade80",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "0.85rem",
              background: "#1e1b4b",
            }}
          >
            Step 2: Position face inside the circle
          </div>
          <div style={{ flex: 1, position: "relative" }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              mirrored={true}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "220px",
                height: "220px",
                border: "3px solid #4ade80",
                borderRadius: "50%",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
              }}
            ></div>
          </div>

          <div
            style={{
              padding: "15px",
              background: "#111",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={captureSelfiePhoto}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#fff",
                border: "4px solid #4ade80",
                cursor: "pointer",
              }}
            ></button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
