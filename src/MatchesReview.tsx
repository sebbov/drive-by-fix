import React, { useEffect, useState } from 'react';
import { DriveFile } from './drive';

interface MatchesReviewProps {
    filenames: string[];
    matches: { [key: string]: DriveFile[] };
    onContinue: (files: DriveFile[]) => void;
}

const MatchesReview: React.FC<MatchesReviewProps> = ({ filenames, matches, onContinue }) => {
    const [missingMatches, setMissingMatches] = useState<string[]>([]);
    const [missingCapabilities, setMissingCapabilities] = useState<DriveFile[]>([]);
    const [sharedFiles, setSharedFiles] = useState<DriveFile[]>([]);

    useEffect(() => {
        const missingMatchesList: string[] = [];
        const missingCapabilitiesList: DriveFile[] = [];
        const sharedFilesList: DriveFile[] = [];

        filenames.forEach((filename) => {
            const fileMatches = matches[filename];

            if (!fileMatches || fileMatches.length === 0) {
                missingMatchesList.push(filename);
                return;
            }

            fileMatches.forEach((file) => {
                const missingCapabilityList: string[] = [];
                if (!file.capabilities.canEdit) missingCapabilityList.push('Edit');
                if (!file.capabilities.canCopy) missingCapabilityList.push('Copy');
                if (!file.capabilities.canDelete) missingCapabilityList.push('Delete');
                if (!file.capabilities.canDownload) missingCapabilityList.push('Download');

                if (missingCapabilityList.length > 0) {
                    missingCapabilitiesList.push(file);
                }

                if (file.sharedWithMeTime) {
                    sharedFilesList.push(file);
                }
            });
        });

        setMissingMatches(missingMatchesList);
        setMissingCapabilities(missingCapabilitiesList);
        setSharedFiles(sharedFilesList);

    }, [filenames, matches]);

    const handleOnClick = () => {
        const files: DriveFile[] = [];

        filenames.forEach((filename) => {
            matches[filename].forEach((file) => {
                if (
                    missingMatches.includes(filename) ||
                    missingCapabilities.some((f) => f.id === file.id) ||
                    sharedFiles.some((f) => f.id === file.id)
                ) {
                    return;
                }
                files.push(file);
            });
        });
        onContinue(files);
    }

    return (
        <div className="p-4">
            {(missingMatches.length == 0 && missingCapabilities.length == 0 && sharedFiles.length == 0) ? (
                <p className="text-green-600 font-semibold text-lg">
                    No problems detected.
                </p>
            ) : (
                <p className="text-yellow-600 font-semibold text-lg">
                    Some problems were detected. The files listed below will be skipped.
                </p>
            )}

            {missingMatches.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">Files with no matches:</h3>
                    <ul className="list-disc pl-6">
                        {missingMatches.map((filename, index) => (
                            <li key={index}>{filename}</li>
                        ))}
                    </ul>
                </div>
            )}

            {missingCapabilities.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">Files missing capabilities:</h3>
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border">File Name</th>
                                <th className="px-4 py-2 border">Missing Capabilities</th>
                            </tr>
                        </thead>
                        <tbody>
                            {missingCapabilities.map((file, index) => {
                                const missingCapabilityList: string[] = [];
                                if (!file.capabilities.canEdit) missingCapabilityList.push('Edit');
                                if (!file.capabilities.canCopy) missingCapabilityList.push('Copy');
                                if (!file.capabilities.canDelete) missingCapabilityList.push('Delete');
                                if (!file.capabilities.canDownload) missingCapabilityList.push('Download');

                                return (
                                    <tr key={index}>
                                        <td className="px-4 py-2 border">{file.name}</td>
                                        <td className="px-4 py-2 border">{missingCapabilityList.join(', ')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {sharedFiles.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-2">Files with sharedWithMeTime:</h3>
                    <ul className="list-disc pl-6">
                        {sharedFiles.map((file, index) => (
                            <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                onClick={handleOnClick}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Continue
            </button>
        </div>
    );
};

export default MatchesReview;
