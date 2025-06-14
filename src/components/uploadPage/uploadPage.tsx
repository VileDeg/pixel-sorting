import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
interface UploadPageProps {
  onUpload: (imageFile: File) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: Array<File>) => {
    const imageURL = acceptedFiles[0];
    onUpload(imageURL);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": []
    }
  });

  return (
    <div style={{ padding: "2rem" }}>
      {/* Left column: Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          minWidth: "250px"
        }}
      >
        <div /* Dropzone */
          {...getRootProps()}
          style={{
            padding: "1rem",
            border: "2px dashed #ccc",
            borderRadius: "8px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag 'n' drop an image here, or click to select</p>
          )}
        </div>
      </div>
    </div>
  );
};
