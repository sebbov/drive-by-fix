import React, { useState } from "react";

interface FileDropZoneProps {
    onFilesDropped: (files: File[]) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesDropped }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(event.dataTransfer.files);
        onFilesDropped(droppedFiles);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                border: "2px dotted gray",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                color: "gray",
                backgroundColor: isDragging ? "#f0f0f0" : "#ffffff",
                transition: "background-color 0.2s",
                cursor: "pointer",
                width: "100%",
                maxWidth: "400px",
                margin: "20px auto",
            }}
        >
            <p>{isDragging ? "Release to drop the files" : "Drop files here"}</p>
        </div>
    );
};

export default FileDropZone;
