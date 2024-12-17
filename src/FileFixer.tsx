import React, { useState } from 'react';
import plimit from 'p-limit';
import ProgressBar from './ProgressBar';
import { DriveFile } from './drive';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatFileSize = (size: string) => {
    const sizeInBytes = parseInt(size, 10);
    if (isNaN(sizeInBytes)) return size;

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;
    let sizeValue = sizeInBytes;

    while (sizeValue >= 1024 && index < units.length - 1) {
        sizeValue /= 1024;
        index++;
    }

    return `${sizeValue.toLocaleString()} ${units[index]}`;
};

const formatModifiedDate = (modifiedTime: string) => {
    const date = new Date(modifiedTime);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
};

interface FileFixerProps {
    files: DriveFile[];
    onCompletion: (updatedFiles: DriveFile[]) => void;
}

const FileFixer: React.FC<FileFixerProps> = ({ files, onCompletion }) => {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [isFixing, setIsFixing] = useState<boolean>(false);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [fileStatuses, setFileStatuses] = useState<Map<string, { message: string; progress?: number }>>(new Map());

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allSelected = new Set(files.map((file) => file.id));
            setSelectedFiles(allSelected);
        } else {
            setSelectedFiles(new Set());
        }
    };

    const toggleSelectFile = (fileId: string) => {
        const updatedSelectedFiles = new Set(selectedFiles);
        if (updatedSelectedFiles.has(fileId)) {
            updatedSelectedFiles.delete(fileId);
        } else {
            updatedSelectedFiles.add(fileId);
        }
        setSelectedFiles(updatedSelectedFiles);
    };

    const isAllSelected = files.length > 0 && files.every((file) => selectedFiles.has(file.id));

    const handleFileAsync = async (
        fileId: string,
        updateStatus: (status: { message: string; progress?: number }) => void
    ) => {
        // TODO(seb): Replace dummy fake with real drive operations.
        updateStatus({ message: `Processing file ${fileId}...`, progress: 0 });
        const delay = Math.floor(Math.random() * 1000) + 1000;
        let progress = 0;

        while (progress < 100) {
            await sleep(200);
            progress += Math.random() * 20;
            updateStatus({ message: `Processing file ${fileId}...`, progress: Math.min(100, Math.round(progress)) });
        }

        await sleep(delay);
        updateStatus({ message: `Complete for file ${fileId}!`, progress: 100 });
    };

    const handleFix = async () => {
        setIsFixing(true);
        setIsComplete(false);

        const limit = plimit(10);
        const selected = files.filter((file) => selectedFiles.has(file.id));

        const updateStatus = (fileId: string, status: { message: string; progress?: number }) => {
            setFileStatuses((prevStatuses) => new Map(prevStatuses).set(fileId, status));
        };

        const tasks = selected.map((file) =>
            limit(async () => {
                await handleFileAsync(file.id, (status) => updateStatus(file.id, status));
            })
        );

        await Promise.all(tasks);

        setIsFixing(false);
        setIsComplete(true);
    };

    const handleContinue = () => {
        const updatedFiles = files.filter((file) => selectedFiles.has(file.id));
        onCompletion(updatedFiles);
    };

    return (
        <div className="p-4">
            <button
                onClick={isComplete ? handleContinue : handleFix}
                disabled={isFixing}
                className={`mb-4 px-4 py-2 rounded ${isFixing ? 'bg-gray-500' : 'bg-blue-500'} text-white`}
            >
                {isFixing ? 'Fixing...' : isComplete ? 'Continue' : 'Fix!'}
            </button>

            <table className="min-w-full table-auto border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                            />
                        </th>
                        <th className="p-2">Go To</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Size</th>
                        <th className="p-2">Modified</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((file) => {
                        const status = fileStatuses.get(file.id);
                        return (
                            <tr key={file.id} className="border-t">
                                <td className="p-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.has(file.id)}
                                        onChange={() => toggleSelectFile(file.id)}
                                    />
                                </td>
                                <td className="p-2">
                                    <a
                                        href={`https://drive.google.com/drive/folders/${file.parents[0]}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline"
                                    >
                                        Parent
                                    </a>
                                </td>
                                <td className="p-2">{file.name}</td>
                                <td className="p-2">{formatFileSize(file.size)}</td>
                                <td className="p-2">{formatModifiedDate(file.modifiedTime)}</td>
                                <td className="p-2">
                                    {status?.progress !== undefined ? (
                                        <ProgressBar percentage={status.progress} />
                                    ) : (
                                        status?.message || ''
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default FileFixer;