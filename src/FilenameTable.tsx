import React, { useState } from 'react';

import { DriveFile, findFile } from './drive';

interface FilenameTableProps {
    // NB: If we stick to getting filenames only from drivefs logs, albeit
    // adding fragility on the log expectation end, we could robustify
    // matching with Drive files by taking other file attributes found
    // in logs into account.  The file size appears to be there.  The
    // checksum too, but the point is that we can't trust that. Avoiding
    // the fragility by making this an optional indication is possible,
    // but adds complexity that should probably be avoided.
    filenames: string[];
}

const FilenameTable: React.FC<FilenameTableProps> = ({ filenames }) => {
    const [matches, setMatches] = useState<{ [key: string]: DriveFile[] }>({});

    const handleLookup = async (filename: string) => {
        const foundMatches = await findFile(filename);
        setMatches((prevMatches) => ({
            ...prevMatches,
            [filename]: foundMatches,
        }));
    };

    const handleLookupAll = async () => {
        // TODO: Parallelize, to some degree.
        for (const filename of filenames) {
            await handleLookup(filename);
        };
    };

    return (
        <div className="p-6 bg-gray-100">
            <button
                onClick={handleLookupAll}
                className="mb-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
                Lookup All
            </button>

            <table className="w-full table-auto bg-white shadow-md rounded border border-gray-300">
                <thead className="bg-gray-200 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left">Lookup</th>
                        <th className="px-4 py-2 text-left">Filename</th>
                        <th className="px-4 py-2 text-left">Drive Matches</th>
                    </tr>
                </thead>
                <tbody>
                    {filenames.map((filename, index) => (
                        <tr
                            key={filename}
                            className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                } hover:bg-gray-100 transition`}
                        >
                            <td className="px-4 py-2">
                                <button
                                    onClick={() => handleLookup(filename)}
                                    className="px-3 py-1 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition"
                                >
                                    Action
                                </button>
                            </td>
                            <td className="px-4 py-2 text-gray-800">{filename}</td>
                            <td className="px-4 py-2">
                                {matches[filename]?.length > 0 ? (
                                    matches[filename].map((match, index) => (
                                        <div key={index} className="text-sm text-gray-700">
                                            {match.name} {match.size}B{" "}
                                            <span
                                                className={`font-bold ${match.capabilities.canCopy ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                copy: {match.capabilities.canCopy ? "true" : "false"}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500">No matches yet</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FilenameTable;
